package com.remy.backend.repository;

import com.remy.backend.model.Ingredient;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IngredientRepository extends JpaRepository<Ingredient, Long> {
    List<Ingredient> findByOwnerId(Long ownerId);
}
