package com.cuonghoangdev.api_backend.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.Transformation;
import com.cloudinary.utils.ObjectUtils;
import com.cuonghoangdev.api_backend.dto.FileUploadResult;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class CloudinaryFileStorageService {

    private final Cloudinary cloudinary;
    private final String cloudName;
    private final boolean configured;

    public CloudinaryFileStorageService(
            @Value("${cloudinary.cloud-name}") String cloudName,
            @Value("${cloudinary.api-key}") String apiKey,
            @Value("${cloudinary.api-secret}") String apiSecret) {
        this.cloudName = cloudName;
        this.configured = cloudName != null && !cloudName.isBlank()
                && apiKey != null && !apiKey.isBlank()
                && apiSecret != null && !apiSecret.isBlank();

        Map config = new HashMap();
        config.put("cloud_name", cloudName != null ? cloudName : "");
        config.put("api_key", apiKey != null ? apiKey : "");
        config.put("api_secret", apiSecret != null ? apiSecret : "");
        config.put("secure", true);
        this.cloudinary = new Cloudinary(config);
    }

    public boolean isConfigured() {
        return configured;
    }

    public String getCloudName() {
        return cloudName;
    }

    public FileUploadResult upload(MultipartFile file, String folder) throws IOException {
        if (!configured) {
            throw new IOException("Cloudinary chua duoc cau hinh. Vui long kiem tra CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET");
        }
        File tempFile = convertToFile(file);
        try {
            Map params = ObjectUtils.asMap(
                    "folder", folder != null ? folder : "misc",
                    "resource_type", "auto",
                    "public_id", generatePublicId(file.getOriginalFilename())
            );
            Map result = cloudinary.uploader().upload(tempFile, params);
            String url = (String) result.get("secure_url");
            String publicId = (String) result.get("public_id");
            return new FileUploadResult(
                    url,
                    publicId,
                    file.getOriginalFilename(),
                    file.getContentType(),
                    file.getSize()
            );
        } finally {
            tempFile.delete();
        }
    }

    public String uploadImage(MultipartFile file, String folder, int width, int height) throws IOException {
        if (!configured) {
            throw new IOException("Cloudinary chua duoc cau hinh");
        }
        File tempFile = convertToFile(file);
        try {
            Map params = ObjectUtils.asMap(
                    "folder", folder != null ? folder : "images",
                    "resource_type", "image",
                    "public_id", generatePublicId(file.getOriginalFilename()),
                    "transformation", new Transformation().width(width).height(height).crop("fill")
            );
            Map result = cloudinary.uploader().upload(tempFile, params);
            return (String) result.get("secure_url");
        } finally {
            tempFile.delete();
        }
    }

    public boolean delete(String publicId) throws IOException {
        Map result = cloudinary.uploader().destroy(publicId,
                ObjectUtils.asMap("invalidate", true));
        return "ok".equals(result.get("result"));
    }

    private File convertToFile(MultipartFile multipartFile) throws IOException {
        File tempFile = File.createTempFile(
                UUID.randomUUID().toString(),
                getExtension(multipartFile.getOriginalFilename()));
        try (FileOutputStream fos = new FileOutputStream(tempFile)) {
            fos.write(multipartFile.getBytes());
        }
        return tempFile;
    }

    private String generatePublicId(String originalFilename) {
        String timestamp = String.valueOf(System.currentTimeMillis());
        String uuid = UUID.randomUUID().toString().substring(0, 8);
        String baseName = originalFilename != null
                ? originalFilename.replaceAll("[^a-zA-Z0-9.-]", "_")
                : "file";
        return timestamp + "_" + uuid + "_" + baseName;
    }

    private String getExtension(String filename) {
        if (filename == null || filename.lastIndexOf('.') == -1) {
            return "";
        }
        return filename.substring(filename.lastIndexOf('.'));
    }
}

