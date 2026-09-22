package com.remy.backend.controller;

import com.remy.backend.model.Recipe;
import com.remy.backend.repository.RecipeRepository;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/recipes")
public class RecipeController {

    private final RecipeRepository recipeRepository;

    public RecipeController(RecipeRepository recipeRepository) {
        this.recipeRepository = recipeRepository;
    }

    @GetMapping
    public List<Recipe> getAllRecipes() {
        return recipeRepository.findAll();
    }

    @PostMapping
    public ResponseEntity<?> createRecipe(@RequestBody Map<String, String> request) {
        String name = request.get("name");
        String instructions = request.get("instructions");

        if (isBlank(name) || isBlank(instructions)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Name and instructions are required."));
        }

        Recipe recipe = new Recipe();
        recipe.setName(name);
        recipe.setInstructions(instructions);

        return ResponseEntity.status(HttpStatus.CREATED).body(recipeRepository.save(recipe));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateRecipe(@PathVariable Long id, @RequestBody Map<String, String> request) {
        Recipe recipe = recipeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Recipe not found."));

        String name = request.get("name");
        String instructions = request.get("instructions");

        if (isBlank(name) || isBlank(instructions)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Name and instructions are required."));
        }

        recipe.setName(name);
        recipe.setInstructions(instructions);

        return ResponseEntity.ok(recipeRepository.save(recipe));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteRecipe(@PathVariable Long id) {
        Recipe recipe = recipeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Recipe not found."));

        recipeRepository.delete(recipe);
        return ResponseEntity.ok(Map.of("deleted", true, "id", id));
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
