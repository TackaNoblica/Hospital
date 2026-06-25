package com.careafter.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.careafter.model.Patient;
import com.careafter.model.SymptomCheckin;

@Repository
public interface SymptomCheckinRepository extends JpaRepository<SymptomCheckin, Long> {
    List<SymptomCheckin> findByPatientOrderByCreatedAtDesc(Patient patient);
}
