package com.remy.backend.repository;

import com.remy.backend.model.GroceryCheck;
import java.util.Set;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface GroceryCheckRepository extends JpaRepository<GroceryCheck, Long> {

    @Query("select c.itemKey from GroceryCheck c where c.user.id = :userId")
    Set<String> findItemKeys(@Param("userId") Long userId);

    boolean existsByUserIdAndItemKey(Long userId, String itemKey);

    @Modifying
    @Query("delete from GroceryCheck c where c.user.id = :userId and c.itemKey = :itemKey")
    void deleteItem(@Param("userId") Long userId, @Param("itemKey") String itemKey);

    @Modifying
    @Query("delete from GroceryCheck c where c.user.id = :userId")
    void deleteAllForUser(@Param("userId") Long userId);
}
