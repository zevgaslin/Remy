package com.remy.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.remy.backend.model.*;
import com.remy.backend.repository.*;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class RecipeManagementService {
    private final RecipeRepository recipes;
    private final RecipeReadRepository reads;
    private final RecipePreferenceRepository preferences;

    public RecipeManagementService(RecipeRepository recipes, RecipePreferenceRepository preferences, RecipeReadRepository reads) {
        this.recipes = recipes;
        this.preferences = preferences;
        this.reads = reads;
    }

    @Transactional(readOnly = true)
    public List<Recipe> list() {
        return reads.list();
    }

    @Transactional(readOnly = true)
    public Recipe get(Long id) {
        return reads.findInOrder(List.of(id)).stream().findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Recipe not found."));
    }

    private Recipe getForUpdate(Long id) {
        return recipes.findByIdIn(List.of(id)).stream().findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Recipe not found."));
    }

    @Transactional
    public Recipe create(JsonNode document) {
        Recipe recipe = new Recipe();
        
        recipe.setName(document.get("name").asText().trim());
        recipe.setCatalogId(string(document, "id"));
        recipe.setDescription(string(document, "description"));
        recipe.setCuisine(string(document, "cuisine"));
        recipe.setMealType(string(document, "mealType"));
        recipe.setDifficulty(string(document, "difficulty"));
        recipe.setPrepMinutes(integer(document, "prepMinutes"));
        recipe.setCookMinutes(integer(document, "cookMinutes"));
        recipe.setServings(integer(document, "servings"));
        
        List<String> steps = new ArrayList<>();
        if (document.has("instructions") && document.get("instructions").isArray()) {
            for (JsonNode step : document.get("instructions")) {
                steps.add((steps.size() + 1) + ". " + step.get("text").asText());
            }
        }
        recipe.setInstructions(String.join("\n\n", steps));

        if (document.has("nutrition") && !document.get("nutrition").isNull()) {
            JsonNode n = document.get("nutrition");
            recipe.setNutrition(new RecipeNutrition(
                integer(n, "calories"),
                integer(n, "protein"),
                integer(n, "carbs"),
                integer(n, "fat")
            ));
        }

        if (document.has("ingredients") && document.get("ingredients").isArray()) {
            for (JsonNode item : document.get("ingredients")) {
                RecipeIngredient ingredient = new RecipeIngredient();
                ingredient.setRecipe(recipe);
                ingredient.setIngredientName(item.get("name").asText());
                ingredient.setQuantity(item.has("quantity") && !item.get("quantity").isNull() ? item.get("quantity").doubleValue() : null);
                ingredient.setUnit(string(item, "unit"));
                ingredient.setOptional(item.has("optional") && item.get("optional").asBoolean());
                recipe.getIngredients().add(ingredient);
            }
        }

        if (document.has("preferenceTags") && document.get("preferenceTags").isArray()) {
            Set<String> tags = new HashSet<>();
            for (JsonNode item : document.get("preferenceTags")) {
                String name = item.get("name").asText().trim().toLowerCase(Locale.ROOT);
                String value = item.get("value").asText().trim().toLowerCase(Locale.ROOT);
                if (!tags.add(name + "\u0000" + value)) continue;
                RecipePreferenceTag tag = new RecipePreferenceTag();
                tag.setRecipe(recipe);
                tag.setPreferenceName(name);
                tag.setPreferenceValue(value);
                recipe.getPreferenceTags().add(tag);
            }
        }

        recipe.setDocument(document.deepCopy());
        return recipes.save(recipe);
    }

    @Transactional
    public Recipe update(Long id, String name, String instructions) {
        Recipe recipe = getForUpdate(id);
        recipe.setName(name.trim());
        recipe.setInstructions(instructions.trim());
        if (recipe.getDocument() instanceof ObjectNode existing) {
            ObjectNode document = existing.deepCopy();
            document.put("name", name.trim());
            if (!Objects.equals(existingInstructions(existing), instructions.trim())) {
                var steps = document.putArray("instructions");
                for (String text : instructions.trim().split("\\n\\s*\\n")) {
                    var step = steps.addObject();
                    step.put("text", text.trim().replaceFirst("^\\d+\\.\\s*", ""));
                    step.putNull("section");
                }
            }
            recipe.setDocument(document);
        }
        return recipes.save(recipe);
    }

    private String existingInstructions(ObjectNode document) {
        var lines = new ArrayList<String>();
        for (var step : document.get("instructions")) {
            lines.add((lines.size() + 1) + ". " + step.get("text").asText());
        }
        return String.join("\n\n", lines);
    }

    @Transactional
    public void delete(Long id) {
        Recipe recipe = getForUpdate(id);
        preferences.deleteForRecipe(id);
        recipes.delete(recipe);
    }

    private static String string(JsonNode n, String key) {
        return (n.has(key) && !n.get(key).isNull()) ? n.get(key).asText() : null;
    }

    private static Integer integer(JsonNode n, String key) {
        if (!n.has(key) || n.get(key).isNull()) return null;
        JsonNode v = n.get(key);
        if (v.isNumber()) return v.intValue();
        try {
            return Integer.parseInt(v.asText());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}