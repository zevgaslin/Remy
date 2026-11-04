package com.remy.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

/** One user's 1–5 star rating of a recipe. Separate from favorite/dislike. */
@Entity
@Table(name = "recipe_ratings",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "recipe_id"}))
public class RecipeRating {

    public static final int MIN_STARS = 1;
    public static final int MAX_STARS = 5;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "recipe_id", nullable = false)
    private Recipe recipe;

    @Column(nullable = false)
    private int stars;

    protected RecipeRating() {
    }

    public RecipeRating(User user, Recipe recipe, int stars) {
        this.user = user;
        this.recipe = recipe;
        this.stars = stars;
    }

    public int getStars() {
        return stars;
    }

    public void setStars(int stars) {
        this.stars = stars;
    }
}
