package com.careafter.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "alerts")
@NoArgsConstructor
@AllArgsConstructor
public class Alert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne
    @JoinColumn(name = "symptom_checkin_id", nullable = false)
    private SymptomCheckin symptomCheckin;

    private String alertType;
    private String message;

    @Enumerated(EnumType.STRING)
    private AlertStatus status = AlertStatus.NEW;

    private LocalDateTime createdAt;
    private LocalDateTime resolvedAt;
}
