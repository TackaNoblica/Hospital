package com.careafter.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;

import com.careafter.model.Alert;
import com.careafter.model.AlertStatus;
import com.careafter.model.Notification;
import com.careafter.model.Patient;
import com.careafter.model.RiskLevel;
import com.careafter.model.SymptomCheckin;
import com.careafter.repository.AlertRepository;
import com.careafter.repository.NotificationRepository;
import com.careafter.repository.PatientRepository;
import com.careafter.repository.SymptomCheckinRepository;

@Service
public class SymptomService {

    private final SymptomCheckinRepository symptomCheckinRepository;
    private final AlertRepository alertRepository;
    private final PatientRepository patientRepository;
    private final NotificationRepository notificationRepository;

    public SymptomService(SymptomCheckinRepository symptomCheckinRepository,
                          AlertRepository alertRepository,
                          PatientRepository patientRepository,
                          NotificationRepository notificationRepository) {
        this.symptomCheckinRepository = symptomCheckinRepository;
        this.alertRepository = alertRepository;
        this.patientRepository = patientRepository;
        this.notificationRepository = notificationRepository;
    }

    public SymptomCheckin createCheckin(Long patientId, SymptomCheckin checkin) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new IllegalArgumentException("Patient not found"));

        checkin.setPatient(patient);
        checkin.setCreatedAt(LocalDateTime.now());
        checkin.setRiskLevel(evaluateRisk(checkin));

        SymptomCheckin saved = symptomCheckinRepository.save(checkin);

        // Keep alert for backward compat with seed data
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

        // Notify assigned doctor for every checkin
        if (patient.getAssignedDoctor() != null) {
            String patName = patient.getUser().getFirstName() + " " + patient.getUser().getLastName();
            Notification notif = new Notification();
            notif.setRecipient(patient.getAssignedDoctor());
            notif.setPatient(patient);
            notif.setCreatedAt(LocalDateTime.now());
            notif.setIsRead(false);

            if (saved.getRiskLevel() == RiskLevel.RED) {
                notif.setType("ALARM_CHECKIN");
                notif.setTitle("🚨 ALARM — " + patName);
                notif.setMessage(buildAlarmMsg(saved));
            } else if (saved.getRiskLevel() == RiskLevel.YELLOW) {
                notif.setType("WARN_CHECKIN");
                notif.setTitle("⚠️ Upozorenje — " + patName);
                notif.setMessage(buildWarnMsg(saved));
            } else {
                notif.setType("INFO_CHECKIN");
                notif.setTitle("Pacijent " + patName + " je obavio dnevni dekurzus");
                notif.setMessage(buildInfoMsg(saved));
            }
            notificationRepository.save(notif);
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
        // SpO2 < 92% = critical hypoxemia
        if (checkin.getSpO2() != null && checkin.getSpO2() < 92.0) {
            return RiskLevel.RED;
        }
        // Hemoptysis = always RED
        if ("BLOODY".equals(checkin.getSputumColor())) {
            return RiskLevel.RED;
        }
        // Severe dyspnea mMRC 3-4
        if (checkin.getDyspneaLevel() != null && checkin.getDyspneaLevel() >= 3) {
            return RiskLevel.RED;
        }
        if (checkin.getTemperature() != null && checkin.getTemperature() >= 38.5) {
            return RiskLevel.RED;
        }
        if (checkin.getPainLevel() != null && checkin.getPainLevel() >= 8) {
            return RiskLevel.RED;
        }
        if (Boolean.TRUE.equals(checkin.getBleeding())) {
            return RiskLevel.RED;
        }
        // SpO2 < 95% = moderate hypoxemia
        if (checkin.getSpO2() != null && checkin.getSpO2() < 95.0) {
            return RiskLevel.YELLOW;
        }
        // mMRC 2 = moderate dyspnea
        if (checkin.getDyspneaLevel() != null && checkin.getDyspneaLevel() >= 2) {
            return RiskLevel.YELLOW;
        }
        if (Boolean.TRUE.equals(checkin.getBreathingProblem())) {
            return RiskLevel.YELLOW;
        }
        if (checkin.getTemperature() != null && checkin.getTemperature() >= 37.5) {
            return RiskLevel.YELLOW;
        }
        if (checkin.getPainLevel() != null && checkin.getPainLevel() >= 5) {
            return RiskLevel.YELLOW;
        }
        if (Boolean.TRUE.equals(checkin.getGeneralWorsening())) {
            return RiskLevel.YELLOW;
        }
        return RiskLevel.GREEN;
    }

    private String buildAlarmMsg(SymptomCheckin c) {
        StringBuilder sb = new StringBuilder("Kritičan dekurzus —");
        if (c.getSpO2() != null && c.getSpO2() < 92) sb.append(" SpO₂ ").append(c.getSpO2()).append("% (kritično);");
        if ("BLOODY".equals(c.getSputumColor()))      sb.append(" hemoptiza;");
        if (c.getDyspneaLevel() != null && c.getDyspneaLevel() >= 3) sb.append(" dispneja mMRC ").append(c.getDyspneaLevel()).append(";");
        if (c.getTemperature() != null && c.getTemperature() >= 38.5) sb.append(" T ").append(c.getTemperature()).append("°C;");
        if (Boolean.TRUE.equals(c.getBleeding()))     sb.append(" krvarenje;");
        return sb.toString().replaceAll(";$", ".");
    }

    private String buildWarnMsg(SymptomCheckin c) {
        StringBuilder sb = new StringBuilder("Povišene vrednosti —");
        if (c.getSpO2() != null && c.getSpO2() < 95) sb.append(" SpO₂ ").append(c.getSpO2()).append("%;");
        if (c.getDyspneaLevel() != null && c.getDyspneaLevel() >= 2) sb.append(" dispneja mMRC ").append(c.getDyspneaLevel()).append(";");
        if (c.getTemperature() != null && c.getTemperature() >= 37.5) sb.append(" T ").append(c.getTemperature()).append("°C;");
        if (Boolean.TRUE.equals(c.getBreathingProblem())) sb.append(" otežano disanje;");
        if (Boolean.TRUE.equals(c.getGeneralWorsening())) sb.append(" opšte pogoršanje;");
        return sb.toString().replaceAll(";$", ".");
    }

    private String buildInfoMsg(SymptomCheckin c) {
        StringBuilder sb = new StringBuilder("Parametri u redu.");
        if (c.getTemperature() != null) sb.append(" T ").append(c.getTemperature()).append("°C.");
        if (c.getSpO2() != null)        sb.append(" SpO₂ ").append(c.getSpO2()).append("%.");
        if (c.getWellbeingScore() != null) sb.append(" Osecanje: ").append(c.getWellbeingScore()).append("/5.");
        return sb.toString();
    }
}
