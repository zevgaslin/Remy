package com.remy.backend.repository;

import com.remy.backend.model.Recipe;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RecipeRepository extends JpaRepository<Recipe, Long> {

    @Override
    @EntityGraph(attributePaths = {"ingredients", "preferenceTags"})
    List<Recipe> findAll();

    @Override
    @EntityGraph(attributePaths = {"ingredients", "preferenceTags"})
    List<Recipe> findAll(Sort sort);
}
