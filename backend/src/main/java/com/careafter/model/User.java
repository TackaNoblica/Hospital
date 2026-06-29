package com.careafter.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Entity
@Table(name = "users")
@NoArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String firstName;
    private String lastName;
    private String email;

    @JsonIgnore
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    private Role role;

    private Boolean active = true;

    private String specialty;
    private String hospital;

    private Integer warningCount = 0;
    private java.time.LocalDateTime bannedUntil;

    public User(Long id, String firstName, String lastName, String email,
                String passwordHash, Role role, Boolean active) {
        this.id = id; this.firstName = firstName; this.lastName = lastName;
        this.email = email; this.passwordHash = passwordHash;
        this.role = role; this.active = active;
    }
}
