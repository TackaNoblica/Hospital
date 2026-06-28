package com.careafter.repository;

import com.careafter.model.MedicalDocument;
import com.careafter.model.Patient;
import com.careafter.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MedicalDocumentRepository extends JpaRepository<MedicalDocument, Long> {
    List<MedicalDocument> findByPatientOrderByDocumentDateDesc(Patient patient);
    List<MedicalDocument> findByPatientAndAuthorOrderByDocumentDateDesc(Patient patient, User author);
    List<MedicalDocument> findByPatientAndRelatedToCurrentIllnessTrueOrderByDocumentDateDesc(Patient patient);
}
