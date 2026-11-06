package com.remy.backend.dto;

/** The user's stars for a recipe (null once cleared) and the recipe's rating across all users. */
public record StarRatingResult(Long recipeId, Integer stars, Double average, long count) {
}
