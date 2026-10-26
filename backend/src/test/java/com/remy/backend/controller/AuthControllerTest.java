package com.remy.backend.controller;

import static org.assertj.core.api.Assertions.assertThat;

import com.remy.backend.dto.LoginRequest;
import com.remy.backend.dto.RegisterRequest;
import com.remy.backend.model.UserSession;
import com.remy.backend.repository.UserRepository;
import com.remy.backend.repository.UserSessionRepository;
import com.remy.backend.service.DatabaseTokenService;
import java.time.Instant;
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

/**
 * Verifies register/login actually work end to end against a real (isolated,
 * in-memory) database - not just that the endpoints exist.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)

class AuthControllerTest {
    @org.springframework.test.context.DynamicPropertySource
    static void database(org.springframework.test.context.DynamicPropertyRegistry registry) {
        com.remy.backend.support.PostgresTestDatabase.configure(registry, "auth_test");
    }


    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private UserSessionRepository sessionRepository;

    @Autowired
    private UserRepository userRepository;

    private ResponseEntity<Map> me(String token) {
        HttpHeaders headers = new HttpHeaders();
        if (token != null) {
            headers.set("Authorization", "Bearer " + token);
        }
        return restTemplate.exchange("/api/auth/me", HttpMethod.GET, new HttpEntity<>(headers), Map.class);
    }

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
    void loginSucceedsWithHardcodedTestingCredentials() {
        LoginRequest login = new LoginRequest();
        login.setUsername("remy");
        login.setPassword("remy");

        ResponseEntity<Map> response = restTemplate.postForEntity("/api/auth/login", login, Map.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).containsEntry("username", "remy");
        assertThat(response.getBody()).containsKey("token");
        assertThat(response.getBody()).containsEntry("email", "remy@example.com");
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

    @Test
    void savedTokenStaysValidUntilLogout() {
        String token = (String) restTemplate.postForEntity("/api/auth/register",
                registerRequest("session_user", "session@example.com", "password123"), Map.class)
                .getBody().get("token");

        ResponseEntity<Map> current = me(token);
        assertThat(current.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(current.getBody()).containsEntry("username", "session_user").doesNotContainKey("token");

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + token);
        ResponseEntity<Map> logout = restTemplate.exchange(
                "/api/auth/logout", HttpMethod.POST, new HttpEntity<>(headers), Map.class);
        assertThat(logout.getStatusCode()).isEqualTo(HttpStatus.OK);

        assertThat(me(token).getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(me(null).getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(me("made-up-token").getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void sessionsSurviveABackendRestartButNotExpiry() {
        String token = (String) restTemplate.postForEntity("/api/auth/register",
                registerRequest("restart_user", "restart@example.com", "password123"), Map.class)
                .getBody().get("token");

        // A fresh service instance has no memory of the login, like the backend after a restart.
        var restarted = new DatabaseTokenService(sessionRepository, userRepository, 30);
        assertThat(restarted.resolveUserId("Bearer " + token)).isPresent();
        assertThat(sessionRepository.findAll()).noneMatch(session -> session.getTokenHash().equals(token));

        var user = userRepository.findByUsername("restart_user").orElseThrow();
        sessionRepository.save(new UserSession(
                "0".repeat(64), user, Instant.now().minusSeconds(7200), Instant.now().minusSeconds(60)));
        assertThat(sessionRepository.findActiveUserId("0".repeat(64), Instant.now())).isEmpty();
    }
}
