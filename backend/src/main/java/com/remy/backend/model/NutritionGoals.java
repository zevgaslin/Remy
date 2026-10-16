package com.remy.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

/**
 * A user's daily nutrition goals. Null until the user sets their own.
 */
@Embeddable
public class NutritionGoals {

    public static final NutritionGoals DEFAULTS = new NutritionGoals(2000, 50, 275, 78);

    @Column(name = "calorie_goal")
    private Integer calories;

    @Column(name = "protein_goal")
    private Integer protein;

    @Column(name = "carbs_goal")
    private Integer carbs;

    @Column(name = "fat_goal")
    private Integer fat;

    public NutritionGoals() {
    }

    public NutritionGoals(Integer calories, Integer protein, Integer carbs, Integer fat) {
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
