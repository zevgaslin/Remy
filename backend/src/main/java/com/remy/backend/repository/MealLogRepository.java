package com.remy.backend.repository;
import com.remy.backend.model.MealLog;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
public interface MealLogRepository extends JpaRepository<MealLog, Long> {
    List<MealLog> findByUserIdAndEatenOnBetweenOrderByEatenOnAscIdAsc(Long userId, LocalDate start, LocalDate end);
    Optional<MealLog> findByUserIdAndEatenOnAndSlot(Long userId, LocalDate day, String slot);
    Optional<MealLog> findByIdAndUserId(Long id, Long userId);
}
