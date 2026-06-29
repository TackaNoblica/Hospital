package com.careafter.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "institution_doctor_requests")
@NoArgsConstructor
public class InstitutionDoctorRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "institution_id")
    private User institution;

    @ManyToOne
    @JoinColumn(name = "doctor_id")
    private User doctor;

    // PENDING, APPROVED, REJECTED
    private String status = "PENDING";

    private LocalDateTime requestedAt;
    private LocalDateTime respondedAt;
}
