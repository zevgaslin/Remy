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
import java.time.LocalDate;

/** A recipe a user has put in one meal slot (e.g. "breakfast") on one calendar day. */
@Entity
@Table(
        name = "planned_meals",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "plan_date", "slot_id"}))
public class PlannedMeal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "plan_date", nullable = false)
    private LocalDate planDate;

    @Column(name = "slot_id", nullable = false, length = 120)
    private String slotId;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "recipe_id", nullable = false)
    private Recipe recipe;

    public PlannedMeal() {
    }

    public PlannedMeal(User user, LocalDate planDate, String slotId) {
        this.user = user;
        this.planDate = planDate;
        this.slotId = slotId;
    }

    public Long getId() {
        return id;
    }

    public LocalDate getPlanDate() {
        return planDate;
    }

    public String getSlotId() {
        return slotId;
    }

    public Recipe getRecipe() {
        return recipe;
    }

    public void setRecipe(Recipe recipe) {
        this.recipe = recipe;
    }
}
