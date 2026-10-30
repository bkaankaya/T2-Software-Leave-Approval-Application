package com.kaankaya.leave;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootApplication
public class LeaveApplication {
    public static void main(String[] args) { SpringApplication.run(LeaveApplication.class, args); }

    @Bean
    ApplicationRunner bootstrapAdmin(UserRepository users, PasswordEncoder encoder,
            @Value("${app.admin.username}") String username,
            @Value("${app.admin.password}") String password,
            @Value("${app.admin.email}") String email) {
        return args -> {
            if (username.isBlank() && password.isBlank()) return;
            if (username.isBlank() || password.length() < 12) {
                throw new IllegalStateException("ADMIN_USERNAME and an ADMIN_PASSWORD of at least 12 characters must be configured together");
            }
            UserAccount existing = users.findById(username).orElse(null);
            if (existing != null) {
                if (existing.getRole() != UserAccount.Role.ADMIN) {
                    throw new IllegalStateException("ADMIN_USERNAME is already registered as an employee");
                }
                return;
            }
            users.save(new UserAccount(username, email, encoder.encode(password), UserAccount.Role.ADMIN));
        };
    }
}
