package com.remy.backend.dto;

import com.remy.backend.model.PreferenceType;

public record RatingResult(Long recipeId, PreferenceType preference, int likes, int dislikes) {
}
