package com.remy.backend.controller;

import static org.assertj.core.api.Assertions.assertThat;

import com.remy.backend.service.RecipeManagementService;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class RecipeRatingControllerTest {

    @org.springframework.test.context.DynamicPropertySource
    static void database(org.springframework.test.context.DynamicPropertyRegistry registry) {
        com.remy.backend.support.PostgresTestDatabase.configure(registry, "recipe_rating_test");
    }

    @Autowired
    private TestRestTemplate http;

    @Autowired
    private RecipeManagementService recipeManagementService;

    @Test
    void ratingsAreSavedPerUserAndAveragedAcrossUsers() {
        HttpHeaders alice = register();
        HttpHeaders bob = register();
        long soup = createRecipe("Rated Tomato Soup", "tomato");

        assertThat(rate(alice, soup, 4).getBody())
                .containsEntry("stars", 4).containsEntry("average", 4.0).containsEntry("count", 1);
        assertThat(rate(bob, soup, 2).getBody()).containsEntry("average", 3.0).containsEntry("count", 2);
        // Changing a rating replaces it instead of adding another.
        assertThat(rate(alice, soup, 5).getBody()).containsEntry("average", 3.5).containsEntry("count", 2);

        assertThat(myRatings(alice)).containsEntry(String.valueOf(soup), 5);
        assertThat(myRatings(bob)).containsEntry(String.valueOf(soup), 2);
        assertThat(http.getForEntity("/api/recipes/{id}", Map.class, soup).getBody())
                .containsEntry("ratingAverage", 3.5).containsEntry("ratingCount", 2);

        ResponseEntity<Map> cleared = http.exchange("/api/recipes/{id}/rating", HttpMethod.DELETE,
                new HttpEntity<>(bob), Map.class, soup);
        assertThat(cleared.getBody()).containsEntry("stars", null).containsEntry("average", 5.0).containsEntry("count", 1);
        assertThat(myRatings(bob)).isEmpty();
    }

    @Test
    void rejectsGuestsInvalidStarsAndUnknownRecipes() {
        long recipe = createRecipe("Unrated Stew", "potato");
        assertThat(rate(new HttpHeaders(), recipe, 3).getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(http.getForEntity("/api/recipes/ratings", Map.class).getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);

        HttpHeaders user = register();
        for (Object stars : new Object[] {0, 6, 2.5, "five"}) {
            assertThat(http.exchange("/api/recipes/{id}/rating", HttpMethod.PUT,
                    new HttpEntity<>(Map.of("stars", stars), user), Map.class, recipe).getStatusCode())
                    .isEqualTo(HttpStatus.BAD_REQUEST);
        }
        assertThat(rate(user, 999_999L, 3).getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(http.getForEntity("/api/recipes/{id}", Map.class, recipe).getBody())
                .containsEntry("ratingAverage", null).containsEntry("ratingCount", 0);
    }

    @Test
    void feedPutsTheUsersTopRatedRecipesFirstAndLowRatedLast() {
        HttpHeaders user = register();
        long loved = createRecipe("Feed Loved", "rice");
        long panned = createRecipe("Feed Panned", "rice");
        long liked = createRecipe("Feed Liked", "rice");
        long fresh = createRecipe("Feed Unrated", "rice");
        rate(user, loved, 5);
        rate(user, panned, 1);
        rate(user, liked, 4);

        List<Long> order = feedIds(user);
        assertThat(order.indexOf(loved)).isLessThan(order.indexOf(liked));
        assertThat(order.indexOf(liked)).isLessThan(order.indexOf(fresh));
        assertThat(order.indexOf(fresh)).isLessThan(order.indexOf(panned));
        assertThat(order.get(order.size() - 1)).isEqualTo(panned);

        // Another user's ratings do not reorder this user's feed.
        List<Long> otherOrder = feedIds(register());
        assertThat(otherOrder.indexOf(fresh)).isLessThan(otherOrder.indexOf(loved));
    }

    @Test
    void searchLiftsTheUsersHigherRatedMatches() {
        String token = "kohl" + UUID.randomUUID().toString().substring(0, 6);
        long alpha = createRecipe("Alpha " + token, token);
        long beta = createRecipe("Beta " + token, token);
        Map<String, Object> search = Map.of("query", token, "ingredients", List.of(token), "limit", 10);

        assertThat(searchIds(new HttpHeaders(), search)).containsExactly(alpha, beta);

        HttpHeaders fan = register();
        rate(fan, beta, 5);
        assertThat(searchIds(fan, search)).containsExactly(beta, alpha);

        HttpHeaders critic = register();
        rate(critic, alpha, 1);
        assertThat(searchIds(critic, search)).containsExactly(beta, alpha);

        // Without a pantry to rank by, ratings alone decide the order.
        assertThat(searchIds(fan, Map.of("query", token, "limit", 10))).containsExactly(beta, alpha);
    }

    @Test
    void favoritesAreOrderedByTheUsersRating() {
        HttpHeaders user = register();
        long first = createRecipe("Fav Unrated Older", "bean");
        long second = createRecipe("Fav Five Stars", "bean");
        long third = createRecipe("Fav Unrated Newer", "bean");
        long fourth = createRecipe("Fav Two Stars", "bean");
        for (long id : new long[] {first, second, third, fourth}) {
            http.exchange("/api/recipes/{id}/like", HttpMethod.POST, new HttpEntity<>(user), Map.class, id);
        }
        rate(user, second, 5);
        rate(user, fourth, 2);

        ResponseEntity<Map[]> response = http.exchange("/api/recipes/favorites", HttpMethod.GET,
                new HttpEntity<>(user), Map[].class);
        assertThat(java.util.Arrays.stream(response.getBody()).map(r -> ((Number) r.get("id")).longValue()))
                .containsExactly(second, third, first, fourth);
    }

    @Test
    void deletingARatedRecipeRemovesItsRatings() {
        HttpHeaders user = register();
        long recipe = createRecipe("Short-lived Salad", "lettuce");
        rate(user, recipe, 3);

        recipeManagementService.delete(recipe);

        assertThat(myRatings(user)).doesNotContainKey(String.valueOf(recipe));
    }

    private ResponseEntity<Map> rate(HttpHeaders user, long recipeId, int stars) {
        return http.exchange("/api/recipes/{id}/rating", HttpMethod.PUT,
                new HttpEntity<>(Map.of("stars", stars), user), Map.class, recipeId);
    }

    private Map myRatings(HttpHeaders user) {
        ResponseEntity<Map> response = http.exchange("/api/recipes/ratings", HttpMethod.GET, new HttpEntity<>(user), Map.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        return response.getBody();
    }

    private List<Long> feedIds(HttpHeaders user) {
        ResponseEntity<Map[]> response = http.exchange("/api/recipes/feed?limit=100", HttpMethod.GET,
                new HttpEntity<>(user), Map[].class);
        return java.util.Arrays.stream(response.getBody()).map(r -> ((Number) r.get("id")).longValue()).toList();
    }

    private List<Long> searchIds(HttpHeaders user, Map<String, Object> request) {
        ResponseEntity<Map[]> response = http.exchange("/api/recipes/search", HttpMethod.POST,
                new HttpEntity<>(request, user), Map[].class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        return java.util.Arrays.stream(response.getBody())
                .map(match -> ((Number) ((Map) match.get("recipe")).get("id")).longValue()).toList();
    }

    private HttpHeaders register() {
        String username = "rater_" + UUID.randomUUID().toString().substring(0, 8);
        ResponseEntity<Map> response = http.postForEntity("/api/auth/register",
                Map.of("username", username, "email", username + "@example.com", "password", "password123"), Map.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth((String) response.getBody().get("token"));
        return headers;
    }

    private long createRecipe(String name, String ingredient) {
        ResponseEntity<Map> response = http.postForEntity("/api/recipes", Map.of(
                "name", name,
                "instructions", List.of(Map.of("text", "Cook it.")),
                "ingredients", List.of(Map.of("name", ingredient, "quantity", 1, "unit", "cup", "optional", false))),
                Map.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        return ((Number) response.getBody().get("id")).longValue();
    }
}
