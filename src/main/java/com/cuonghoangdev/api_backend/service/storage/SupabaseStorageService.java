package com.cuonghoangdev.api_backend.service.storage;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClientException;
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
        this.supabaseUrl = normalizeUrl(supabaseUrl);
        this.serviceRoleKey = serviceRoleKey;
        this.anonKey = anonKey;
        this.bucketName = bucketName;
        this.restTemplate = buildRestTemplate();

        // Validate configuration at startup
        this.configured = validateConfiguration();

        if (!this.configured) {
            log.error("============================================================");
            log.error("  SUPABASE STORAGE IS NOT CONFIGURED!");
            log.error("  Upload will FAIL. Please set these environment variables:");
            log.error("    - SUPABASE_URL          (e.g. https://your-project.supabase.co)");
            log.error("    - SUPABASE_ANON_KEY     (from Project Settings > API)");
            log.error("    - SUPABASE_SERVICE_ROLE_KEY (from Project Settings > API)");
            log.error("============================================================");
        } else {
            log.info("[Supabase] Initialized — bucket='{}', url='{}', anonKey set={}, serviceRoleKey set={}",
                    bucketName, supabaseUrl,
                    anonKey != null && !anonKey.isBlank(),
                    serviceRoleKey != null && !serviceRoleKey.isBlank());
        }
    }

    /**
     * Normalize URL: remove trailing slashes and whitespace.
     */
    private String normalizeUrl(String url) {
        if (url == null) return null;
        String trimmed = url.trim();
        return trimmed.endsWith("/") ? trimmed.substring(0, trimmed.length() - 1) : trimmed;
    }

    /**
     * Validate configuration at startup — logs exactly what is missing.
     */
    private boolean validateConfiguration() {
        if (supabaseUrl == null || supabaseUrl.isBlank()) {
            log.error("[Supabase] SUPABASE_URL is NOT set or is blank");
            return false;
        }
        if (!supabaseUrl.startsWith("https://")) {
            log.warn("[Supabase] SUPABASE_URL should start with https:// (got: {})", supabaseUrl);
        }
        if (supabaseUrl.contains("your-project") || supabaseUrl.contains("example")) {
            log.error("[Supabase] SUPABASE_URL appears to be a placeholder: {}", supabaseUrl);
            return false;
        }
        if (serviceRoleKey == null || serviceRoleKey.isBlank()) {
            log.error("[Supabase] SUPABASE_SERVICE_ROLE_KEY is NOT set");
            return false;
        }
        // service role key must be a valid JWT format (starts with eyJ)
        if (!serviceRoleKey.trim().startsWith("eyJ")) {
            log.warn("[Supabase] SUPABASE_SERVICE_ROLE_KEY doesn't look like a valid JWT (should start with 'eyJ...')");
        }
        if (anonKey == null || anonKey.isBlank()) {
            log.warn("[Supabase] SUPABASE_ANON_KEY is NOT set — using service role key for apikey header");
        } else if (!anonKey.trim().startsWith("sb_")) {
            log.warn("[Supabase] SUPABASE_ANON_KEY doesn't look right (should start with 'sb_...')");
        }
        return true;
    }

    /**
     * Build a RestTemplate with connection and read timeouts.
     */
    private RestTemplate buildRestTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(15_000);  // 15 seconds to establish connection
        factory.setReadTimeout(30_000);     // 30 seconds to read response
        RestTemplate template = new RestTemplate(factory);
        return template;
    }

    @Override
    public StorageResult upload(MultipartFile file, String folder, String fileName) throws IOException {
        if (!configured) {
            throw new IOException("Supabase Storage is not configured. " +
                    "Set SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY.");
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

        // ContentType may be null/blank when browser doesn't send it (especially for audio files).
        // Try to derive from file extension as fallback.
        if (contentType == null || contentType.trim().isEmpty()) {
            String ext = getExtension(originalName).toLowerCase();
            contentType = switch (ext) {
                case ".mp3"  -> "audio/mpeg";
                case ".wav"  -> "audio/wav";
                case ".ogg"  -> "audio/ogg";
                case ".m4a"  -> "audio/mp4";
                case ".aac"  -> "audio/aac";
                case ".flac" -> "audio/flac";
                case ".wma"  -> "audio/x-ms-wma";
                case ".aiff" -> "audio/aiff";
                default      -> "audio/mpeg"; // safe default for music files
            };
            log.info("[Supabase] ContentType was null/empty, derived from extension '{}' -> '{}'", ext, contentType);
        }

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
            // Server-side upload requires service role key (bypasses RLS)
            headers.set("Authorization", "Bearer " + serviceRoleKey);

            HttpEntity<byte[]> request = new HttpEntity<>(
                    Files.readAllBytes(tempFile.toPath()), headers);

            log.info("[Supabase] PUT to: {}", uploadUrl);

            ResponseEntity<Void> response = restTemplate.exchange(
                    uploadUrl,
                    HttpMethod.PUT,
                    request,
                    Void.class
            );

            if (response.getStatusCode().is2xxSuccessful()) {
                String publicUrl = buildPublicUrl(path);

                log.info("[Supabase] Upload success: {} -> {}", path, publicUrl);

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
            log.error("[Supabase] Upload HTTP error [{}]: {}", e.getStatusCode(), body);
            throw new IOException("Supabase upload failed [" + e.getStatusCode() + "]: " + body);
        } catch (ResourceAccessException e) {
            log.error("[Supabase] Upload connection error: {} — Cause: {}", e.getMessage(), e.getCause());
            throw new IOException("Cannot reach Supabase: " + e.getMessage() +
                    ". Check SUPABASE_URL is correct and Supabase is accessible.");
        } catch (RestClientException e) {
            log.error("[Supabase] Upload unexpected error: {}", e.getMessage());
            throw new IOException("Supabase upload error: " + e.getMessage());
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
        } catch (ResourceAccessException e) {
            log.error("[Supabase] Delete connection error for {}: {}", publicId, e.getMessage());
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
            throw new IOException("Supabase Storage is not configured. " +
                    "Set SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY.");
        }

        if (path == null || path.isBlank()) {
            throw new IOException("Storage path cannot be empty");
        }

        // Determine effective apikey — prefer anon key, fall back to service role key
        String effectiveApikey = (anonKey != null && !anonKey.isBlank()) ? anonKey : serviceRoleKey;
        if (effectiveApikey == null || effectiveApikey.isBlank()) {
            throw new IOException("No Supabase key available — SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are both unset");
        }

        // Use anon key for the /upload/sign endpoint headers
        // (this endpoint requires anon-level auth, not service role)
        String signUrl = supabaseUrl + "/storage/v1/object/upload/sign/" + bucketName + "/" + path;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("apikey", effectiveApikey);
        headers.set("Authorization", "Bearer " + effectiveApikey);

        String requestBody = String.format("{\"expiresIn\": %d}", expiresInSeconds);
        HttpEntity<String> request = new HttpEntity<>(requestBody, headers);

        log.info("[Supabase] POST /upload/sign — bucket='{}', path='{}', expires={}s",
                bucketName, path, expiresInSeconds);
        log.info("[Supabase] Headers — apikey: '{}...', auth: Bearer '{}...'",
                effectiveApikey.substring(0, Math.min(10, effectiveApikey.length())),
                effectiveApikey.substring(0, Math.min(10, effectiveApikey.length())));

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    signUrl,
                    HttpMethod.POST,
                    request,
                    Map.class
            );

            log.info("[Supabase] Sign response: HTTP {} — body: {}",
                    response.getStatusCode(), response.getBody());

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                String signedPath = (String) response.getBody().get("url");
                String token = (String) response.getBody().get("token");

                if (signedPath == null) {
                    throw new IOException("Supabase returned null signed URL path. Body: " + response.getBody());
                }

                // Build base URL: signedPath from Supabase may be absolute or relative
                String baseUrl = signedPath.startsWith("http") ? signedPath : supabaseUrl + signedPath;

                // Append query params — both apikey AND token are REQUIRED
                String separator = baseUrl.contains("?") ? "&" : "?";

                // apikey: URL-encode to handle special chars (_ -) in anon keys
                String encodedApikey = URLEncoder.encode(effectiveApikey, StandardCharsets.UTF_8);
                String uploadUrl = baseUrl + separator + "apikey=" + encodedApikey;

                // token: HMAC signature from Supabase — without this, PUT will be rejected
                if (token != null && !token.isBlank()) {
                    String encodedToken = URLEncoder.encode(token, StandardCharsets.UTF_8);
                    uploadUrl += "&token=" + encodedToken;
                }

                log.info("[Supabase] Signed URL ready — final URL has {} chars", uploadUrl.length());
                return uploadUrl;
            } else {
                throw new IOException("Failed to create signed URL: HTTP " + response.getStatusCode() +
                        ", body: " + response.getBody());
            }
        } catch (HttpClientErrorException e) {
            String bodyStr = e.getResponseBodyAsString();
            log.error("[Supabase] Sign HTTP error [{}]: {}", e.getStatusCode(), bodyStr);
            throw new IOException("Supabase sign endpoint [" + e.getStatusCode() + "]: " + bodyStr);
        } catch (HttpServerErrorException e) {
            String bodyStr = e.getResponseBodyAsString();
            log.error("[Supabase] Sign server error [{}]: {}", e.getStatusCode(), bodyStr);
            throw new IOException("Supabase server error [" + e.getStatusCode() + "]: " + bodyStr);
        } catch (ResourceAccessException e) {
            // This is the I/O error the user is seeing — connection failure
            log.error("[Supabase] Sign CONNECTION FAILED: {}", e.getMessage());
            log.error("[Supabase] Likely causes: 1) Wrong SUPABASE_URL, 2) Network blocked, 3) Supabase is down");
            log.error("[Supabase] SUPABASE_URL used: {}", supabaseUrl);
            throw new IOException("Cannot connect to Supabase at '" + supabaseUrl +
                    "': " + e.getMessage() +
                    ". Verify SUPABASE_URL is correct and Supabase is accessible from this server.");
        } catch (RestClientException e) {
            log.error("[Supabase] Sign unexpected error: {}", e.getMessage());
            throw new IOException("Supabase sign error: " + e.getMessage());
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
        return filename.substring(filename.lastIndexOf('.')).toLowerCase();
    }
}
