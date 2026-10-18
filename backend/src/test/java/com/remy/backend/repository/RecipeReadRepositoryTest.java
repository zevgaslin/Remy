package com.remy.backend.repository;

import com.remy.backend.model.*;
import com.remy.backend.service.RecipeCatalogService;
import com.remy.backend.support.PostgresTestDatabase;
import java.nio.file.Path;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.*;
import org.springframework.transaction.annotation.Transactional;
import static org.assertj.core.api.Assertions.*;

@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.NONE)
@Transactional
class RecipeReadRepositoryTest {
    @DynamicPropertySource static void database(DynamicPropertyRegistry registry) {
        PostgresTestDatabase.configure(registry,"read_projection_test");
    }
    @Autowired RecipeRepository entities;
    @Autowired RecipeReadRepository reads;
    @Autowired RecipeCatalogService catalog;

    @Test void optimizedRowsPreserveTheExistingApiDataAndOrdering() throws Exception {
        catalog.importFolder(Path.of("src/test/resources/recipes"));
        var actual=reads.list();
        assertThat(actual).hasSize(13);
        var byId=new HashMap<Long,Recipe>();
        entities.findAll().forEach(recipe->byId.put(recipe.getId(),recipe));
        for (Recipe row:actual) {
            Recipe expected=byId.get(row.getId());
            assertThat(row.getName()).isEqualTo(expected.getName());
            assertThat(row.getDocument()).isEqualTo(expected.getDocument());
            assertThat(row.getInstructions()).isEqualTo(expected.getInstructions());
            assertThat(row.getCatalogId()).isEqualTo(expected.getCatalogId());
            assertThat(row.getNutrition().getCalories()).isEqualTo(expected.getNutrition().getCalories());
            assertThat(row.getIngredients()).extracting("id","ingredientName","quantity","unit","optional")
                    .containsExactlyInAnyOrderElementsOf(expected.getIngredients().stream()
                            .map(i->org.assertj.core.groups.Tuple.tuple(i.getId(),i.getIngredientName(),i.getQuantity(),i.getUnit(),i.isOptional())).toList());
            assertThat(row.getPreferenceTags()).extracting("id","preferenceName","preferenceValue")
                    .containsExactlyInAnyOrderElementsOf(expected.getPreferenceTags().stream()
                            .map(t->org.assertj.core.groups.Tuple.tuple(t.getId(),t.getPreferenceName(),t.getPreferenceValue())).toList());
        }
        var ids=List.of(actual.get(3).getId(),actual.get(0).getId());
        assertThat(reads.findInOrder(ids)).extracting(Recipe::getId).containsExactlyElementsOf(ids);
        assertThat(reads.findInOrder(List.of())).isEmpty();
    }
}
