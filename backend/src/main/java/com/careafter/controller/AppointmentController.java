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
public class AppointmentController {

    private final AppointmentRepository apptRepo;
    private final PatientRepository patientRepo;
    private final UserRepository userRepo;
    private final NotificationRepository notifRepo;

    public AppointmentController(AppointmentRepository apptRepo,
                                  PatientRepository patientRepo,
                                  UserRepository userRepo,
                                  NotificationRepository notifRepo) {
        this.apptRepo = apptRepo;
        this.patientRepo = patientRepo;
        this.userRepo = userRepo;
        this.notifRepo = notifRepo;
    }

    @GetMapping("/api/patients/{patientId}/appointments")
    public ResponseEntity<List<Appointment>> getForPatient(@PathVariable Long patientId) {
        Patient patient = patientRepo.findById(patientId)
                .orElseThrow(() -> new IllegalArgumentException("Patient not found"));
        return ResponseEntity.ok(apptRepo.findByPatientOrderByAppointmentDateDesc(patient));
    }

    @PostMapping("/api/patients/{patientId}/appointments")
    public ResponseEntity<Appointment> createAppointment(
            @PathVariable Long patientId,
            @RequestBody Map<String, String> body,
            Principal principal) {

        Patient patient = patientRepo.findById(patientId)
                .orElseThrow(() -> new IllegalArgumentException("Patient not found"));
        User doctor = userRepo.findByEmail(principal.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Appointment appt = new Appointment();
        appt.setPatient(patient);
        appt.setScheduledBy(doctor);
        appt.setAppointmentType(body.getOrDefault("appointmentType", "Kontrolni pregled"));
        appt.setLocation(body.getOrDefault("location", ""));
        appt.setNote(body.get("note"));
        appt.setStatus("SCHEDULED");

        String dateStr = body.get("appointmentDate");
        if (dateStr != null) {
            appt.setAppointmentDate(LocalDateTime.parse(dateStr));
        }

        Appointment saved = apptRepo.save(appt);

        User patientUser = patient.getUser();
        String typeLabel = appt.getAppointmentType();
        String dateLabel = appt.getAppointmentDate() != null
                ? appt.getAppointmentDate().toLocalDate().toString() + " u "
                  + String.format("%02d:%02d", appt.getAppointmentDate().getHour(), appt.getAppointmentDate().getMinute())
                : "";

        // APPOINTMENT notification
        Notification apptNotif = new Notification();
        apptNotif.setRecipient(patientUser);
        apptNotif.setPatient(patient);
        apptNotif.setTitle("Zakazan pregled: " + typeLabel);
        apptNotif.setMessage(doctor.getFirstName() + " " + doctor.getLastName()
                + " zakazao/la je " + typeLabel + " za " + dateLabel
                + (appt.getLocation() != null && !appt.getLocation().isBlank() ? " · " + appt.getLocation() : "")
                + (appt.getNote() != null ? ". Napomena: " + appt.getNote() : ""));
        apptNotif.setType("APPOINTMENT");
        apptNotif.setIsRead(false);
        apptNotif.setCreatedAt(LocalDateTime.now());
        notifRepo.save(apptNotif);

        // REMINDER notification (day before reminder)
        Notification reminder = new Notification();
        reminder.setRecipient(patientUser);
        reminder.setPatient(patient);
        reminder.setTitle("Podsetnik: " + typeLabel + " sutra");
        reminder.setMessage("Ne zaboravite — " + typeLabel + " je zakazan za " + dateLabel
                + (appt.getLocation() != null && !appt.getLocation().isBlank() ? " na lokaciji: " + appt.getLocation() : "") + ".");
        reminder.setType("REMINDER");
        reminder.setIsRead(false);
        reminder.setCreatedAt(LocalDateTime.now());
        notifRepo.save(reminder);

        return ResponseEntity.ok(saved);
    }

    @PatchMapping("/api/appointments/{id}/cancel")
    public ResponseEntity<Appointment> cancelAppointment(@PathVariable Long id, Principal principal) {
        Appointment appt = apptRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Appointment not found"));
        appt.setStatus("CANCELLED");
        Appointment saved = apptRepo.save(appt);

        // Notify patient if doctor cancels, or doctor if patient cancels
        User actor = userRepo.findByEmail(principal.getName()).orElse(null);
        Patient patient = appt.getPatient();
        if (actor != null && patient != null) {
            boolean actorIsDoctor = actor.getRole() == Role.DOCTOR;
            User notifyUser = actorIsDoctor ? patient.getUser() : appt.getScheduledBy();
            if (notifyUser != null) {
                Notification n = new Notification();
                n.setRecipient(notifyUser);
                n.setPatient(patient);
                n.setTitle("Pregled otkazan: " + appt.getAppointmentType());
                n.setMessage((actorIsDoctor ? "Lekar " + actor.getFirstName() + " " + actor.getLastName()
                        : "Pacijent " + patient.getUser().getFirstName() + " " + patient.getUser().getLastName())
                        + " je otkazao/la pregled \"" + appt.getAppointmentType() + "\".");
                n.setType("APPOINTMENT");
                n.setIsRead(false);
                n.setCreatedAt(LocalDateTime.now());
                notifRepo.save(n);
            }
        }

        return ResponseEntity.ok(saved);
    }
}
