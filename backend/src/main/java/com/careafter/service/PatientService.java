package com.careafter.service;

import java.security.Principal;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.careafter.model.Patient;
import com.careafter.model.RequestStatus;
import com.careafter.model.Role;
import com.careafter.model.SymptomCheckin;
import com.careafter.model.User;
import com.careafter.repository.DoctorPatientRequestRepository;
import com.careafter.repository.PatientRepository;
import com.careafter.repository.SymptomCheckinRepository;
import com.careafter.repository.UserRepository;

@Service
public class PatientService {

    private final PatientRepository patientRepository;
    private final UserRepository userRepository;
    private final SymptomCheckinRepository symptomCheckinRepository;
    private final DoctorPatientRequestRepository doctorPatientRequestRepository;

    public PatientService(PatientRepository patientRepository,
                          UserRepository userRepository,
                          SymptomCheckinRepository symptomCheckinRepository,
                          DoctorPatientRequestRepository doctorPatientRequestRepository) {
        this.patientRepository = patientRepository;
        this.userRepository = userRepository;
        this.symptomCheckinRepository = symptomCheckinRepository;
        this.doctorPatientRequestRepository = doctorPatientRequestRepository;
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

    /** Returns patients approved via DoctorPatientRequest for the given doctor */
    public List<Patient> getPatientsForDoctor(String doctorEmail) {
        User doctor = userRepository.findByEmail(doctorEmail)
                .orElseThrow(() -> new IllegalArgumentException("Doctor not found: " + doctorEmail));
        return doctorPatientRequestRepository.findByDoctorAndStatus(doctor, RequestStatus.APPROVED)
                .stream()
                .map(r -> r.getPatient())
                .collect(Collectors.toList());
    }

    /** Returns all doctors in the system */
    public List<User> getAllDoctors() {
        return userRepository.findByRole(Role.DOCTOR);
    }

    public List<SymptomCheckin> getCheckinsForPatient(Long patientId) {
        Patient patient = getPatientById(patientId);
        return symptomCheckinRepository.findByPatientOrderByCreatedAtDesc(patient);
    }

    public Patient updateDiagnosisStatus(Long patientId, String status) {
        Patient p = patientRepository.findById(patientId)
                .orElseThrow(() -> new IllegalArgumentException("Patient not found"));
        p.setDiagnosisStatus(status);
        return patientRepository.save(p);
    }
}
