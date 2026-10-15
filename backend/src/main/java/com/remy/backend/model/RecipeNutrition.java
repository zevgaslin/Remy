package com.remy.backend.model;

import jakarta.persistence.Embeddable;

/**
 * Nutrition for one serving of a recipe. Serialized as the recipe's "nutrition" object.
 */
@Embeddable
public class RecipeNutrition {

    private Integer calories;
    private Integer protein;
    private Integer carbs;
    private Integer fat;

    public RecipeNutrition() {
    }

    public RecipeNutrition(Integer calories, Integer protein, Integer carbs, Integer fat) {
        this.calories = calories;
        this.protein = protein;
        this.carbs = carbs;
        this.fat = fat;
    }

    public Integer getCalories() {
        return calories;
    }

    public Integer getProtein() {
        return protein;
    }

    public Integer getCarbs() {
        return carbs;
    }

    public Integer getFat() {
        return fat;
    }
}
