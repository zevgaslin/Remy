package com.remy.backend.repository;

import com.remy.backend.model.MealPlanDay;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MealPlanDayRepository extends JpaRepository<MealPlanDay, Long> {

    List<MealPlanDay> findByUserIdAndPlanDateGreaterThanEqualOrderByPlanDate(Long userId, LocalDate from);

    Optional<MealPlanDay> findByUserIdAndPlanDate(Long userId, LocalDate planDate);
}
