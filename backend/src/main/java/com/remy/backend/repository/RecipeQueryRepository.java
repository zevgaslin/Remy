package com.remy.backend.repository;

import com.remy.backend.dto.PreferenceCriterion;
import java.util.*;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

/** PostgreSQL executes candidate filtering, pantry ranking, and pagination before JPA hydration. */
@Repository
public class RecipeQueryRepository {
    private final NamedParameterJdbcTemplate jdbc;
    public RecipeQueryRepository(NamedParameterJdbcTemplate jdbc) { this.jdbc = jdbc; }

    public List<Long> search(String query, Set<String> ingredients, List<PreferenceCriterion> preferences,
            boolean requireAll, int limit) {
        var parameters = new MapSqlParameterSource("limit", limit);
        var where = new StringBuilder(" WHERE true");
        String trimmed = query == null ? "" : query.trim().toLowerCase(Locale.ROOT);
        int index = 0;
        for (String token : trimmed.isEmpty() ? new String[0] : trimmed.split("\\s+")) {
            String key = "term" + index++;
            parameters.addValue(key, token);
            where.append(" AND (strpos(lower(concat_ws(' ', r.name, r.description, r.cuisine, r.meal_type, r.difficulty)), :")
                    .append(key).append(") > 0")
                    .append(" OR EXISTS (SELECT 1 FROM recipe_ingredients ki WHERE ki.recipe_id=r.id AND strpos(lower(ki.ingredient_name), :")
                    .append(key).append(") > 0)")
                    .append(" OR EXISTS (SELECT 1 FROM recipe_preference_tags kt WHERE kt.recipe_id=r.id AND strpos(lower(kt.preference_value), :")
                    .append(key).append(") > 0)")
                    .append(" OR EXISTS (SELECT 1 FROM jsonb_array_elements_text(COALESCE(r.document->'keywords','[]'::jsonb)) kw(value) WHERE strpos(lower(kw.value), :")
                    .append(key).append(") > 0))");
        }
        index = 0;
        for (PreferenceCriterion preference : preferences) {
            String name = "preferenceName" + index, value = "preferenceValue" + index++;
            parameters.addValue(name, preference.getName().trim().toLowerCase(Locale.ROOT));
            parameters.addValue(value, preference.getValue().trim().toLowerCase(Locale.ROOT));
            where.append(" AND EXISTS (SELECT 1 FROM recipe_preference_tags pt WHERE pt.recipe_id=r.id AND lower(pt.preference_name)=:")
                    .append(name).append(" AND lower(pt.preference_value)=:").append(value).append(")");
        }
        String rank = null;
        if (!ingredients.isEmpty()) {
            parameters.addValue("ingredients", ingredients);
            where.append(" AND EXISTS (SELECT 1 FROM recipe_ingredients ai WHERE ai.recipe_id=r.id AND ai.normalized_name IN (:ingredients))");
            rank = "COALESCE((SELECT count(*) FILTER (WHERE mi.normalized_name IN (:ingredients))::numeric / NULLIF(count(*),0) FROM recipe_ingredients mi WHERE mi.recipe_id=r.id AND NOT mi.optional),1.0)";
        }
        if (requireAll) {
            where.append(" AND NOT EXISTS (SELECT 1 FROM recipe_ingredients missing WHERE missing.recipe_id=r.id AND NOT missing.optional");
            if (!ingredients.isEmpty()) where.append(" AND (missing.normalized_name IS NULL OR missing.normalized_name NOT IN (:ingredients))");
            where.append(")");
        }
        String sql = "SELECT r.id FROM recipe r" + where + " ORDER BY "
                + (rank == null ? "" : rank + " DESC, ") + "r.name, r.id LIMIT :limit";
        return jdbc.queryForList(sql, parameters, Long.class);
    }

    public List<Long> feed(Long userId, int limit, int offset) {
        var parameters = new MapSqlParameterSource().addValue("limit",limit).addValue("offset",offset);
        String where = "";
        if (userId != null) {
            where = " WHERE NOT EXISTS (SELECT 1 FROM recipe_preferences rp WHERE rp.recipe_id=r.id AND rp.user_id=:userId)";
            parameters.addValue("userId",userId);
        }
        return jdbc.queryForList("SELECT r.id FROM recipe r"+where+" ORDER BY r.id DESC LIMIT :limit OFFSET :offset", parameters, Long.class);
    }
}
