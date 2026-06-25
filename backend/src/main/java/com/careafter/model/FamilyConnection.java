package com.careafter.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "family_connections")
@NoArgsConstructor
@AllArgsConstructor
public class FamilyConnection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne
    @JoinColumn(name = "family_member_id", nullable = false)
    private User familyMember;

    private String relation;
    private Boolean consentGiven;
    private LocalDateTime createdAt;
}
