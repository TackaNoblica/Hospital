package com.careafter.controller;

import com.careafter.model.*;
import com.careafter.repository.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/medications")
public class MedicationController {

    private final PatientRepository patientRepo;
    private final MedicationRepository medicationRepo;
    private final MedicationLogRepository logRepo;
    private final UserRepository userRepo;
    private final DischargePlanRepository planRepo;

    public MedicationController(PatientRepository patientRepo,
                                MedicationRepository medicationRepo,
                                MedicationLogRepository logRepo,
                                UserRepository userRepo,
                                DischargePlanRepository planRepo) {
        this.patientRepo   = patientRepo;
        this.medicationRepo = medicationRepo;
        this.logRepo       = logRepo;
        this.userRepo      = userRepo;
        this.planRepo      = planRepo;
    }

    /** Patient: today's medications with taken status */
    @GetMapping("/today")
    public ResponseEntity<List<Map<String, Object>>> getTodayMeds(Principal principal) {
        User user = userRepo.findByEmail(principal.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Patient patient = patientRepo.findByUser(user)
                .orElseThrow(() -> new IllegalArgumentException("Patient not found"));

        List<DischargePlan> plans = planRepo.findByPatient(patient);
        if (plans.isEmpty()) return ResponseEntity.ok(List.of());

        DischargePlan plan = plans.get(0);
        LocalDate today = LocalDate.now();

        List<Map<String, Object>> result = new ArrayList<>();
        for (Medication med : plan.getMedications()) {
            Optional<MedicationLog> log = logRepo.findByPatientAndMedicationAndScheduledDate(patient, med, today);
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("medicationId",   med.getId());
            entry.put("medicationName", med.getMedicationName());
            entry.put("dosage",         med.getDosage());
            entry.put("frequency",      med.getFrequency());
            entry.put("instructions",   med.getInstructions());
            entry.put("taken",          log.map(MedicationLog::isTaken).orElse(false));
            entry.put("takenAt",        log.map(MedicationLog::getTakenAt).orElse(null));
            entry.put("logId",          log.map(MedicationLog::getId).orElse(null));
            result.add(entry);
        }
        return ResponseEntity.ok(result);
    }

    /** Patient: mark medication as taken today */
    @PostMapping("/{medicationId}/take")
    public ResponseEntity<Map<String, Object>> takeMedication(@PathVariable Long medicationId, Principal principal) {
        User user = userRepo.findByEmail(principal.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Patient patient = patientRepo.findByUser(user)
                .orElseThrow(() -> new IllegalArgumentException("Patient not found"));
        Medication med = medicationRepo.findById(medicationId)
                .orElseThrow(() -> new IllegalArgumentException("Medication not found"));

        LocalDate today = LocalDate.now();
        MedicationLog log = logRepo.findByPatientAndMedicationAndScheduledDate(patient, med, today)
                .orElseGet(() -> {
                    MedicationLog l = new MedicationLog();
                    l.setPatient(patient);
                    l.setMedication(med);
                    l.setScheduledDate(today);
                    return l;
                });

        log.setTaken(true);
        log.setTakenAt(LocalDateTime.now());
        logRepo.save(log);

        return ResponseEntity.ok(Map.of("taken", true, "takenAt", log.getTakenAt().toString()));
    }

    /** Doctor: adherence summary for all their assigned patients (for distribution chart) */
    @GetMapping("/adherence-summary")
    public ResponseEntity<List<Map<String, Object>>> getAdherenceSummary(Principal principal) {
        User doctor = userRepo.findByEmail(principal.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        List<Patient> patients = patientRepo.findByAssignedDoctor(doctor);

        LocalDate from = LocalDate.now().minusDays(29);
        LocalDate to   = LocalDate.now();

        List<Map<String, Object>> result = new ArrayList<>();
        for (Patient patient : patients) {
            List<DischargePlan> plans = planRepo.findByPatient(patient);
            if (plans.isEmpty()) continue;
            int totalMeds = plans.get(0).getMedications().size();
            if (totalMeds == 0) continue;

            List<MedicationLog> logs = logRepo.findByPatientAndScheduledDateBetweenOrderByScheduledDateAsc(patient, from, to);
            long totalScheduled = (long) totalMeds * 30;
            long totalTaken = logs.stream().filter(MedicationLog::isTaken).count();
            int pct = totalScheduled == 0 ? 0 : (int) (totalTaken * 100 / totalScheduled);

            Map<String, Object> m = new LinkedHashMap<>();
            m.put("patientId", patient.getId());
            m.put("patientName", patient.getUser().getFirstName() + " " + patient.getUser().getLastName());
            m.put("adherencePct", pct);
            result.add(m);
        }
        return ResponseEntity.ok(result);
    }

    /** Doctor: medication adherence for a patient over last 30 days */
    @GetMapping("/adherence/{patientId}")
    public ResponseEntity<Map<String, Object>> getAdherence(@PathVariable Long patientId) {
        Patient patient = patientRepo.findById(patientId)
                .orElseThrow(() -> new IllegalArgumentException("Patient not found"));

        List<DischargePlan> plans = planRepo.findByPatient(patient);
        if (plans.isEmpty()) return ResponseEntity.ok(Map.of("totalMeds", 0, "logs", List.of()));

        DischargePlan plan = plans.get(0);
        int totalMeds = plan.getMedications().size();

        LocalDate from = LocalDate.now().minusDays(29);
        LocalDate to   = LocalDate.now();

        List<MedicationLog> logs = logRepo.findByPatientAndScheduledDateBetweenOrderByScheduledDateAsc(patient, from, to);

        // Build daily summary
        Map<LocalDate, long[]> byDay = new LinkedHashMap<>();
        for (LocalDate d = from; !d.isAfter(to); d = d.plusDays(1)) {
            byDay.put(d, new long[]{0, 0}); // [taken, total]
        }
        // Per-day expected = totalMeds
        byDay.forEach((d, arr) -> arr[1] = totalMeds);
        logs.forEach(l -> {
            long[] arr = byDay.get(l.getScheduledDate());
            if (arr != null && l.isTaken()) arr[0]++;
        });

        List<Map<String, Object>> daily = byDay.entrySet().stream().map(e -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("date",   e.getKey().toString());
            m.put("taken",  e.getValue()[0]);
            m.put("total",  e.getValue()[1]);
            return m;
        }).collect(Collectors.toList());

        long totalScheduled = (long) totalMeds * 30;
        long totalTaken = logs.stream().filter(MedicationLog::isTaken).count();
        int adherencePct = totalScheduled == 0 ? 0 : (int) (totalTaken * 100 / totalScheduled);

        return ResponseEntity.ok(Map.of(
                "totalMeds",    totalMeds,
                "adherencePct", adherencePct,
                "daily",        daily,
                "logs",         logs
        ));
    }
}
