package com.kaankaya.leave;

import jakarta.persistence.*;

@Entity
@Table(name = "user_accounts", uniqueConstraints = @UniqueConstraint(columnNames = "email"))
public class UserAccount {
    public enum Role { EMPLOYEE, ADMIN }
    @Id @Column(length = 80, nullable = false)
    private String username;
    @Column(nullable = false, length = 254)
    private String email;
    @Column(name = "password_hash", nullable = false)
    private String passwordHash;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20)
    private Role role = Role.EMPLOYEE;
    @Column(nullable = false)
    private boolean enabled = true;
    @Column(nullable = false)
    private long tokenVersion = 0;

    protected UserAccount() {}
    public UserAccount(String username, String email, String passwordHash, Role role) {
        this.username = username; this.email = email; this.passwordHash = passwordHash; this.role = role;
    }
    public String getUsername() { return username; }
    public String getEmail() { return email; }
    public String getPasswordHash() { return passwordHash; }
    public Role getRole() { return role; }
    public boolean isEnabled() { return enabled; }
    public long getTokenVersion() { return tokenVersion; }
    public void changePassword(String newHash) { passwordHash = newHash; tokenVersion++; }
}
