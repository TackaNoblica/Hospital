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
    @Column(columnDefinition = "TEXT")
    private String comment;

    @Enumerated(EnumType.STRING)
    private RiskLevel riskLevel;

    private LocalDateTime createdAt;

    // ── Pulmonary-specific fields ─────────────────────────────
    private Double spO2;
    private Integer respiratoryRate;

    private Boolean hasCough;
    private String  coughType;       // DRY | PRODUCTIVE
    private String  sputumColor;     // WHITE | YELLOW_GREEN | BLOODY
    private Integer coughIntensity;  // 1-10

    private Integer dyspneaLevel;    // 0-4  mMRC scale
    private Boolean hasWheezing;

    private Boolean chestPainPresent;
    private String  chestPainSide;   // LEFT | RIGHT | BOTH | STERNAL

    private Boolean hasFatigue;
    private Boolean hasNightSweats;

    private Integer wellbeingScore;  // 1=very bad … 5=excellent

    @Column(columnDefinition = "TEXT")
    private String imageData;  // Base64 data URL (optional symptom photo)
}
