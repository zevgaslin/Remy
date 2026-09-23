package com.remy.backend.controller;

import static org.assertj.core.api.Assertions.assertThat;

import com.remy.backend.dto.CreateIngredientRequest;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.TestPropertySource;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:remy-crud-test;DB_CLOSE_DELAY=-1",
        "spring.sql.init.mode=never"
})
class CrudApiControllerTest {

    @Autowired
    private TestRestTemplate restTemplate;

    @Test
    void ingredientCrudFlowWorks() {
        String token = registerAndGetToken("crud_user", "crud@example.com", "password123");
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + token);

        CreateIngredientRequest create = new CreateIngredientRequest();
        create.setName("Apple");
        create.setQuantity(3.0);
        create.setUnit("pieces");
        create.setExpirationDate(java.time.LocalDate.now().plusDays(3));

        ResponseEntity<Map> createResponse = restTemplate.exchange(
                "/api/ingredients",
                HttpMethod.POST,
                new HttpEntity<>(create, headers),
                Map.class);

        assertThat(createResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        Long ingredientId = ((Number) createResponse.getBody().get("id")).longValue();

        CreateIngredientRequest update = new CreateIngredientRequest();
        update.setName("Green Apple");
        update.setQuantity(5.0);
        update.setUnit("pieces");
        update.setExpirationDate(java.time.LocalDate.now().plusDays(10));

        ResponseEntity<Map> updateResponse = restTemplate.exchange(
                "/api/ingredients/{id}",
                HttpMethod.PUT,
                new HttpEntity<>(update, headers),
                Map.class,
                ingredientId);

        assertThat(updateResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(updateResponse.getBody()).containsEntry("name", "Green Apple");

        ResponseEntity<Map> deleteResponse = restTemplate.exchange(
                "/api/ingredients/{id}",
                HttpMethod.DELETE,
                new HttpEntity<>(headers),
                Map.class,
                ingredientId);

        assertThat(deleteResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(deleteResponse.getBody()).containsEntry("deleted", true);
    }

    @Test
    void ingredientCreateRejectsMissingRequiredFields() {
        String token = registerAndGetToken("crud_validation_user", "crud-validation@example.com", "password123");
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + token);

        ResponseEntity<Map> response = restTemplate.exchange(
                "/api/ingredients",
                HttpMethod.POST,
                new HttpEntity<>(Map.of("name", "", "quantity", 1.0, "unit", "pieces"), headers),
                Map.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).containsEntry("error", "Name, unit, and expiration date are required.");
    }

    @Test
    void recipeCrudFlowWorks() {
        HttpHeaders headers = new HttpHeaders();

        ResponseEntity<Map> createResponse = restTemplate.exchange(
                "/api/recipes",
                HttpMethod.POST,
                new HttpEntity<>(Map.of("name", "Pasta", "instructions", "Boil water and cook pasta."), headers),
                Map.class);

        assertThat(createResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        Long recipeId = ((Number) createResponse.getBody().get("id")).longValue();

        ResponseEntity<Map> updateResponse = restTemplate.exchange(
                "/api/recipes/{id}",
                HttpMethod.PUT,
                new HttpEntity<>(Map.of("name", "Pasta Deluxe", "instructions", "Boil water, cook pasta, then serve."), headers),
                Map.class,
                recipeId);

        assertThat(updateResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(updateResponse.getBody()).containsEntry("name", "Pasta Deluxe");

        ResponseEntity<Map> deleteResponse = restTemplate.exchange(
                "/api/recipes/{id}",
                HttpMethod.DELETE,
                new HttpEntity<>(headers),
                Map.class,
                recipeId);

        assertThat(deleteResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(deleteResponse.getBody()).containsEntry("deleted", true);
    }

    @Test
    void recipeCreateRejectsMissingInstructions() {
        HttpHeaders headers = new HttpHeaders();

        ResponseEntity<Map> response = restTemplate.exchange(
                "/api/recipes",
                HttpMethod.POST,
                new HttpEntity<>(Map.of("name", "Pasta"), headers),
                Map.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).containsEntry("error", "Name and instructions are required.");
    }

    @Test
    void ingredientUpdateRequiresOwnership() {
        String ownerToken = registerAndGetToken("owner_user", "owner@example.com", "password123");
        String otherToken = registerAndGetToken("other_user", "other@example.com", "password123");

        HttpHeaders ownerHeaders = new HttpHeaders();
        ownerHeaders.set("Authorization", "Bearer " + ownerToken);

        CreateIngredientRequest create = new CreateIngredientRequest();
        create.setName("Banana");
        create.setQuantity(2.0);
        create.setUnit("pieces");
        create.setExpirationDate(java.time.LocalDate.now().plusDays(2));

        ResponseEntity<Map> createResponse = restTemplate.exchange(
                "/api/ingredients",
                HttpMethod.POST,
                new HttpEntity<>(create, ownerHeaders),
                Map.class);

        Long ingredientId = ((Number) createResponse.getBody().get("id")).longValue();

        HttpHeaders otherHeaders = new HttpHeaders();
        otherHeaders.set("Authorization", "Bearer " + otherToken);

        ResponseEntity<Map> forbiddenResponse = restTemplate.exchange(
                "/api/ingredients/{id}",
                HttpMethod.PUT,
                new HttpEntity<>(Map.of(
                        "name", "Not Mine",
                        "quantity", 99.0,
                        "unit", "pieces",
                        "expirationDate", java.time.LocalDate.now().plusDays(1)),
                        otherHeaders),
                Map.class,
                ingredientId);

        assertThat(forbiddenResponse.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(forbiddenResponse.getBody()).containsEntry("error", "You can only update your own ingredients.");
    }

    @Test
    void ingredientDeleteRequiresAuthentication() {
        HttpHeaders headers = new HttpHeaders();

        ResponseEntity<Map> response = restTemplate.exchange(
                "/api/ingredients/99999",
                HttpMethod.DELETE,
                new HttpEntity<>(headers),
                Map.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(response.getBody()).containsEntry("error", "Log in to delete ingredients.");
    }

    @Test
    void recipeFeedTracksUserPreferenceAndSkipsReviewedItems() {
        String token = registerAndGetToken("feed_user", "feed@example.com", "password123");
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + token);

        Long firstRecipeId = createRecipe("Crispy Tofu Bowl");
        Long secondRecipeId = createRecipe("Spicy Ramen");
        Long thirdRecipeId = createRecipe("Lemon Chicken");

        ResponseEntity<Map> likeResponse = restTemplate.exchange(
                "/api/recipes/{id}/like",
                HttpMethod.POST,
                new HttpEntity<>(headers),
                Map.class,
                firstRecipeId);

        assertThat(likeResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(likeResponse.getBody()).containsEntry("preference", "LIKE");

        ResponseEntity<Map> dislikeResponse = restTemplate.exchange(
                "/api/recipes/{id}/dislike",
                HttpMethod.POST,
                new HttpEntity<>(headers),
                Map.class,
                secondRecipeId);

        assertThat(dislikeResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(dislikeResponse.getBody()).containsEntry("preference", "DISLIKE");

        ResponseEntity<Map[]> feedResponse = restTemplate.exchange(
                "/api/recipes/feed?limit=10",
                HttpMethod.GET,
                new HttpEntity<>(headers),
                Map[].class);

        assertThat(feedResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(feedResponse.getBody()).extracting(item -> ((Number) item.get("id")).longValue())
                .doesNotContain(firstRecipeId, secondRecipeId)
                .contains(thirdRecipeId);

        ResponseEntity<Map> preferenceResponse = restTemplate.exchange(
                "/api/recipes/{id}/preference",
                HttpMethod.GET,
                new HttpEntity<>(headers),
                Map.class,
                firstRecipeId);

        assertThat(preferenceResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(preferenceResponse.getBody()).containsEntry("preference", "LIKE");
    }

    private Long createRecipe(String name) {
        ResponseEntity<Map> response = restTemplate.exchange(
                "/api/recipes",
                HttpMethod.POST,
                new HttpEntity<>(Map.of("name", name, "instructions", "Cook it well.")),
                Map.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        return ((Number) response.getBody().get("id")).longValue();
    }

    private String registerAndGetToken(String username, String email, String password) {
        Map<String, Object> body = Map.of(
                "username", username,
                "email", email,
                "password", password);
        ResponseEntity<Map> response = restTemplate.postForEntity("/api/auth/register", body, Map.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        return (String) response.getBody().get("token");
    }
}
