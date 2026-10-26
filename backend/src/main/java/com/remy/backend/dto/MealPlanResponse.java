package com.remy.backend.dto;

import com.fasterxml.jackson.databind.JsonNode;
import com.remy.backend.model.Recipe;
import java.util.List;
import java.util.Map;

/** A user's saved calendar: planned recipes plus any days whose meal slots were customized. */
public record MealPlanResponse(List<Meal> meals, Map<String, JsonNode> daySlots) {

    public record Meal(String date, String slotId, Recipe recipe) {
    }
}
