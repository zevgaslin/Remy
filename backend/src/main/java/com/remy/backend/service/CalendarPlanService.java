package com.remy.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.remy.backend.model.CalendarPlan;
import com.remy.backend.model.User;
import com.remy.backend.repository.CalendarPlanRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.HashSet;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class CalendarPlanService {
    public record Plan(long revision, JsonNode plannedMeals, JsonNode dailyMealSlots) {}
    private final CalendarPlanRepository plans;
    private final EntityManager em;
    public CalendarPlanService(CalendarPlanRepository plans, EntityManager em) { this.plans=plans; this.em=em; }

    @Transactional(readOnly=true)
    public Plan get(Long userId) {
        return plans.findById(userId).map(this::dto).orElseGet(() ->
            new Plan(0,JsonNodeFactory.instance.objectNode(),JsonNodeFactory.instance.objectNode()));
    }

    @Transactional
    public Plan save(Long userId, Plan request) {
        validate(request);
        // Lock the user even on the first save, when a calendar row does not exist yet.
        em.find(User.class,userId,LockModeType.PESSIMISTIC_WRITE);
        CalendarPlan plan=plans.findById(userId).orElseGet(CalendarPlan::new);
        if (plan.revision!=request.revision()) throw new ResponseStatusException(HttpStatus.CONFLICT,
            "Your calendar changed in another tab. Reload the saved calendar before editing.");
        plan.userId=userId;
        plan.revision++;
        plan.plannedMeals=request.plannedMeals().deepCopy();
        plan.dailyMealSlots=request.dailyMealSlots().deepCopy();
        return dto(plans.save(plan));
    }
    private Plan dto(CalendarPlan plan) { return new Plan(plan.revision,plan.plannedMeals,plan.dailyMealSlots); }

    private void validate(Plan p) {
        if (p==null || p.revision()<0 || p.plannedMeals()==null || !p.plannedMeals().isObject()
                || p.dailyMealSlots()==null || !p.dailyMealSlots().isObject()) invalid();
        if (p.plannedMeals().size()>10000 || p.dailyMealSlots().size()>3660
                || p.plannedMeals().toString().length()+p.dailyMealSlots().toString().length()>5_000_000) invalid();
        p.plannedMeals().fields().forEachRemaining(entry -> {
            String key=entry.getKey();
            if (key.length()<12 || key.length()>212) invalid();
            date(key.substring(0,10));
            String separator=key.substring(10);
            if (!(separator.startsWith("::") && separator.length()>2) && !(separator.startsWith("-") && separator.length()>1)) invalid();
            JsonNode meal=entry.getValue();
            if (!meal.isObject() || !meal.path("id").isIntegralNumber() || meal.path("id").asLong()<=0
                    || !text(meal,"name",255)) invalid();
        });
        p.dailyMealSlots().fields().forEachRemaining(entry -> {
            date(entry.getKey());
            JsonNode slots=entry.getValue();
            if (!slots.isArray() || slots.size()>100) invalid();
            var ids=new HashSet<String>();
            for (JsonNode slot:slots) {
                if (!slot.isObject() || !text(slot,"id",200) || !text(slot,"label",100)
                        || !text(slot,"time",5) || !slot.path("time").asText().matches("[0-2][0-9]:[0-5][0-9]")
                        || !ids.add(slot.path("id").asText())) invalid();
                try { LocalTime.parse(slot.path("time").asText()); } catch (RuntimeException ex) { invalid(); }
                if (slot.has("hour") && (!slot.path("hour").isIntegralNumber() || slot.path("hour").asInt()<0 || slot.path("hour").asInt()>23)) invalid();
            }
        });
    }
    private boolean text(JsonNode node,String field,int max) {
        JsonNode value=node.path(field);
        return value.isTextual() && !value.asText().isBlank() && value.asText().length()<=max;
    }
    private void date(String value) {
        try { if (!value.matches("\\d{4}-\\d{2}-\\d{2}")) invalid(); LocalDate.parse(value); }
        catch (RuntimeException ex) { invalid(); }
    }
    private void invalid() { throw new IllegalArgumentException("Invalid calendar data. Choose valid recipes, dates, and meal slots."); }
}
