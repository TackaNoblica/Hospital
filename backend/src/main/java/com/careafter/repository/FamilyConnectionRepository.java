package com.careafter.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.careafter.model.FamilyConnection;
import com.careafter.model.Patient;
import com.careafter.model.User;

@Repository
public interface FamilyConnectionRepository extends JpaRepository<FamilyConnection, Long> {
    List<FamilyConnection> findByPatient(Patient patient);
    List<FamilyConnection> findByFamilyMember(User familyMember);
}
