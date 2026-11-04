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

    /**
     * How much one star above or below neutral (3) moves a recipe in pantry-ranked search:
     * 5 stars ranks like covering 20% more of the recipe's ingredients, 1 star like 20% fewer.
     */
    static final String RATING_BOOST_PER_STAR = "0.1";

    /** The signed-in user's stars for r, with unrated counted as a neutral 3. */
    private static final String MY_STARS =
            "COALESCE((SELECT mr.stars FROM recipe_ratings mr WHERE mr.recipe_id=r.id AND mr.user_id=:userId), 3)";

    public List<Long> search(String query, Set<String> ingredients, Set<String> expiring,
            List<PreferenceCriterion> preferences, boolean requireAll, int limit) {
        return search(query, ingredients, expiring, preferences, requireAll, limit, null);
    }

    /** userId, when given, ranks the user's higher-rated recipes above their lower-rated ones. */
    public List<Long> search(String query, Set<String> ingredients, Set<String> expiring,
            List<PreferenceCriterion> preferences, boolean requireAll, int limit, Long userId) {
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
        String expiringRank = null;
        if (!expiring.isEmpty()) {
            parameters.addValue("expiring", expiring);
            where.append(" AND EXISTS (SELECT 1 FROM recipe_ingredients ei WHERE ei.recipe_id=r.id AND ei.normalized_name IN (:expiring))");
            expiringRank = "(SELECT count(DISTINCT xi.normalized_name) FROM recipe_ingredients xi WHERE xi.recipe_id=r.id AND xi.normalized_name IN (:expiring))";
        }
        String ratingOrder = "";
        if (userId != null) {
            parameters.addValue("userId", userId);
            if (rank != null) {
                rank = "(" + rank + " + (" + MY_STARS + " - 3) * " + RATING_BOOST_PER_STAR + ")";
            } else {
                ratingOrder = MY_STARS + " DESC, ";
            }
        }
        String sql = "SELECT r.id FROM recipe r" + where + " ORDER BY "
                + (expiringRank == null ? "" : expiringRank + " DESC, ")
                + (rank == null ? "" : rank + " DESC, ") + ratingOrder + "r.name, r.id LIMIT :limit";
        return jdbc.queryForList(sql, parameters, Long.class);
    }

    /** Select in PostgreSQL so only one candidate ID crosses the database boundary. */
    public Optional<Long> randomId(PreferenceCriterion preference) {
        var parameters = new MapSqlParameterSource();
        String where = "";
        if (preference != null) {
            parameters.addValue("name", preference.getName().trim().toLowerCase(Locale.ROOT));
            parameters.addValue("value", preference.getValue().trim().toLowerCase(Locale.ROOT));
            where = " WHERE EXISTS (SELECT 1 FROM recipe_preference_tags p WHERE p.recipe_id=r.id"
                    + " AND p.preference_name=:name AND p.preference_value=:value)";
        }
        return jdbc.queryForList("SELECT r.id FROM recipe r" + where + " ORDER BY random() LIMIT 1",
                parameters, Long.class).stream().findFirst();
    }

    /**
     * Recipes the user has not favorited or disliked. Their 5- and 4-star recipes come first,
     * then unrated and 3-star ones (newest first), and 1- and 2-star ones last.
     */
    public List<Long> feed(Long userId, int limit, int offset) {
        var parameters = new MapSqlParameterSource().addValue("limit",limit).addValue("offset",offset);
        String where = "";
        String order = " ORDER BY r.id DESC";
        if (userId != null) {
            where = " WHERE NOT EXISTS (SELECT 1 FROM recipe_preferences rp WHERE rp.recipe_id=r.id AND rp.user_id=:userId)";
            order = " ORDER BY " + MY_STARS + " DESC, r.id DESC";
            parameters.addValue("userId",userId);
        }
        return jdbc.queryForList("SELECT r.id FROM recipe r"+where+order+" LIMIT :limit OFFSET :offset", parameters, Long.class);
    }
}
