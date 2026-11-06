package com.remy.backend.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.remy.backend.model.Role;
import com.remy.backend.model.User;
import com.remy.backend.repository.UserRepository;
import com.remy.backend.service.SessionTokenService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Map;
import java.util.Optional;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

/** Enforces {@link AdminOnly} before the controller method runs. */
@Component
public class AdminOnlyInterceptor implements HandlerInterceptor {

    private final SessionTokenService tokenService;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    public AdminOnlyInterceptor(SessionTokenService tokenService, UserRepository userRepository, ObjectMapper objectMapper) {
        this.tokenService = tokenService;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws IOException {
        if (!(handler instanceof HandlerMethod method) || !requiresAdmin(method)) {
            return true;
        }

        Optional<User> user = tokenService.resolveUserId(request.getHeader(HttpHeaders.AUTHORIZATION))
                .flatMap(userRepository::findById);
        if (user.isEmpty()) {
            reject(response, HttpStatus.UNAUTHORIZED, "Log in to continue.");
            return false;
        }
        if (user.get().getRole() != Role.ADMIN) {
            reject(response, HttpStatus.FORBIDDEN, "Only admins can do this.");
            return false;
        }
        return true;
    }

    private boolean requiresAdmin(HandlerMethod method) {
        return method.hasMethodAnnotation(AdminOnly.class)
                || method.getBeanType().isAnnotationPresent(AdminOnly.class);
    }

    private void reject(HttpServletResponse response, HttpStatus status, String message) throws IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(response.getOutputStream(), Map.of("error", message));
    }
}
