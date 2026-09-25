package com.remy.backend.repository;

import com.remy.backend.model.UserPreference;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserPreferenceRepository extends JpaRepository<UserPreference, Long> {
    List<UserPreference> findByUserId(Long userId);

    void deleteByUserId(Long userId);
}
