package com.remy.backend.dto;

import com.remy.backend.model.NutritionGoals;

public record NutritionGoalsDto(Integer calories, Integer protein, Integer carbs, Integer fat) {

    public static NutritionGoalsDto from(NutritionGoals goals) {
        return new NutritionGoalsDto(goals.getCalories(), goals.getProtein(), goals.getCarbs(), goals.getFat());
    }
}
