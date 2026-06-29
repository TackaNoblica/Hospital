package com.careafter.repository;

import com.careafter.model.DoctorRating;
import com.careafter.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface DoctorRatingRepository extends JpaRepository<DoctorRating, Long> {
    List<DoctorRating> findByDoctorOrderByCreatedAtDesc(User doctor);
    Optional<DoctorRating> findByPatientAndDoctor(User patient, User doctor);

    @Query("SELECT AVG(r.stars) FROM DoctorRating r WHERE r.doctor = :doctor")
    Double findAvgStarsByDoctor(@Param("doctor") User doctor);

    long countByDoctor(User doctor);
}
