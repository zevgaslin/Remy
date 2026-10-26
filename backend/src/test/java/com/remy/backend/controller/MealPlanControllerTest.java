package com.remy.backend.controller;

import static org.assertj.core.api.Assertions.assertThat;

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
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class MealPlanControllerTest {

    @DynamicPropertySource
    static void database(DynamicPropertyRegistry registry) {
        com.remy.backend.support.PostgresTestDatabase.configure(registry, "meal_plan_test");
    }

    private static final String PLAN = "/api/users/me/meal-plan";
    private static final String DAY = "2030-03-04";

    @Autowired
    private TestRestTemplate restTemplate;

    @Test
    void plannedMealsAreSavedPerUserAndReplaceable() {
        HttpHeaders alice = login("plan_alice");
        HttpHeaders bob = login("plan_bob");
        Long oats = createRecipe("Overnight Oats");
        Long pancakes = createRecipe("Protein Pancakes");

        assertThat(plan(alice, DAY, "breakfast", oats).getStatusCode()).isEqualTo(HttpStatus.OK);
        plan(alice, DAY, "dinner", pancakes);
        plan(alice, DAY, "breakfast", pancakes);

        Map body = getPlan(alice, "2030-03-01");
        List<Map> meals = (List<Map>) body.get("meals");
        assertThat(meals).extracting(meal -> meal.get("slotId") + "=" + ((Map) meal.get("recipe")).get("name"))
                .containsExactly("breakfast=Protein Pancakes", "dinner=Protein Pancakes");
        assertThat(meals).allMatch(meal -> DAY.equals(meal.get("date")));

        assertThat((List) getPlan(bob, "2030-03-01").get("meals")).isEmpty();
        assertThat((List) getPlan(alice, "2030-03-05").get("meals")).isEmpty();

        restTemplate.exchange(PLAN + "/meals/{date}/{slot}", HttpMethod.DELETE, new HttpEntity<>(alice), Map.class,
                DAY, "dinner");
        assertThat((List<Map>) getPlan(alice, "2030-03-01").get("meals"))
                .extracting(meal -> meal.get("slotId")).containsExactly("breakfast");
    }

    @Test
    void customSlotsAreSavedAndRemovingASlotDropsItsMeal() {
        HttpHeaders user = login("plan_slots");
        Long soup = createRecipe("Lentil Soup");
        plan(user, DAY, "lunch", soup);
        plan(user, DAY, "custom-second-breakfast-10:00-1", soup);

        List<Map<String, Object>> slots = List.of(
                Map.of("id", "breakfast", "label", "Breakfast", "time", "08:00", "hour", 8),
                Map.of("id", "custom-second-breakfast-10:00-1", "label", "Second breakfast", "time", "10:00", "hour", 10));
        ResponseEntity<Map> saved = restTemplate.exchange(PLAN + "/days/{date}/slots", HttpMethod.PUT,
                new HttpEntity<>(slots, user), Map.class, DAY);
        assertThat(saved.getStatusCode()).isEqualTo(HttpStatus.OK);

        Map body = getPlan(user, "2030-03-01");
        assertThat((Map<String, List<Map>>) body.get("daySlots")).containsOnlyKeys(DAY);
        assertThat(((Map<String, List<Map>>) body.get("daySlots")).get(DAY))
                .extracting(slot -> slot.get("label")).containsExactly("Breakfast", "Second breakfast");
        assertThat((List<Map>) body.get("meals")).extracting(meal -> meal.get("slotId"))
                .containsExactly("custom-second-breakfast-10:00-1");
    }

    @Test
    void rejectsGuestsBadInputAndForgetsDeletedRecipes() {
        HttpHeaders user = login("plan_checks");
        assertThat(restTemplate.getForEntity(PLAN, Map.class).getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(plan(user, DAY, "lunch", 999_999L).getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(restTemplate.exchange(PLAN + "/days/{date}/slots", HttpMethod.PUT,
                new HttpEntity<>(List.of(Map.of("id", "", "label", "Nameless")), user), Map.class, DAY)
                .getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);

        Long toast = createRecipe("Avocado Toast");
        plan(user, DAY, "breakfast", toast);
        restTemplate.exchange("/api/recipes/{id}", HttpMethod.DELETE, new HttpEntity<>(user), Map.class, toast);
        assertThat((List) getPlan(user, "2030-03-01").get("meals")).isEmpty();
    }

    private ResponseEntity<Map> plan(HttpHeaders headers, String date, String slotId, Long recipeId) {
        return restTemplate.exchange(PLAN + "/meals/{date}/{slot}", HttpMethod.PUT,
                new HttpEntity<>(Map.of("recipeId", recipeId), headers), Map.class, date, slotId);
    }

    private Map getPlan(HttpHeaders headers, String from) {
        ResponseEntity<Map> response = restTemplate.exchange(PLAN + "?from={from}", HttpMethod.GET,
                new HttpEntity<>(headers), Map.class, from);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        return response.getBody();
    }

    private HttpHeaders login(String username) {
        ResponseEntity<Map> response = restTemplate.postForEntity("/api/auth/register",
                Map.of("username", username, "email", username + "@example.com", "password", "password123"), Map.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + response.getBody().get("token"));
        return headers;
    }

    private Long createRecipe(String name) {
        ResponseEntity<Map> response = restTemplate.postForEntity("/api/recipes",
                Map.of("name", name, "instructions", "Cook it well."), Map.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        return ((Number) response.getBody().get("id")).longValue();
    }
}
