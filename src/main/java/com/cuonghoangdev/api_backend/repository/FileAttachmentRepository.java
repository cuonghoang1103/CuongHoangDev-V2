package com.cuonghoangdev.api_backend.repository;

import com.cuonghoangdev.api_backend.entity.FileAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FileAttachmentRepository extends JpaRepository<FileAttachment, Long> {

    List<FileAttachment> findByUploadedBy(Long userId);

    List<FileAttachment> findByFileCategory(String category);

    Optional<FileAttachment> findByStoredName(String storedName);
}
