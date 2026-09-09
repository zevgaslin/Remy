package com.remy.backend.controller;

import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Confirms the backend is up and reachable from the frontend.
 * Feature controllers (pantry, recipes, planning, auth) live alongside this one.
 */
@RestController
public class HealthController {

    @GetMapping("/api/health")
    public Map<String, String> health() {
        return Map.of("status", "ok", "service", "remy-backend");
    }

}
