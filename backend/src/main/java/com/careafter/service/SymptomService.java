package com.careafter.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;

import com.careafter.model.Alert;
import com.careafter.model.AlertStatus;
import com.careafter.model.Patient;
import com.careafter.model.RiskLevel;
import com.careafter.model.SymptomCheckin;
import com.careafter.repository.AlertRepository;
import com.careafter.repository.PatientRepository;
import com.careafter.repository.SymptomCheckinRepository;

@Service
public class SymptomService {

    private final SymptomCheckinRepository symptomCheckinRepository;
    private final AlertRepository alertRepository;
    private final PatientRepository patientRepository;

    public SymptomService(SymptomCheckinRepository symptomCheckinRepository,
                          AlertRepository alertRepository,
                          PatientRepository patientRepository) {
        this.symptomCheckinRepository = symptomCheckinRepository;
        this.alertRepository = alertRepository;
        this.patientRepository = patientRepository;
    }

    public SymptomCheckin createCheckin(Long patientId, SymptomCheckin checkin) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new IllegalArgumentException("Patient not found"));

        checkin.setPatient(patient);
        checkin.setCreatedAt(LocalDateTime.now());
        checkin.setRiskLevel(evaluateRisk(checkin));

        SymptomCheckin saved = symptomCheckinRepository.save(checkin);

        if (saved.getRiskLevel() == RiskLevel.YELLOW || saved.getRiskLevel() == RiskLevel.RED) {
            Alert alert = new Alert();
            alert.setPatient(patient);
            alert.setSymptomCheckin(saved);
            alert.setAlertType("SYMPTOM_RISK");
            alert.setMessage("Pacijent je uneo simptome sa rizikom " + saved.getRiskLevel());
            alert.setStatus(AlertStatus.NEW);
            alert.setCreatedAt(LocalDateTime.now());
            alertRepository.save(alert);
        }

        return saved;
    }

    public List<Alert> getActiveAlerts() {
        return alertRepository.findByStatus(AlertStatus.NEW);
    }

    public Alert resolveAlert(Long alertId) {
        Alert alert = alertRepository.findById(alertId)
                .orElseThrow(() -> new IllegalArgumentException("Alert not found"));
        alert.setStatus(AlertStatus.RESOLVED);
        alert.setResolvedAt(LocalDateTime.now());
        return alertRepository.save(alert);
    }

    private RiskLevel evaluateRisk(SymptomCheckin checkin) {
        if (checkin.getTemperature() != null && checkin.getTemperature() >= 38.5) {
            return RiskLevel.RED;
        }
        if (checkin.getPainLevel() != null && checkin.getPainLevel() >= 8) {
            return RiskLevel.RED;
        }
        if (Boolean.TRUE.equals(checkin.getBleeding()) || Boolean.TRUE.equals(checkin.getBreathingProblem())) {
            return RiskLevel.RED;
        }
        if (checkin.getTemperature() != null && checkin.getTemperature() >= 37.5) {
            return RiskLevel.YELLOW;
        }
        if (checkin.getPainLevel() != null && checkin.getPainLevel() >= 5) {
            return RiskLevel.YELLOW;
        }
        return RiskLevel.GREEN;
    }
}
