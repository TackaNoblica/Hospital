package com.careafter.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "reports")
@NoArgsConstructor
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "reporter_id")
    private User reporter;

    @ManyToOne
    @JoinColumn(name = "reported_user_id")
    private User reportedUser;

    // PATIENT_REPORTS_DOCTOR or DOCTOR_REPORTS_PATIENT
    private String reportType;

    @Column(columnDefinition = "TEXT")
    private String reason;

    // PENDING, WARNING_SENT, BANNED, RESOLVED
    private String status = "PENDING";

    private LocalDateTime createdAt;
    private LocalDateTime resolvedAt;
}
