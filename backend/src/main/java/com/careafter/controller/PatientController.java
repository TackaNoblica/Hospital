package com.careafter.controller;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;

import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


import com.careafter.model.Appointment;
import com.careafter.model.DischargePlan;
import com.careafter.model.Notification;
import com.careafter.model.Patient;
import com.careafter.model.SymptomCheckin;
import com.careafter.model.User;
import com.careafter.repository.NotificationRepository;
import com.careafter.service.AppointmentService;
import com.careafter.service.DischargePlanService;
import com.careafter.service.PatientService;


@RestController
@RequestMapping("/api")
public class PatientController {

    private final PatientService patientService;
    private final AppointmentService appointmentService;
    private final DischargePlanService dischargePlanService;
    private final NotificationRepository notifRepo;

    public PatientController(PatientService patientService,
                             AppointmentService appointmentService,
                             DischargePlanService dischargePlanService,
                             NotificationRepository notifRepo) {
        this.patientService = patientService;
        this.appointmentService = appointmentService;
        this.dischargePlanService = dischargePlanService;
        this.notifRepo = notifRepo;
    }

    @GetMapping("/patients/me")
    public ResponseEntity<Patient> getCurrentPatient(Principal principal) {
        return ResponseEntity.ok(patientService.getPatientForPrincipal(principal));
    }

    @GetMapping("/patients/me/checkins")
    public ResponseEntity<List<SymptomCheckin>> getCurrentPatientCheckins(Principal principal) {
        Patient patient = patientService.getPatientForPrincipal(principal);
        return ResponseEntity.ok(patientService.getCheckinsForPatient(patient.getId()));
    }

    @GetMapping("/patients/me/appointments")
    public ResponseEntity<List<Appointment>> getCurrentPatientAppointments(Principal principal) {
        Patient patient = patientService.getPatientForPrincipal(principal);
        return ResponseEntity.ok(appointmentService.getAppointmentsForPatient(patient.getId()));
    }

    @GetMapping("/patients/me/discharge-plans")
    public ResponseEntity<List<DischargePlan>> getCurrentPatientDischargePlans(Principal principal) {
        Patient patient = patientService.getPatientForPrincipal(principal);
        return ResponseEntity.ok(dischargePlanService.getDischargePlansForPatient(patient.getId()));
    }

    @GetMapping("/patients/doctor")
    public ResponseEntity<List<Patient>> getPatientsForDoctor(Principal principal) {
        return ResponseEntity.ok(patientService.getPatientsForDoctor(principal.getName()));
    }

    @GetMapping("/patients/{patientId}/checkins")
    public ResponseEntity<List<SymptomCheckin>> getPatientCheckins(@PathVariable Long patientId) {
        return ResponseEntity.ok(patientService.getCheckinsForPatient(patientId));
    }

    @GetMapping("/doctors")
    public ResponseEntity<List<User>> getAllDoctors() {
        return ResponseEntity.ok(patientService.getAllDoctors());
    }

    /** Doctor: close or reopen a patient's illness */
    @PatchMapping("/patients/{id}/diagnosis-status")
    public ResponseEntity<Patient> updateDiagnosisStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            Principal principal) {
        String status = body.get("status");
        Patient updated = patientService.updateDiagnosisStatus(id, status);

        if ("RESOLVED".equals(status)) {
            User assignedDoctor = updated.getAssignedDoctor();
            User patientUser = updated.getUser();
            if (assignedDoctor != null && patientUser != null) {
                Notification n = new Notification();
                n.setRecipient(patientUser);
                n.setPatient(updated);
                n.setTitle("Ocenite lekara: Dr. " + assignedDoctor.getFirstName() + " " + assignedDoctor.getLastName());
                n.setMessage("Vaš karton je zatvoren. Kako biste ocenili Dr. " + assignedDoctor.getFirstName()
                        + " " + assignedDoctor.getLastName() + "? Vaša ocena pomaže drugim pacijentima.");
                n.setType("RATE_DOCTOR");
                n.setIsRead(false);
                n.setCreatedAt(LocalDateTime.now());
                n.setRelatedUserId(assignedDoctor.getId());
                notifRepo.save(n);
            }
        }

        return ResponseEntity.ok(updated);
    }

}
