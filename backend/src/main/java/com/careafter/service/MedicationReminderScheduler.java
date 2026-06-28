package com.careafter.service;

import com.careafter.model.*;
import com.careafter.repository.*;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Component
public class MedicationReminderScheduler {

    private final PatientRepository patientRepo;
    private final DischargePlanRepository planRepo;
    private final NotificationRepository notifRepo;

    public MedicationReminderScheduler(PatientRepository patientRepo,
                                       DischargePlanRepository planRepo,
                                       NotificationRepository notifRepo) {
        this.patientRepo = patientRepo;
        this.planRepo    = planRepo;
        this.notifRepo   = notifRepo;
    }

    /** Runs every day at 08:00. Creates a medication reminder for each patient who has medications. */
    @Scheduled(cron = "0 0 8 * * *")
    @Transactional
    public void sendDailyReminders() {
        sendRemindersNow();
    }

    /** Public so it can be called on startup (seeding) and from tests. */
    @Transactional
    public void sendRemindersNow() {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay   = startOfDay.plusDays(1).minusNanos(1);

        List<Patient> patients = patientRepo.findAll();
        for (Patient patient : patients) {
            User user = patient.getUser();
            if (user == null) continue;

            List<DischargePlan> plans = planRepo.findByPatient(patient);
            if (plans.isEmpty() || plans.get(0).getMedications() == null || plans.get(0).getMedications().isEmpty()) continue;

            // Check if a reminder was already sent today
            List<Notification> existing = notifRepo.findByRecipientAndTypeAndCreatedAtBetween(
                    user, "MEDICATION_REMINDER", startOfDay, endOfDay);
            if (!existing.isEmpty()) continue;

            int medCount = plans.get(0).getMedications().size();
            Notification n = new Notification();
            n.setRecipient(user);
            n.setPatient(patient);
            n.setTitle("💊 Podsetnik za terapiju");
            n.setMessage("Vreme je za vašu dnevnu terapiju. Imate " + medCount + " " +
                         (medCount == 1 ? "lek" : medCount < 5 ? "leka" : "lekova") +
                         " za danas. Otvorite Plan oporavka → Danas i obeležite šta ste uzeli.");
            n.setType("MEDICATION_REMINDER");
            n.setIsRead(false);
            n.setCreatedAt(LocalDateTime.now());
            notifRepo.save(n);
        }
    }
}
