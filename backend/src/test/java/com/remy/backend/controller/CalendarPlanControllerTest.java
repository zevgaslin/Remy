package com.remy.backend.controller;

import java.util.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.*;
import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT)
class CalendarPlanControllerTest {
    @org.springframework.test.context.DynamicPropertySource
    static void database(org.springframework.test.context.DynamicPropertyRegistry registry) {
        com.remy.backend.support.PostgresTestDatabase.configure(registry,"calendar_plan_test");
    }
    @Autowired TestRestTemplate http;
    private String username;
    private HttpHeaders auth() {
        username="plan_"+UUID.randomUUID().toString().substring(0,8);
        var response=http.postForEntity("/api/auth/register",Map.of("username",username,"email",username+"@example.com","password","password123"),Map.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        return headers(response.getBody());
    }
    private HttpHeaders headers(Map response) { var h=new HttpHeaders();h.setBearerAuth((String)response.get("token"));return h; }
    private ResponseEntity<Map> get(HttpHeaders auth) {
        return http.exchange("/api/users/me/calendar",HttpMethod.GET,new HttpEntity<>(auth),Map.class);
    }
    private ResponseEntity<Map> save(HttpHeaders auth,Object data) {
        return http.exchange("/api/users/me/calendar",HttpMethod.PUT,new HttpEntity<>(data,auth),Map.class);
    }
    @Test void persistsRecipesSlotsAndRemovalsAcrossLoginWhileIsolatingAccounts() {
        var owner=auth();String ownerName=username; var other=auth();
        assertThat(get(owner).getBody()).containsEntry("revision",0).containsEntry("plannedMeals",Map.of());
        var meals=Map.of("2026-11-01::custom-snack",Map.of("id",1,"name","Soup","nutrition",Map.of("calories",250)));
        var slots=Map.of("2026-11-01",List.of(Map.of("id","custom-snack","label","Afternoon snack","time","15:30","hour",15)));
        var saved=save(owner,Map.of("revision",0,"plannedMeals",meals,"dailyMealSlots",slots));
        assertThat(saved.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(saved.getBody()).containsEntry("revision",1).containsEntry("plannedMeals",meals).containsEntry("dailyMealSlots",slots);
        var login=http.postForEntity("/api/auth/login",Map.of("username",ownerName,"password","password123"),Map.class);
        var newSession=headers(login.getBody());
        assertThat(get(newSession).getBody()).isEqualTo(saved.getBody());
        assertThat(get(other).getBody()).containsEntry("revision",0).containsEntry("plannedMeals",Map.of());
        save(other,Map.of("revision",0,"plannedMeals",Map.of(),"dailyMealSlots",Map.of()));
        assertThat(get(owner).getBody()).isEqualTo(saved.getBody());
        var removed=save(newSession,Map.of("revision",1,"plannedMeals",Map.of(),"dailyMealSlots",Map.of("2026-11-01",List.of())));
        assertThat(removed.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(get(owner).getBody()).containsEntry("plannedMeals",Map.of()).containsEntry("dailyMealSlots",Map.of("2026-11-01",List.of()));
    }
    @Test void rejectsStaleSavesInvalidShapesAndUnauthenticatedRequests() {
        var owner=auth();var empty=Map.of("revision",0,"plannedMeals",Map.of(),"dailyMealSlots",Map.of());
        assertThat(save(owner,empty).getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(save(owner,empty).getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(get(owner).getBody()).containsEntry("revision",1);
        assertThat(save(owner,Map.of("revision",1,"plannedMeals",List.of(),"dailyMealSlots",Map.of())).getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(save(owner,Map.of("revision",1,"plannedMeals",Map.of("bad-key",Map.of("id",1,"name","Soup")),"dailyMealSlots",Map.of())).getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(save(owner,Map.of("revision",1,"plannedMeals",Map.of(),"dailyMealSlots",Map.of("2026-11-01",List.of(Map.of("id","x","label","Snack","time","29:00"))))).getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(get(new HttpHeaders()).getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(save(new HttpHeaders(),empty).getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }
}
