package com.remy.backend.repository;

import com.fasterxml.jackson.databind.*;
import com.remy.backend.model.*;
import java.sql.*;
import java.util.*;
import org.springframework.jdbc.core.namedparam.*;
import org.springframework.stereotype.Repository;

/** One row per recipe: aggregate small child rows before transferring the full JSON document. */
@Repository
public class RecipeReadRepository {
    private static final String SELECT = """
        SELECT r.*,
          COALESCE((SELECT jsonb_agg(jsonb_build_object(
            'id', i.id, 'name', i.ingredient_name, 'quantity', i.quantity, 'unit', i.unit, 'optional', i.optional)
            ORDER BY i.id) FROM recipe_ingredients i WHERE i.recipe_id=r.id), '[]'::jsonb) AS ingredient_rows,
          COALESCE((SELECT jsonb_agg(jsonb_build_object(
            'id', t.id, 'name', t.preference_name, 'value', t.preference_value)
            ORDER BY t.id) FROM recipe_preference_tags t WHERE t.recipe_id=r.id), '[]'::jsonb) AS tag_rows
        FROM recipe r
        """;
    private final NamedParameterJdbcTemplate jdbc;
    private final ObjectMapper mapper;
    public RecipeReadRepository(NamedParameterJdbcTemplate jdbc, ObjectMapper mapper) { this.jdbc=jdbc; this.mapper=mapper; }

    public List<Recipe> list() { return jdbc.query(SELECT+" ORDER BY r.id DESC", Map.of(), this::map); }
    public List<Recipe> findInOrder(List<Long> ids) {
        if (ids.isEmpty()) return List.of();
        var rows=jdbc.query(SELECT+" WHERE r.id IN (:ids)", Map.of("ids",ids), this::map);
        var byId=new HashMap<Long,Recipe>();
        rows.forEach(recipe->byId.put(recipe.getId(),recipe));
        return ids.stream().map(byId::get).filter(Objects::nonNull).toList();
    }
    private Recipe map(ResultSet row,int index) throws SQLException {
        var recipe=new Recipe(row.getLong("id"));
        recipe.setCatalogId(row.getString("catalog_id"));
        recipe.setName(row.getString("name")); recipe.setDescription(row.getString("description"));
        recipe.setInstructions(row.getString("instruction_text"));
        recipe.setCuisine(row.getString("cuisine")); recipe.setMealType(row.getString("meal_type"));
        recipe.setDifficulty(row.getString("difficulty"));
        recipe.setPrepMinutes(row.getObject("prep_minutes",Integer.class));
        recipe.setCookMinutes(row.getObject("cook_minutes",Integer.class));
        recipe.setServings(row.getObject("servings",Integer.class));
        recipe.setLikes(row.getInt("likes")); recipe.setDislikes(row.getInt("dislikes"));
        Integer calories=row.getObject("calories",Integer.class), protein=row.getObject("protein",Integer.class);
        Integer carbs=row.getObject("carbs",Integer.class), fat=row.getObject("fat",Integer.class);
        if (calories!=null || protein!=null || carbs!=null || fat!=null)
            recipe.setNutrition(new RecipeNutrition(calories,protein,carbs,fat));
        try {
            String document=row.getString("document");
            if (document!=null) recipe.setDocument(mapper.readTree(document));
            for (var item:mapper.readTree(row.getString("ingredient_rows"))) {
                var ingredient=new RecipeIngredient(item.get("id").longValue());
                ingredient.setRecipe(recipe); ingredient.setIngredientName(item.get("name").asText());
                ingredient.setQuantity(item.get("quantity").isNull()?null:item.get("quantity").doubleValue());
                ingredient.setUnit(item.get("unit").isNull()?null:item.get("unit").asText());
                ingredient.setOptional(item.get("optional").asBoolean()); recipe.getIngredients().add(ingredient);
            }
            for (var item:mapper.readTree(row.getString("tag_rows"))) {
                var tag=new RecipePreferenceTag(item.get("id").longValue()); tag.setRecipe(recipe);
                tag.setPreferenceName(item.get("name").asText()); tag.setPreferenceValue(item.get("value").asText());
                recipe.getPreferenceTags().add(tag);
            }
        } catch (com.fasterxml.jackson.core.JsonProcessingException error) {
            throw new SQLException("Cannot read stored recipe JSON for ID "+recipe.getId(),error);
        }
        return recipe;
    }
}
