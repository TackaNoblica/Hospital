package com.careafter.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Data
@Entity
@Table(name = "discharge_plans")
@NoArgsConstructor
@AllArgsConstructor
public class DischargePlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne
    @JoinColumn(name = "doctor_id", nullable = false)
    private User doctor;

    private LocalDate dischargeDate;
    private String diagnosisSummary;
    private String recoveryInstructions;
    private String warningSigns;

    @Enumerated(EnumType.STRING)
    private PlanStatus status = PlanStatus.DRAFT;

    @OneToMany(mappedBy = "dischargePlan", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Medication> medications = new ArrayList<>();
}
