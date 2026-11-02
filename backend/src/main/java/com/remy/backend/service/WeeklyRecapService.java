package com.remy.backend.service;

import com.remy.backend.model.*;
import com.remy.backend.repository.*;
import com.remy.backend.dto.NutritionGoalsDto;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WeeklyRecapService {
    private final MealLogRepository logs;
    private final RecipeRepository recipes;
    private final NutritionGoalsService goals;
    private final EntityManager em;
    public WeeklyRecapService(MealLogRepository logs, RecipeRepository recipes, NutritionGoalsService goals, EntityManager em) {
        this.logs=logs; this.recipes=recipes; this.goals=goals; this.em=em;
    }
    public record LogRequest(Long recipeId, LocalDate eatenOn, String slot, double servings, String timezone) {}
    public record Day(LocalDate date, List<MealLog> meals, Map<String,Double> totals,
                      Map<String,Boolean> goalsHit, NutritionGoalsDto goals) {}
    public record Recap(LocalDate weekStart, LocalDate weekEnd, boolean complete, int daysLogged,
                        int mealsLogged, List<Day> days, Map<String,Integer> goalDays) {}
    public static LocalDate today(String timezone) {
        try { return LocalDate.now(ZoneId.of(timezone)); }
        catch (Exception ex) { throw new IllegalArgumentException("A valid timezone is required."); }
    }
    @Transactional
    public MealLog log(Long userId, LogRequest r) {
        if (r == null || r.recipeId()==null || r.eatenOn()==null || r.slot()==null || r.slot().isBlank()
                || r.slot().length()>200 || !Double.isFinite(r.servings()) || r.servings()<=0 || r.servings()>100) {
            throw new IllegalArgumentException("Choose a recipe, date, meal slot, and servings greater than 0 and at most 100.");
        }
        if (r.eatenOn().isAfter(today(r.timezone()))) throw new IllegalArgumentException("Future meals cannot be marked as eaten.");
        // Serialize writes for a user, including simultaneous double-clicks and first-day snapshots.
        em.find(User.class, userId, LockModeType.PESSIMISTIC_WRITE);
        var existing=logs.findByUserIdAndEatenOnAndSlot(userId,r.eatenOn(),r.slot());
        if (existing.isPresent()) return existing.get();
        Recipe recipe=recipes.findById(r.recipeId()).orElseThrow(() -> new IllegalArgumentException("Recipe no longer exists."));
        MealLog entry=new MealLog();
        entry.userId=userId; entry.recipeId=recipe.getId(); entry.recipeName=recipe.getName();
        entry.eatenOn=r.eatenOn(); entry.slot=r.slot(); entry.servings=r.servings();
        RecipeNutrition n=recipe.getNutrition();
        entry.calories=scaled(n==null?null:n.getCalories(),r.servings());
        entry.protein=scaled(n==null?null:n.getProtein(),r.servings());
        entry.carbs=scaled(n==null?null:n.getCarbs(),r.servings());
        entry.fat=scaled(n==null?null:n.getFat(),r.servings());
        var day=logs.findByUserIdAndEatenOnBetweenOrderByEatenOnAscIdAsc(userId,r.eatenOn(),r.eatenOn());
        NutritionGoalsDto g=day.isEmpty()?goals.getGoals(userId):NutritionGoalsDto.from(day.get(0).goals);
        entry.goals=new NutritionGoals(g.calories(),g.protein(),g.carbs(),g.fat());
        return logs.save(entry);
    }
    private Double scaled(Integer value,double servings) { return value==null?null:value*servings; }
    @Transactional
    public void undo(Long userId,Long id) {
        logs.findByIdAndUserId(id,userId).ifPresent(logs::delete);
    }
    @Transactional(readOnly=true)
    public Recap recap(Long userId,LocalDate weekStart,String timezone) {
        LocalDate now=today(timezone);
        LocalDate currentMonday=now.minusDays(now.getDayOfWeek().getValue()-1);
        LocalDate start=weekStart==null?currentMonday.minusWeeks(1):weekStart;
        if (start.getDayOfWeek()!=DayOfWeek.MONDAY || start.isAfter(currentMonday))
            throw new IllegalArgumentException("Choose a Monday in the current week or earlier.");
        var entries=logs.findByUserIdAndEatenOnBetweenOrderByEatenOnAscIdAsc(userId,start,start.plusDays(6));
        return summarize(start, now, entries);
    }
    public static Recap summarize(LocalDate start, LocalDate now, List<MealLog> entries) {
        List<Day> days=new ArrayList<>();
        Map<String,Integer> goalDays=new LinkedHashMap<>();
        for(String key:List.of("calories","protein","carbs","fat")) goalDays.put(key,0);
        int logged=0;
        for(int i=0;i<7;i++) {
            LocalDate date=start.plusDays(i);
            List<MealLog> meals=entries.stream().filter(m -> m.eatenOn.equals(date)).toList();
            if(!meals.isEmpty()) logged++;
            var totals=new LinkedHashMap<String,Double>();
            var hits=new LinkedHashMap<String,Boolean>();
            NutritionGoals g=meals.isEmpty()?null:meals.get(0).goals;
            for(String key:goalDays.keySet()) {
                List<Double> values=meals.stream().map(m -> switch(key) {
                    case "calories" -> m.calories; case "protein" -> m.protein;
                    case "carbs" -> m.carbs; default -> m.fat;
                }).toList();
                Double total=values.isEmpty()||values.contains(null)?null:values.stream().mapToDouble(Double::doubleValue).sum();
                totals.put(key,total);
                Integer target=g==null?null:switch(key) {
                    case "calories" -> g.getCalories(); case "protein" -> g.getProtein();
                    case "carbs" -> g.getCarbs(); default -> g.getFat();
                };
                Boolean hit=total==null||target==null?null:key.equals("protein")?total>=target:
                    target==0?total==0:total>=target*0.9 && total<=target*1.1;
                hits.put(key,hit);
                if(Boolean.TRUE.equals(hit)) goalDays.merge(key,1,Integer::sum);
            }
            days.add(new Day(date,meals,totals,hits,g==null?null:NutritionGoalsDto.from(g)));
        }
        return new Recap(start,start.plusDays(6),now.isAfter(start.plusDays(6)),logged,entries.size(),days,goalDays);
    }
}
