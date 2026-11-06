package com.remy.backend.controller;

import com.remy.backend.service.GroceryListService;
import com.remy.backend.service.SessionTokenService;
import java.time.LocalDate;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** The logged-in user's grocery list, generated from the meals on their calendar. */
@RestController
@RequestMapping("/api/users/me/grocery-list")
public class GroceryListController {

    private static final int DEFAULT_DAYS = 7;

    private final GroceryListService groceryListService;
    private final SessionTokenService tokenService;

    public GroceryListController(GroceryListService groceryListService, SessionTokenService tokenService) {
        this.groceryListService = groceryListService;
        this.tokenService = tokenService;
    }

    /** Defaults to the next 7 days. The frontend passes its own dates so "today" is the user's today. */
    @GetMapping
    public ResponseEntity<?> getList(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        LocalDate start = from == null ? LocalDate.now() : from;
        LocalDate end = to == null ? start.plusDays(DEFAULT_DAYS - 1) : to;
        return asUser(authHeader, "Log in to see your grocery list.",
                userId -> ResponseEntity.ok(groceryListService.build(userId, start, end)));
    }

    /** Body: { "key": "<item key>", "checked": true | false }. */
    @PutMapping("/checked")
    public ResponseEntity<?> setChecked(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody(required = false) Map<String, Object> request) {
        return asUser(authHeader, "Log in to update your grocery list.", userId -> {
            Object key = request == null ? null : request.get("key");
            boolean checked = request != null && Boolean.TRUE.equals(request.get("checked"));
            groceryListService.setChecked(userId, key instanceof String text ? text : null, checked);
            return ResponseEntity.ok(Map.of("key", key, "checked", checked));
        });
    }

    @DeleteMapping("/checked")
    public ResponseEntity<?> clearChecked(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        return asUser(authHeader, "Log in to update your grocery list.", userId -> {
            groceryListService.clearChecked(userId);
            return ResponseEntity.ok(Map.of("cleared", true));
        });
    }

    private ResponseEntity<?> asUser(String authHeader, String loginMessage, Function<Long, ResponseEntity<?>> action) {
        Optional<Long> userId = tokenService.resolveUserId(authHeader);
        if (userId.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", loginMessage));
        }
        try {
            return action.apply(userId.get());
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }
}
