package com.remy.backend.model;

import com.fasterxml.jackson.databind.JsonNode;
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
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * A day whose meal slots the user customized (added or removed slots). Days without a row
 * use the default Breakfast/Lunch/Snack/Dinner slots.
 */
@Entity
@Table(
        name = "meal_plan_days",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "plan_date"}))
public class MealPlanDay {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "plan_date", nullable = false)
    private LocalDate planDate;

    // [{ "id": "breakfast", "label": "Breakfast", "time": "08:00", "hour": 8 }, ...]
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private JsonNode slots;

    public MealPlanDay() {
    }

    public MealPlanDay(User user, LocalDate planDate) {
        this.user = user;
        this.planDate = planDate;
    }

    public LocalDate getPlanDate() {
        return planDate;
    }

    public JsonNode getSlots() {
        return slots;
    }

    public void setSlots(JsonNode slots) {
        this.slots = slots;
    }
}
