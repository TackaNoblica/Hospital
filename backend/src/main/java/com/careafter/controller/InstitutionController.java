package com.careafter.controller;

import com.careafter.model.*;
import com.careafter.repository.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/institution")
public class InstitutionController {

    private final InstitutionDoctorRequestRepository instRepo;
    private final UserRepository userRepo;
    private final NotificationRepository notifRepo;
    private final DoctorRatingRepository ratingRepo;
    private final ReportRepository reportRepo;

    public InstitutionController(InstitutionDoctorRequestRepository instRepo,
                                 UserRepository userRepo,
                                 NotificationRepository notifRepo,
                                 DoctorRatingRepository ratingRepo,
                                 ReportRepository reportRepo) {
        this.instRepo = instRepo;
        this.userRepo = userRepo;
        this.notifRepo = notifRepo;
        this.ratingRepo = ratingRepo;
        this.reportRepo = reportRepo;
    }

    // Institution follows a doctor (sends request)
    @PostMapping("/follow/{doctorId}")
    public ResponseEntity<InstitutionDoctorRequest> followDoctor(@PathVariable Long doctorId, Principal principal) {
        User institution = userRepo.findByEmail(principal.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        User doctor = userRepo.findById(doctorId)
                .orElseThrow(() -> new IllegalArgumentException("Doctor not found"));

        Optional<InstitutionDoctorRequest> existing = instRepo.findByInstitutionAndDoctor(institution, doctor);
        if (existing.isPresent()) return ResponseEntity.ok(existing.get());

        InstitutionDoctorRequest req = new InstitutionDoctorRequest();
        req.setInstitution(institution);
        req.setDoctor(doctor);
        req.setStatus("PENDING");
        req.setRequestedAt(LocalDateTime.now());
        InstitutionDoctorRequest saved = instRepo.save(req);

        Notification n = new Notification();
        n.setRecipient(doctor);
        n.setTitle("Zahtev za pracenje od ustanove: " + institution.getFirstName());
        n.setMessage("Zdravstvena ustanova \"" + institution.getFirstName() + " " + institution.getLastName()
                + "\" želi da Vas doda u svoju mrežu lekara. Prihvatite ili odbijte zahtev.");
        n.setType("INSTITUTION_REQUEST");
        n.setIsRead(false);
        n.setCreatedAt(LocalDateTime.now());
        n.setRelatedUserId(saved.getId());
        notifRepo.save(n);

        return ResponseEntity.ok(saved);
    }

    // Doctor sees all incoming institution follow requests
    @GetMapping("/incoming-requests")
    public ResponseEntity<List<InstitutionDoctorRequest>> getIncomingRequests(Principal principal) {
        User doctor = userRepo.findByEmail(principal.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return ResponseEntity.ok(instRepo.findByDoctorOrderByRequestedAtDesc(doctor));
    }

    // Doctor approves institution request
    @PostMapping("/requests/{id}/approve")
    public ResponseEntity<InstitutionDoctorRequest> approveRequest(@PathVariable Long id, Principal principal) {
        InstitutionDoctorRequest req = instRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Request not found"));
        req.setStatus("APPROVED");
        req.setRespondedAt(LocalDateTime.now());
        instRepo.save(req);

        // Update doctor's hospital field to show this institution
        User doctor = req.getDoctor();
        if (doctor.getHospital() == null || doctor.getHospital().isBlank()) {
            doctor.setHospital(req.getInstitution().getFirstName() + " " + req.getInstitution().getLastName());
            userRepo.save(doctor);
        }

        Notification n = new Notification();
        n.setRecipient(req.getInstitution());
        n.setTitle("Zahtev prihvaćen — Dr. " + doctor.getLastName());
        n.setMessage("Dr. " + doctor.getFirstName() + " " + doctor.getLastName()
                + " je prihvatio/la Vaš zahtev. Sada možete pratiti njihov rad.");
        n.setType("INSTITUTION_APPROVED");
        n.setIsRead(false);
        n.setCreatedAt(LocalDateTime.now());
        notifRepo.save(n);

        return ResponseEntity.ok(req);
    }

    // Doctor rejects institution request
    @PostMapping("/requests/{id}/reject")
    public ResponseEntity<InstitutionDoctorRequest> rejectRequest(@PathVariable Long id, Principal principal) {
        InstitutionDoctorRequest req = instRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Request not found"));
        req.setStatus("REJECTED");
        req.setRespondedAt(LocalDateTime.now());
        return ResponseEntity.ok(instRepo.save(req));
    }

    // Institution gets all its approved doctors with stats
    @GetMapping("/doctors")
    public ResponseEntity<List<Map<String, Object>>> getInstitutionDoctors(Principal principal) {
        User institution = userRepo.findByEmail(principal.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        List<Map<String, Object>> result = new ArrayList<>();
        instRepo.findByInstitutionAndStatus(institution, "APPROVED").forEach(idr -> {
            User doc = idr.getDoctor();
            Map<String, Object> entry = new HashMap<>();
            entry.put("id", doc.getId());
            entry.put("firstName", doc.getFirstName());
            entry.put("lastName", doc.getLastName());
            entry.put("email", doc.getEmail());
            entry.put("specialty", doc.getSpecialty());
            entry.put("hospital", doc.getHospital());
            entry.put("active", doc.getActive());
            entry.put("bannedUntil", doc.getBannedUntil());
            entry.put("warningCount", doc.getWarningCount());

            Double avg = ratingRepo.findAvgStarsByDoctor(doc);
            entry.put("avgStars", avg != null ? Math.round(avg * 10.0) / 10.0 : null);
            entry.put("ratingCount", ratingRepo.countByDoctor(doc));

            long reportCount = reportRepo.countByReportedUserAndReportType(doc, "PATIENT_REPORTS_DOCTOR");
            entry.put("reportCount", reportCount);

            result.add(entry);
        });
        return ResponseEntity.ok(result);
    }

    // Institution gets all doctors (to search and follow)
    @GetMapping("/all-doctors")
    public ResponseEntity<List<User>> getAllDoctors() {
        return ResponseEntity.ok(userRepo.findByRole(Role.DOCTOR));
    }

    // Institution gets pending follow requests it sent
    @GetMapping("/pending-requests")
    public ResponseEntity<List<InstitutionDoctorRequest>> getPendingRequests(Principal principal) {
        User institution = userRepo.findByEmail(principal.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return ResponseEntity.ok(instRepo.findByInstitutionOrderByRequestedAtDesc(institution));
    }

    // Institution dashboard stats
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats(Principal principal) {
        User institution = userRepo.findByEmail(principal.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        List<InstitutionDoctorRequest> approved = instRepo.findByInstitutionAndStatus(institution, "APPROVED");
        List<InstitutionDoctorRequest> pending = instRepo.findByInstitutionAndStatus(institution, "PENDING");

        long totalReports = approved.stream()
                .mapToLong(idr -> reportRepo.countByReportedUserAndReportType(idr.getDoctor(), "PATIENT_REPORTS_DOCTOR"))
                .sum();

        double totalAvg = approved.stream()
                .mapToDouble(idr -> {
                    Double avg = ratingRepo.findAvgStarsByDoctor(idr.getDoctor());
                    return avg != null ? avg : 0.0;
                })
                .average().orElse(0.0);

        Map<String, Object> stats = new HashMap<>();
        stats.put("doctorCount", approved.size());
        stats.put("pendingRequests", pending.size());
        stats.put("totalReports", totalReports);
        stats.put("avgRating", Math.round(totalAvg * 10.0) / 10.0);
        return ResponseEntity.ok(stats);
    }
}
