package com.spruce.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Email
    @Column(unique = true, nullable = false)
    private String email;

    @NotBlank
    @Column(nullable = false)
    private String password; // bcrypt hashed

    @NotBlank
    @Column(unique = true, nullable = false)
    private String username;

    @Column(columnDefinition = "TEXT")
    private String avatar;

    @Column(name = "x25519_pub", columnDefinition = "TEXT")
    private String x25519PublicKey;

    @Column(name = "kyber_pub", columnDefinition = "TEXT")
    private String kyberPublicKey;

    @Column(name = "dilithium_pub", columnDefinition = "TEXT")
    private String dilithiumPublicKey;

    @Column(columnDefinition = "TEXT")
    private String bio;

    private String status = "online";

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}

