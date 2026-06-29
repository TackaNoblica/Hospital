package com.careafter.controller;

import com.careafter.model.*;
import com.careafter.repository.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportRepository reportRepo;
    private final UserRepository userRepo;
    private final NotificationRepository notifRepo;
    private final InstitutionDoctorRequestRepository instRepo;

    public ReportController(ReportRepository reportRepo,
                            UserRepository userRepo,
                            NotificationRepository notifRepo,
                            InstitutionDoctorRequestRepository instRepo) {
        this.reportRepo = reportRepo;
        this.userRepo = userRepo;
        this.notifRepo = notifRepo;
        this.instRepo = instRepo;
    }

    @PostMapping
    public ResponseEntity<Report> createReport(@RequestBody Map<String, String> body, Principal principal) {
        User reporter = userRepo.findByEmail(principal.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Long reportedId = Long.parseLong(body.get("reportedUserId"));
        User reported = userRepo.findById(reportedId)
                .orElseThrow(() -> new IllegalArgumentException("Reported user not found"));

        String reportType = body.get("reportType");
        String reason = body.getOrDefault("reason", "");

        Report report = new Report();
        report.setReporter(reporter);
        report.setReportedUser(reported);
        report.setReportType(reportType);
        report.setReason(reason);
        report.setStatus("PENDING");
        report.setCreatedAt(LocalDateTime.now());
        Report saved = reportRepo.save(report);

        // Notify all institutions that follow this doctor (if PATIENT_REPORTS_DOCTOR)
        if ("PATIENT_REPORTS_DOCTOR".equals(reportType)) {
            instRepo.findByDoctorAndStatus(reported, "APPROVED").forEach(idr -> {
                Notification n = new Notification();
                n.setRecipient(idr.getInstitution());
                n.setTitle("Prijavljen lekar: " + reported.getFirstName() + " " + reported.getLastName());
                n.setMessage("Pacijent " + reporter.getFirstName() + " " + reporter.getLastName()
                        + " je prijavio lekara " + reported.getFirstName() + " " + reported.getLastName()
                        + ". Razlog: " + reason);
                n.setType("REPORT");
                n.setIsRead(false);
                n.setCreatedAt(LocalDateTime.now());
                n.setRelatedUserId(saved.getId());
                notifRepo.save(n);
            });
        }

        return ResponseEntity.ok(saved);
    }

    @GetMapping("/for-doctor/{doctorId}")
    public ResponseEntity<List<Report>> getDoctorReports(@PathVariable Long doctorId) {
        User doctor = userRepo.findById(doctorId)
                .orElseThrow(() -> new IllegalArgumentException("Doctor not found"));
        return ResponseEntity.ok(
                reportRepo.findByReportTypeAndReportedUserOrderByCreatedAtDesc("PATIENT_REPORTS_DOCTOR", doctor));
    }

    @GetMapping("/on-patient/{patientUserId}")
    public ResponseEntity<List<Report>> getPatientReports(@PathVariable Long patientUserId) {
        User patient = userRepo.findById(patientUserId)
                .orElseThrow(() -> new IllegalArgumentException("Patient not found"));
        return ResponseEntity.ok(
                reportRepo.findByReportTypeAndReportedUserOrderByCreatedAtDesc("DOCTOR_REPORTS_PATIENT", patient));
    }

    @GetMapping("/institution")
    public ResponseEntity<List<Report>> getInstitutionReports(Principal principal) {
        User institution = userRepo.findByEmail(principal.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        List<User> doctors = instRepo.findByInstitutionAndStatus(institution, "APPROVED")
                .stream().map(InstitutionDoctorRequest::getDoctor).toList();
        if (doctors.isEmpty()) return ResponseEntity.ok(List.of());
        return ResponseEntity.ok(
                reportRepo.findAll().stream()
                        .filter(r -> "PATIENT_REPORTS_DOCTOR".equals(r.getReportType())
                                && doctors.contains(r.getReportedUser()))
                        .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                        .toList());
    }

    @PostMapping("/{id}/warn")
    public ResponseEntity<Report> sendWarning(@PathVariable Long id, Principal principal) {
        Report report = reportRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Report not found"));
        User reported = report.getReportedUser();

        report.setStatus("WARNING_SENT");
        report.setResolvedAt(LocalDateTime.now());
        reportRepo.save(report);

        reported.setWarningCount((reported.getWarningCount() == null ? 0 : reported.getWarningCount()) + 1);
        userRepo.save(reported);

        Notification n = new Notification();
        n.setRecipient(reported);
        n.setTitle("Upozorenje od zdravstvene ustanove");
        n.setMessage("Primili ste upozorenje od zdravstvene ustanove u vezi sa prijavom pacijenta. "
                + "Ukupan broj upozorenja: " + reported.getWarningCount()
                + ". Molimo Vas da poboljšate komunikaciju sa pacijentima.");
        n.setType("WARNING");
        n.setIsRead(false);
        n.setCreatedAt(LocalDateTime.now());
        notifRepo.save(n);

        return ResponseEntity.ok(report);
    }

    @PostMapping("/{id}/ban")
    public ResponseEntity<Report> banDoctor(@PathVariable Long id,
                                            @RequestBody Map<String, Object> body,
                                            Principal principal) {
        Report report = reportRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Report not found"));
        User reported = report.getReportedUser();

        int days = body.containsKey("days") ? Integer.parseInt(body.get("days").toString()) : 30;

        report.setStatus("BANNED");
        report.setResolvedAt(LocalDateTime.now());
        reportRepo.save(report);

        reported.setBannedUntil(LocalDateTime.now().plusDays(days));
        userRepo.save(reported);

        Notification n = new Notification();
        n.setRecipient(reported);
        n.setTitle("Profil privremeno zabranjen");
        n.setMessage("Vaš profil je privremeno zabranjen na " + days + " dana zbog ponavljajućih prijava od strane pacijenata. "
                + "Zabrana ističe: " + reported.getBannedUntil().toLocalDate() + ".");
        n.setType("BAN");
        n.setIsRead(false);
        n.setCreatedAt(LocalDateTime.now());
        notifRepo.save(n);

        return ResponseEntity.ok(report);
    }
}
