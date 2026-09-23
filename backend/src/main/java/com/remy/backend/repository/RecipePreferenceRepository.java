package com.remy.backend.repository;

import com.remy.backend.model.RecipePreference;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RecipePreferenceRepository extends JpaRepository<RecipePreference, Long> {

    Optional<RecipePreference> findByUserIdAndRecipeId(Long userId, Long recipeId);

    @Query("select rp.recipe.id from RecipePreference rp where rp.user.id = :userId")
    List<Long> findRecipeIdsByUserId(@Param("userId") Long userId);
}
