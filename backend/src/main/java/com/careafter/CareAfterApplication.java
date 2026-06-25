package com.careafter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import com.careafter.model.Alert;
import com.careafter.model.AlertStatus;
import com.careafter.model.AuditLog;
import com.careafter.model.Appointment;
import com.careafter.model.DischargePlan;
import com.careafter.model.FamilyConnection;
import com.careafter.model.Medication;
import com.careafter.model.Notification;
import com.careafter.model.Patient;
import com.careafter.model.RiskLevel;
import com.careafter.model.Role;
import com.careafter.model.SymptomCheckin;
import com.careafter.model.User;
import com.careafter.repository.AlertRepository;
import com.careafter.repository.AuditLogRepository;
import com.careafter.repository.AppointmentRepository;
import com.careafter.repository.DischargePlanRepository;
import com.careafter.repository.FamilyConnectionRepository;
import com.careafter.repository.MedicationRepository;
import com.careafter.repository.NotificationRepository;
import com.careafter.repository.PatientRepository;
import com.careafter.repository.SymptomCheckinRepository;
import com.careafter.repository.UserRepository;

@SpringBootApplication
public class CareAfterApplication {

    public static void main(String[] args) {
        SpringApplication.run(CareAfterApplication.class, args);
    }

    @Bean
    public CommandLineRunner seedDatabase(
            UserRepository userRepository,
            PatientRepository patientRepository,
            SymptomCheckinRepository symptomCheckinRepository,
            AlertRepository alertRepository,
            DischargePlanRepository dischargePlanRepository,
            MedicationRepository medicationRepository,
            AppointmentRepository appointmentRepository,
            NotificationRepository notificationRepository,
            AuditLogRepository auditLogRepository,
            FamilyConnectionRepository familyConnectionRepository,
            org.springframework.security.crypto.password.PasswordEncoder passwordEncoder) {
        return args -> {
            User admin = userRepository.findByEmail("admin@careafter.local").orElse(null);
            if (admin == null) {
                admin = new User(null, "Admin", "User", "admin@careafter.local",
                        passwordEncoder.encode("admin123"), Role.ADMIN, true);
            } else {
                admin.setPasswordHash(passwordEncoder.encode("admin123"));
                admin.setActive(true);
            }

            User doctor = userRepository.findByEmail("doctor@careafter.local").orElse(null);
            if (doctor == null) {
                doctor = new User(null, "Dr.", "Petrovic", "doctor@careafter.local",
                        passwordEncoder.encode("doctor123"), Role.DOCTOR, true);
            } else {
                doctor.setPasswordHash(passwordEncoder.encode("doctor123"));
                doctor.setActive(true);
            }

            User patientUser = userRepository.findByEmail("patient@careafter.local").orElse(null);
            if (patientUser == null) {
                patientUser = new User(null, "Milica", "Petrovic", "patient@careafter.local",
                        passwordEncoder.encode("patient123"), Role.PATIENT, true);
            } else {
                patientUser.setPasswordHash(passwordEncoder.encode("patient123"));
                patientUser.setActive(true);
            }

            User familyMember = userRepository.findByEmail("family@careafter.local").orElse(null);
            if (familyMember == null) {
                familyMember = new User(null, "Jelena", "Petrovic", "family@careafter.local",
                        passwordEncoder.encode("family123"), Role.FAMILY_MEMBER, true);
            } else {
                familyMember.setPasswordHash(passwordEncoder.encode("family123"));
                familyMember.setActive(true);
            }

            admin = userRepository.save(admin);
            doctor = userRepository.save(doctor);
            patientUser = userRepository.save(patientUser);
            familyMember = userRepository.save(familyMember);

            Patient patient = patientRepository.findByUser(patientUser).orElse(null);
            SymptomCheckin checkin1 = null;
            if (patient == null) {
                patient = new Patient();
                patient.setUser(patientUser);
                patient.setDateOfBirth(LocalDate.of(1989, 12, 5));
                patient.setGender("Female");
                patient.setDiagnosis("Post-operative care after abdominal surgery");
                patient.setHospitalDepartment("Surgery");
                patient.setAssignedDoctor(doctor);
                patient = patientRepository.save(patient);

                checkin1 = new SymptomCheckin();
                checkin1.setPatient(patient);
                checkin1.setTemperature(37.8);
                checkin1.setPainLevel(6);
                checkin1.setNausea(true);
                checkin1.setBleeding(false);
                checkin1.setBreathingProblem(false);
                checkin1.setWoundRedness(true);
                checkin1.setGeneralWorsening(false);
                checkin1.setComment("Osećam blagi bol oko reza.");
                checkin1.setRiskLevel(RiskLevel.YELLOW);
                checkin1.setCreatedAt(LocalDateTime.now().minusHours(2));
                checkin1 = symptomCheckinRepository.save(checkin1);
            } else {
                List<SymptomCheckin> existingCheckins = symptomCheckinRepository.findByPatientOrderByCreatedAtDesc(patient);
                if (!existingCheckins.isEmpty()) {
                    checkin1 = existingCheckins.get(0);
                }
            }

            Alert alert = new Alert();
            alert.setPatient(patient);
            alert.setSymptomCheckin(checkin1);
            alert.setAlertType("SYMPTOM_RISK");
            alert.setMessage("Pacijent je uneo simptome sa rizikom YELLOW.");
            alert.setStatus(AlertStatus.NEW);
            alert.setCreatedAt(LocalDateTime.now().minusHours(2));
            alertRepository.save(alert);

            DischargePlan dischargePlan = new DischargePlan();
            dischargePlan.setPatient(patient);
            dischargePlan.setDoctor(doctor);
            dischargePlan.setDischargeDate(LocalDate.now().plusDays(3));
            dischargePlan.setDiagnosisSummary("Stabilizovano stanje nakon operacije, bez komplikacija.");
            dischargePlan.setRecoveryInstructions("Odmarajte se, pratite temperaturu i uzimajte propisane lekove.");
            dischargePlan.setWarningSigns("Visoka temperatura, otežano disanje, intenzivan bol ili curenje iz rane.");
            dischargePlan.setStatus(com.careafter.model.PlanStatus.ACTIVE);

            Medication medication1 = new Medication();
            medication1.setMedicationName("Paracetamol");
            medication1.setDosage("500mg");
            medication1.setFrequency("3 puta dnevno");
            medication1.setStartDate(LocalDate.now());
            medication1.setEndDate(LocalDate.now().plusDays(7));
            medication1.setInstructions("Uzeti posle jela.");
            medication1.setDischargePlan(dischargePlan);

            Medication medication2 = new Medication();
            medication2.setMedicationName("Amoksicilin");
            medication2.setDosage("500mg");
            medication2.setFrequency("2 puta dnevno");
            medication2.setStartDate(LocalDate.now());
            medication2.setEndDate(LocalDate.now().plusDays(5));
            medication2.setInstructions("Uzeti sa vodom.");
            medication2.setDischargePlan(dischargePlan);

            dischargePlan.setMedications(List.of(medication1, medication2));
            dischargePlan = dischargePlanRepository.save(dischargePlan);
            medicationRepository.saveAll(dischargePlan.getMedications());

            Appointment appointment = new Appointment();
            appointment.setPatient(patient);
            appointment.setDischargePlan(dischargePlan);
            appointment.setAppointmentDate(LocalDateTime.now().plusDays(1).withHour(10).withMinute(0));
            appointment.setAppointmentType("Kontrolni pregled");
            appointment.setLocation("Ordinacija 12");
            appointment.setNote("Provera rane i oporavka.");
            appointmentRepository.save(appointment);

            Notification notification1 = new Notification();
            notification1.setRecipient(doctor);
            notification1.setPatient(patient);
            notification1.setTitle("Novi alert pacijenta");
            notification1.setMessage("Milica Petrovic je prijavila simptome sa rizikom.");
            notification1.setType("ALERT");
            notification1.setIsRead(false);
            notification1.setCreatedAt(LocalDateTime.now().minusMinutes(90));
            notificationRepository.save(notification1);

            Notification notification2 = new Notification();
            notification2.setRecipient(familyMember);
            notification2.setPatient(patient);
            notification2.setTitle("Novi bolesnikov status");
            notification2.setMessage("Milica Petrovic ima zakazan kontrolni pregled.");
            notification2.setType("INFO");
            notification2.setIsRead(false);
            notification2.setCreatedAt(LocalDateTime.now().minusMinutes(30));
            notificationRepository.save(notification2);

            FamilyConnection familyConnection = new FamilyConnection();
            familyConnection.setPatient(patient);
            familyConnection.setFamilyMember(familyMember);
            familyConnection.setRelation("Sestra");
            familyConnection.setConsentGiven(true);
            familyConnection.setCreatedAt(LocalDateTime.now().minusDays(1));
            familyConnectionRepository.save(familyConnection);

            AuditLog auditLog1 = new AuditLog();
            auditLog1.setUser(admin);
            auditLog1.setAction("CREATE");
            auditLog1.setEntityType("User");
            auditLog1.setEntityId(doctor.getId());
            auditLog1.setCreatedAt(LocalDateTime.now().minusDays(1));
            auditLogRepository.save(auditLog1);

            AuditLog auditLog2 = new AuditLog();
            auditLog2.setUser(doctor);
            auditLog2.setAction("UPDATE");
            auditLog2.setEntityType("Patient");
            auditLog2.setEntityId(patient.getId());
            auditLog2.setCreatedAt(LocalDateTime.now().minusHours(2));
            auditLogRepository.save(auditLog2);
        };
    }
}
