package com.careafter.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.careafter.model.DischargePlan;
import com.careafter.service.DischargePlanService;

@RestController
@RequestMapping("/api/patients")
public class DischargePlanController {

    private final DischargePlanService dischargePlanService;

    public DischargePlanController(DischargePlanService dischargePlanService) {
        this.dischargePlanService = dischargePlanService;
    }

    @GetMapping("/{patientId}/discharge-plans")
    public ResponseEntity<List<DischargePlan>> getDischargePlansForPatient(@PathVariable Long patientId) {
        return ResponseEntity.ok(dischargePlanService.getDischargePlansForPatient(patientId));
    }
}
