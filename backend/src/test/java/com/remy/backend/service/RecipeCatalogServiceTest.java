package com.remy.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.remy.backend.model.*;
import com.remy.backend.repository.RecipeRepository;
import java.nio.file.*;
import java.util.*;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.io.TempDir;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class RecipeCatalogServiceTest {
    @TempDir Path folder;
    private final ObjectMapper mapper = new ObjectMapper();
    private RecipeRepository repository;
    private RecipeCatalogService service;
    private com.fasterxml.jackson.databind.JsonNode document;

    @BeforeEach void setup() throws Exception {
        repository = mock(RecipeRepository.class);
        service = new RecipeCatalogService(repository,mapper);
        document = mapper.readTree(Path.of("../docs/recipes/examples/garlic-butter-pasta.json").toFile());
        Files.writeString(folder.resolve(document.get("id").asText()+".json"),mapper.writeValueAsString(document));
    }
    @Test void validatesAllPreparedRecipesAndSchemaCopiesMatch() throws Exception {
        assertThat(service.validateFolder(Path.of("src/test/resources/recipes"))).hasSize(13);
        assertThat(Files.readString(Path.of("src/main/resources/recipe.schema.json")))
                .isEqualTo(Files.readString(Path.of("../docs/recipes/recipe.schema.json")));
    }
    @Test void badFilePreventsAnyRecipeWrites() throws Exception {
        Files.writeString(folder.resolve("bad.json"),"{\"schemaVersion\":99}");
        assertThatThrownBy(()->service.importFolder(folder)).isInstanceOf(IllegalArgumentException.class);
        verifyNoInteractions(repository);
    }
    @Test void adoptsLegacyRecordAndPreservesReactions() throws Exception {
        Recipe existing = new Recipe(); existing.setLikes(7); existing.setDislikes(2);
        when(repository.findByNameAndCatalogIdIsNull("Garlic Butter Pasta")).thenReturn(List.of(existing));
        var result = service.importFolder(folder);
        assertThat(result.updated()).isEqualTo(1);
        assertThat(existing.getLikes()).isEqualTo(7); assertThat(existing.getDislikes()).isEqualTo(2);
        assertThat(existing.getDocument()).isEqualTo(document);
        assertThat(existing.getInstructions()).contains("1. Set out", "11. Divide");
        assertThat(existing.getIngredients()).hasSize(5);
        assertThat(existing.getPreferenceTags()).hasSize(4);
        verify(repository).save(existing);
    }
    @Test void identicalDocumentDoesNotRewriteRecipe() throws Exception {
        Recipe existing = new Recipe(); existing.setDocument(document);
        when(repository.findByCatalogId(document.get("id").asText())).thenReturn(Optional.of(existing));
        assertThat(service.importFolder(folder).unchanged()).isEqualTo(1);
        verify(repository,never()).save(any());
    }
    @Test void malformedUuidIsRejected() throws Exception {
        ((com.fasterxml.jackson.databind.node.ObjectNode)document).put("id","invalid");
        Files.writeString(folder.resolve("bad.json"),mapper.writeValueAsString(document));
        assertThatThrownBy(()->service.validateFolder(folder)).isInstanceOf(IllegalArgumentException.class);
    }
}
