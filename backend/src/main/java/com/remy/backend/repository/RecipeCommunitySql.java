package com.remy.backend.repository;

/** Counts each account once across calendar slots and meal logs. */
final class RecipeCommunitySql {
    private RecipeCommunitySql() {}

    static final String USAGE_CTE = """
        WITH recipe_users AS (
          SELECT DISTINCT cp.user_id, meal.value->>'id' AS recipe_id
          FROM calendar_plan cp CROSS JOIN LATERAL jsonb_each(cp.planned_meals) meal
          UNION
          SELECT user_id, recipe_id::text FROM planned_meals
          UNION
          SELECT user_id, recipe_id::text FROM meal_log WHERE recipe_id IS NOT NULL
        )
        """;

    static final String RANKING_CTES = USAGE_CTE + """
        , community_ratings AS (
          SELECT recipe_id, (sum(stars) - 3.0 * count(*)) / (count(*) + 5.0) AS quality
          FROM recipe_ratings WHERE user_id <> :communityUserId GROUP BY recipe_id
        ), community_usage AS (
          SELECT recipe_id, count(*) AS users FROM recipe_users
          WHERE user_id <> :communityUserId GROUP BY recipe_id
        )
        """;

    static final String JOINS = """
         LEFT JOIN community_ratings cr ON cr.recipe_id=r.id
         LEFT JOIN community_usage cu ON cu.recipe_id=r.id::text
        """;

    // Five neutral prior ratings temper tiny samples. Usage has a bounded positive boost.
    static final String SCORE =
            "(0.15 * COALESCE(cr.quality, 0) + 0.1 * COALESCE(cu.users / (cu.users + 5.0), 0))";
}
