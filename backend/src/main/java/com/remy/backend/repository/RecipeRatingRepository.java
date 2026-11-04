package com.remy.backend.repository;

import com.remy.backend.model.RecipeRating;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RecipeRatingRepository extends JpaRepository<RecipeRating, Long> {

    Optional<RecipeRating> findByUserIdAndRecipeId(Long userId, Long recipeId);

    // Each row is {recipeId, stars}.
    @Query("select r.recipe.id, r.stars from RecipeRating r where r.user.id = :userId")
    List<Object[]> findStarsByUserId(@Param("userId") Long userId);

    // One row: {average stars or null, number of ratings}.
    @Query("select avg(r.stars), count(r) from RecipeRating r where r.recipe.id = :recipeId")
    List<Object[]> summarize(@Param("recipeId") Long recipeId);

    @Modifying
    @Query("delete from RecipeRating r where r.recipe.id = :recipeId")
    void deleteForRecipe(@Param("recipeId") Long recipeId);
}
