package com.careafter.controller;

import java.security.Principal;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.careafter.model.FamilyConnection;
import com.careafter.service.FamilyConnectionService;

@RestController
@RequestMapping("/api")
public class FamilyConnectionController {

    private final FamilyConnectionService familyConnectionService;

    public FamilyConnectionController(FamilyConnectionService familyConnectionService) {
        this.familyConnectionService = familyConnectionService;
    }

    @GetMapping("/patients/{patientId}/family-connections")
    public ResponseEntity<List<FamilyConnection>> getConnectionsForPatient(@PathVariable Long patientId) {
        return ResponseEntity.ok(familyConnectionService.getConnectionsForPatient(patientId));
    }

    @GetMapping("/family-connections/me")
    public ResponseEntity<List<FamilyConnection>> getConnectionsForCurrentFamilyMember(Principal principal) {
        return ResponseEntity.ok(familyConnectionService.getConnectionsForFamilyMember(principal.getName()));
    }
}
