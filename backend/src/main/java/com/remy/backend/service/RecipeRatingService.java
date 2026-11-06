package com.remy.backend.service;

import com.remy.backend.dto.StarRatingResult;
import com.remy.backend.model.Recipe;
import com.remy.backend.model.RecipeRating;
import com.remy.backend.repository.RecipeRatingRepository;
import com.remy.backend.repository.RecipeRepository;
import com.remy.backend.repository.UserRepository;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class RecipeRatingService {

    private final RecipeRatingRepository ratings;
    private final RecipeRepository recipes;
    private final UserRepository users;

    public RecipeRatingService(RecipeRatingRepository ratings, RecipeRepository recipes, UserRepository users) {
        this.ratings = ratings;
        this.recipes = recipes;
        this.users = users;
    }

    /** Sets or changes the user's rating. */
    @Transactional
    public StarRatingResult rate(Long userId, Long recipeId, Integer stars) {
        if (stars == null || stars < RecipeRating.MIN_STARS || stars > RecipeRating.MAX_STARS) {
            throw new IllegalArgumentException("Choose a rating from 1 to 5 stars.");
        }
        Recipe recipe = recipe(recipeId);
        RecipeRating rating = ratings.findByUserIdAndRecipeId(userId, recipeId)
                .orElseGet(() -> new RecipeRating(users.getReferenceById(userId), recipe, stars));
        rating.setStars(stars);
        ratings.saveAndFlush(rating);
        return summary(recipeId, stars);
    }

    /** Removes the user's rating; a no-op when there is none. */
    @Transactional
    public StarRatingResult clear(Long userId, Long recipeId) {
        recipe(recipeId);
        ratings.findByUserIdAndRecipeId(userId, recipeId).ifPresent(rating -> {
            ratings.delete(rating);
            ratings.flush();
        });
        return summary(recipeId, null);
    }

    /** Recipe ID to stars for everything the user has rated. */
    @Transactional(readOnly = true)
    public Map<Long, Integer> userRatings(Long userId) {
        Map<Long, Integer> result = new LinkedHashMap<>();
        for (Object[] row : ratings.findStarsByUserId(userId)) {
            result.put((Long) row[0], (Integer) row[1]);
        }
        return result;
    }

    private StarRatingResult summary(Long recipeId, Integer stars) {
        Object[] row = ratings.summarize(recipeId).get(0);
        Double average = row[0] == null ? null : Math.round(((Number) row[0]).doubleValue() * 10) / 10.0;
        return new StarRatingResult(recipeId, stars, average, ((Number) row[1]).longValue());
    }

    private Recipe recipe(Long recipeId) {
        return recipes.findById(recipeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Recipe not found."));
    }
}
