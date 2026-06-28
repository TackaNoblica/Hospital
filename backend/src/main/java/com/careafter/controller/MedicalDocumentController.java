package com.careafter.controller;

import com.careafter.model.MedicalDocument;
import com.careafter.model.Patient;
import com.careafter.model.User;
import com.careafter.repository.MedicalDocumentRepository;
import com.careafter.repository.PatientRepository;
import com.careafter.repository.UserRepository;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/medical-documents")
public class MedicalDocumentController {

    private final MedicalDocumentRepository docRepo;
    private final PatientRepository patientRepo;
    private final UserRepository userRepo;

    public MedicalDocumentController(MedicalDocumentRepository docRepo,
                                     PatientRepository patientRepo,
                                     UserRepository userRepo) {
        this.docRepo = docRepo;
        this.patientRepo = patientRepo;
        this.userRepo = userRepo;
    }

    /** Patient: get all their own documents */
    @GetMapping("/my")
    public ResponseEntity<List<MedicalDocument>> getMyDocuments(Principal principal) {
        User user = userRepo.findByEmail(principal.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Patient patient = patientRepo.findByUser(user)
                .orElseThrow(() -> new IllegalArgumentException("Patient not found"));
        return ResponseEntity.ok(docRepo.findByPatientOrderByDocumentDateDesc(patient));
    }

    /** Get single document */
    @GetMapping("/{id}")
    public ResponseEntity<MedicalDocument> getDocument(@PathVariable Long id) {
        return docRepo.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** Doctor: get all documents for a patient */
    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<MedicalDocument>> getForPatient(@PathVariable Long patientId) {
        Patient patient = patientRepo.findById(patientId)
                .orElseThrow(() -> new IllegalArgumentException("Patient not found"));
        return ResponseEntity.ok(docRepo.findByPatientOrderByDocumentDateDesc(patient));
    }

    /** Doctor: get documents they wrote for a patient */
    @GetMapping("/patient/{patientId}/by-doctor/{doctorId}")
    public ResponseEntity<List<MedicalDocument>> getByDoctorForPatient(
            @PathVariable Long patientId, @PathVariable Long doctorId) {
        Patient patient = patientRepo.findById(patientId)
                .orElseThrow(() -> new IllegalArgumentException("Patient not found"));
        User doctor = userRepo.findById(doctorId)
                .orElseThrow(() -> new IllegalArgumentException("Doctor not found"));
        return ResponseEntity.ok(docRepo.findByPatientAndAuthorOrderByDocumentDateDesc(patient, doctor));
    }

    /** Patient: upload their own lab result file */
    @PostMapping("/upload")
    public ResponseEntity<MedicalDocument> uploadDocument(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam(value = "documentDate", required = false) String documentDate,
            Principal principal) throws java.io.IOException {
        User user = userRepo.findByEmail(principal.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Patient patient = patientRepo.findByUser(user)
                .orElseThrow(() -> new IllegalArgumentException("Patient not found"));

        MedicalDocument doc = new MedicalDocument();
        doc.setPatient(patient);
        doc.setAuthor(user);
        doc.setTitle(title != null && !title.isBlank() ? title : file.getOriginalFilename());
        doc.setDocumentType("NALAZ_LAB");
        doc.setFileName(file.getOriginalFilename());
        doc.setFileContentType(file.getContentType());
        doc.setFileData(file.getBytes());
        doc.setDocumentDate(documentDate != null && !documentDate.isBlank()
                ? LocalDate.parse(documentDate) : LocalDate.now());
        doc.setRelatedToCurrentIllness(false);
        doc.setUploadedByPatient(true);
        doc.setUploadedAt(LocalDateTime.now());
        return ResponseEntity.ok(docRepo.save(doc));
    }

    /** Download the raw file attached to a document */
    @GetMapping("/{id}/file")
    public ResponseEntity<byte[]> downloadFile(@PathVariable Long id) {
        MedicalDocument doc = docRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Document not found"));
        if (doc.getFileData() == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE,
                        doc.getFileContentType() != null ? doc.getFileContentType() : MediaType.APPLICATION_OCTET_STREAM_VALUE)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\"" + doc.getFileName() + "\"")
                .body(doc.getFileData());
    }

    /** Doctor: create a new document for a patient */
    @PostMapping
    public ResponseEntity<MedicalDocument> createDocument(
            @RequestBody Map<String, Object> body, Principal principal) {
        User author = userRepo.findByEmail(principal.getName())
                .orElseThrow(() -> new IllegalArgumentException("Doctor not found"));
        Long patientId = Long.parseLong(body.get("patientId").toString());
        Patient patient = patientRepo.findById(patientId)
                .orElseThrow(() -> new IllegalArgumentException("Patient not found"));

        MedicalDocument doc = new MedicalDocument();
        doc.setPatient(patient);
        doc.setAuthor(author);
        doc.setTitle(body.getOrDefault("title", "Medicinski dokument").toString());
        doc.setDocumentType(body.getOrDefault("documentType", "ANAMNEZA").toString());
        doc.setContent(body.getOrDefault("content", "").toString());
        doc.setRelatedToCurrentIllness(Boolean.parseBoolean(
                body.getOrDefault("relatedToCurrentIllness", "true").toString()));
        String dateStr = body.get("documentDate") != null ? body.get("documentDate").toString() : null;
        doc.setDocumentDate(dateStr != null ? LocalDate.parse(dateStr) : LocalDate.now());
        doc.setUploadedAt(LocalDateTime.now());
        return ResponseEntity.ok(docRepo.save(doc));
    }
}
