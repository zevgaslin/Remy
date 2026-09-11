package com.remy.backend.controller;

import com.remy.backend.dto.LoginRequest;
import com.remy.backend.dto.RegisterRequest;
import com.remy.backend.dto.UserResponse;
import com.remy.backend.model.User;
import com.remy.backend.repository.UserRepository;
import java.util.Map;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        if (isBlank(request.getUsername()) || isBlank(request.getEmail()) || isBlank(request.getPassword())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Username, email, and password are required."));
        }
        if (userRepository.existsByUsername(request.getUsername())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "Username is already taken."));
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "Email is already registered."));
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        User saved = userRepository.save(user);

        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(saved));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        Optional<User> match = userRepository.findByUsername(request.getUsername());
        if (match.isEmpty() || !passwordEncoder.matches(request.getPassword(), match.get().getPasswordHash())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid username or password."));
        }
        return ResponseEntity.ok(toResponse(match.get()));
    }

    private UserResponse toResponse(User user) {
        return new UserResponse(user.getId(), user.getUsername(), user.getEmail());
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
