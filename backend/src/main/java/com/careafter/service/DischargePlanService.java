package com.careafter.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.careafter.model.DischargePlan;
import com.careafter.model.Patient;
import com.careafter.repository.DischargePlanRepository;
import com.careafter.repository.PatientRepository;

@Service
public class DischargePlanService {

    private final DischargePlanRepository dischargePlanRepository;
    private final PatientRepository patientRepository;

    public DischargePlanService(DischargePlanRepository dischargePlanRepository, PatientRepository patientRepository) {
        this.dischargePlanRepository = dischargePlanRepository;
        this.patientRepository = patientRepository;
    }

    public List<DischargePlan> getDischargePlansForPatient(Long patientId) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new IllegalArgumentException("Patient not found"));
        return dischargePlanRepository.findByPatient(patient);
    }
}
