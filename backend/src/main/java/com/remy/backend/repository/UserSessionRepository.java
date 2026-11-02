package com.remy.backend.repository;

import com.remy.backend.model.UserSession;
import java.time.Instant;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserSessionRepository extends JpaRepository<UserSession, Long> {

    @Query("select s.user.id from UserSession s where s.tokenHash = :tokenHash and s.expiresAt > :now")
    Optional<Long> findActiveUserId(@Param("tokenHash") String tokenHash, @Param("now") Instant now);

    @Modifying
    @Query("delete from UserSession s where s.tokenHash = :tokenHash")
    int deleteByTokenHash(@Param("tokenHash") String tokenHash);

    @Modifying
    @Query("delete from UserSession s where s.expiresAt <= :now")
    int deleteExpired(@Param("now") Instant now);
}
