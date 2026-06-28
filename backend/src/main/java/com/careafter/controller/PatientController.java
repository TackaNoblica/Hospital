package com.careafter.controller;

import java.security.Principal;
import java.util.List;

import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


import com.careafter.model.Appointment;
import com.careafter.model.DischargePlan;
import com.careafter.model.Patient;
import com.careafter.model.SymptomCheckin;
import com.careafter.model.User;
import com.careafter.service.AppointmentService;
import com.careafter.service.DischargePlanService;
import com.careafter.service.PatientService;


@RestController
@RequestMapping("/api")
public class PatientController {

    private final PatientService patientService;
    private final AppointmentService appointmentService;
    private final DischargePlanService dischargePlanService;

    public PatientController(PatientService patientService,
                             AppointmentService appointmentService,
                             DischargePlanService dischargePlanService) {
        this.patientService = patientService;
        this.appointmentService = appointmentService;
        this.dischargePlanService = dischargePlanService;
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
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(patientService.updateDiagnosisStatus(id, body.get("status")));
    }

}
