package com.remy.backend.repository;

import com.remy.backend.model.Recipe;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

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

}
