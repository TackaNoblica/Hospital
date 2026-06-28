package com.careafter.repository;

import com.careafter.model.DoctorPatientRequest;
import com.careafter.model.Patient;
import com.careafter.model.RequestStatus;
import com.careafter.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DoctorPatientRequestRepository extends JpaRepository<DoctorPatientRequest, Long> {
    List<DoctorPatientRequest> findByDoctorAndStatus(User doctor, RequestStatus status);
    List<DoctorPatientRequest> findByDoctorAndStatusOrderByRequestedAtDesc(User doctor, RequestStatus status);
    List<DoctorPatientRequest> findByPatient(Patient patient);
    List<DoctorPatientRequest> findByPatientAndStatus(Patient patient, RequestStatus status);
    Optional<DoctorPatientRequest> findByDoctorAndPatient(User doctor, Patient patient);
    List<DoctorPatientRequest> findByDoctor(User doctor);
}
