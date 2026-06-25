package com.careafter.service;

import java.security.Principal;
import java.util.List;

import org.springframework.stereotype.Service;

import com.careafter.model.Patient;
import com.careafter.model.SymptomCheckin;
import com.careafter.model.User;
import com.careafter.repository.PatientRepository;
import com.careafter.repository.SymptomCheckinRepository;
import com.careafter.repository.UserRepository;

@Service
public class PatientService {

    private final PatientRepository patientRepository;
    private final UserRepository userRepository;
    private final SymptomCheckinRepository symptomCheckinRepository;

    public PatientService(PatientRepository patientRepository,
                          UserRepository userRepository,
                          SymptomCheckinRepository symptomCheckinRepository) {
        this.patientRepository = patientRepository;
        this.userRepository = userRepository;
        this.symptomCheckinRepository = symptomCheckinRepository;
    }

    public Patient getPatientById(Long patientId) {
        return patientRepository.findById(patientId)
                .orElseThrow(() -> new IllegalArgumentException("Patient not found"));
    }

    public Patient getPatientByUserEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + email));
        return patientRepository.findByUser(user)
                .orElseThrow(() -> new IllegalArgumentException("Patient profile not found for user: " + email));
    }

    public Patient getPatientForPrincipal(Principal principal) {
        return getPatientByUserEmail(principal.getName());
    }

    public List<Patient> getPatientsForDoctor(String doctorEmail) {
        User doctor = userRepository.findByEmail(doctorEmail)
                .orElseThrow(() -> new IllegalArgumentException("Doctor not found: " + doctorEmail));
        return patientRepository.findByAssignedDoctor(doctor);
    }

    public List<SymptomCheckin> getCheckinsForPatient(Long patientId) {
        Patient patient = getPatientById(patientId);
        return symptomCheckinRepository.findByPatientOrderByCreatedAtDesc(patient);
    }
}
