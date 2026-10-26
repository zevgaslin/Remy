package com.remy.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.remy.backend.dto.MealPlanResponse;
import com.remy.backend.model.MealPlanDay;
import com.remy.backend.model.PlannedMeal;
import com.remy.backend.model.Recipe;
import com.remy.backend.model.User;
import com.remy.backend.repository.MealPlanDayRepository;
import com.remy.backend.repository.PlannedMealRepository;
import com.remy.backend.repository.RecipeReadRepository;
import com.remy.backend.repository.RecipeRepository;
import com.remy.backend.repository.UserRepository;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class MealPlanService {

    static final int MAX_SLOTS_PER_DAY = 24;
    private static final int MAX_SLOT_ID_LENGTH = 120;
    private static final int MAX_LABEL_LENGTH = 60;

    private final PlannedMealRepository meals;
    private final MealPlanDayRepository days;
    private final RecipeRepository recipes;
    private final RecipeReadRepository recipeReads;
    private final UserRepository users;

    public MealPlanService(
            PlannedMealRepository meals,
            MealPlanDayRepository days,
            RecipeRepository recipes,
            RecipeReadRepository recipeReads,
            UserRepository users) {
        this.meals = meals;
        this.days = days;
        this.recipes = recipes;
        this.recipeReads = recipeReads;
        this.users = users;
    }

    @Transactional(readOnly = true)
    public MealPlanResponse getPlan(Long userId, LocalDate from) {
        List<Object[]> rows = meals.findPlanRows(userId, from);
        List<Long> recipeIds = rows.stream().map(row -> (Long) row[2]).distinct().toList();
        Map<Long, Recipe> recipesById = recipeReads.findInOrder(recipeIds).stream()
                .collect(Collectors.toMap(Recipe::getId, Function.identity()));

        List<MealPlanResponse.Meal> planned = new ArrayList<>();
        for (Object[] row : rows) {
            Recipe recipe = recipesById.get((Long) row[2]);
            if (recipe != null) {
                planned.add(new MealPlanResponse.Meal(row[0].toString(), (String) row[1], recipe));
            }
        }

        Map<String, JsonNode> daySlots = new LinkedHashMap<>();
        days.findByUserIdAndPlanDateGreaterThanEqualOrderByPlanDate(userId, from)
                .forEach(day -> daySlots.put(day.getPlanDate().toString(), day.getSlots()));
        return new MealPlanResponse(planned, daySlots);
    }

    @Transactional
    public void planMeal(Long userId, LocalDate date, String slotId, Long recipeId) {
        requireSlotId(slotId);
        if (recipeId == null) {
            throw new IllegalArgumentException("Choose a recipe to plan.");
        }
        Recipe recipe = recipes.findById(recipeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Recipe not found."));
        PlannedMeal meal = meals.findByUserIdAndPlanDateAndSlotId(userId, date, slotId)
                .orElseGet(() -> new PlannedMeal(user(userId), date, slotId));
        meal.setRecipe(recipe);
        meals.save(meal);
    }

    @Transactional
    public void removeMeal(Long userId, LocalDate date, String slotId) {
        meals.deleteSlot(userId, date, slotId);
    }

    /** Saves a day's custom slot list and drops any planned meal whose slot was removed. */
    @Transactional
    public void setDaySlots(Long userId, LocalDate date, JsonNode slots) {
        Set<String> slotIds = validateSlots(slots);
        MealPlanDay day = days.findByUserIdAndPlanDate(userId, date)
                .orElseGet(() -> new MealPlanDay(user(userId), date));
        day.setSlots(slots);
        days.save(day);

        if (slotIds.isEmpty()) {
            meals.deleteDay(userId, date);
        } else {
            meals.deleteSlotsNotIn(userId, date, slotIds);
        }
    }

    private Set<String> validateSlots(JsonNode slots) {
        if (slots == null || !slots.isArray()) {
            throw new IllegalArgumentException("Meal slots must be a list.");
        }
        if (slots.size() > MAX_SLOTS_PER_DAY) {
            throw new IllegalArgumentException("A day can have at most " + MAX_SLOTS_PER_DAY + " meals.");
        }
        Map<String, Boolean> ids = new HashMap<>();
        for (JsonNode slot : slots) {
            String id = slot.path("id").asText("");
            String label = slot.path("label").asText("");
            requireSlotId(id);
            if (label.isBlank() || label.length() > MAX_LABEL_LENGTH) {
                throw new IllegalArgumentException("Each meal needs a name of at most " + MAX_LABEL_LENGTH + " characters.");
            }
            if (ids.put(id, true) != null) {
                throw new IllegalArgumentException("Meal slot IDs must be unique within a day.");
            }
        }
        return ids.keySet();
    }

    private void requireSlotId(String slotId) {
        if (slotId == null || slotId.isBlank() || slotId.length() > MAX_SLOT_ID_LENGTH) {
            throw new IllegalArgumentException("Invalid meal slot.");
        }
    }

    private User user(Long userId) {
        return users.getReferenceById(userId);
    }
}
