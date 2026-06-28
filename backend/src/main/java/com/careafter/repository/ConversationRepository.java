package com.careafter.repository;

import com.careafter.model.Conversation;
import com.careafter.model.Patient;
import com.careafter.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    @Query("SELECT c FROM Conversation c JOIN c.participants p WHERE p = :user ORDER BY c.lastMessageAt DESC NULLS LAST")
    List<Conversation> findByParticipant(@Param("user") User user);

    @Query("SELECT c FROM Conversation c JOIN c.participants p WHERE p = :user AND c.patient = :patient")
    Optional<Conversation> findByPatientAndParticipant(@Param("patient") Patient patient, @Param("user") User user);

    List<Conversation> findByPatient(Patient patient);
}
