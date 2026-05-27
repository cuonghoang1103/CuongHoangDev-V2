package com.cuonghoangdev.api_backend.service;

import com.cuonghoangdev.api_backend.entity.FileAttachment;
import com.cuonghoangdev.api_backend.repository.FileAttachmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
public class FileStorageService {

    private final Path rootLocation;
    private final String baseUrl;

    @Autowired
    private FileAttachmentRepository fileAttachmentRepository;

    public FileStorageService(
            @Value("${app.file.storage-path:./uploads}") String storagePath,
            @Value("${app.base-url:http://localhost:8080}") String baseUrl) {
        this.rootLocation = Paths.get(storagePath).toAbsolutePath().normalize();
        this.baseUrl = baseUrl;
        init();
    }

    private void init() {
        try {
            Files.createDirectories(rootLocation);
        } catch (IOException e) {
            throw new RuntimeException("Khong the tao thu muc upload: " + rootLocation, e);
        }
    }

    @Transactional
    public FileAttachment store(MultipartFile file, Long userId, String category) {
        if (file.isEmpty()) {
            throw new RuntimeException("File rong, khong the upload");
        }

        String originalName = file.getOriginalFilename();
        if (originalName == null) {
            originalName = "unknown";
        }

        String ext = "";
        int dotIdx = originalName.lastIndexOf('.');
        if (dotIdx > 0) {
            ext = originalName.substring(dotIdx);
        }

        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String storedName = timestamp + "_" + UUID.randomUUID().toString().substring(0, 8) + ext;

        try {
            Path destinationDir = rootLocation.resolve(
                    category != null ? category : "misc");
            Files.createDirectories(destinationDir);

            Path destinationFile = destinationDir.resolve(storedName).normalize();

            if (!destinationFile.startsWith(rootLocation)) {
                throw new RuntimeException("Duong dan file khong hop le");
            }

            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, destinationFile, StandardCopyOption.REPLACE_EXISTING);
            }

            FileAttachment attachment = new FileAttachment();
            attachment.setOriginalName(originalName);
            attachment.setStoredName(storedName);
            attachment.setFilePath(destinationFile.toString());
            attachment.setContentType(file.getContentType() != null ? file.getContentType() : "application/octet-stream");
            attachment.setFileSize(file.getSize());
            attachment.setUploadedBy(userId);
            attachment.setFileCategory(category);

            return fileAttachmentRepository.save(attachment);

        } catch (IOException e) {
            throw new RuntimeException("Loi khi luu file: " + storedName, e);
        }
    }

    public Resource loadAsResource(String storedName) {
        FileAttachment attachment = findByStoredName(storedName);
        Path filePath = Paths.get(attachment.getFilePath()).normalize();
        try {
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new RuntimeException("File khong doc duoc: " + storedName);
            }
        } catch (MalformedURLException e) {
            throw new RuntimeException("File khong doc duoc: " + storedName, e);
        }
    }

    public FileAttachment findByStoredName(String storedName) {
        return fileAttachmentRepository.findByStoredName(storedName)
                .orElseThrow(() -> new RuntimeException("File not found: " + storedName));
    }

    public List<FileAttachment> getFilesByUser(Long userId) {
        return fileAttachmentRepository.findByUploadedBy(userId);
    }

    @Transactional
    public void deleteFile(Long fileId, Long userId) {
        FileAttachment attachment = fileAttachmentRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found with id: " + fileId));

        try {
            Path filePath = Paths.get(attachment.getFilePath());
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            throw new RuntimeException("Loi khi xoa file: " + attachment.getStoredName(), e);
        }

        fileAttachmentRepository.delete(attachment);
    }

    public String getDownloadUrl(String storedName) {
        return baseUrl + "/api/v1/files/" + storedName;
    }
}
