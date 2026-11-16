package com.remy.backend.dto;

import com.remy.backend.model.Recipe;
import java.util.List;

public class RecipeMatchResponse {

    private final Recipe recipe;
    private final double matchScore;
    private final List<String> matchedIngredients;
    private final List<String> missingIngredients;
    private final List<PreferenceCriterion> matchedPreferences;
    private final List<String> expiringIngredients;
    private final List<String> favoriteIngredients;

    public RecipeMatchResponse(
            Recipe recipe,
            double matchScore,
            List<String> matchedIngredients,
            List<String> missingIngredients,
            List<PreferenceCriterion> matchedPreferences,
            List<String> expiringIngredients) {
        this(recipe, matchScore, matchedIngredients, missingIngredients, matchedPreferences, expiringIngredients, List.of());
    }

    public RecipeMatchResponse(
            Recipe recipe,
            double matchScore,
            List<String> matchedIngredients,
            List<String> missingIngredients,
            List<PreferenceCriterion> matchedPreferences,
            List<String> expiringIngredients,
            List<String> favoriteIngredients) {
        this.recipe = recipe;
        this.matchScore = matchScore;
        this.matchedIngredients = matchedIngredients;
        this.missingIngredients = missingIngredients;
        this.matchedPreferences = matchedPreferences;
        this.expiringIngredients = expiringIngredients;
        this.favoriteIngredients = favoriteIngredients == null ? List.of() : favoriteIngredients;
    }

    public Recipe getRecipe() {
        return recipe;
    }

    public double getMatchScore() {
        return matchScore;
    }

    public List<String> getMatchedIngredients() {
        return matchedIngredients;
    }

    public List<String> getMissingIngredients() {
        return missingIngredients;
    }

    public List<PreferenceCriterion> getMatchedPreferences() {
        return matchedPreferences;
    }

    public List<String> getExpiringIngredients() {
        return expiringIngredients;
    }

    public List<String> getFavoriteIngredients() {
        return favoriteIngredients;
    }
}
