package com.careafter.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.careafter.model.DischargePlan;
import com.careafter.model.Patient;

@Repository
public interface DischargePlanRepository extends JpaRepository<DischargePlan, Long> {
    List<DischargePlan> findByPatient(Patient patient);
}
