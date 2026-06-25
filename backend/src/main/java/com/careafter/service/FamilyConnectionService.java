package com.careafter.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.careafter.model.FamilyConnection;
import com.careafter.model.Patient;
import com.careafter.model.User;
import com.careafter.repository.FamilyConnectionRepository;
import com.careafter.repository.PatientRepository;
import com.careafter.repository.UserRepository;

@Service
public class FamilyConnectionService {

    private final FamilyConnectionRepository familyConnectionRepository;
    private final PatientRepository patientRepository;
    private final UserRepository userRepository;

    public FamilyConnectionService(FamilyConnectionRepository familyConnectionRepository,
                                   PatientRepository patientRepository,
                                   UserRepository userRepository) {
        this.familyConnectionRepository = familyConnectionRepository;
        this.patientRepository = patientRepository;
        this.userRepository = userRepository;
    }

    public List<FamilyConnection> getConnectionsForPatient(Long patientId) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new IllegalArgumentException("Patient not found"));
        return familyConnectionRepository.findByPatient(patient);
    }

    public List<FamilyConnection> getConnectionsForFamilyMember(String email) {
        User familyMember = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Family member not found: " + email));
        return familyConnectionRepository.findByFamilyMember(familyMember);
    }
}
