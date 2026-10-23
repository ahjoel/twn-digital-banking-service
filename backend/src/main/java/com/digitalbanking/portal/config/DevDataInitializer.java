package com.digitalbanking.portal.config;

import com.digitalbanking.portal.entity.User;
import com.digitalbanking.portal.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/** Inserts demo users into the users table (dev and test profiles only). */
@Component
@Profile({"dev", "test"})
public class DevDataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DevDataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        createUserIfMissing("john.doe", "Password123!", "john.doe@example.com");
        createUserIfMissing("tom@mybank.com", "tom", "tom@mybank.com");
    }

    private void createUserIfMissing(String username, String rawPassword, String email) {
        if (userRepository.findByUsername(username).isEmpty()) {
            User user = new User();
            user.setUsername(username);
            user.setPassword(passwordEncoder.encode(rawPassword));
            user.setEmail(email);
            user.setRole("CUSTOMER");
            userRepository.save(user);
        }
    }
}
