package com.remy.backend.controller;

import com.remy.backend.dto.CreateIngredientRequest;
import com.remy.backend.model.Ingredient;
import com.remy.backend.repository.IngredientRepository;
import com.remy.backend.repository.UserRepository;
import com.remy.backend.service.TokenService;
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
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ingredients")
public class IngredientController {

    private final IngredientRepository ingredientRepository;
    private final UserRepository userRepository;
    private final TokenService tokenService;

    public IngredientController(
            IngredientRepository ingredientRepository,
            UserRepository userRepository,
            TokenService tokenService) {
        this.ingredientRepository = ingredientRepository;
        this.userRepository = userRepository;
        this.tokenService = tokenService;
    }

    @GetMapping
    public ResponseEntity<?> getMyIngredients(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        Optional<Long> userId = tokenService.resolveUserId(authHeader);
        if (userId.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Log in to see your ingredients."));
        }
        return ResponseEntity.ok(ingredientRepository.findByOwnerId(userId.get()));
    }

    @PostMapping
    public ResponseEntity<?> createIngredient(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody CreateIngredientRequest request) {
        Optional<Long> userId = tokenService.resolveUserId(authHeader);
        if (userId.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Log in to add ingredients."));
        }
        if (isBlank(request.getName()) || isBlank(request.getUnit()) || request.getExpirationDate() == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Name, unit, and expiration date are required."));
        }

        Ingredient ingredient = new Ingredient();
        ingredient.setName(request.getName());
        ingredient.setQuantity(request.getQuantity() != null ? request.getQuantity() : 1);
        ingredient.setUnit(request.getUnit());
        ingredient.setExpirationDate(request.getExpirationDate());
        ingredient.setOwner(userRepository.findById(userId.get()).orElseThrow());

        Ingredient saved = ingredientRepository.save(ingredient);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateIngredient(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id,
            @RequestBody CreateIngredientRequest request) {
        Optional<Long> userId = tokenService.resolveUserId(authHeader);
        if (userId.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Log in to update ingredients."));
        }
        if (isBlank(request.getName()) || isBlank(request.getUnit()) || request.getExpirationDate() == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Name, unit, and expiration date are required."));
        }

        Ingredient ingredient = ingredientRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Ingredient not found."));

        if (!ingredient.getOwner().getId().equals(userId.get())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "You can only update your own ingredients."));
        }

        ingredient.setName(request.getName());
        ingredient.setQuantity(request.getQuantity() != null ? request.getQuantity() : 1);
        ingredient.setUnit(request.getUnit());
        ingredient.setExpirationDate(request.getExpirationDate());

        return ResponseEntity.ok(ingredientRepository.save(ingredient));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteIngredient(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id) {
        Optional<Long> userId = tokenService.resolveUserId(authHeader);
        if (userId.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Log in to delete ingredients."));
        }

        Ingredient ingredient = ingredientRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Ingredient not found."));

        if (!ingredient.getOwner().getId().equals(userId.get())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "You can only delete your own ingredients."));
        }

        ingredientRepository.delete(ingredient);
        return ResponseEntity.ok(Map.of("deleted", true, "id", id));
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
