package com.remy.backend;

import static org.assertj.core.api.Assertions.assertThat;

import com.remy.backend.model.Recipe;
import com.remy.backend.repository.RecipeRepository;
import java.util.Set;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:remy-seed-test;DB_CLOSE_DELAY=-1",
        "spring.sql.init.mode=always"
})
class SeedDataIntegrationTest {

    @Autowired
    private RecipeRepository recipeRepository;

    @Test
    void recipeSeedDataIncludesIngredientsAndPreferenceTags() {
        Recipe pasta = recipeRepository.findAll().stream()
                .filter(recipe -> recipe.getName().equals("Garlic Butter Pasta"))
                .findFirst()
                .orElseThrow();

        assertThat(recipeRepository.count()).isGreaterThanOrEqualTo(13);
        assertThat(pasta.getIngredients()).extracting("ingredientName")
                .contains("Pasta", "Garlic", "Butter", "Parmesan");
        assertThat(pasta.getPreferenceTags()).extracting("preferenceValue")
                .contains("dinner", "vegetarian", "italian", "easy");

        Set<String> recipeNames = recipeRepository.findAll().stream()
                .map(Recipe::getName)
                .collect(Collectors.toSet());
        assertThat(recipeNames).contains(
                "Classic Pancakes",
                "Homemade Chicken Noodle Soup",
                "Classic Beef Chili",
                "Easy Mac and Cheese",
                "Chocolate Chunk Cookies");

        Recipe pancakes = recipeRepository.findAll().stream()
                .filter(recipe -> recipe.getName().equals("Classic Pancakes"))
                .findFirst()
                .orElseThrow();
        assertThat(pancakes.getIngredients()).extracting("ingredientName")
                .contains("Egg", "Milk", "All-Purpose Flour", "Baking Powder");
        assertThat(pancakes.getPreferenceTags()).extracting("preferenceValue")
                .contains("breakfast", "vegetarian", "american", "easy");
    }
}
