package com.remy.backend.service;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/** Backfills the derived ingredient key for rows imported before SQL pantry search existed. */
@Component
public class RecipeIngredientIndex implements ApplicationRunner {
    private final JdbcTemplate jdbc;
    public RecipeIngredientIndex(JdbcTemplate jdbc) { this.jdbc=jdbc; }
    @Override
    @Transactional
    public void run(ApplicationArguments arguments) {
        var rows=jdbc.queryForList("SELECT id,ingredient_name FROM recipe_ingredients WHERE normalized_name IS NULL");
        for (var row:rows) jdbc.update("UPDATE recipe_ingredients SET normalized_name=? WHERE id=?",
                IngredientNameNormalizer.canonicalize((String)row.get("ingredient_name")),row.get("id"));
        jdbc.execute("CREATE INDEX IF NOT EXISTS recipe_ingredients_normalized_lookup ON recipe_ingredients(normalized_name,recipe_id)");
    }
}
