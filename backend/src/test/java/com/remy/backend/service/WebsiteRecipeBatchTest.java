package com.remy.backend.service;

import com.remy.backend.repository.RecipeRepository;
import com.remy.backend.support.PostgresTestDatabase;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.*;
import static org.assertj.core.api.Assertions.*;

@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.NONE)
class WebsiteRecipeBatchTest {
    @DynamicPropertySource static void database(DynamicPropertyRegistry registry) {
        PostgresTestDatabase.configure(registry,"website_batch_test");
    }
    @Autowired RecipeCatalogService catalog;
    @Autowired RecipeRepository recipes;

    @Test void importsAllOneHundredSourceRecipesAndCanRepeatWithoutDuplicates() throws Exception {
        Path folder=Path.of("recipes/web-import-2026-10-16");
        var documents=catalog.validateFolder(folder);
        assertThat(documents).hasSize(100);
        assertThat(documents.stream().map(d->d.path("source").path("url").asText()).distinct()).hasSize(100);
        for (var document:documents) {
            assertThat(document.path("source").path("kind").asText()).isEqualTo("website");
            assertThat(document.path("source").path("originalInstructions").asText()).isNotBlank();
            assertThat(document.path("source").path("instructionsOrigin").asText()).isEqualTo("adapted");
            assertThat(document.path("instructions").size()).isGreaterThanOrEqualTo(6);
        }
        assertThat(catalog.importFolder(folder).created()).isEqualTo(100);
        assertThat(catalog.verifyFolder(folder)).isEqualTo(100);
        assertThat(catalog.importFolder(folder).unchanged()).isEqualTo(100);
        assertThat(recipes.count()).isEqualTo(100);
    }
}
