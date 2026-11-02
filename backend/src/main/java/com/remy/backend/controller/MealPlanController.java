package com.remy.backend.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.remy.backend.service.MealPlanService;
import com.remy.backend.service.SessionTokenService;
import java.time.LocalDate;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** The logged-in user's meal calendar: which recipe goes in which slot on which day. */
@RestController
@RequestMapping("/api/users/me/meal-plan")
public class MealPlanController {

    // The calendar's widest view is a month, so a month back covers anything it can show.
    private static final int DEFAULT_DAYS_BACK = 31;

    private final MealPlanService mealPlanService;
    private final SessionTokenService tokenService;

    public MealPlanController(MealPlanService mealPlanService, SessionTokenService tokenService) {
        this.mealPlanService = mealPlanService;
        this.tokenService = tokenService;
    }

    @GetMapping
    public ResponseEntity<?> getPlan(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from) {
        LocalDate start = from == null ? LocalDate.now().minusDays(DEFAULT_DAYS_BACK) : from;
        return asUser(authHeader, "Log in to see your meal plan.",
                userId -> ResponseEntity.ok(mealPlanService.getPlan(userId, start)));
    }

    @PutMapping("/meals/{date}/{slotId}")
    public ResponseEntity<?> planMeal(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @PathVariable String slotId,
            @RequestBody(required = false) Map<String, Long> request) {
        return asUser(authHeader, "Log in to save your meal plan.", userId -> {
            mealPlanService.planMeal(userId, date, slotId, request == null ? null : request.get("recipeId"));
            return ResponseEntity.ok(Map.of("date", date.toString(), "slotId", slotId));
        });
    }

    @DeleteMapping("/meals/{date}/{slotId}")
    public ResponseEntity<?> removeMeal(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @PathVariable String slotId) {
        return asUser(authHeader, "Log in to save your meal plan.", userId -> {
            mealPlanService.removeMeal(userId, date, slotId);
            return ResponseEntity.ok(Map.of("removed", true));
        });
    }

    @PutMapping("/days/{date}/slots")
    public ResponseEntity<?> setDaySlots(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestBody(required = false) JsonNode slots) {
        return asUser(authHeader, "Log in to save your meal plan.", userId -> {
            mealPlanService.setDaySlots(userId, date, slots);
            return ResponseEntity.ok(Map.of("date", date.toString(), "slots", slots));
        });
    }

    private ResponseEntity<?> asUser(String authHeader, String loginMessage, Function<Long, ResponseEntity<?>> action) {
        Optional<Long> userId = tokenService.resolveUserId(authHeader);
        if (userId.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", loginMessage));
        }
        try {
            return action.apply(userId.get());
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }
}
