package com.careafter.repository;

import com.careafter.model.Report;
import com.careafter.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReportRepository extends JpaRepository<Report, Long> {
    List<Report> findByReportedUserOrderByCreatedAtDesc(User reportedUser);
    List<Report> findByReporterOrderByCreatedAtDesc(User reporter);
    List<Report> findByReportTypeAndReportedUserOrderByCreatedAtDesc(String reportType, User reportedUser);
    long countByReportedUserAndReportType(User reportedUser, String reportType);
}
