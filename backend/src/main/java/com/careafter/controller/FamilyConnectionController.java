package com.careafter.controller;

import java.security.Principal;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.careafter.model.FamilyConnection;
import com.careafter.model.Patient;
import com.careafter.model.User;
import com.careafter.repository.FamilyConnectionRepository;
import com.careafter.repository.PatientRepository;
import com.careafter.repository.UserRepository;
import com.careafter.service.FamilyConnectionService;

@RestController
@RequestMapping("/api")
public class FamilyConnectionController {

    private final FamilyConnectionService familyConnectionService;
    private final FamilyConnectionRepository familyConnectionRepo;
    private final PatientRepository patientRepo;
    private final UserRepository userRepo;

    public FamilyConnectionController(FamilyConnectionService familyConnectionService,
                                      FamilyConnectionRepository familyConnectionRepo,
                                      PatientRepository patientRepo,
                                      UserRepository userRepo) {
        this.familyConnectionService = familyConnectionService;
        this.familyConnectionRepo    = familyConnectionRepo;
        this.patientRepo             = patientRepo;
        this.userRepo                = userRepo;
    }

    @GetMapping("/patients/{patientId}/family-connections")
    public ResponseEntity<List<FamilyConnection>> getConnectionsForPatient(@PathVariable Long patientId) {
        return ResponseEntity.ok(familyConnectionService.getConnectionsForPatient(patientId));
    }

    @GetMapping("/family-connections/me")
    public ResponseEntity<List<FamilyConnection>> getConnectionsForCurrentFamilyMember(Principal principal) {
        return ResponseEntity.ok(familyConnectionService.getConnectionsForFamilyMember(principal.getName()));
    }

    /** Patient: view their own family connections */
    @GetMapping("/family-connections/my-family")
    public ResponseEntity<List<FamilyConnection>> getMyFamilyConnections(Principal principal) {
        User user = userRepo.findByEmail(principal.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Patient patient = patientRepo.findByUser(user)
                .orElseThrow(() -> new IllegalArgumentException("Patient not found"));
        return ResponseEntity.ok(familyConnectionRepo.findByPatient(patient));
    }

    /** Patient: toggle consent for a family member */
    @PatchMapping("/family-connections/{id}/consent")
    public ResponseEntity<FamilyConnection> toggleConsent(@PathVariable Long id,
                                                          @RequestBody Map<String, Boolean> body,
                                                          Principal principal) {
        FamilyConnection conn = familyConnectionRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Connection not found"));

        // Verify caller is the patient of this connection
        User user = userRepo.findByEmail(principal.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Patient patient = patientRepo.findByUser(user)
                .orElseThrow(() -> new IllegalArgumentException("Patient not found"));
        if (!conn.getPatient().getId().equals(patient.getId())) {
            return ResponseEntity.status(403).build();
        }

        conn.setConsentGiven(body.getOrDefault("consentGiven", conn.getConsentGiven()));
        return ResponseEntity.ok(familyConnectionRepo.save(conn));
    }
}
