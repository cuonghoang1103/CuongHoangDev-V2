package com.cuonghoangdev.api_backend.service.storage;

import com.cloudinary.Cloudinary;
import com.cloudinary.Transformation;
import com.cloudinary.utils.ObjectUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Cloudinary storage implementation — handles image uploads (covers, thumbnails, etc.)
 * Audio files should use SupabaseStorageService instead.
 */
@Service
public class CloudinaryStorageService implements StorageService {

    private static final Logger log = LoggerFactory.getLogger(CloudinaryStorageService.class);

    private final Cloudinary cloudinary;
    private final String cloudName;
    private final String apiKey;
    private final String apiSecret;
    private final boolean configured;

    public CloudinaryStorageService(
            @Value("${cloudinary.cloud-name:}") String cloudNameVal,
            @Value("${cloudinary.api-key:}") String apiKeyVal,
            @Value("${cloudinary.api-secret:}") String apiSecretVal
    ) {
        this.cloudName = cloudNameVal;
        this.apiKey = apiKeyVal;
        this.apiSecret = apiSecretVal;
        this.configured = cloudNameVal != null && !cloudNameVal.isBlank()
                && apiKeyVal != null && !apiKeyVal.isBlank()
                && apiSecretVal != null && !apiSecretVal.isBlank();

        if (!this.configured) {
            log.warn("Cloudinary is NOT configured. Image uploads will fail.");
        }

        Map config = new HashMap();
        config.put("cloud_name", cloudName != null ? cloudName : "");
        config.put("api_key", apiKey != null ? apiKey : "");
        config.put("api_secret", apiSecret != null ? apiSecret : "");
        config.put("secure", true);
        this.cloudinary = new Cloudinary(config);
    }

    @Override
    public StorageResult upload(MultipartFile file, String folder, String fileName) throws IOException {
        if (!configured) {
            throw new IOException("Cloudinary is not configured. Check CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.");
        }

        File tempFile = convertToFile(file);
        try {
            String publicId = fileName != null
                    ? fileName.replaceAll("[^a-zA-Z0-9._-]", "_")
                    : generatePublicId(file.getOriginalFilename());

            Map params = ObjectUtils.asMap(
                    "folder", folder != null ? folder : "misc",
                    "resource_type", "image",  // Always image for this service
                    "public_id", publicId
            );

            Map result = cloudinary.uploader().upload(tempFile, params);
            String url = (String) result.get("secure_url");
            String publicIdResult = (String) result.get("public_id");

            log.info("[Cloudinary] Uploaded image: {} ({} bytes) -> {}",
                    file.getOriginalFilename(), file.getSize(), url);

            return new StorageResult(
                    url,
                    publicIdResult,
                    file.getOriginalFilename(),
                    file.getContentType(),
                    file.getSize(),
                    StorageType.CLOUDINARY
            );
        } finally {
            tempFile.delete();
        }
    }

    /**
     * Upload an image with optional resize transformation.
     */
    public StorageResult uploadImage(MultipartFile file, String folder, int width, int height) throws IOException {
        if (!configured) {
            throw new IOException("Cloudinary is not configured.");
        }

        File tempFile = convertToFile(file);
        try {
            String publicId = generatePublicId(file.getOriginalFilename());

            Map params = ObjectUtils.asMap(
                    "folder", folder != null ? folder : "images",
                    "resource_type", "image",
                    "public_id", publicId,
                    "transformation", new Transformation().width(width).height(height).crop("fill")
            );

            Map result = cloudinary.uploader().upload(tempFile, params);
            String url = (String) result.get("secure_url");
            String publicIdResult = (String) result.get("public_id");

            log.info("[Cloudinary] Uploaded image {}x{}: {} -> {}", width, height, file.getOriginalFilename(), url);

            return new StorageResult(
                    url,
                    publicIdResult,
                    file.getOriginalFilename(),
                    file.getContentType(),
                    file.getSize(),
                    StorageType.CLOUDINARY
            );
        } finally {
            tempFile.delete();
        }
    }

    @Override
    public boolean delete(String publicId) throws IOException {
        if (!configured || publicId == null || publicId.isBlank()) {
            return false;
        }

        Map result = cloudinary.uploader().destroy(publicId, ObjectUtils.asMap("invalidate", true));
        boolean success = "ok".equals(result.get("result"));
        log.info("[Cloudinary] Delete {}: {}", publicId, success ? "success" : "failed");
        return success;
    }

    @Override
    public boolean isConfigured() {
        return configured;
    }

    @Override
    public StorageType getType() {
        return StorageType.CLOUDINARY;
    }

    // 2-arg overload for backward compatibility with existing callers
    public StorageResult upload(MultipartFile file, String folder) throws IOException {
        return upload(file, folder, null);
    }

    // --- Public access to credentials for frontend signing ---

    public String getCloudName() {
        return cloudName;
    }

    public String getApiKey() {
        return apiKey;
    }

    public String getApiSecret() {
        return apiSecret;
    }

    /**
     * Generate a SHA-1 signature for Cloudinary direct upload from browser.
     * Used by MusicController to sign upload requests.
     */
    public String sign(String toSign) {
        try {
            java.security.MessageDigest md = java.security.MessageDigest.getInstance("SHA-1");
            byte[] hash = md.digest(toSign.getBytes("UTF-8"));
            StringBuilder hex = new StringBuilder();
            for (byte b : hash) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (Exception e) {
            log.error("[Cloudinary] Failed to generate signature", e);
            return "";
        }
    }

    // --- Private helpers ---

    private File convertToFile(MultipartFile multipartFile) throws IOException {
        File tempFile = File.createTempFile(
                UUID.randomUUID().toString(),
                getExtension(multipartFile.getOriginalFilename())
        );
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
