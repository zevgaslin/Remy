package com.remy.backend.controller;

import com.remy.backend.service.RecipeCatalogService;
import com.remy.backend.support.PostgresTestDatabase;
import java.nio.file.Path;
import java.util.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.*;
import static org.assertj.core.api.Assertions.*;

@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT)
class PostgresRecipeSearchTest {
    @DynamicPropertySource static void database(DynamicPropertyRegistry registry) {
        PostgresTestDatabase.configure(registry,"search_test");
    }
    @Autowired TestRestTemplate http;
    @Autowired RecipeCatalogService catalog;
    @Autowired JdbcTemplate jdbc;
    @BeforeEach void loadRecipes() throws Exception { catalog.importFolder(Path.of("src/test/resources/recipes")); }

    private List<Map> search(Map<String,Object> request) {
        var response=http.postForEntity("/api/recipes/search",request,Map[].class);
        assertThat(response.getStatusCode().value()).isEqualTo(200);
        return Arrays.asList(response.getBody());
    }
    private List<String> names(List<Map> matches) {
        return matches.stream().map(m->(String)((Map)m.get("recipe")).get("name")).toList();
    }
    @Test void keywordSearchFiltersCaseInsensitivelyAndRequiresEachWord() {
        assertThat(names(search(Map.of("query","  CHICKEN  "))))
                .containsExactly("Homemade Chicken Noodle Soup","Lemon Yogurt Chicken");
        assertThat(names(search(Map.of("query","garlic butter"))))
                .contains("Garlic Butter Pasta").doesNotContain("Lemon Yogurt Chicken");
        assertThat(names(search(Map.of("query","dessert")))).containsExactly("Chocolate Chunk Cookies");
        assertThat(search(Map.of("query","does-not-exist"))).isEmpty();
    }
    @Test void randomSelectionReturnsOneRecipeAndHonorsTheDiet() {
        assertThat(search(Map.of("random", true))).hasSize(1);
        var matches = search(Map.of("random", true, "preferences",
                List.of(Map.of("name", "diet", "value", "vegetarian"))));
        assertThat(matches).hasSize(1);
        assertThat(names(search(Map.of("preferences",
                List.of(Map.of("name", "diet", "value", "vegetarian"))))))
                .containsAll(names(matches));
        assertThat(search(Map.of("random", true, "preferences",
                List.of(Map.of("name", "diet", "value", "nonexistent-diet"))))).isEmpty();
    }

    @Test void literalSearchDoesNotTreatSqlOrWildcardsAsCommands() {
        assertThat(search(Map.of("query","' OR 1=1 --"))).isEmpty();
        assertThat(search(Map.of("query","%"))).isEmpty();
    }
    @Test void searchesJsonKeywordsAndCombinesDietWithKeyword() {
        jdbc.update("UPDATE recipe SET document=jsonb_set(document,'{keywords}','[\"weeknight-special\"]'::jsonb) WHERE name='Garlic Butter Pasta'");
        assertThat(names(search(Map.of("query","weeknight-special")))).containsExactly("Garlic Butter Pasta");
        assertThat(search(Map.of("query","chicken","preferences",List.of(Map.of("name","diet","value","vegetarian"))))).isEmpty();
    }
    @Test void sqlPantryMatchingKeepsAliasesAndRequiredIngredients() {
        var matches=search(Map.of("query","pasta","ingredients",List.of("pastas","cloves of garlic","butter","parmesan"),"requireAllIngredients",true));
        assertThat(names(matches)).containsExactly("Garlic Butter Pasta");
        assertThat(((Number)matches.get(0).get("matchScore")).doubleValue()).isEqualTo(100);
        assertThat((List)matches.get(0).get("missingIngredients")).isEmpty();
        assertThat(search(Map.of("query","pasta","ingredients",List.of("garlic"),"requireAllIngredients",true))).isEmpty();
        assertThat(search(Map.of("requireAllIngredients",true))).isEmpty();
    }
    @Test void paginationAndDetailsUseStoredSupabaseShape() {
        var first=http.getForObject("/api/recipes/feed?limit=2",Map[].class);
        var next=http.getForObject("/api/recipes/feed?limit=2&offset=2",Map[].class);
        assertThat(first).hasSize(2); assertThat(next).hasSize(2);
        assertThat(Arrays.stream(first).map(r->r.get("id")).toList())
                .doesNotContainAnyElementsOf(Arrays.stream(next).map(r->r.get("id")).toList());
        var pasta=(Map)search(Map.of("query","garlic butter pasta")).get(0).get("recipe");
        var detail=http.getForEntity("/api/recipes/"+pasta.get("id"),Map.class);
        assertThat(detail.getStatusCode().value()).isEqualTo(200);
        var document=(Map)detail.getBody().get("document");
        assertThat((List)document.get("instructions")).hasSize(11);
        assertThat((List)detail.getBody().get("ingredients")).hasSize(5);
        assertThat(http.getForEntity("/api/recipes/99999999",Map.class).getStatusCode().value()).isEqualTo(404);
    }
    @Test void editingImportedRecipeKeepsJsonAndCompatibilityFieldsTogether() {
        var pasta=(Map)search(Map.of("query","garlic butter pasta")).get(0).get("recipe");
        String url="/api/recipes/"+pasta.get("id");
        http.put(url,Map.of("name","Edited Pasta","instructions","Boil water.\n\nCook the pasta."));
        var updated=http.getForObject(url,Map.class);
        assertThat(updated.get("name")).isEqualTo("Edited Pasta");
        var document=(Map)updated.get("document");
        assertThat(document.get("name")).isEqualTo("Edited Pasta");
        assertThat((List)document.get("instructions")).hasSize(2);
    }
}
