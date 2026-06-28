package com.careafter.repository;

import com.careafter.model.Medication;
import com.careafter.model.MedicationLog;
import com.careafter.model.Patient;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface MedicationLogRepository extends JpaRepository<MedicationLog, Long> {
    List<MedicationLog> findByPatientAndScheduledDate(Patient patient, LocalDate date);
    List<MedicationLog> findByPatientAndScheduledDateBetweenOrderByScheduledDateAsc(Patient patient, LocalDate from, LocalDate to);
    Optional<MedicationLog> findByPatientAndMedicationAndScheduledDate(Patient patient, Medication medication, LocalDate date);
}
