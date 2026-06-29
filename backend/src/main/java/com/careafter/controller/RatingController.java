package com.careafter.controller;

import com.careafter.model.*;
import com.careafter.repository.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ratings")
public class RatingController {

    private final DoctorRatingRepository ratingRepo;
    private final UserRepository userRepo;
    private final NotificationRepository notifRepo;

    public RatingController(DoctorRatingRepository ratingRepo,
                            UserRepository userRepo,
                            NotificationRepository notifRepo) {
        this.ratingRepo = ratingRepo;
        this.userRepo = userRepo;
        this.notifRepo = notifRepo;
    }

    @PostMapping
    public ResponseEntity<DoctorRating> rateDoctor(@RequestBody Map<String, Object> body, Principal principal) {
        User patient = userRepo.findByEmail(principal.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Long doctorId = Long.parseLong(body.get("doctorId").toString());
        User doctor = userRepo.findById(doctorId)
                .orElseThrow(() -> new IllegalArgumentException("Doctor not found"));

        int stars = Integer.parseInt(body.get("stars").toString());
        String comment = body.containsKey("comment") ? (String) body.get("comment") : null;

        // If already rated, update existing
        DoctorRating rating = ratingRepo.findByPatientAndDoctor(patient, doctor)
                .orElse(new DoctorRating());
        rating.setPatient(patient);
        rating.setDoctor(doctor);
        rating.setStars(stars);
        rating.setComment(comment);
        rating.setCreatedAt(LocalDateTime.now());
        DoctorRating saved = ratingRepo.save(rating);

        // Mark any pending RATE_DOCTOR notification as read
        notifRepo.findAll().stream()
                .filter(n -> patient.getId().equals(n.getRecipient().getId())
                        && "RATE_DOCTOR".equals(n.getType())
                        && doctorId.equals(n.getRelatedUserId())
                        && Boolean.FALSE.equals(n.getIsRead()))
                .forEach(n -> {
                    n.setIsRead(true);
                    notifRepo.save(n);
                });

        return ResponseEntity.ok(saved);
    }

    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<Map<String, Object>> getDoctorRatings(@PathVariable Long doctorId) {
        User doctor = userRepo.findById(doctorId)
                .orElseThrow(() -> new IllegalArgumentException("Doctor not found"));

        List<DoctorRating> ratings = ratingRepo.findByDoctorOrderByCreatedAtDesc(doctor);
        Double avg = ratingRepo.findAvgStarsByDoctor(doctor);
        long count = ratingRepo.countByDoctor(doctor);

        Map<String, Object> result = new HashMap<>();
        result.put("avgStars", avg != null ? Math.round(avg * 10.0) / 10.0 : null);
        result.put("count", count);
        result.put("ratings", ratings);
        return ResponseEntity.ok(result);
    }
}
