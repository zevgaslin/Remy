package com.remy.backend.service;

import com.remy.backend.dto.RatingResult;
import com.remy.backend.model.PreferenceType;
import com.remy.backend.model.Recipe;
import com.remy.backend.model.RecipePreference;
import com.remy.backend.model.User;
import com.remy.backend.repository.RecipePreferenceRepository;
import com.remy.backend.repository.RecipeRepository;
import com.remy.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RecipePreferenceService {

    private final RecipeRepository recipeRepository;
    private final RecipePreferenceRepository recipePreferenceRepository;
    private final UserRepository userRepository;

    public RecipePreferenceService(
            RecipeRepository recipeRepository,
            RecipePreferenceRepository recipePreferenceRepository,
            UserRepository userRepository) {
        this.recipeRepository = recipeRepository;
        this.recipePreferenceRepository = recipePreferenceRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public RatingResult rate(Long userId, Long recipeId, PreferenceType next) {
        User user = userRepository.findById(userId).orElseThrow();
        Recipe recipe = recipeRepository.findById(recipeId)
                .orElseThrow(() -> new IllegalArgumentException("Recipe not found."));

        RecipePreference existing = recipePreferenceRepository.findByUserIdAndRecipeId(userId, recipeId)
                .orElseGet(() -> {
                    RecipePreference created = new RecipePreference();
                    created.setUser(user);
                    created.setRecipe(recipe);
                    return created;
                });

        PreferenceType previous = existing.getPreference();
        if (previous != next) {
            recipe.applyPreferenceChange(previous, next);
        }

        existing.setPreference(next);
        recipePreferenceRepository.save(existing);
        recipeRepository.save(recipe);

        return new RatingResult(recipeId, next, recipe.getLikes(), recipe.getDislikes());
    }
}
