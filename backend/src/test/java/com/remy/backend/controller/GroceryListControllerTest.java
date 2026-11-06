package com.remy.backend.controller;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
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
class GroceryListControllerTest {

    @org.springframework.test.context.DynamicPropertySource
    static void database(org.springframework.test.context.DynamicPropertyRegistry registry) {
        com.remy.backend.support.PostgresTestDatabase.configure(registry, "grocery_list_test");
    }

    private static final String LIST = "/api/users/me/grocery-list";

    @Autowired
    private TestRestTemplate http;

    @Test
    void buildsListFromPlannedMealsInRangeMinusPantry() {
        HttpHeaders user = register();
        long pancakes = createRecipe("Pancakes", List.of(
                ingredient("Flour", 2.0, "cup", false),
                ingredient("Milk", 1.0, "cup", false),
                ingredient("Eggs", 2.0, null, false),
                ingredient("Water", 1.0, "cup", false),
                ingredient("Vanilla", 1.0, "tsp", true)));
        long omelet = createRecipe("Omelet", List.of(
                ingredient("Egg", 3.0, null, false),
                ingredient("Milk", 4.0, "tbsp", false),
                ingredient("Cheddar", 0.5, "cup", false)));
        saveCalendar(user, Map.of(
                "2030-05-01::breakfast", meal(pancakes, "Pancakes"),
                "2030-05-02::breakfast", meal(pancakes, "Pancakes"),
                "2030-05-02::dinner", meal(omelet, "Omelet"),
                "2030-05-20::dinner", meal(omelet, "Omelet")));
        addToPantry(user, "Milk", 0.5, "cup");
        addToPantry(user, "Cheddar cheese", 1.0, "cup");

        Map body = getList(user, "2030-05-01", "2030-05-07").getBody();

        assertThat(body).containsEntry("plannedMeals", 3);
        List<Map<String, Object>> items = (List<Map<String, Object>>) body.get("items");
        // Water is assumed on hand, vanilla is optional, and the pantry's cheddar covers the recipe.
        assertThat(items).extracting(item -> item.get("name")).containsExactly("Eggs", "Flour", "Milk");
        assertThat(item(items, "Eggs")).containsEntry("amount", "7")
                .containsEntry("recipes", List.of("Omelet", "Pancakes"))
                .containsEntry("checked", false);
        assertThat(item(items, "Flour")).containsEntry("amount", "4 cup").containsEntry("have", "");
        // 2 cup + 4 tbsp needed, 0.5 cup owned.
        assertThat(item(items, "Milk")).containsEntry("amount", "1.75 cup").containsEntry("have", "0.5 cup");
    }

    @Test
    void checkedItemsAreRememberedUntilUncheckedOrCleared() {
        HttpHeaders user = register();
        long toast = createRecipe("Toast", List.of(ingredient("Bread", 2.0, "slices", false)));
        saveCalendar(user, Map.of("2030-06-01::breakfast", meal(toast, "Toast")));

        assertThat(setChecked(user, "bread", true).getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(onlyItem(user)).containsEntry("key", "bread").containsEntry("checked", true);

        setChecked(user, "bread", false);
        assertThat(onlyItem(user)).containsEntry("checked", false);

        setChecked(user, "bread", true);
        setChecked(user, "bread", true); // checking twice is harmless
        assertThat(http.exchange(LIST + "/checked", HttpMethod.DELETE, new HttpEntity<>(user), Map.class)
                .getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(onlyItem(user)).containsEntry("checked", false);

        // Another account's list is unaffected by these check-offs.
        HttpHeaders other = register();
        saveCalendar(other, Map.of("2030-06-01::breakfast", meal(toast, "Toast")));
        setChecked(user, "bread", true);
        assertThat(onlyItem(other)).containsEntry("checked", false);
    }

    @Test
    void rejectsGuestsAndBadInput() {
        assertThat(http.getForEntity(LIST, Map.class).getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(setChecked(new HttpHeaders(), "bread", true).getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);

        HttpHeaders user = register();
        assertThat(getList(user, "2030-05-07", "2030-05-01").getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(getList(user, "2030-01-01", "2030-12-31").getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(setChecked(user, " ", true).getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);

        // No calendar yet: an empty list for the default next 7 days.
        Map body = http.exchange(LIST, HttpMethod.GET, new HttpEntity<>(user), Map.class).getBody();
        assertThat(body).containsEntry("from", LocalDate.now().toString())
                .containsEntry("to", LocalDate.now().plusDays(6).toString())
                .containsEntry("items", List.of());
    }

    private Map<String, Object> onlyItem(HttpHeaders user) {
        List<Map<String, Object>> items = (List<Map<String, Object>>) getList(user, "2030-06-01", "2030-06-01")
                .getBody().get("items");
        assertThat(items).hasSize(1);
        return items.get(0);
    }

    private static Map<String, Object> item(List<Map<String, Object>> items, String name) {
        return items.stream().filter(item -> name.equals(item.get("name"))).findFirst().orElseThrow();
    }

    private ResponseEntity<Map> getList(HttpHeaders user, String from, String to) {
        return http.exchange(LIST + "?from={from}&to={to}", HttpMethod.GET, new HttpEntity<>(user), Map.class, from, to);
    }

    private ResponseEntity<Map> setChecked(HttpHeaders user, String key, boolean checked) {
        return http.exchange(LIST + "/checked", HttpMethod.PUT,
                new HttpEntity<>(Map.of("key", key, "checked", checked), user), Map.class);
    }

    private HttpHeaders register() {
        String username = "grocery_" + UUID.randomUUID().toString().substring(0, 8);
        ResponseEntity<Map> response = http.postForEntity("/api/auth/register",
                Map.of("username", username, "email", username + "@example.com", "password", "password123"), Map.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth((String) response.getBody().get("token"));
        return headers;
    }

    private long createRecipe(String name, List<Map<String, Object>> ingredients) {
        ResponseEntity<Map> response = http.postForEntity("/api/recipes", Map.of(
                "name", name,
                "instructions", List.of(Map.of("text", "Cook it.")),
                "ingredients", ingredients), Map.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        return ((Number) response.getBody().get("id")).longValue();
    }

    private static Map<String, Object> ingredient(String name, Double quantity, String unit, boolean optional) {
        var map = new java.util.HashMap<String, Object>();
        map.put("name", name);
        map.put("quantity", quantity);
        map.put("unit", unit);
        map.put("optional", optional);
        return map;
    }

    private static Map<String, Object> meal(long recipeId, String name) {
        return Map.of("id", recipeId, "name", name);
    }

    private void saveCalendar(HttpHeaders user, Map<String, Object> plannedMeals) {
        ResponseEntity<Map> response = http.exchange("/api/users/me/calendar", HttpMethod.PUT,
                new HttpEntity<>(Map.of("revision", 0, "plannedMeals", plannedMeals, "dailyMealSlots", Map.of()), user),
                Map.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    private void addToPantry(HttpHeaders user, String name, double quantity, String unit) {
        ResponseEntity<Map> response = http.exchange("/api/ingredients", HttpMethod.POST, new HttpEntity<>(Map.of(
                "name", name, "quantity", quantity, "unit", unit,
                "expirationDate", LocalDate.now().plusDays(30).toString()), user), Map.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
    }
}
