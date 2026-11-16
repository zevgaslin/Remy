package com.remy.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.remy.backend.dto.GroceryListResponse;
import com.remy.backend.model.GroceryCheck;
import com.remy.backend.model.Ingredient;
import com.remy.backend.model.Recipe;
import com.remy.backend.model.RecipeIngredient;
import com.remy.backend.repository.CalendarPlanRepository;
import com.remy.backend.repository.GroceryCheckRepository;
import com.remy.backend.repository.IngredientRepository;
import com.remy.backend.repository.RecipeReadRepository;
import com.remy.backend.repository.UserRepository;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.TreeSet;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Builds a grocery list from the recipes planned on the user's calendar:
 * every required ingredient, scaled by the planned servings for each slot,
 * merged by name and unit, minus what the pantry already holds.
 */
@Service
public class GroceryListService {

    static final int MAX_RANGE_DAYS = 62;
    static final int MAX_KEY_LENGTH = 255;

    private record PlannedMealEntry(long recipeId, double servings) {}

    private final CalendarPlanRepository calendars;
    private final RecipeReadRepository recipes;
    private final IngredientRepository pantry;
    private final GroceryCheckRepository checks;
    private final UserRepository users;

    public GroceryListService(CalendarPlanRepository calendars, RecipeReadRepository recipes,
            IngredientRepository pantry, GroceryCheckRepository checks, UserRepository users) {
        this.calendars = calendars;
        this.recipes = recipes;
        this.pantry = pantry;
        this.checks = checks;
        this.users = users;
    }

    @Transactional(readOnly = true)
    public GroceryListResponse build(Long userId, LocalDate from, LocalDate to) {
        if (to.isBefore(from)) {
            throw new IllegalArgumentException("The end date must be on or after the start date.");
        }
        if (ChronoUnit.DAYS.between(from, to) >= MAX_RANGE_DAYS) {
            throw new IllegalArgumentException("Choose a range of at most " + MAX_RANGE_DAYS + " days.");
        }

        List<PlannedMealEntry> plannedEntries = plannedMealEntries(userId, from, to);
        List<Long> distinctIds = plannedEntries.stream().map(PlannedMealEntry::recipeId).distinct().toList();
        Map<Long, Recipe> recipesById = recipes.findInOrder(distinctIds).stream()
                .collect(Collectors.toMap(Recipe::getId, Function.identity()));

        Map<String, Need> needs = new LinkedHashMap<>();
        for (PlannedMealEntry entry : plannedEntries) {
            Recipe recipe = recipesById.get(entry.recipeId());
            if (recipe == null) {
                continue; // deleted since it was planned
            }
            double multiplier = entry.servings() > 0 && Double.isFinite(entry.servings()) ? entry.servings() : 1.0;
            for (RecipeIngredient ingredient : recipe.getIngredients()) {
                String name = ingredient.getIngredientName();
                if (ingredient.isOptional() || name == null || name.isBlank() || CookingWater.is(name)) {
                    continue;
                }
                String key = IngredientNameNormalizer.canonicalize(name);
                Double rawQty = ingredient.getQuantity();
                Double scaledQty = rawQty != null && Double.isFinite(rawQty) ? rawQty * multiplier : null;
                needs.computeIfAbsent(key, k -> new Need(name.trim()))
                        .add(recipe.getName(), scaledQty, ingredient.getUnit());
            }
        }

        List<Ingredient> owned = pantry.findByOwnerId(userId);
        Set<String> checked = checks.findItemKeys(userId);
        List<GroceryListResponse.Item> items = new ArrayList<>();
        needs.forEach((key, need) -> {
            List<Ingredient> matching = owned.stream()
                    .filter(item -> item.getName() != null
                            && namesMatch(key, IngredientNameNormalizer.canonicalize(item.getName())))
                    .toList();
            Remaining remaining = need.remainingAfter(matching);
            if (remaining != null) {
                items.add(new GroceryListResponse.Item(key, need.name, remaining.amount(), remaining.have(),
                        List.copyOf(need.recipes), checked.contains(key)));
            }
        });
        items.sort(Comparator.comparing(GroceryListResponse.Item::name, String.CASE_INSENSITIVE_ORDER));
        return new GroceryListResponse(from.toString(), to.toString(), plannedEntries.size(), items);
    }

    @Transactional
    public void setChecked(Long userId, String key, boolean checked) {
        if (key == null || key.isBlank() || key.length() > MAX_KEY_LENGTH) {
            throw new IllegalArgumentException("Choose a grocery item to check off.");
        }
        if (!checked) {
            checks.deleteItem(userId, key);
        } else if (!checks.existsByUserIdAndItemKey(userId, key)) {
            checks.save(new GroceryCheck(users.getReferenceById(userId), key));
        }
    }

    @Transactional
    public void clearChecked(Long userId) {
        checks.deleteAllForUser(userId);
    }

