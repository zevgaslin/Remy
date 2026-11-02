package com.remy.backend.service;

import com.remy.backend.model.UserSession;
import com.remy.backend.repository.UserRepository;
import com.remy.backend.repository.UserSessionRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Session tokens stored in the database, so users stay logged in across page
 * refreshes and backend restarts until the session expires or they log out.
 */
@Service
public class DatabaseTokenService implements SessionTokenService {

    private static final String BEARER = "Bearer ";

    private final UserSessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final Duration sessionLength;
    private final SecureRandom random = new SecureRandom();

    public DatabaseTokenService(
            UserSessionRepository sessionRepository,
            UserRepository userRepository,
            @Value("${app.session.days:30}") long sessionDays) {
        this.sessionRepository = sessionRepository;
        this.userRepository = userRepository;
        this.sessionLength = Duration.ofDays(sessionDays);
    }

    @Override
    @Transactional
    public String issueToken(Long userId) {
        Instant now = Instant.now();
        // Logins are rare enough that tidying up expired sessions here is cheap.
        sessionRepository.deleteExpired(now);

        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        sessionRepository.save(new UserSession(
                hash(token), userRepository.getReferenceById(userId), now, now.plus(sessionLength)));
        return token;
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Long> resolveUserId(String authorizationHeader) {
        return tokenFrom(authorizationHeader)
                .flatMap(token -> sessionRepository.findActiveUserId(hash(token), Instant.now()));
    }

    @Override
    @Transactional
    public void revoke(String authorizationHeader) {
        tokenFrom(authorizationHeader).ifPresent(token -> sessionRepository.deleteByTokenHash(hash(token)));
    }

    private Optional<String> tokenFrom(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith(BEARER)) {
            return Optional.empty();
        }
        String token = authorizationHeader.substring(BEARER.length()).trim();
        return token.isEmpty() ? Optional.empty() : Optional.of(token);
    }

    private static String hash(String token) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException error) {
            throw new IllegalStateException("SHA-256 is unavailable", error);
        }
    }
}
