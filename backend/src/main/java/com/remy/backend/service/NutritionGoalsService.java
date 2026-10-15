package com.remy.backend.service;

import com.remy.backend.dto.NutritionGoalsDto;
import com.remy.backend.model.NutritionGoals;
import com.remy.backend.model.User;
import com.remy.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NutritionGoalsService {

    static final int MAX_CALORIES = 20000;
    static final int MAX_GRAMS = 2000;

    private final UserRepository userRepository;

    public NutritionGoalsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public NutritionGoalsDto getGoals(Long userId) {
        NutritionGoals goals = userRepository.findById(userId).orElseThrow().getNutritionGoals();
        return NutritionGoalsDto.from(isComplete(goals) ? goals : NutritionGoals.DEFAULTS);
    }

    @Transactional
    public NutritionGoalsDto updateGoals(Long userId, NutritionGoalsDto request) {
        validate(request);
        User user = userRepository.findById(userId).orElseThrow();
        NutritionGoals goals = new NutritionGoals(request.calories(), request.protein(), request.carbs(), request.fat());
        user.setNutritionGoals(goals);
        userRepository.save(user);
        return NutritionGoalsDto.from(goals);
    }

    private void validate(NutritionGoalsDto request) {
        if (request == null || request.calories() == null || request.protein() == null
                || request.carbs() == null || request.fat() == null) {
            throw new IllegalArgumentException("Calories, protein, carbs, and fat goals are required.");
        }
        if (request.calories() < 1 || request.calories() > MAX_CALORIES) {
            throw new IllegalArgumentException("Calorie goal must be between 1 and " + MAX_CALORIES + ".");
        }
        if (outOfRange(request.protein()) || outOfRange(request.carbs()) || outOfRange(request.fat())) {
            throw new IllegalArgumentException("Protein, carbs, and fat goals must be between 0 and " + MAX_GRAMS + "g.");
        }
    }

    private boolean outOfRange(int grams) {
        return grams < 0 || grams > MAX_GRAMS;
    }

    private boolean isComplete(NutritionGoals goals) {
        return goals != null && goals.getCalories() != null && goals.getProtein() != null
                && goals.getCarbs() != null && goals.getFat() != null;
    }
}
