package com.remy.backend.controller;

import com.remy.backend.model.*;
import com.remy.backend.repository.*;
import com.remy.backend.service.WeeklyRecapService;
import java.time.*;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.*;
import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT)
class WeeklyRecapControllerTest {
    @org.springframework.test.context.DynamicPropertySource
    static void database(org.springframework.test.context.DynamicPropertyRegistry registry) {
        com.remy.backend.support.PostgresTestDatabase.configure(registry,"weekly_recap_test");
    }
    @Autowired TestRestTemplate http;
    @Autowired RecipeRepository recipes;
    private HttpHeaders auth() {
        String name="recap_"+UUID.randomUUID().toString().substring(0,8);
        var response=http.postForEntity("/api/auth/register",Map.of("username",name,"email",name+"@example.com","password","password123"),Map.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        HttpHeaders headers=new HttpHeaders(); headers.setBearerAuth((String)response.getBody().get("token")); return headers;
    }
    private ResponseEntity<Map> log(HttpHeaders headers, Long recipeId, LocalDate day, String slot, double servings) {
        return http.exchange("/api/users/me/meal-logs",HttpMethod.POST,new HttpEntity<>(Map.of("recipeId",recipeId,"eatenOn",day.toString(),"slot",slot,"servings",servings,"timezone","America/Chicago"),headers),Map.class);
    }
    private ResponseEntity<Map> recap(HttpHeaders headers, LocalDate monday) {
        return http.exchange("/api/users/me/recaps/weekly?timezone=America/Chicago&weekStart="+monday,HttpMethod.GET,new HttpEntity<>(headers),Map.class);
    }
    @Test void recordsSnapshotsDeduplicatesAndIsolatesUsers() {
        var owner=auth(); var other=auth();
        LocalDate date=LocalDate.now(ZoneId.of("America/Chicago"));
        LocalDate monday=date.minusDays(date.getDayOfWeek().getValue()-1);
        Recipe recipe=new Recipe();recipe.setName("Recap soup");recipe.setNutrition(new RecipeNutrition(1000,25,137,39));recipe=recipes.save(recipe);
        var first=log(owner,recipe.getId(),date,"lunch",2);
        assertThat(first.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(first.getBody()).containsEntry("calories",2000.0).containsEntry("protein",50.0);
        assertThat(log(owner,recipe.getId(),date,"lunch",2).getBody().get("id")).isEqualTo(first.getBody().get("id"));
        recipe.setName("Edited recipe");recipe.setNutrition(new RecipeNutrition(1,1,1,1));recipes.save(recipe);
        http.exchange("/api/users/me/goals",HttpMethod.PUT,new HttpEntity<>(Map.of("calories",100,"protein",1,"carbs",1,"fat",1),owner),Map.class);
        var result=recap(owner,monday);
        assertThat(result.getBody()).containsEntry("mealsLogged",1).containsEntry("daysLogged",1);
        assertThat((Map)result.getBody().get("goalDays")).containsEntry("calories",1).containsEntry("protein",1);
        assertThat(result.getBody().toString()).contains("Recap soup").doesNotContain("Edited recipe");
        assertThat(recap(other,monday).getBody()).containsEntry("mealsLogged",0);
        Object id=first.getBody().get("id");
        http.exchange("/api/users/me/meal-logs/"+id,HttpMethod.DELETE,new HttpEntity<>(other),Void.class);
        assertThat(recap(owner,monday).getBody()).containsEntry("mealsLogged",1);
        http.exchange("/api/users/me/meal-logs/"+id,HttpMethod.DELETE,new HttpEntity<>(owner),Void.class);
        assertThat(recap(owner,monday).getBody()).containsEntry("mealsLogged",0);
    }
    @Test void rejectsInvalidLogsAndRequiresAuthentication() {
        var owner=auth();LocalDate date=LocalDate.now(ZoneId.of("America/Chicago"));
        assertThat(log(owner,1L,date.plusDays(1),"breakfast",1).getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(log(owner,1L,date,"breakfast",0).getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(log(owner,1L,date," ",1).getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(log(new HttpHeaders(),1L,date,"breakfast",1).getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(http.getForEntity("/api/users/me/recaps/weekly?timezone=America/Chicago",Map.class).getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(recap(owner,date.with(java.time.temporal.TemporalAdjusters.next(DayOfWeek.MONDAY))).getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }
    @Test void missingNutritionIsUnknownAndCompletionUsesCalendarBoundary() {
        LocalDate monday=LocalDate.of(2026,10,26);
        MealLog meal=new MealLog();meal.eatenOn=monday;meal.protein=60.0;
        meal.goals=new NutritionGoals(2000,50,275,78);
        var result=WeeklyRecapService.summarize(monday,monday.plusDays(6),List.of(meal));
        assertThat(result.complete()).isFalse();
        assertThat(result.daysLogged()).isEqualTo(1);
        assertThat(result.days().get(0).totals().get("calories")).isNull();
        assertThat(result.days().get(0).goalsHit().get("calories")).isNull();
        assertThat(result.goalDays().get("protein")).isEqualTo(1);
        assertThat(result.days().get(1).totals().get("protein")).isNull();
        assertThat(WeeklyRecapService.summarize(monday,monday.plusDays(7),List.of(meal)).complete()).isTrue();
    }
}
