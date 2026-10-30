package com.kaankaya.leave;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api")
public class AuthController {
    private final UserRepository users;
    private final PasswordEncoder passwords;
    private final JwtEncoder encoder;
    private final String issuer;
    private final long ttl;
    public AuthController(UserRepository users, PasswordEncoder passwords, JwtEncoder encoder,
            @Value("${app.jwt.issuer}") String issuer,
            @Value("${app.jwt.ttl-minutes}") long ttl) {
        this.users = users; this.passwords = passwords; this.encoder = encoder;
        this.issuer = issuer; this.ttl = ttl;
    }

    public record Register(@NotBlank @Size(max = 80) String username,
        @NotBlank @Email @Size(max = 254) String email,
        @NotBlank @Size(min = 8, max = 128) String password) {}
    public record Credentials(@NotBlank String username, @NotBlank String password) {}
    public record PasswordUpdate(@NotBlank String oldPassword,
        @NotBlank @Size(min = 8, max = 128) String newPassword) {}

    @PostMapping("/login/register")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, String> register(@Valid @RequestBody Register input) {
        String name = input.username().trim(), email = input.email().trim();
        if (users.existsById(name) || users.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username or email already exists");
        }
        users.save(new UserAccount(name, email, passwords.encode(input.password()), UserAccount.Role.EMPLOYEE));
        return Map.of("message", "Account created");
    }

    @PostMapping("/login")
    public Map<String, Object> login(@Valid @RequestBody Credentials input) {
        UserAccount user = users.findById(input.username()).orElse(null);
        if (user == null || !user.isEnabled() || !passwords.matches(input.password(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder().issuer(issuer).subject(user.getUsername())
            .issuedAt(now).expiresAt(now.plus(ttl, ChronoUnit.MINUTES))
            .claim("ver", user.getTokenVersion()).build();
        String token = encoder.encode(JwtEncoderParameters.from(
            JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();
        return Map.of("token", token, "adminControl", user.getRole() == UserAccount.Role.ADMIN,
            "username", user.getUsername(), "expiresInSeconds", ttl * 60);
    }

    @GetMapping("/auth/verify-token")
    public Map<String, Object> verify(Authentication auth) {
        return Map.of("username", auth.getName(), "valid", true);
    }

    @PutMapping("/users/{username}/update-password")
    @Transactional
    public Map<String, String> updatePassword(@PathVariable String username,
            @Valid @RequestBody PasswordUpdate input, Authentication auth) {
        if (!username.equals(auth.getName())) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        UserAccount user = users.findById(auth.getName()).orElseThrow();
        if (!passwords.matches(input.oldPassword(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current password is incorrect");
        }
        if (passwords.matches(input.newPassword(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "New password must be different");
        }
        user.changePassword(passwords.encode(input.newPassword()));
        return Map.of("message", "Password updated; please sign in again");
    }
}
