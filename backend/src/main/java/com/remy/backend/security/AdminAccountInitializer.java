package com.remy.backend.security;

import com.remy.backend.model.Role;
import com.remy.backend.repository.UserRepository;
import java.util.Arrays;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Promotes the accounts named in app.admin.usernames (comma-separated) to ADMIN
 * at startup. Registration never grants ADMIN, so this is how the first admin
 * is created. Accounts that do not exist yet are skipped.
 */
@Component
public class AdminAccountInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminAccountInitializer.class);

    private final UserRepository userRepository;
    private final String[] adminUsernames;

    public AdminAccountInitializer(UserRepository userRepository,
            @Value("${app.admin.usernames:}") String[] adminUsernames) {
        this.userRepository = userRepository;
        this.adminUsernames = adminUsernames;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        Arrays.stream(adminUsernames)
                .map(String::trim)
                .filter(name -> !name.isEmpty())
                .forEach(name -> userRepository.findByUsername(name).ifPresentOrElse(user -> {
                    if (user.getRole() != Role.ADMIN) {
                        user.setRole(Role.ADMIN);
                        userRepository.save(user);
                        log.info("Granted ADMIN role to '{}'", name);
                    }
                }, () -> log.warn("app.admin.usernames lists '{}', but no such user exists", name)));
    }
}
