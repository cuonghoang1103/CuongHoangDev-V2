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
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.Map;
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
    private final String anonKey;
    private final String bucketName;
    private final boolean configured;
    private final RestTemplate restTemplate;

    private static final long MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

    public SupabaseStorageService(
            @Value("${supabase.url:}") String supabaseUrl,
            @Value("${supabase.service-role-key:}") String serviceRoleKey,
            @Value("${supabase.anon-key:}") String anonKey,
            @Value("${supabase.bucket:music-tracks}") String bucketName
    ) {
        this.supabaseUrl = supabaseUrl;
        this.serviceRoleKey = serviceRoleKey;
        this.anonKey = anonKey;
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

    /**
     * Creates a signed upload URL for direct browser-to-Supabase uploads.
     * This bypasses the Vercel 4.5MB limit because the file goes directly
     * from the browser to Supabase.
     *
     * @param path  The storage path, e.g. "tracks/uuid.mp3"
     * @param expiresInSeconds How long the signed URL is valid (default 2 hours)
     * @return Upload URL that accepts a PUT request with the file body
     * @throws IOException if Supabase is not configured or request fails
     */
    public String createSignedUploadUrl(String path, int expiresInSeconds) throws IOException {
        if (!configured) {
            throw new IOException("Supabase Storage is not configured");
        }

        // Supabase Storage API: POST /storage/v1/object/upload/sign/{bucket}/{path}
        // Headers: apikey=anon_key, Authorization=Bearer anon_key (NOT service role key)
        String effectiveApikey = (anonKey != null && !anonKey.isBlank()) ? anonKey : serviceRoleKey;
        String signUrl = supabaseUrl + "/storage/v1/object/upload/sign/" + bucketName + "/" + path;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        // Supabase requires both apikey and Authorization to match and use the anon key
        headers.set("apikey", effectiveApikey);
        headers.set("Authorization", "Bearer " + effectiveApikey);

        String requestBody = String.format("{\"expiresIn\": %d}", expiresInSeconds);
        HttpEntity<String> request = new HttpEntity<>(requestBody, headers);

        try {
            log.info("[Supabase] Creating signed upload URL for path: {}, expires: {}s", path, expiresInSeconds);
            log.info("[Supabase] Using apikey: {}...", effectiveApikey.substring(0, Math.min(10, effectiveApikey.length())));

            ResponseEntity<Map> response = restTemplate.exchange(
                    signUrl,
                    HttpMethod.POST,
                    request,
                    Map.class
            );

            log.info("[Supabase] Sign response status: {}, body: {}", response.getStatusCode(), response.getBody());

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                String signedPath = (String) response.getBody().get("url");
                String token = (String) response.getBody().get("token");

                if (signedPath == null) {
                    throw new IOException("Supabase returned null signed URL path. Body: " + response.getBody());
                }

                // Build base URL: signedPath may be absolute or relative
                String baseUrl = signedPath.startsWith("http") ? signedPath : supabaseUrl + signedPath;

                // Append query params: apikey (URL-encoded) AND token (critical for HMAC validation)
                String separator = baseUrl.contains("?") ? "&" : "?";

                // apikey MUST be URL-encoded — anon keys contain _ and -
                String encodedApikey = URLEncoder.encode(effectiveApikey, StandardCharsets.UTF_8);
                String uploadUrl = baseUrl + separator + "apikey=" + encodedApikey;

                // token is the HMAC signature from Supabase — REQUIRED for the upload to be valid
                if (token != null && !token.isBlank()) {
                    String encodedToken = URLEncoder.encode(token, StandardCharsets.UTF_8);
                    uploadUrl += "&token=" + encodedToken;
                }

                log.info("[Supabase] Final signed upload URL: {}", uploadUrl);
                return uploadUrl;
            } else {
                throw new IOException("Failed to create signed upload URL: HTTP " + response.getStatusCode() + ", body: " + response.getBody());
            }
        } catch (HttpClientErrorException e) {
            String bodyStr = e.getResponseBodyAsString();
            log.error("[Supabase] Signed URL creation failed [{}]: {}", e.getStatusCode(), bodyStr);
            throw new IOException("Supabase API error [" + e.getStatusCode() + "]: " + bodyStr);
        }
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
