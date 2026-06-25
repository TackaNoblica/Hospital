package com.careafter.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.careafter.model.Alert;
import com.careafter.model.SymptomCheckin;
import com.careafter.service.SymptomService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api")
@Validated
public class SymptomController {

    private final SymptomService symptomService;

    public SymptomController(SymptomService symptomService) {
        this.symptomService = symptomService;
    }

    @PostMapping("/symptom-checkins/patient/{patientId}")
    public ResponseEntity<SymptomCheckin> createSymptomCheckin(
            @PathVariable Long patientId,
            @Valid @RequestBody SymptomCheckin checkin) {
        return ResponseEntity.ok(symptomService.createCheckin(patientId, checkin));
    }

    @GetMapping("/alerts")
    public ResponseEntity<List<Alert>> getAlerts() {
        return ResponseEntity.ok(symptomService.getActiveAlerts());
    }

    @PatchMapping("/alerts/{alertId}/resolve")
    public ResponseEntity<Alert> resolveAlert(@PathVariable Long alertId) {
        return ResponseEntity.ok(symptomService.resolveAlert(alertId));
    }
}
