package com.careafter.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "symptom_checkins")
@NoArgsConstructor
@AllArgsConstructor
public class SymptomCheckin {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    private Double temperature;
    private Integer painLevel;
    private Boolean nausea;
    private Boolean bleeding;
    private Boolean breathingProblem;
    private Boolean woundRedness;
    private Boolean generalWorsening;
    private String comment;

    @Enumerated(EnumType.STRING)
    private RiskLevel riskLevel;

    private LocalDateTime createdAt;
}
