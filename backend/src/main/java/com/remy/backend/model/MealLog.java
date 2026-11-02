package com.remy.backend.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.time.LocalDate;

/** Immutable nutrition and goal snapshots; intentionally independent of recipe deletion. */
@Entity
@Table(uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "eaten_on", "slot"}))
public class MealLog {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    @JsonIgnore @Column(name="user_id", nullable=false)
    public Long userId;
    @Column(name="eaten_on", nullable=false)
    public LocalDate eatenOn;
    @Column(nullable=false, length=200)
    public String slot;
    public String recipeName;
    public Long recipeId;
    public double servings;
    public Double calories;
    public Double protein;
    public Double carbs;
    public Double fat;
    @Embedded public NutritionGoals goals;
}
