package com.remy.backend.repository;

import com.remy.backend.model.Recipe;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RecipeRepository extends JpaRepository<Recipe, Long> {

    java.util.Optional<Recipe> findByCatalogId(String catalogId);
    List<Recipe> findByNameAndCatalogIdIsNull(String name);

    @EntityGraph(attributePaths = {"ingredients", "preferenceTags"})
    List<Recipe> findByIdIn(java.util.Collection<Long> ids);

    @Override
    @EntityGraph(attributePaths = {"ingredients", "preferenceTags"})
    List<Recipe> findAll();

    @Override
    @EntityGraph(attributePaths = {"ingredients", "preferenceTags"})
    List<Recipe> findAll(Sort sort);

    // NEW: Fetch all IDs for random selection
    @Query("SELECT r.id FROM Recipe r")
    List<Long> findAllRecipeIds();

    // NEW: Fetch IDs matching a specific preference for random selection
    @Query("SELECT r.id FROM Recipe r JOIN r.preferenceTags p WHERE p.preferenceName = :name AND p.preferenceValue = :value")
    List<Long> findRecipeIdsByPreference(@Param("name") String name, @Param("value") String value);
}