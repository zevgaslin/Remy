package com.remy.backend.repository;

import com.remy.backend.model.RecipePreference;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RecipePreferenceRepository extends JpaRepository<RecipePreference, Long> {

    @Query("select rp.preference from RecipePreference rp where rp.user.id = :userId and rp.recipe.id = :recipeId")
    Optional<com.remy.backend.model.PreferenceType> findPreferenceValue(
            @Param("userId") Long userId, @Param("recipeId") Long recipeId);

    @org.springframework.data.jpa.repository.Modifying
    @Query("delete from RecipePreference rp where rp.recipe.id = :recipeId")
    void deleteForRecipe(@Param("recipeId") Long recipeId);

    Optional<RecipePreference> findByUserIdAndRecipeId(Long userId, Long recipeId);

    @Query("select rp.recipe.id from RecipePreference rp where rp.user.id = :userId")
    List<Long> findRecipeIdsByUserId(@Param("userId") Long userId);

    // Each row is {recipeId, PreferenceType}; avoids loading every reacted recipe just to read its ID.
    @Query("select rp.recipe.id, rp.preference from RecipePreference rp where rp.user.id = :userId")
    List<Object[]> findReactionsByUserId(@Param("userId") Long userId);

    @Query("select rp.recipe.id from RecipePreference rp where rp.user.id = :userId"
            + " and rp.preference = :preference order by rp.id desc")
    List<Long> findRecipeIdsByUserIdAndPreference(
            @Param("userId") Long userId, @Param("preference") com.remy.backend.model.PreferenceType preference);
}
