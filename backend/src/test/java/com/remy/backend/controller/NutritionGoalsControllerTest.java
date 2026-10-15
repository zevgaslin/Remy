package com.remy.backend.controller;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
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
        "spring.datasource.url=jdbc:h2:mem:remy-goals-test;DB_CLOSE_DELAY=-1",
        "spring.sql.init.mode=never"
})
class NutritionGoalsControllerTest {

    @Autowired
    private TestRestTemplate restTemplate;

    @Test
    void newUsersGetTheDefaultGoals() {
        HttpHeaders headers = authHeaders("goals_default", "goals_default@example.com");

        ResponseEntity<Map> response = restTemplate.exchange(
                "/api/users/me/goals", HttpMethod.GET, new HttpEntity<>(headers), Map.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody())
                .containsEntry("calories", 2000)
                .containsEntry("protein", 50)
                .containsEntry("carbs", 275)
                .containsEntry("fat", 78);
    }

    @Test
    void savedGoalsAreReturnedOnTheNextRequest() {
        HttpHeaders headers = authHeaders("goals_save", "goals_save@example.com");
        Map<String, Object> goals = Map.of("calories", 3200, "protein", 180, "carbs", 350, "fat", 90);

        ResponseEntity<Map> saveResponse = restTemplate.exchange(
                "/api/users/me/goals", HttpMethod.PUT, new HttpEntity<>(goals, headers), Map.class);
        assertThat(saveResponse.getStatusCode()).isEqualTo(HttpStatus.OK);

        ResponseEntity<Map> getResponse = restTemplate.exchange(
                "/api/users/me/goals", HttpMethod.GET, new HttpEntity<>(headers), Map.class);
        assertThat(getResponse.getBody())
                .containsEntry("calories", 3200)
                .containsEntry("protein", 180)
                .containsEntry("carbs", 350)
                .containsEntry("fat", 90);
    }

    @Test
    void goalsAreKeptSeparatePerUser() {
        HttpHeaders first = authHeaders("goals_first", "goals_first@example.com");
        HttpHeaders second = authHeaders("goals_second", "goals_second@example.com");
        restTemplate.exchange("/api/users/me/goals", HttpMethod.PUT,
                new HttpEntity<>(Map.of("calories", 1500, "protein", 100, "carbs", 120, "fat", 50), first), Map.class);

        ResponseEntity<Map> response = restTemplate.exchange(
                "/api/users/me/goals", HttpMethod.GET, new HttpEntity<>(second), Map.class);

        assertThat(response.getBody()).containsEntry("calories", 2000);
    }

    @Test
    void invalidGoalsAreRejected() {
        HttpHeaders headers = authHeaders("goals_invalid", "goals_invalid@example.com");
        Map<String, Object> missingFat = new HashMap<>(Map.of("calories", 2000, "protein", 50, "carbs", 275));
        Map<String, Object> zeroCalories = Map.of("calories", 0, "protein", 50, "carbs", 275, "fat", 78);
        Map<String, Object> negativeProtein = Map.of("calories", 2000, "protein", -5, "carbs", 275, "fat", 78);

        for (Map<String, Object> body : new Map[] {missingFat, zeroCalories, negativeProtein}) {
            ResponseEntity<Map> response = restTemplate.exchange(
                    "/api/users/me/goals", HttpMethod.PUT, new HttpEntity<>(body, headers), Map.class);
            assertThat(response.getStatusCode()).as(body.toString()).isEqualTo(HttpStatus.BAD_REQUEST);
            assertThat(response.getBody()).containsKey("error");
        }

        ResponseEntity<Map> unchanged = restTemplate.exchange(
                "/api/users/me/goals", HttpMethod.GET, new HttpEntity<>(headers), Map.class);
        assertThat(unchanged.getBody()).containsEntry("calories", 2000);
    }

    @Test
    void goalsRequireLogin() {
        ResponseEntity<Map> getResponse = restTemplate.getForEntity("/api/users/me/goals", Map.class);
        ResponseEntity<Map> putResponse = restTemplate.exchange("/api/users/me/goals", HttpMethod.PUT,
                new HttpEntity<>(Map.of("calories", 2000, "protein", 50, "carbs", 275, "fat", 78)), Map.class);

        assertThat(getResponse.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(putResponse.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    private HttpHeaders authHeaders(String username, String email) {
        Map<String, Object> body = Map.of("username", username, "email", email, "password", "password123");
        ResponseEntity<Map> response = restTemplate.postForEntity("/api/auth/register", body, Map.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + response.getBody().get("token"));
        return headers;
    }
}
