package com.remy.backend.controller;

import static org.assertj.core.api.Assertions.assertThat;

import com.remy.backend.dto.CreateIngredientRequest;
import com.remy.backend.model.Recipe;
import com.remy.backend.model.RecipeIngredient;
import com.remy.backend.model.RecipePreferenceTag;
import com.remy.backend.repository.RecipeRepository;
import java.util.List;
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

    @Autowired
    private RecipeRepository recipeRepository;

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
    void ingredientStoresNutritionWhenProvided() {
        String token = registerAndGetToken("macro_user", "macro@example.com", "password123");
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + token);

        CreateIngredientRequest create = new CreateIngredientRequest();
        create.setName("Chicken Breast");
        create.setQuantity(2.0);
        create.setUnit("lb");
        create.setExpirationDate(java.time.LocalDate.now().plusDays(4));
        create.setCalories(750.0);
        create.setProtein(140.0);
        create.setCarbs(0.0);
        create.setFat(16.0);

        ResponseEntity<Map> createResponse = restTemplate.exchange(
                "/api/ingredients",
                HttpMethod.POST,
                new HttpEntity<>(create, headers),
                Map.class);

        assertThat(createResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);

        ResponseEntity<Map[]> listResponse = restTemplate.exchange(
                "/api/ingredients",
                HttpMethod.GET,
                new HttpEntity<>(headers),
                Map[].class);

        assertThat(listResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        Map saved = listResponse.getBody()[0];
        assertThat(saved).containsEntry("calories", 750.0);
        assertThat(saved).containsEntry("protein", 140.0);
        assertThat(saved).containsEntry("carbs", 0.0);
        assertThat(saved).containsEntry("fat", 16.0);
    }

    @Test
    void ingredientWithoutNutritionStillSaves() {
        String token = registerAndGetToken("no_macro_user", "no-macro@example.com", "password123");
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + token);

        CreateIngredientRequest create = new CreateIngredientRequest();
        create.setName("Rice");
        create.setQuantity(1.0);
        create.setUnit("bag");
        create.setExpirationDate(java.time.LocalDate.now().plusDays(30));

        ResponseEntity<Map> createResponse = restTemplate.exchange(
                "/api/ingredients",
                HttpMethod.POST,
                new HttpEntity<>(create, headers),
                Map.class);

        assertThat(createResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(createResponse.getBody().get("calories")).isNull();
        assertThat(createResponse.getBody().get("protein")).isNull();
    }

    @Test
    void ingredientRejectsNegativeNutrition() {
        String token = registerAndGetToken("negative_macro_user", "negative-macro@example.com", "password123");
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + token);

        CreateIngredientRequest create = new CreateIngredientRequest();
        create.setName("Butter");
        create.setQuantity(1.0);
        create.setUnit("stick");
        create.setExpirationDate(java.time.LocalDate.now().plusDays(14));
        create.setFat(-5.0);

        ResponseEntity<Map> response = restTemplate.exchange(
                "/api/ingredients",
                HttpMethod.POST,
                new HttpEntity<>(create, headers),
                Map.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody())
                .containsEntry("error", "Calories, protein, carbs, and fat cannot be negative.");
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

    @Test
    void recipeSearchMatchesPantryAndDietaryPreferences() {
        String token = registerAndGetToken("match_user", "match@example.com", "password123");
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + token);

        addIngredient(headers, "Spinach");
        addIngredient(headers, "Egg");
        addIngredient(headers, "Tortilla");
        addIngredient(headers, "Cheddar");

        Recipe breakfastWrap = new Recipe();
        breakfastWrap.setName("Test Breakfast Wrap");
        breakfastWrap.setInstructions("Cook and wrap.");
        addRecipeIngredient(breakfastWrap, "Spinach", false);
        addRecipeIngredient(breakfastWrap, "Egg", false);
        addRecipeIngredient(breakfastWrap, "Tortilla", false);
        addRecipeIngredient(breakfastWrap, "Cheddar", false);
        addRecipeTag(breakfastWrap, "diet", "vegetarian");
        addRecipeTag(breakfastWrap, "meal_type", "breakfast");
        recipeRepository.save(breakfastWrap);

        Recipe unrelatedRecipe = new Recipe();
        unrelatedRecipe.setName("Test Vegetarian Pasta");
        unrelatedRecipe.setInstructions("Boil pasta.");
        addRecipeIngredient(unrelatedRecipe, "Pasta", false);
        addRecipeTag(unrelatedRecipe, "diet", "vegetarian");
        recipeRepository.save(unrelatedRecipe);

        ResponseEntity<List> savePreferencesResponse = restTemplate.exchange(
                "/api/recipes/preferences",
                HttpMethod.PUT,
                new HttpEntity<>(List.of(
                        Map.of("name", "diet", "value", "vegetarian"),
                        Map.of("name", "meal_type", "value", "breakfast")), headers),
                List.class);
        assertThat(savePreferencesResponse.getStatusCode()).isEqualTo(HttpStatus.OK);

        ResponseEntity<List> matchResponse = restTemplate.exchange(
                "/api/recipes/matches",
                HttpMethod.GET,
                new HttpEntity<>(headers),
                List.class);

        assertThat(matchResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(matchResponse.getBody()).isNotEmpty();
        Map firstMatch = (Map) matchResponse.getBody().get(0);
        Map firstRecipe = (Map) firstMatch.get("recipe");
        assertThat(firstRecipe).containsEntry("name", "Test Breakfast Wrap");
        assertThat(((Number) firstMatch.get("matchScore")).doubleValue()).isEqualTo(100.0);
        assertThat((List<?>) firstMatch.get("missingIngredients")).isEmpty();

        ResponseEntity<List> directSearchResponse = restTemplate.postForEntity(
                "/api/recipes/search",
                Map.of(
                        "ingredients", List.of("spinach", "egg", "tortilla", "cheddar"),
                        "preferences", List.of(Map.of("name", "diet", "value", "vegetarian")),
                        "requireAllIngredients", true),
                List.class);

        assertThat(directSearchResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(directSearchResponse.getBody()).hasSize(1);
        Map directMatch = (Map) directSearchResponse.getBody().get(0);
        assertThat((Map) directMatch.get("recipe")).containsEntry("name", "Test Breakfast Wrap");
    }

    @Test
    void notificationsTrackExpiredFoodAndCanBeMarkedRead() {
        String token = registerAndGetToken("notify_user", "notify@example.com", "password123");
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + token);

        CreateIngredientRequest create = new CreateIngredientRequest();
        create.setName("Milk");
        create.setQuantity(1.0);
        create.setUnit("bottle");
        create.setExpirationDate(java.time.LocalDate.now().minusDays(1));

        ResponseEntity<Map> createResponse = restTemplate.exchange(
                "/api/ingredients",
                HttpMethod.POST,
                new HttpEntity<>(create, headers),
                Map.class);

        assertThat(createResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);

        ResponseEntity<Map[]> notificationResponse = restTemplate.exchange(
                "/api/notifications",
                HttpMethod.GET,
                new HttpEntity<>(headers),
                Map[].class);

        assertThat(notificationResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(notificationResponse.getBody()).isNotEmpty();
        assertThat(notificationResponse.getBody()[0].get("message")).asString().contains("Milk");

        Long notificationId = ((Number) notificationResponse.getBody()[0].get("id")).longValue();

        ResponseEntity<Map> markReadResponse = restTemplate.exchange(
                "/api/notifications/{id}/read",
                HttpMethod.POST,
                new HttpEntity<>(headers),
                Map.class,
                notificationId);

        assertThat(markReadResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(markReadResponse.getBody()).containsEntry("read", true);
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

    private void addIngredient(HttpHeaders headers, String name) {
        CreateIngredientRequest request = new CreateIngredientRequest();
        request.setName(name);
        request.setQuantity(1.0);
        request.setUnit("item");
        request.setExpirationDate(java.time.LocalDate.now().plusDays(5));
        ResponseEntity<Map> response = restTemplate.exchange(
                "/api/ingredients",
                HttpMethod.POST,
                new HttpEntity<>(request, headers),
                Map.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
    }

    private void addRecipeIngredient(Recipe recipe, String name, boolean optional) {
        RecipeIngredient ingredient = new RecipeIngredient();
        ingredient.setRecipe(recipe);
        ingredient.setIngredientName(name);
        ingredient.setQuantity(1.0);
        ingredient.setUnit("item");
        ingredient.setOptional(optional);
        recipe.getIngredients().add(ingredient);
    }

    private void addRecipeTag(Recipe recipe, String name, String value) {
        RecipePreferenceTag tag = new RecipePreferenceTag();
        tag.setRecipe(recipe);
        tag.setPreferenceName(name);
        tag.setPreferenceValue(value);
        recipe.getPreferenceTags().add(tag);
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
