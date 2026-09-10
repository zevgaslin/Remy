package com.remy.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Entry point for the Remy backend. Every controller, model, and repository
 * package under com.remy.backend is picked up automatically via component
 * scanning from this class's package.
 */
@SpringBootApplication
public class RemyApplication {

    public static void main(String[] args) {
        SpringApplication.run(RemyApplication.class, args);
    }
}
