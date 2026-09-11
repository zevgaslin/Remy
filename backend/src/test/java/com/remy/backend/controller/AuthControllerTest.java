package com.remy.backend.controller;

import static org.assertj.core.api.Assertions.assertThat;

import com.remy.backend.dto.LoginRequest;
import com.remy.backend.dto.RegisterRequest;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.TestPropertySource;

/**
 * Verifies register/login actually work end to end against a real (isolated,
 * in-memory) database - not just that the endpoints exist.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:remy-auth-test;DB_CLOSE_DELAY=-1",
        "spring.sql.init.mode=never"
})
class AuthControllerTest {

    @Autowired
    private TestRestTemplate restTemplate;

    private RegisterRequest registerRequest(String username, String email, String password) {
        RegisterRequest request = new RegisterRequest();
        request.setUsername(username);
        request.setEmail(email);
        request.setPassword(password);
        return request;
    }

    @Test
    void registerCreatesAccountAndNeverReturnsPasswordHash() {
        ResponseEntity<Map> response = restTemplate.postForEntity(
                "/api/auth/register",
                registerRequest("viability_user", "viability@example.com", "correctHorseBattery"),
                Map.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody()).containsKeys("id", "username", "email", "token");
        assertThat(response.getBody()).doesNotContainKey("passwordHash");
        assertThat(response.getBody()).doesNotContainKey("password");
    }

    @Test
    void registerRejectsDuplicateUsername() {
        restTemplate.postForEntity(
                "/api/auth/register", registerRequest("dupe_user", "one@example.com", "password123"), Map.class);

        ResponseEntity<Map> response = restTemplate.postForEntity(
                "/api/auth/register", registerRequest("dupe_user", "two@example.com", "password123"), Map.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    void loginSucceedsWithCorrectCredentials() {
        restTemplate.postForEntity(
                "/api/auth/register",
                registerRequest("login_ok_user", "loginok@example.com", "mypassword123"),
                Map.class);

        LoginRequest login = new LoginRequest();
        login.setUsername("login_ok_user");
        login.setPassword("mypassword123");

        ResponseEntity<Map> response = restTemplate.postForEntity("/api/auth/login", login, Map.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).containsKey("token");
    }

    @Test
    void loginRejectsWrongPasswordAndUnknownUserWithTheSameMessage() {
        restTemplate.postForEntity(
                "/api/auth/register",
                registerRequest("login_fail_user", "loginfail@example.com", "therealpassword"),
                Map.class);

        LoginRequest wrongPassword = new LoginRequest();
        wrongPassword.setUsername("login_fail_user");
        wrongPassword.setPassword("notTheRealPassword");
        ResponseEntity<Map> wrongPasswordResponse =
                restTemplate.postForEntity("/api/auth/login", wrongPassword, Map.class);

        LoginRequest unknownUser = new LoginRequest();
        unknownUser.setUsername("someone_who_does_not_exist");
        unknownUser.setPassword("whatever");
        ResponseEntity<Map> unknownUserResponse =
                restTemplate.postForEntity("/api/auth/login", unknownUser, Map.class);

        assertThat(wrongPasswordResponse.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(unknownUserResponse.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(wrongPasswordResponse.getBody().get("error"))
                .isEqualTo(unknownUserResponse.getBody().get("error"));
    }
}
