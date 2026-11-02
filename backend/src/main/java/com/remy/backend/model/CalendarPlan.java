package com.remy.backend.model;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/** One account-owned calendar, with recipe and custom-slot snapshots. */
@Entity
public class CalendarPlan {
    @Id public Long userId;
    @Column(nullable=false) public long revision;
    @JdbcTypeCode(SqlTypes.JSON) @Column(nullable=false, columnDefinition="jsonb")
    public JsonNode plannedMeals;
    @JdbcTypeCode(SqlTypes.JSON) @Column(nullable=false, columnDefinition="jsonb")
    public JsonNode dailyMealSlots;
}
