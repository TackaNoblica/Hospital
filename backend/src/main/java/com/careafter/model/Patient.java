package com.careafter.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Entity
@Table(name = "patients")
@NoArgsConstructor
@AllArgsConstructor
public class Patient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private LocalDate dateOfBirth;
    private String gender;
    private String diagnosis;
    private String hospitalDepartment;
    private java.time.LocalDate diagnosedAt;
    private String diagnosisStatus = "ACTIVE"; // ACTIVE or RESOLVED

    @ManyToOne
    @JoinColumn(name = "assigned_doctor_id")
    private User assignedDoctor;
}
