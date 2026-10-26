package com.remy.backend.service;

import java.util.Optional;

/**
 * Issues and resolves session tokens. Controllers depend on this abstraction,
 * not on where tokens are stored.
 */
public interface SessionTokenService {

    String issueToken(Long userId);

    Optional<Long> resolveUserId(String authorizationHeader);

    /** Ends the session behind this header so its token stops working; unknown tokens are ignored. */
    void revoke(String authorizationHeader);
}
