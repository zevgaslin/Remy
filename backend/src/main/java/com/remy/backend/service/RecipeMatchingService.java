package com.remy.backend.service;

import com.remy.backend.dto.PreferenceCriterion;
import com.remy.backend.dto.RecipeMatchResponse;
import com.remy.backend.dto.RecipeSearchRequest;
import com.remy.backend.model.Ingredient;
import com.remy.backend.model.Recipe;
import com.remy.backend.model.RecipeIngredient;
import com.remy.backend.model.RecipePreferenceTag;
import com.remy.backend.model.User;
import com.remy.backend.model.UserPreference;
import com.remy.backend.repository.IngredientRepository;
import com.remy.backend.repository.RecipeRepository;
import com.remy.backend.repository.UserPreferenceRepository;
import com.remy.backend.repository.UserRepository;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RecipeMatchingService {

    private final RecipeRepository recipeRepository;
    private final IngredientRepository ingredientRepository;
    private final UserPreferenceRepository userPreferenceRepository;
    private final UserRepository userRepository;

    public RecipeMatchingService(
            RecipeRepository recipeRepository,
            IngredientRepository ingredientRepository,
            UserPreferenceRepository userPreferenceRepository,
            UserRepository userRepository) {
        this.recipeRepository = recipeRepository;
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
        return search(request);
    }

    @Transactional(readOnly = true)
    public List<RecipeMatchResponse> search(RecipeSearchRequest request) {
        Set<String> availableIngredients = new HashSet<>();
        request.getIngredients().stream()
                .filter(value -> value != null && !value.isBlank())
                .map(this::normalize)
                .forEach(availableIngredients::add);

        List<PreferenceCriterion> requestedPreferences = request.getPreferences().stream()
                .filter(item -> item != null && !isBlank(item.getName()) && !isBlank(item.getValue()))
                .toList();

        int limit = request.getLimit() == null ? 20 : Math.max(1, Math.min(request.getLimit(), 100));

        return recipeRepository.findAll().stream()
                .filter(recipe -> matchesPreferences(recipe, requestedPreferences))
                .filter(recipe -> availableIngredients.isEmpty()
                        || recipe.getIngredients().stream().anyMatch(ingredient ->
                                availableIngredients.contains(normalize(ingredient.getIngredientName()))))
                .map(recipe -> score(recipe, availableIngredients, requestedPreferences))
                .filter(match -> !request.isRequireAllIngredients() || match.getMissingIngredients().isEmpty())
                .sorted(Comparator.comparingDouble(RecipeMatchResponse::getMatchScore).reversed()
                        .thenComparing(match -> match.getRecipe().getName()))
                .limit(limit)
                .toList();
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

    private boolean matchesPreferences(Recipe recipe, List<PreferenceCriterion> preferences) {
        Set<String> tags = recipe.getPreferenceTags().stream()
                .map(this::tagKey)
                .collect(java.util.stream.Collectors.toSet());
        return preferences.stream()
                .allMatch(preference -> tags.contains(tagKey(preference.getName(), preference.getValue())));
    }

    private RecipeMatchResponse score(
            Recipe recipe,
            Set<String> availableIngredients,
            List<PreferenceCriterion> requestedPreferences) {
        List<String> matched = new ArrayList<>();
        List<String> missing = new ArrayList<>();
        int requiredCount = 0;
        int matchedRequiredCount = 0;

        for (RecipeIngredient ingredient : recipe.getIngredients()) {
            boolean available = availableIngredients.contains(normalize(ingredient.getIngredientName()));
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
                requestedPreferences);
    }

    private String tagKey(RecipePreferenceTag tag) {
        return tagKey(tag.getPreferenceName(), tag.getPreferenceValue());
    }

    private String tagKey(String name, String value) {
        return normalize(name) + "\u0000" + normalize(value);
    }

    private String normalize(String value) {
        return value.trim().toLowerCase(Locale.ROOT);
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
