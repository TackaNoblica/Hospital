package com.careafter.controller;

import java.security.Principal;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.careafter.model.Patient;
import com.careafter.model.SymptomCheckin;
import com.careafter.service.PatientService;

@RestController
@RequestMapping("/api")
public class PatientController {

    private final PatientService patientService;

    public PatientController(PatientService patientService) {
        this.patientService = patientService;
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

    @GetMapping("/patients/doctor")
    public ResponseEntity<List<Patient>> getPatientsForDoctor(Principal principal) {
        return ResponseEntity.ok(patientService.getPatientsForDoctor(principal.getName()));
    }

    @GetMapping("/patients/{patientId}/checkins")
    public ResponseEntity<List<SymptomCheckin>> getPatientCheckins(@PathVariable Long patientId) {
        return ResponseEntity.ok(patientService.getCheckinsForPatient(patientId));
    }
}
