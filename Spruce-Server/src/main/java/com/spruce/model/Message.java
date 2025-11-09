package com.spruce.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "messages")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Message {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "sender_id", nullable = false)
    private Long senderId;

    @Column(name = "receiver_id")
    private Long receiverId;

    @Column(name = "group_id")
    private Long groupId;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String ciphertext;

    @Column(columnDefinition = "TEXT")
    private String iv; // Base64 encoded IV for AES-GCM

    @Column(columnDefinition = "TEXT")
    private String metadata; // JSON metadata

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime timestamp;
}




