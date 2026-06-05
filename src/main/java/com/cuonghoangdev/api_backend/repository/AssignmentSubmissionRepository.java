package com.cuonghoangdev.api_backend.repository;

import com.cuonghoangdev.api_backend.entity.AssignmentSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AssignmentSubmissionRepository extends JpaRepository<AssignmentSubmission, Long> {
    Optional<AssignmentSubmission> findByAssignmentIdAndUserId(Long assignmentId, Long userId);
    List<AssignmentSubmission> findByAssignmentIdOrderBySubmittedAtDesc(Long assignmentId);
}
