package com.remy.backend.service;

import com.remy.backend.dto.RatingResult;
import com.remy.backend.model.PreferenceType;
import com.remy.backend.model.Recipe;
import com.remy.backend.model.RecipePreference;
import com.remy.backend.model.User;
import com.remy.backend.repository.RecipePreferenceRepository;
import com.remy.backend.repository.RecipeReadRepository;
import com.remy.backend.repository.RecipeRepository;
import com.remy.backend.repository.UserRepository;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class RecipePreferenceService {

    private final RecipeRepository recipeRepository;
    private final RecipeReadRepository recipeReads;
    private final RecipePreferenceRepository recipePreferenceRepository;
    private final UserRepository userRepository;

    public RecipePreferenceService(
            RecipeRepository recipeRepository,
            RecipeReadRepository recipeReads,
            RecipePreferenceRepository recipePreferenceRepository,
            UserRepository userRepository) {
        this.recipeRepository = recipeRepository;
        this.recipeReads = recipeReads;
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

    /** Removes the user's like or dislike so the recipe is unrated again; a no-op when there is none. */
    @Transactional
    public RatingResult clear(Long userId, Long recipeId) {
        Recipe recipe = recipeRepository.findById(recipeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Recipe not found."));

        recipePreferenceRepository.findByUserIdAndRecipeId(userId, recipeId).ifPresent(existing -> {
            recipe.applyPreferenceChange(existing.getPreference(), null);
            recipePreferenceRepository.delete(existing);
            recipeRepository.save(recipe);
        });

        return new RatingResult(recipeId, null, recipe.getLikes(), recipe.getDislikes());
    }

    /** Recipe ID to LIKE or DISLIKE for everything the user has reacted to. */
    @Transactional(readOnly = true)
    public Map<Long, PreferenceType> reactions(Long userId) {
        Map<Long, PreferenceType> reactions = new LinkedHashMap<>();
        for (Object[] row : recipePreferenceRepository.findReactionsByUserId(userId)) {
            reactions.put((Long) row[0], (PreferenceType) row[1]);
        }
        return reactions;
    }

    /** Liked recipes, most recently liked first. */
    @Transactional(readOnly = true)
    public List<Recipe> favorites(Long userId) {
        return recipeReads.findInOrder(
                recipePreferenceRepository.findRecipeIdsByUserIdAndPreference(userId, PreferenceType.LIKE));
    }
}
