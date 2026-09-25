package com.remy.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.OneToMany;
import java.util.LinkedHashSet;
import java.util.Set;

@Entity
public class Recipe {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Lob
    private String instructions;

    private String description;
    private String cuisine;
    private String mealType;
    private String difficulty;
    private Integer prepMinutes;
    private Integer cookMinutes;
    private Integer servings;

    @OneToMany(mappedBy = "recipe", cascade = jakarta.persistence.CascadeType.ALL, orphanRemoval = true)
    private Set<RecipeIngredient> ingredients = new LinkedHashSet<>();

    @OneToMany(mappedBy = "recipe", cascade = jakarta.persistence.CascadeType.ALL, orphanRemoval = true)
    private Set<RecipePreferenceTag> preferenceTags = new LinkedHashSet<>();

    @Column(nullable = false)
    private int likes = 0;

    @Column(nullable = false)
    private int dislikes = 0;

    public Recipe() {
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getInstructions() {
        return instructions;
    }

    public void setInstructions(String instructions) {
        this.instructions = instructions;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCuisine() {
        return cuisine;
    }

    public void setCuisine(String cuisine) {
        this.cuisine = cuisine;
    }

    public String getMealType() {
        return mealType;
    }

    public void setMealType(String mealType) {
        this.mealType = mealType;
    }

    public String getDifficulty() {
        return difficulty;
    }

    public void setDifficulty(String difficulty) {
        this.difficulty = difficulty;
    }

    public Integer getPrepMinutes() {
        return prepMinutes;
    }

    public void setPrepMinutes(Integer prepMinutes) {
        this.prepMinutes = prepMinutes;
    }

    public Integer getCookMinutes() {
        return cookMinutes;
    }

    public void setCookMinutes(Integer cookMinutes) {
        this.cookMinutes = cookMinutes;
    }

    public Integer getServings() {
        return servings;
    }

    public void setServings(Integer servings) {
        this.servings = servings;
    }

    public Set<RecipeIngredient> getIngredients() {
        return ingredients;
    }

    public Set<RecipePreferenceTag> getPreferenceTags() {
        return preferenceTags;
    }

    public int getLikes() {
        return likes;
    }

    public void setLikes(int likes) {
        this.likes = likes;
    }

    public int getLikeCount() {
        return likes;
    }

    public int getDislikes() {
        return dislikes;
    }

    public void setDislikes(int dislikes) {
        this.dislikes = dislikes;
    }

    public int getDislikeCount() {
        return dislikes;
    }

    public void applyPreferenceChange(PreferenceType previous, PreferenceType next) {
        if (previous == PreferenceType.LIKE) {
            likes = Math.max(0, likes - 1);
        } else if (previous == PreferenceType.DISLIKE) {
            dislikes = Math.max(0, dislikes - 1);
        }

        if (next == PreferenceType.LIKE) {
            likes++;
        } else if (next == PreferenceType.DISLIKE) {
            dislikes++;
        }
    }
}