    /**
     * Calendar keys look like "2030-03-04::dinner" (older ones "2030-03-04-dinner").
     * Sorted by key, i.e. by date, so the earliest meal decides how a name is displayed.
     */
    private List<PlannedMealEntry> plannedMealEntries(Long userId, LocalDate from, LocalDate to) {
        Map<String, PlannedMealEntry> entriesByKey = new TreeMap<>();
        calendars.findById(userId).ifPresent(plan -> plan.plannedMeals.fields().forEachRemaining(entry -> {
            LocalDate date = dateOf(entry.getKey());
            JsonNode mealNode = entry.getValue();
            JsonNode recipeId = mealNode.path("id");
            if (date != null && !date.isBefore(from) && !date.isAfter(to) && recipeId.isIntegralNumber()) {
                double servings = 1.0;
                JsonNode servingsNode = mealNode.path("plannedServings");
                if (!servingsNode.isNumber()) {
                    servingsNode = mealNode.path("servings");
                }
                // Only use `plannedServings` if explicitly set on the calendar slot, otherwise default to 1x
                if (mealNode.has("plannedServings") && mealNode.path("plannedServings").isNumber()) {
                    double parsed = mealNode.path("plannedServings").asDouble();
                    if (Double.isFinite(parsed) && parsed > 0) {
                        servings = parsed;
                    }
                }
                entriesByKey.put(entry.getKey(), new PlannedMealEntry(recipeId.asLong(), servings));
            }
        }));
        return List.copyOf(entriesByKey.values());
    }

    private static LocalDate dateOf(String key) {
        try {
            return key.length() < 10 ? null : LocalDate.parse(key.substring(0, 10));
        } catch (DateTimeParseException ex) {
            return null;
        }
    }

    /** Same name, or one is a whole-word part of the other ("cheddar" and "cheddar cheese"). */
    static boolean namesMatch(String needed, String owned) {
        if (needed.equals(owned)) {
            return true;
        }
        if (needed.length() < 3 || owned.length() < 3) {
            return false;
        }
        String paddedNeeded = " " + needed + " ";
        String paddedOwned = " " + owned + " ";
        return paddedOwned.contains(paddedNeeded) || paddedNeeded.contains(paddedOwned);
    }

    private record Remaining(String amount, String have) {
    }

    /** Everything the planned recipes need of one ingredient, summed per unit family. */
    private static final class Need {
        private final String name;
        private final Set<String> recipes = new TreeSet<>(String.CASE_INSENSITIVE_ORDER);
        private final Map<String, Amount> byFamily = new LinkedHashMap<>();

        Need(String name) {
            this.name = name;
        }

        void add(String recipeName, Double quantity, String unit) {
            recipes.add(recipeName);
            if (quantity == null || !Double.isFinite(quantity) || quantity <= 0) {
                return;
            }
            GroceryUnits.Unit info = GroceryUnits.of(unit);
            byFamily.computeIfAbsent(info.family(), family -> new Amount(unit, info.factor())).base
                    += quantity * info.factor();
        }

        /** What is left to buy after the pantry, or null when the pantry covers it. */
        Remaining remainingAfter(List<Ingredient> owned) {
            Map<String, Double> haveByFamily = new LinkedHashMap<>();
            List<String> haveParts = new ArrayList<>();
            for (Ingredient item : owned) {
                if (!Double.isFinite(item.getQuantity()) || item.getQuantity() <= 0) {
                    continue;
                }
                GroceryUnits.Unit info = GroceryUnits.of(item.getUnit());
                haveByFamily.merge(info.family(), item.getQuantity() * info.factor(), Double::sum);
                haveParts.add(GroceryUnits.format(item.getQuantity(), item.getUnit()));
            }

            if (byFamily.isEmpty()) {
                // No amount to compare against, so owning any of it counts as covered.
                return owned.isEmpty() ? new Remaining("", "") : null;
            }

            // First subtract within the exact same unit family (e.g., lb/oz/g/kg or cup/tbsp/ml/l).
            Map<String, Double> leftoverBaseByFamily = new LinkedHashMap<>();
            byFamily.forEach((family, need) -> {
                double haveInFamily = haveByFamily.getOrDefault(family, 0.0);
                double used = Math.min(need.base, haveInFamily);
                haveByFamily.put(family, haveInFamily - used);
                leftoverBaseByFamily.put(family, Math.max(0.0, need.base - used));
            });

            // Convert any unused pantry stock into grams so cross-family equivalents
            // (e.g., 1 lb of onion covering 1 each onion or 1 cup chopped onion) are also subtracted.
            final double[] unusedGrams = {0.0};
            haveByFamily.forEach((family, leftBase) -> {
                if (leftBase > 1e-6) {
                    double baseToGrams = switch (family) {
                        case "weight" -> 1.0;
                        case "volume" -> 4.92892;
                        case "count" -> 120.0;
                        default -> 100.0;
                    };
                    unusedGrams[0] += leftBase * baseToGrams;
                }
            });

            List<String> parts = new ArrayList<>();
            byFamily.forEach((family, need) -> {
                double left = leftoverBaseByFamily.getOrDefault(family, 0.0);
                if (left > 1e-6 && unusedGrams[0] > 1e-6) {
                    double baseToGrams = switch (family) {
                        case "weight" -> 1.0;
                        case "volume" -> 4.92892;
                        case "count" -> 120.0;
                        default -> 100.0;
                    };
                    double neededGrams = left * baseToGrams;
                    double coveredGrams = Math.min(neededGrams, unusedGrams[0]);
                    unusedGrams[0] -= coveredGrams;
                    left = Math.max(0.0, neededGrams - coveredGrams) / baseToGrams;
                }
                if (left > 1e-6) {
                    parts.add(GroceryUnits.format(left / need.factor, need.displayUnit));
                }
            });
            return parts.isEmpty() ? null : new Remaining(String.join(" + ", parts), String.join(" + ", haveParts));
        }
    }

    /** Running total in base units, shown in the first unit the recipes used. */
    private static final class Amount {
        private final String displayUnit;
        private final double factor;
        private double base;

        Amount(String displayUnit, double factor) {
            this.displayUnit = displayUnit;
            this.factor = factor;
        }
    }
}
