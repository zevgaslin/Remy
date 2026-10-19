package com.remy.backend.controller;

import com.remy.backend.dto.RatingResult;
import com.remy.backend.model.PreferenceType;
import com.remy.backend.dto.PreferenceCriterion;
import com.remy.backend.dto.RecipeSearchRequest;
import com.remy.backend.model.Recipe;
import com.remy.backend.repository.RecipePreferenceRepository;
import com.remy.backend.service.RecipeMatchingService;
import com.remy.backend.service.RecipePreferenceService;
import com.remy.backend.service.SessionTokenService;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/recipes")
public class RecipeController {

    private final com.remy.backend.service.RecipeManagementService recipeManagementService;
    private final RecipePreferenceRepository recipePreferenceRepository;
    private final RecipePreferenceService recipePreferenceService;
    private final SessionTokenService tokenService;
    private final RecipeMatchingService recipeMatchingService;

    public RecipeController(
            com.remy.backend.service.RecipeManagementService recipeManagementService,
            RecipePreferenceRepository recipePreferenceRepository,
            RecipePreferenceService recipePreferenceService,
            SessionTokenService tokenService,
            RecipeMatchingService recipeMatchingService) {
        this.recipeManagementService = recipeManagementService;
        this.recipePreferenceRepository = recipePreferenceRepository;
        this.recipePreferenceService = recipePreferenceService;
        this.tokenService = tokenService;
        this.recipeMatchingService = recipeMatchingService;
    }

    @GetMapping
    public List<Recipe> getAllRecipes() {
        return recipeManagementService.list();
    }

    @GetMapping("/{id}")
    public Recipe getRecipe(@PathVariable Long id) {
        return recipeManagementService.get(id);
    }

    @GetMapping("/feed")
    public ResponseEntity<?> getRecipeFeed(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(defaultValue = "0") int offset) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.ok(recipeMatchingService.feed(null, limit, offset));
        }
        Optional<Long> userId = tokenService.resolveUserId(authHeader);
        if (userId.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Log in to see recipe suggestions."));
        }
        return ResponseEntity.ok(recipeMatchingService.feed(userId.get(), limit, offset));
    }

    @GetMapping("/matches")
    public ResponseEntity<?> getRecipeMatches(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(defaultValue = "20") int limit) {
        Optional<Long> userId = tokenService.resolveUserId(authHeader);
        if (userId.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Log in to match recipes to your pantry and preferences."));
        }
        int safeLimit = Math.max(1, Math.min(limit, 100));
        return ResponseEntity.ok(recipeMatchingService.findMatchesForUser(userId.get(), safeLimit));
    }

    @PostMapping("/search")
    public ResponseEntity<?> searchRecipes(@RequestBody RecipeSearchRequest request) {
        if (request == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Search values are required."));
        }
        return ResponseEntity.ok(recipeMatchingService.search(request));
    }

    @GetMapping("/preferences")
    public ResponseEntity<?> getUserPreferences(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        Optional<Long> userId = tokenService.resolveUserId(authHeader);
        if (userId.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Log in to view dietary preferences."));
        }
        return ResponseEntity.ok(recipeMatchingService.getUserPreferences(userId.get()));
    }

    @PutMapping("/preferences")
    public ResponseEntity<?> replaceUserPreferences(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody List<PreferenceCriterion> preferences) {
        Optional<Long> userId = tokenService.resolveUserId(authHeader);
        if (userId.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Log in to save dietary preferences."));
        }
        return ResponseEntity.ok(recipeMatchingService.replaceUserPreferences(
                userId.get(), preferences == null ? List.of() : preferences));
    }

    @GetMapping("/{id}/preference")
    public ResponseEntity<?> getUserRecipePreference(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.ok(Map.of("recipeId", id, "preference", "NONE"));
        }

        Optional<Long> userId = tokenService.resolveUserId(authHeader);
        if (userId.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Log in to view recipe preferences."));
        }

        String preference = recipePreferenceRepository.findPreferenceValue(userId.get(), id)
                .map(Enum::name)
                .orElse("NONE");

        return ResponseEntity.ok(Map.of("recipeId", id, "preference", preference));
    }

    @PostMapping
    public ResponseEntity<?> createRecipe(@RequestBody Map<String, String> request) {
        String name = request.get("name");
        String instructions = request.get("instructions");

        if (isBlank(name) || isBlank(instructions)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Name and instructions are required."));
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(recipeManagementService.create(name, instructions));
    }

    @PostMapping("/{id}/like")
    public ResponseEntity<?> likeRecipe(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id) {
        return applyPreference(authHeader, id, PreferenceType.LIKE);
    }

    @PostMapping("/{id}/dislike")
    public ResponseEntity<?> dislikeRecipe(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id) {
        return applyPreference(authHeader, id, PreferenceType.DISLIKE);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateRecipe(@PathVariable Long id, @RequestBody Map<String, String> request) {
        String name = request.get("name");
        String instructions = request.get("instructions");

        if (isBlank(name) || isBlank(instructions)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Name and instructions are required."));
        }

        return ResponseEntity.ok(recipeManagementService.update(id, name, instructions));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteRecipe(@PathVariable Long id) {
        recipeManagementService.delete(id);
        return ResponseEntity.ok(Map.of("deleted", true, "id", id));
    }

    private ResponseEntity<?> applyPreference(String authHeader, Long recipeId, PreferenceType preference) {
        Optional<Long> userId = tokenService.resolveUserId(authHeader);
        if (userId.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Log in to rate recipes."));
        }

        RatingResult result = recipePreferenceService.rate(userId.get(), recipeId, preference);
        return ResponseEntity.ok(Map.of(
                "recipeId", result.recipeId(),
                "preference", result.preference().name(),
                "likes", result.likes(),
                "dislikes", result.dislikes()));
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}