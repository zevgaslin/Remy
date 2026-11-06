package com.remy.backend.dto;

public class AuthResponse {

    private final Long id;
    private final String username;
    private final String email;
    private final String token;
    private final String role;

    public AuthResponse(Long id, String username, String email, String token, String role) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.token = token;
        this.role = role;
    }

    public Long getId() {
        return id;
    }

    public String getUsername() {
        return username;
    }

    public String getEmail() {
        return email;
    }

    public String getToken() {
        return token;
    }

    public String getRole() {
        return role;
    }
}
