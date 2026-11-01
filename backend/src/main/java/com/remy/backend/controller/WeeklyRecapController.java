package com.remy.backend.controller;

import com.remy.backend.service.*;
import java.time.LocalDate;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/users/me")
public class WeeklyRecapController {
    private final WeeklyRecapService service;
    private final SessionTokenService tokens;
    public WeeklyRecapController(WeeklyRecapService service,SessionTokenService tokens) {this.service=service;this.tokens=tokens;}
    private Long user(String auth) {
        return tokens.resolveUserId(auth).orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED,"Log in to track meals."));
    }
    @PostMapping("/meal-logs")
    public Object log(@RequestHeader(value="Authorization",required=false) String auth,
                      @RequestBody WeeklyRecapService.LogRequest request) { return service.log(user(auth),request); }
    @DeleteMapping("/meal-logs/{id}")
    public void undo(@RequestHeader(value="Authorization",required=false) String auth,@PathVariable Long id) {service.undo(user(auth),id);}
    @GetMapping("/recaps/weekly")
    public Object recap(@RequestHeader(value="Authorization",required=false) String auth,
            @RequestParam(required=false) LocalDate weekStart,@RequestParam String timezone) {
        return service.recap(user(auth),weekStart,timezone);
    }
    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public java.util.Map<String,String> invalid(IllegalArgumentException ex) {return java.util.Map.of("error",ex.getMessage());}
}
