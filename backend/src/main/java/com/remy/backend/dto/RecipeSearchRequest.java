package com.remy.backend.dto;

import java.util.ArrayList;
import java.util.List;

public class RecipeSearchRequest {

    private List<String> ingredients = new ArrayList<>();
    private List<PreferenceCriterion> preferences = new ArrayList<>();
    private boolean requireAllIngredients;
    private Integer limit = 20;

    public List<String> getIngredients() {
        return ingredients;
    }

    public void setIngredients(List<String> ingredients) {
        this.ingredients = ingredients == null ? new ArrayList<>() : ingredients;
    }

    public List<PreferenceCriterion> getPreferences() {
        return preferences;
    }

    public void setPreferences(List<PreferenceCriterion> preferences) {
        this.preferences = preferences == null ? new ArrayList<>() : preferences;
    }

    public boolean isRequireAllIngredients() {
        return requireAllIngredients;
    }

    public void setRequireAllIngredients(boolean requireAllIngredients) {
        this.requireAllIngredients = requireAllIngredients;
    }

    public Integer getLimit() {
        return limit;
    }

    public void setLimit(Integer limit) {
        this.limit = limit;
    }
}
