package com.careafter.controller;

import com.careafter.model.*;
import com.careafter.repository.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/doctor-requests")
public class DoctorPatientRequestController {

    private final DoctorPatientRequestRepository requestRepo;
    private final PatientRepository patientRepo;
    private final UserRepository userRepo;
    private final ConversationRepository conversationRepo;

    public DoctorPatientRequestController(DoctorPatientRequestRepository requestRepo,
                                          PatientRepository patientRepo,
                                          UserRepository userRepo,
                                          ConversationRepository conversationRepo) {
        this.requestRepo = requestRepo;
        this.patientRepo = patientRepo;
        this.userRepo = userRepo;
        this.conversationRepo = conversationRepo;
    }

    /** Patient sends a follow request to a doctor */
    @PostMapping
    public ResponseEntity<?> sendRequest(@RequestBody Map<String, Long> body, Principal principal) {
        Long doctorId = body.get("doctorId");
        User currentUser = userRepo.findByEmail(principal.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Patient patient = patientRepo.findByUser(currentUser)
                .orElseThrow(() -> new IllegalArgumentException("Patient profile not found"));
        User doctor = userRepo.findById(doctorId)
                .orElseThrow(() -> new IllegalArgumentException("Doctor not found"));

        if (requestRepo.findByDoctorAndPatient(doctor, patient).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Zahtev vec postoji"));
        }

        DoctorPatientRequest req = new DoctorPatientRequest();
        req.setDoctor(doctor);
        req.setPatient(patient);
        req.setStatus(RequestStatus.PENDING);
        req.setRequestedAt(LocalDateTime.now());
        return ResponseEntity.ok(requestRepo.save(req));
    }

    /** Doctor sees all pending requests */
    @GetMapping("/pending")
    public ResponseEntity<List<DoctorPatientRequest>> getPending(Principal principal) {
        User doctor = userRepo.findByEmail(principal.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return ResponseEntity.ok(
                requestRepo.findByDoctorAndStatusOrderByRequestedAtDesc(doctor, RequestStatus.PENDING));
    }

    /** Doctor sees all their connections (approved) */
    @GetMapping("/my-patients")
    public ResponseEntity<List<DoctorPatientRequest>> getMyPatients(Principal principal) {
        User doctor = userRepo.findByEmail(principal.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return ResponseEntity.ok(
                requestRepo.findByDoctorAndStatus(doctor, RequestStatus.APPROVED));
    }

    /** Patient sees all their sent requests */
    @GetMapping("/my-requests")
    public ResponseEntity<List<DoctorPatientRequest>> getMyRequests(Principal principal) {
        User currentUser = userRepo.findByEmail(principal.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Patient patient = patientRepo.findByUser(currentUser)
                .orElseThrow(() -> new IllegalArgumentException("Patient profile not found"));
        return ResponseEntity.ok(requestRepo.findByPatient(patient));
    }

    /** Patient sees approved doctors */
    @GetMapping("/my-doctors")
    public ResponseEntity<List<DoctorPatientRequest>> getMyDoctors(Principal principal) {
        User currentUser = userRepo.findByEmail(principal.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Patient patient = patientRepo.findByUser(currentUser)
                .orElseThrow(() -> new IllegalArgumentException("Patient profile not found"));
        return ResponseEntity.ok(requestRepo.findByPatientAndStatus(patient, RequestStatus.APPROVED));
    }

    /** Doctor approves a request */
    @PostMapping("/{id}/approve")
    public ResponseEntity<DoctorPatientRequest> approve(@PathVariable Long id, Principal principal) {
        DoctorPatientRequest req = requestRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Request not found"));
        req.setStatus(RequestStatus.APPROVED);
        req.setRespondedAt(LocalDateTime.now());
        DoctorPatientRequest saved = requestRepo.save(req);

        // Auto-create conversation if it doesn't exist
        ensureConversation(req.getPatient(), req.getDoctor());

        return ResponseEntity.ok(saved);
    }

    /** Doctor rejects a request */
    @PostMapping("/{id}/reject")
    public ResponseEntity<DoctorPatientRequest> reject(@PathVariable Long id, Principal principal) {
        DoctorPatientRequest req = requestRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Request not found"));
        req.setStatus(RequestStatus.REJECTED);
        req.setRespondedAt(LocalDateTime.now());
        return ResponseEntity.ok(requestRepo.save(req));
    }

    /** Patient cancels a pending request */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> cancel(@PathVariable Long id, Principal principal) {
        requestRepo.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private void ensureConversation(Patient patient, User doctor) {
        User patientUser = patient.getUser();
        // Check if direct conversation already exists
        boolean exists = conversationRepo.findByPatientAndParticipant(patient, doctor).isPresent();
        if (!exists) {
            Conversation conv = new Conversation();
            conv.setPatient(patient);
            conv.setTitle("Dr. " + doctor.getLastName() + " — " + patientUser.getFirstName() + " " + patientUser.getLastName());
            conv.setCreatedAt(LocalDateTime.now());
            conv.setParticipants(List.of(patientUser, doctor));
            conversationRepo.save(conv);
        }
    }
}
