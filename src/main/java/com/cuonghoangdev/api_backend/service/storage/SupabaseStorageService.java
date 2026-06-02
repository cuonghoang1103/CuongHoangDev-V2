package com.cuonghoangdev.api_backend.service.storage;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.UUID;

/**
 * Supabase Storage implementation — handles audio file uploads.
 * Uses the Supabase Storage REST API with the service role key for server-side operations.
 *
 * Key advantages over Cloudinary for audio:
 * - No per-upload network hop through Vercel (files go directly to Supabase)
 * - Larger file support (up to 50MB+ per file)
 * - Streaming-optimized for audio playback
 * - Cheaper for large audio libraries
 *
 * Setup: Create a public bucket named "music-tracks" in Supabase Dashboard.
 */
@Service
public class SupabaseStorageService implements StorageService {

    private static final Logger log = LoggerFactory.getLogger(SupabaseStorageService.class);

    private final String supabaseUrl;
    private final String serviceRoleKey;
    private final String bucketName;
    private final boolean configured;
    private final RestTemplate restTemplate;

    private static final long MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

    public SupabaseStorageService(
            @Value("${supabase.url:}") String supabaseUrl,
            @Value("${supabase.service-role-key:}") String serviceRoleKey,
            @Value("${supabase.bucket:music-tracks}") String bucketName
    ) {
        this.supabaseUrl = supabaseUrl;
        this.serviceRoleKey = serviceRoleKey;
        this.bucketName = bucketName;
        this.restTemplate = new RestTemplate();

        this.configured = supabaseUrl != null && !supabaseUrl.isBlank()
                && serviceRoleKey != null && !serviceRoleKey.isBlank();

        if (!this.configured) {
            log.warn("Supabase Storage is NOT configured. Audio uploads will fail. " +
                    "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
        } else {
            log.info("[Supabase] Configured for bucket '{}' at {}", bucketName, supabaseUrl);
        }
    }

    @Override
    public StorageResult upload(MultipartFile file, String folder, String fileName) throws IOException {
        if (!configured) {
            throw new IOException("Supabase Storage is not configured. " +
                    "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.");
        }

        if (file == null || file.isEmpty()) {
            throw new IOException("No file provided");
        }

        long size = file.getSize();
        if (size > MAX_FILE_SIZE) {
            throw new IOException("File too large. Max " + (MAX_FILE_SIZE / 1024 / 1024) + "MB. " +
                    "Your file is " + (size / 1024 / 1024) + "MB.");
        }

        String originalName = file.getOriginalFilename();
        String contentType = file.getContentType();
        String ext = getExtension(originalName);
        String baseName = fileName != null
                ? fileName.replaceAll("[^a-zA-Z0-9._-]", "_")
                : UUID.randomUUID().toString();
        String path = buildPath(folder, baseName + ext);

        log.info("[Supabase] Uploading audio: {} ({} bytes, type={}) -> {}",
                originalName, size, contentType, path);

        File tempFile = null;
        try {
            tempFile = File.createTempFile("audio_upload_", ext);
            file.transferTo(tempFile);

            String uploadUrl = supabaseUrl + "/storage/v1/object/" + bucketName + "/" + path;

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(
                    contentType != null ? contentType : "audio/mpeg"));
            headers.set("Authorization", "Bearer " + serviceRoleKey);

            HttpEntity<File> request = new HttpEntity<>(tempFile, headers);

            // Supabase Storage API: PUT /storage/v1/object/{bucket}/{path}
            ResponseEntity<Void> response = restTemplate.exchange(
                    uploadUrl,
                    HttpMethod.PUT,
                    request,
                    Void.class
            );

            if (response.getStatusCode().is2xxSuccessful()) {
                String publicUrl = buildPublicUrl(path);

                log.info("[Supabase] Upload success: {} ({} bytes, {}s) -> {}",
                        originalName, size, size / 1024 / 1024 + "MB", publicUrl);

                return new StorageResult(
                        publicUrl,
                        path,
                        originalName,
                        contentType,
                        size,
                        StorageType.SUPABASE
                );
            } else {
                throw new IOException("Upload failed: HTTP " + response.getStatusCode());
            }

        } catch (HttpClientErrorException e) {
            String body = e.getResponseBodyAsString();
            log.error("[Supabase] Upload failed [{}]: {}", e.getStatusCode(), body);
            throw new IOException("Supabase upload failed [" + e.getStatusCode() + "]: " + body);
        } finally {
            if (tempFile != null && tempFile.exists()) {
                Files.deleteIfExists(tempFile.toPath());
            }
        }
    }

    @Override
    public boolean delete(String publicId) throws IOException {
        if (!configured || publicId == null || publicId.isBlank()) {
            return false;
        }

        try {
            String deleteUrl = supabaseUrl + "/storage/v1/object/" + bucketName + "/" + publicId;

            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + serviceRoleKey);

            HttpEntity<Void> request = new HttpEntity<>(headers);
            ResponseEntity<Void> response = restTemplate.exchange(
                    deleteUrl,
                    HttpMethod.DELETE,
                    request,
                    Void.class
            );

            boolean success = response.getStatusCode().is2xxSuccessful();
            log.info("[Supabase] Delete {}: {}", publicId, success ? "success" : "failed");
            return success;
        } catch (HttpClientErrorException e) {
            if (e.getStatusCode().value() == 404) {
                log.warn("[Supabase] File not found for deletion: {}", publicId);
                return true;
            }
            log.error("[Supabase] Delete failed for {}: {}", publicId, e.getMessage());
            return false;
        }
    }

    @Override
    public boolean isConfigured() {
        return configured;
    }

    @Override
    public StorageType getType() {
        return StorageType.SUPABASE;
    }

    public String buildPublicUrl(String path) {
        return supabaseUrl + "/storage/v1/object/public/" + bucketName + "/" + path;
    }

    // --- Private helpers ---

    private String buildPath(String folder, String fileName) {
        if (folder == null || folder.isBlank()) {
            return fileName;
        }
        folder = folder.replaceAll("^/+|/+$", "");
        return folder + "/" + fileName;
    }

    private String getExtension(String filename) {
        if (filename == null || filename.lastIndexOf('.') == -1) {
            return ".mp3";
        }
        return filename.substring(filename.lastIndexOf('.'));
    }
}
