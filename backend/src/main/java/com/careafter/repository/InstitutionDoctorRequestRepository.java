package com.careafter.repository;

import com.careafter.model.InstitutionDoctorRequest;
import com.careafter.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InstitutionDoctorRequestRepository extends JpaRepository<InstitutionDoctorRequest, Long> {
    List<InstitutionDoctorRequest> findByInstitutionOrderByRequestedAtDesc(User institution);
    List<InstitutionDoctorRequest> findByDoctorOrderByRequestedAtDesc(User doctor);
    List<InstitutionDoctorRequest> findByInstitutionAndStatus(User institution, String status);
    List<InstitutionDoctorRequest> findByDoctorAndStatus(User doctor, String status);
    Optional<InstitutionDoctorRequest> findByInstitutionAndDoctor(User institution, User doctor);
}
