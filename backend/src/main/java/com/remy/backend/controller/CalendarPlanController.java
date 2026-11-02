package com.remy.backend.controller;

import com.remy.backend.service.CalendarPlanService;
import com.remy.backend.service.SessionTokenService;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/users/me/calendar")
public class CalendarPlanController {
    private final CalendarPlanService plans;
    private final SessionTokenService tokens;
    public CalendarPlanController(CalendarPlanService plans,SessionTokenService tokens) { this.plans=plans; this.tokens=tokens; }
    private Long user(String header) {
        return tokens.resolveUserId(header).orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED,"Log in to save your calendar."));
    }
    @GetMapping
    public CalendarPlanService.Plan get(@RequestHeader(value="Authorization",required=false) String auth) { return plans.get(user(auth)); }
    @PutMapping
    public CalendarPlanService.Plan save(@RequestHeader(value="Authorization",required=false) String auth,@RequestBody CalendarPlanService.Plan plan) {
        return plans.save(user(auth),plan);
    }
    @ExceptionHandler(IllegalArgumentException.class) @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String,String> invalid(IllegalArgumentException ex) {return Map.of("error",ex.getMessage());}
}
