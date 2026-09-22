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
