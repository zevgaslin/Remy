package com.remy.backend.service;

import com.remy.backend.dto.PreferenceCriterion;
import com.remy.backend.dto.RecipeMatchResponse;
import com.remy.backend.dto.RecipeSearchRequest;
import com.remy.backend.model.Ingredient;
import com.remy.backend.model.Recipe;
import com.remy.backend.model.RecipeIngredient;
import com.remy.backend.model.User;
import com.remy.backend.model.UserPreference;
import com.remy.backend.repository.IngredientRepository;
import com.remy.backend.repository.RecipeReadRepository;
import com.remy.backend.repository.RecipeQueryRepository;
import com.remy.backend.repository.UserPreferenceRepository;
import com.remy.backend.repository.UserRepository;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RecipeMatchingService {

    private final RecipeReadRepository recipeReads;
    private final RecipeQueryRepository recipeQueryRepository;
    private final IngredientRepository ingredientRepository;
    private final UserPreferenceRepository userPreferenceRepository;
    private final UserRepository userRepository;

    public RecipeMatchingService(
            RecipeReadRepository recipeReads,
            RecipeQueryRepository recipeQueryRepository,
            IngredientRepository ingredientRepository,
            UserPreferenceRepository userPreferenceRepository,
            UserRepository userRepository) {
        this.recipeReads = recipeReads;
        this.recipeQueryRepository = recipeQueryRepository;
        this.ingredientRepository = ingredientRepository;
        this.userPreferenceRepository = userPreferenceRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<RecipeMatchResponse> findMatchesForUser(Long userId, int limit) {
        List<String> ingredients = ingredientRepository.findByOwnerId(userId).stream()
                .map(Ingredient::getName)
                .toList();
        List<PreferenceCriterion> preferences = userPreferenceRepository.findByUserId(userId).stream()
                .map(item -> new PreferenceCriterion(item.getPreferenceName(), item.getPreferenceValue()))
                .toList();

        RecipeSearchRequest request = new RecipeSearchRequest();
        request.setIngredients(ingredients);
        request.setPreferences(preferences);
        request.setLimit(limit);
        return search(request, userId);
    }

    @Transactional(readOnly = true)
    public List<RecipeMatchResponse> search(RecipeSearchRequest request) {
        return search(request, null);
    }

    /** userId, when given, lifts the user's higher-rated recipes in the ranking and checks pantry unit quantities. */
    @Transactional(readOnly = true)
    public List<RecipeMatchResponse> search(RecipeSearchRequest request, Long userId) {
        Set<String> availableIngredients = canonicalNames(request.getIngredients());
        Set<String> expiringIngredients = canonicalNames(request.getExpiringIngredients());
        Set<String> favoriteIngredients = canonicalNames(request.getFavoriteIngredients());
        // Expiring and favorite items are still in the pantry, so they count toward what the user has.
        availableIngredients.addAll(expiringIngredients);
        availableIngredients.addAll(favoriteIngredients);

        List<Ingredient> userPantry = userId == null ? List.of() : ingredientRepository.findByOwnerId(userId);

        List<PreferenceCriterion> requestedPreferences = request.getPreferences() == null ? List.of() : 
                request.getPreferences().stream()
                .filter(item -> item != null && !isBlank(item.getName()) && !isBlank(item.getValue()))
                .toList();

        if (request.isRandom()) {
            return randomMatch(availableIngredients, requestedPreferences, userPantry);
        }

        int limit = request.getLimit() == null ? 20 : Math.max(1, Math.min(request.getLimit(), 100));

        var ids = recipeQueryRepository.search(request.getQuery(), availableIngredients, expiringIngredients,
                favoriteIngredients, requestedPreferences, request.isRequireAllIngredients(), limit, userId);
        return loadInOrder(ids).stream()
                .map(recipe -> score(recipe, availableIngredients, expiringIngredients, favoriteIngredients, requestedPreferences, userPantry))
                .filter(match -> !request.isRequireAllIngredients() || match.getMissingIngredients().isEmpty())
                .toList();
    }

    private List<RecipeMatchResponse> randomMatch(
            Set<String> ingredients, List<PreferenceCriterion> preferences, List<Ingredient> userPantry) {
        PreferenceCriterion preference = preferences.isEmpty() ? null : preferences.get(0);
        return recipeQueryRepository.randomId(preference)
                .map(id -> loadInOrder(List.of(id)).stream()
                        .map(recipe -> score(recipe, ingredients, Set.of(), Set.of(), preferences, userPantry))
                        .toList())
                .orElseGet(List::of);
    }

    @Transactional(readOnly = true)
    public List<PreferenceCriterion> getUserPreferences(Long userId) {
        return userPreferenceRepository.findByUserId(userId).stream()
                .map(item -> new PreferenceCriterion(item.getPreferenceName(), item.getPreferenceValue()))
                .toList();
    }

    @Transactional
    public List<PreferenceCriterion> replaceUserPreferences(Long userId, List<PreferenceCriterion> preferences) {
        User user = userRepository.findById(userId).orElseThrow();
        userPreferenceRepository.deleteByUserId(userId);

        Set<String> seen = new HashSet<>();
        List<UserPreference> saved = new ArrayList<>();
        for (PreferenceCriterion criterion : preferences) {
            if (criterion == null || isBlank(criterion.getName()) || isBlank(criterion.getValue())) {
                continue;
            }
            String key = normalize(criterion.getName()) + "\u0000" + normalize(criterion.getValue());
            if (!seen.add(key)) {
                continue;
            }

            UserPreference preference = new UserPreference();
            preference.setUser(user);
            preference.setPreferenceName(normalize(criterion.getName()));
            preference.setPreferenceValue(normalize(criterion.getValue()));
            saved.add(preference);
        }
        userPreferenceRepository.saveAll(saved);
        return getUserPreferences(userId);
    }

    @Transactional(readOnly = true)
    public List<Recipe> feed(Long userId, int limit, int offset) {
        return loadInOrder(recipeQueryRepository.feed(userId, Math.max(1, Math.min(limit, 100)), Math.max(0, offset)));
    }

    private List<Recipe> loadInOrder(List<Long> ids) {
        return recipeReads.findInOrder(ids);
    }

    private RecipeMatchResponse score(
            Recipe recipe,
            Set<String> availableIngredients,
            Set<String> expiringIngredients,
            Set<String> favoriteIngredients,
            List<PreferenceCriterion> requestedPreferences,
            List<Ingredient> userPantry) {
        List<String> matched = new ArrayList<>();
        List<String> missing = new ArrayList<>();
        Set<String> expiringUsed = new HashSet<>();
        Set<String> favoriteUsed = new HashSet<>();
        int requiredCount = 0;
        int matchedRequiredCount = 0;

        for (RecipeIngredient ingredient : recipe.getIngredients()) {
            String canonical = IngredientNameNormalizer.canonicalize(ingredient.getIngredientName());
            boolean available = isIngredientCovered(ingredient, canonical, availableIngredients, userPantry);
            if (expiringIngredients.contains(canonical)) {
                expiringUsed.add(ingredient.getIngredientName());
            }
            if (favoriteIngredients.contains(canonical)) {
                favoriteUsed.add(ingredient.getIngredientName());
            }
            if (available) {
                matched.add(ingredient.getIngredientName());
            }
            if (!ingredient.isOptional()) {
                requiredCount++;
                if (available) {
                    matchedRequiredCount++;
                } else {
                    missing.add(ingredient.getIngredientName());
                }
            }
        }

        double ingredientScore = availableIngredients.isEmpty() || requiredCount == 0
                ? 1.0
                : (double) matchedRequiredCount / requiredCount;
        double score = requestedPreferences.isEmpty()
                ? ingredientScore * 100
                : (ingredientScore * 0.75 + 0.25) * 100;

        return new RecipeMatchResponse(
                recipe,
                Math.round(score * 100.0) / 100.0,
                matched.stream().sorted().toList(),
                missing.stream().sorted().toList(),
                requestedPreferences,
                expiringUsed.stream().sorted().toList(),
                favoriteUsed.stream().sorted().toList());
    }

    /**
     * Checks whether the pantry covers {@code ingredient}. When the user's pantry items are
     * available, converts each matching pantry item's unit into the recipe ingredient's unit
     * (e.g., 1 lb of onion = 453.59 g >= 50 g of onion) so sufficient quantity in any compatible
     * unit qualifies.
     */
    static boolean isIngredientCovered(
            RecipeIngredient ingredient,
            String canonical,
            Set<String> availableIngredients,
            List<Ingredient> userPantry) {
        boolean nameMatched = availableIngredients.contains(canonical)
                || availableIngredients.stream().anyMatch(owned -> GroceryListService.namesMatch(canonical, owned));
        if (userPantry == null || userPantry.isEmpty()) {
            return nameMatched;
        }
        List<Ingredient> matchingPantry = userPantry.stream()
                .filter(p -> p.getName() != null
                        && GroceryListService.namesMatch(canonical, IngredientNameNormalizer.canonicalize(p.getName())))
                .toList();
        if (matchingPantry.isEmpty()) {
            return nameMatched;
        }
        Double neededQty = ingredient.getQuantity();
        if (neededQty == null || !Double.isFinite(neededQty) || neededQty <= 0) {
            return matchingPantry.stream().anyMatch(p -> p.getQuantity() > 0);
        }
        String recipeUnit = ingredient.getUnit();
        boolean placeholderOnly = matchingPantry.stream()
                .allMatch(p -> "item".equalsIgnoreCase(p.getUnit()) && p.getQuantity() == 1.0)
                && (recipeUnit == null || "item".equalsIgnoreCase(recipeUnit));
        if (placeholderOnly) {
            return true;
        }
        double totalInRecipeUnit = 0.0;
        for (Ingredient owned : matchingPantry) {
            if (Double.isFinite(owned.getQuantity()) && owned.getQuantity() > 0) {
                totalInRecipeUnit += GroceryUnits.convert(owned.getQuantity(), owned.getUnit(), recipeUnit);
            }
        }
        return totalInRecipeUnit + 1e-6 >= neededQty;
    }

    private Set<String> canonicalNames(List<String> names) {
        Set<String> canonical = new HashSet<>();
        if (names != null) {
            names.stream()
                    .filter(value -> value != null && !value.isBlank())
                    .map(IngredientNameNormalizer::canonicalize)
                    .forEach(canonical::add);
        }
        return canonical;
    }

    private String normalize(String value) {
        return value.trim().toLowerCase(Locale.ROOT);
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
