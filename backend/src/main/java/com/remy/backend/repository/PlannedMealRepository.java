package com.remy.backend.repository;

import com.remy.backend.model.PlannedMeal;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PlannedMealRepository extends JpaRepository<PlannedMeal, Long> {

    // Each row is {planDate, slotId, recipeId}; recipes are loaded separately in one query.
    @Query("select m.planDate, m.slotId, m.recipe.id from PlannedMeal m"
            + " where m.user.id = :userId and m.planDate >= :from order by m.planDate, m.slotId")
    List<Object[]> findPlanRows(@Param("userId") Long userId, @Param("from") LocalDate from);

    Optional<PlannedMeal> findByUserIdAndPlanDateAndSlotId(Long userId, LocalDate planDate, String slotId);

    @Modifying
    @Query("delete from PlannedMeal m where m.user.id = :userId and m.planDate = :date and m.slotId = :slotId")
    int deleteSlot(@Param("userId") Long userId, @Param("date") LocalDate date, @Param("slotId") String slotId);

    @Modifying
    @Query("delete from PlannedMeal m where m.user.id = :userId and m.planDate = :date and m.slotId not in :keep")
    int deleteSlotsNotIn(@Param("userId") Long userId, @Param("date") LocalDate date, @Param("keep") Collection<String> keep);

    @Modifying
    @Query("delete from PlannedMeal m where m.user.id = :userId and m.planDate = :date")
    int deleteDay(@Param("userId") Long userId, @Param("date") LocalDate date);

    @Modifying
    @Query("delete from PlannedMeal m where m.recipe.id = :recipeId")
    void deleteForRecipe(@Param("recipeId") Long recipeId);
}
