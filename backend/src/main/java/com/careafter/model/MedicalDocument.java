package com.careafter.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@Entity
@Table(name = "medical_documents")
public class MedicalDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne
    @JoinColumn(name = "author_id")
    private User author;

    private String title;

    /** ANAMNEZA | FIZIKALNI | NALAZ_RTG | NALAZ_LAB | IZVESTAJ | KONTROLNI_PREGLED | OTPUSNA_LISTA */
    private String documentType;

    /** Structured content — sections separated by marker lines */
    @Column(columnDefinition = "TEXT")
    private String content;

    /** Date of the actual examination (may differ from upload date) */
    private LocalDate documentDate;

    private boolean relatedToCurrentIllness = true;

    private LocalDateTime uploadedAt = LocalDateTime.now();

    private boolean uploadedByPatient = false;

    private String fileName;

    private String fileContentType;

    @Lob
    @Column(name = "file_data", columnDefinition = "LONGVARBINARY")
    private byte[] fileData;
}
