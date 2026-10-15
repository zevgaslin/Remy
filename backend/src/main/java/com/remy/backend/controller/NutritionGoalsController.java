package com.remy.backend.controller;

import com.remy.backend.dto.NutritionGoalsDto;
import com.remy.backend.service.NutritionGoalsService;
import com.remy.backend.service.SessionTokenService;
import java.util.Map;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users/me/goals")
public class NutritionGoalsController {

    private final NutritionGoalsService nutritionGoalsService;
    private final SessionTokenService tokenService;

    public NutritionGoalsController(NutritionGoalsService nutritionGoalsService, SessionTokenService tokenService) {
        this.nutritionGoalsService = nutritionGoalsService;
        this.tokenService = tokenService;
    }

    @GetMapping
    public ResponseEntity<?> getGoals(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        Optional<Long> userId = tokenService.resolveUserId(authHeader);
        if (userId.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Log in to see your nutrition goals."));
        }
        return ResponseEntity.ok(nutritionGoalsService.getGoals(userId.get()));
    }

    @PutMapping
    public ResponseEntity<?> updateGoals(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody(required = false) NutritionGoalsDto request) {
        Optional<Long> userId = tokenService.resolveUserId(authHeader);
        if (userId.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Log in to set your nutrition goals."));
        }
        try {
            return ResponseEntity.ok(nutritionGoalsService.updateGoals(userId.get(), request));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }
}
