package com.cuonghoangdev.api_backend.controller;

import com.cuonghoangdev.api_backend.dto.MusicTrackDto;
import com.cuonghoangdev.api_backend.dto.MusicUploadRequest;
import com.cuonghoangdev.api_backend.entity.MusicTrack;
import com.cuonghoangdev.api_backend.service.MusicTrackService;
import com.cuonghoangdev.api_backend.service.storage.CloudinaryStorageService;
import com.cuonghoangdev.api_backend.service.storage.SupabaseStorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.Part;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/music")
@CrossOrigin(origins = "*")
@Tag(name = "Music", description = "Music track management — audio stored in Supabase, covers in Cloudinary")
public class MusicController {

    // Simple DTO for the signed URL request body
    public static class SignedUrlRequest {
        public String fileName;
        public String contentType;
    }

    private static final Logger log = LoggerFactory.getLogger(MusicController.class);

    @Autowired
    private MusicTrackService musicTrackService;

    @Autowired
    private CloudinaryStorageService cloudinaryService;

    @Autowired
    private SupabaseStorageService supabaseService;

    // ========================================================================
    // Public endpoints
    // ========================================================================

    @Operation(summary = "Get all active tracks", description = "Public endpoint — anyone can view active music tracks")
    @GetMapping("/tracks")
    public ResponseEntity<?> getTracks() {
        return ResponseEntity.ok(Map.of(
                "success", true,
                "data", musicTrackService.getAllActiveTracks()
        ));
    }

    // ========================================================================
    // Admin endpoints
    // ========================================================================

    @Operation(summary = "Get all tracks (admin)", description = "Admin only — returns all tracks including inactive")
    @ApiResponse(responseCode = "401", description = "Unauthorized")
    @ApiResponse(responseCode = "403", description = "Forbidden — admin role required")
    @GetMapping("/admin/tracks")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllTracksAdmin() {
        return ResponseEntity.ok(Map.of(
                "success", true,
                "data", musicTrackService.getAllTracks()
        ));
    }

    @Operation(summary = "Get single track (admin)", description = "Admin only")
    @ApiResponse(responseCode = "404", description = "Track not found")
    @GetMapping("/admin/tracks/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getTrackAdmin(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", musicTrackService.getTrackById(id)
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    @Operation(
            summary = "Create a music track",
            description = """
                    Admin only. Creates a track record.

                    **Typical flow:**
                    1. Frontend calls POST /admin/upload/supabase → gets uploadUrl
                    2. Frontend PUTs audio file directly to Supabase
                    3. Frontend calls this endpoint with the `audioUrl` from step 2
                    """
    )
    @PostMapping("/admin/tracks")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createTrack(
            @RequestBody MusicUploadRequest request,
            @RequestHeader(value = "Content-Type", required = false) String contentTypeHeader,
            HttpServletRequest httpRequest) {

        log.info("======================================================");
        log.info("[MusicController] ===== createTrack ENTRY POINT =====");
        log.info("[MusicController] HTTP Content-Type header: '{}'", contentTypeHeader);
        log.info("[MusicController] Raw @RequestBody MusicUploadRequest: {}", request);
        log.info("[MusicController]   request.title           = {}", request.getTitle());
        log.info("[MusicController]   request.artist         = {}", request.getArtist());
        log.info("[MusicController]   request.audioUrl       = {}", request.getAudioUrl());
        log.info("[MusicController]   request.supabasePath   = {}", request.getSupabasePath());
        log.info("[MusicController]   request.coverImageUrl = {}", request.getCoverImageUrl());
        log.info("[MusicController]   request.durationSeconds = {}", request.getDurationSeconds());
        log.info("[MusicController]   request.active       = {}", request.getActive());

        try {
            MusicTrack track = new MusicTrack();
            track.setTitle(request.getTitle() != null ? request.getTitle() : "Untitled");
            track.setArtist(request.getArtist() != null ? request.getArtist() : "Unknown Artist");
            track.setDurationSeconds(request.getDurationSeconds());
            track.setCoverImage(request.getCoverImageUrl());
            track.setSupabasePath(request.getSupabasePath());
            track.setActive(request.getActive() != null ? request.getActive() : true);

            // ─── Validation: at least one of audioUrl / supabasePath must be present ───
            String audioUrl = request.getAudioUrl();
            String supabasePath = request.getSupabasePath();
            if ((audioUrl == null || audioUrl.isBlank()) && (supabasePath == null || supabasePath.isBlank())) {
                log.error("[MusicController] VALIDATION FAILED: both audioUrl AND supabasePath are null/blank — rejecting request");
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Validation failed: audioUrl and supabasePath are both missing. At least one is required."
                ));
            }
            log.info("[MusicController] Validation passed — audioUrl='{}', supabasePath='{}'", audioUrl, supabasePath);

            // Fallback: if audioUrl is null/blank but supabasePath is provided,
            // build the public URL from the path using the same logic as SupabaseStorageService
            if ((audioUrl == null || audioUrl.isBlank()) && supabasePath != null && !supabasePath.isBlank()) {
                audioUrl = supabaseService.buildPublicUrl(supabasePath);
                log.info("[MusicController] audioUrl is null/blank — built fallback from supabasePath '{}' -> '{}'",
                        supabasePath, audioUrl);
            }
            track.setAudioUrl(audioUrl);

            log.info("[MusicController] ===== MusicTrack entity BEFORE service call =====");
            log.info("[MusicController]   track.title        = {}", track.getTitle());
            log.info("[MusicController]   track.artist       = {}", track.getArtist());
            log.info("[MusicController]   track.audioUrl     = {}", track.getAudioUrl());
            log.info("[MusicController]   track.supabasePath  = {}", track.getSupabasePath());
            log.info("[MusicController]   track.coverImage   = {}", track.getCoverImage());
            log.info("[MusicController]   track.durationSecs = {}", track.getDurationSeconds());
            log.info("[MusicController]   track.active       = {}", track.getActive());
            log.info("[MusicController]   track.toString()    = {}", track);

            MusicTrackDto created = musicTrackService.createTrack(track);
            log.info("[MusicController] ===== createTrack SUCCESS ===== id={}, audioUrl={}", created.getId(), created.getAudioUrl());
            log.info("======================================================");

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", Map.of(
                            "track", created,
                            "audioUrl", created.getAudioUrl(),
                            "supabasePath", created.getSupabasePath(),
                            "coverUrl", created.getCoverImage()
                    )
            ));
        } catch (Exception e) {
            log.error("[MusicController] ===== createTrack FAILED =====", e);
            log.error("[MusicController] Exception class : {}", e.getClass().getName());
            log.error("[MusicController] Exception message: {}", e.getMessage());
            log.error("[MusicController] Exception cause  : {}", e.getCause());
            log.error("[MusicController] ==============================================");
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Failed to create track: " + e.getMessage()
            ));
        }
    }

    @Operation(
            summary = "Update a music track",
            description = "Admin only. Can update metadata, audio URL, and cover image."
    )
    @PutMapping("/admin/tracks/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateTrack(@PathVariable Long id, @RequestBody MusicUploadRequest request) {
        try {
            MusicTrack updated = new MusicTrack();
            updated.setTitle(request.getTitle());
            updated.setArtist(request.getArtist());
            updated.setDurationSeconds(request.getDurationSeconds());
            updated.setCoverImage(request.getCoverImageUrl());
            // Audio URL may be updated if a new file was uploaded to Supabase
            if (request.getAudioUrl() != null) {
                updated.setAudioUrl(request.getAudioUrl());
            }
            if (request.getSupabasePath() != null) {
                updated.setSupabasePath(request.getSupabasePath());
            }
            updated.setActive(request.getActive());

            MusicTrackDto result = musicTrackService.updateTrack(id, updated);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", result
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    @Operation(summary = "Delete a track", description = "Admin only. Removes files from Supabase and record from DB.")
    @DeleteMapping("/admin/tracks/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteTrack(@PathVariable Long id) {
        try {
            musicTrackService.deleteTrack(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (IOException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Delete failed: " + e.getMessage()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    // ========================================================================
    // Server-side upload (audio → Supabase, cover → Cloudinary)
    // Called when frontend sends both files through this proxy endpoint
    // ========================================================================

    @Operation(
            summary = "Upload audio + cover to storage",
            description = """
                    Admin only. Uploads audio to Supabase Storage and cover image to Cloudinary.
                    Use this for browser-based uploads that need server-side handling.

                    **Bypasses Vercel 4.5MB limit** because:
                    - Audio goes directly from this server to Supabase (not through Vercel)
                    - Supabase has no body size restriction

                    Max audio: 100MB. Cover image is resized to 600x600.
                    """
    )
    @PostMapping("/admin/upload")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> uploadFiles(
            @RequestParam(value = "audio", required = false) MultipartFile audio,
            @RequestParam(value = "cover", required = false) MultipartFile cover,
            @RequestParam(value = "title", defaultValue = "") String title,
            @RequestParam(value = "artist", defaultValue = "") String artist,
            @RequestParam(value = "durationSeconds", defaultValue = "0") int durationSeconds
    ) {
        String audioUrl = null;
        String supabasePath = null;
        String coverUrl = null;
        Long fileSize = null;

        try {
            // 1. Upload audio to Supabase
            if (audio != null && !audio.isEmpty()) {
                log.info("[MusicController] Uploading audio: {} ({} bytes) to Supabase",
                        audio.getOriginalFilename(), audio.getSize());

                // Generate path: tracks/{uuid}.{ext}
                String folder = "tracks";
                String baseName = UUID.randomUUID().toString();
                String ext = getExtension(audio.getOriginalFilename());

                var result = supabaseService.upload(audio, folder, baseName + ext);
                audioUrl = result.getUrl();
                supabasePath = result.getPublicId();
                fileSize = result.getFileSize();

                log.info("[MusicController] Audio uploaded to Supabase: {} ({} bytes) -> {}",
                        audio.getOriginalFilename(), fileSize, audioUrl);
            }

            // 2. Upload cover to Cloudinary (optional)
            if (cover != null && !cover.isEmpty()) {
                log.info("[MusicController] Uploading cover: {} to Cloudinary",
                        cover.getOriginalFilename());

                var coverResult = cloudinaryService.upload(cover, "music-covers", null);
                coverUrl = coverResult.getUrl();

                log.info("[MusicController] Cover uploaded to Cloudinary: {} -> {}",
                        cover.getOriginalFilename(), coverUrl);
            }

            // 3. Create track record
            MusicTrack track = new MusicTrack();
            track.setTitle(title.isBlank() ? audio.getOriginalFilename() : title);
            track.setArtist(artist.isBlank() ? "Unknown Artist" : artist);
            track.setAudioUrl(audioUrl);
            track.setSupabasePath(supabasePath);
            track.setCoverImage(coverUrl);
            track.setDurationSeconds(durationSeconds);
            track.setFileSize(fileSize);
            track.setActive(true);

            MusicTrackDto created = musicTrackService.createTrack(track);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", Map.of(
                            "track", created,
                            "audioUrl", audioUrl,
                            "coverUrl", coverUrl,
                            "supabasePath", supabasePath
                    )
            ));

        } catch (IOException e) {
            log.error("[MusicController] Upload failed", e);
            // Try to clean up uploaded files on failure
            if (supabasePath != null) {
                try { supabaseService.delete(supabasePath); } catch (Exception ignored) {}
            }
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Upload failed: " + e.getMessage()
            ));
        }
    }

    // ========================================================================
    // Supabase upload signature for direct browser upload
    // (Frontend uploads audio directly to Supabase, bypassing this server)
    // ========================================================================

    @Operation(
            summary = "Get Supabase upload URL",
            description = """
                    Admin only. Returns a signed upload URL for direct browser-to-Supabase upload.
                    This bypasses the Vercel body limit entirely — the audio file goes directly
                    from the browser to Supabase Storage.

                    Frontend should:
                    1. Call this endpoint to get the signed uploadUrl
                    2. PUT the audio file directly to the `uploadUrl` (binary body, no auth needed)
                    3. Call POST /admin/tracks with the returned `path` as `supabasePath`
                    """
    )
    @PostMapping("/admin/upload/supabase")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getSupabaseUploadUrl(@RequestBody SignedUrlRequest request) {
        String fileName = (request != null && request.fileName != null) ? request.fileName : "";
        String contentType = (request != null && request.contentType != null) ? request.contentType : "audio/mpeg";
        log.info("[MusicController] /admin/upload/supabase called - configured={}", supabaseService.isConfigured());

        if (!supabaseService.isConfigured()) {
            log.error("[MusicController] Supabase not configured. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars.");
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Supabase Storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
            ));
        }

        try {
            String ext = getExtension(fileName);
            String baseName = UUID.randomUUID().toString();
            String path = "tracks/" + baseName + ext;

            log.info("[MusicController] Creating signed upload URL for path: {}", path);

            // Create signed upload URL valid for 2 hours (7200 seconds)
            String uploadUrl = supabaseService.createSignedUploadUrl(path, 7200);

            log.info("[MusicController] Signed upload URL created: {}", uploadUrl);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", Map.of(
                            "path", path,
                            "uploadUrl", uploadUrl,
                            "publicUrl", supabaseService.buildPublicUrl(path)
                    )
            ));
        } catch (Exception e) {
            log.error("[MusicController] Failed to create Supabase upload URL", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Failed to create upload URL: " + e.getMessage()
            ));
        }
    }

    /**
     * Server-side audio upload — receives file via Jakarta Servlet Part API.
     *
     * Strategy: We use jakarta.servlet.http.Part (not Spring's MultipartFile)
     * to parse the multipart/form-data body. The Part API is a raw servlet API
     * that works without Spring's multipart resolution chain.
     *
     * This bypasses all Spring/Tomcat multipart configuration issues:
     * no StandardServletMultipartResolver, no MultipartConfigElement needed.
     *
     * Frontend: POST /api/v1/music/admin/upload/audio
     *   Content-Type: multipart/form-data
     *   Body: form field "file" = audio binary
     */
    @PostMapping(value = "/admin/upload/audio", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> uploadAudioServerSide(HttpServletRequest request) {
        log.info("[MusicController] /admin/upload/audio called");

        Part filePart;
        try {
            filePart = request.getPart("file");
        } catch (Exception e) {
            log.error("[MusicController] Failed to get 'file' part from request — {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Could not parse multipart request: " + e.getMessage()
                            + ". Make sure Content-Type is multipart/form-data."
            ));
        }

        if (filePart == null || filePart.getSubmittedFileName() == null || filePart.getSize() == 0) {
            log.error("[MusicController] No file received — part is null or empty");
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "No file received. Send a multipart/form-data request with a 'file' field."
            ));
        }

        String submittedFilename = filePart.getSubmittedFileName();
        String contentType = filePart.getContentType();
        long size = filePart.getSize();
        log.info("[MusicController] File received — name: '{}', size: {} bytes, contentType: '{}'",
                submittedFilename, size, contentType);

        if (!supabaseService.isConfigured()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Supabase Storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
            ));
        }

        try {
            // Read bytes once — avoid double-read via temp file
            byte[] bytes = filePart.getInputStream().readAllBytes();

            // Derive contentType from extension if not set
            if (contentType == null || contentType.isBlank()) {
                String ext = getExtension(submittedFilename).toLowerCase();
                contentType = switch (ext) {
                    case ".mp3"  -> "audio/mpeg";
                    case ".wav"  -> "audio/wav";
                    case ".ogg"  -> "audio/ogg";
                    case ".m4a"  -> "audio/mp4";
                    case ".aac"  -> "audio/aac";
                    case ".flac" -> "audio/flac";
                    default      -> "application/octet-stream";
                };
            }

            String path = "tracks/" + UUID.randomUUID() + getExtension(submittedFilename);

            log.info("[MusicController] Uploading {} bytes to Supabase: {}", bytes.length, path);

            var result = supabaseService.upload(bytes, submittedFilename, contentType, "tracks", path);

            log.info("[MusicController] Upload success — publicUrl: {}", result.getUrl());

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", Map.of(
                            "path", result.getPublicId(),
                            "audioUrl", result.getUrl(),
                            "originalName", result.getOriginalFileName(),
                            "fileSize", result.getFileSize()
                    )
            ));
        } catch (IOException e) {
            log.error("[MusicController] Server-side audio upload failed", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Upload failed: " + e.getMessage()
            ));
        } catch (Exception e) {
            log.error("[MusicController] Unexpected error during upload", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Unexpected error: " + e.getMessage()
            ));
        }
    }

    /**
     * RAW BINARY upload — receives the entire request body as bytes.
     *
     * This endpoint accepts a PUT with the raw audio bytes and no Content-Type
     * restrictions. No multipart parsing, no MultipartResolver, no MultipartConfig.
     * The backend reads the body directly as bytes and uploads to Supabase.
     *
     * Frontend sends:
     *   PUT /api/v1/music/admin/upload/audio/raw?filename=mytrack.mp3
     *   Authorization: Bearer <token>
     *   Body: raw binary audio bytes
     */
    @PutMapping("/admin/upload/audio/raw")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> uploadAudioRaw(HttpServletRequest request) {
        String filename = request.getParameter("filename");
        if (filename == null || filename.isBlank()) {
            filename = "track.mp3";
        }
        log.info("[MusicController] /admin/upload/audio/raw called — filename: {}", filename);

        if (!supabaseService.isConfigured()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Supabase Storage is not configured."
            ));
        }

        try {
            byte[] bytes = request.getInputStream().readAllBytes();
            log.info("[MusicController] Received {} bytes", bytes.length);

            if (bytes.length == 0) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Empty request body — no file data received."
                ));
            }

            String contentType = request.getContentType();
            String ext = getExtension(filename);

            String path = "tracks/" + UUID.randomUUID() + ext;
            log.info("[MusicController] Calling supabaseService.upload(byte[]) — path='{}', size={} bytes", path, bytes.length);

            var result = supabaseService.upload(bytes, filename, contentType != null ? contentType : "audio/mpeg", "tracks", path);

            log.info("[MusicController] ===== Supabase upload SUCCESS =====");
            log.info("[MusicController]   result.publicId        = {}", result.getPublicId());
            log.info("[MusicController]   result.url             = {}", result.getUrl());
            log.info("[MusicController]   result.fileSize       = {} bytes", result.getFileSize());

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", Map.of(
                            "path", result.getPublicId(),
                            "audioUrl", result.getUrl(),
                            "supabasePath", result.getPublicId(),
                            "originalName", result.getOriginalFileName(),
                            "fileSize", result.getFileSize()
                    )
            ));
        } catch (IOException e) {
            log.error("[MusicController] ===== Supabase upload FAILED (IOException) =====", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Upload failed: " + e.getMessage()
            ));
        } catch (Exception e) {
            log.error("[MusicController] ===== Supabase upload FAILED (Exception) =====", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Unexpected error: " + e.getMessage()
            ));
        }
    }

    /**
     * Convert a Jakarta Servlet Part to a Spring MultipartFile.
     * This lets us reuse the existing SupabaseStorageService without modification.
     */
    private MultipartFile convertPartToMultipartFile(Part part, String filename) throws IOException {
        String contentType = part.getContentType();
        if (contentType == null || contentType.isBlank()) {
            String ext = getExtension(filename).toLowerCase();
            contentType = switch (ext) {
                case ".mp3"  -> "audio/mpeg";
                case ".wav"  -> "audio/wav";
                case ".ogg"  -> "audio/ogg";
                case ".m4a"  -> "audio/mp4";
                case ".aac"  -> "audio/aac";
                case ".flac" -> "audio/flac";
                default      -> "application/octet-stream";
            };
        }

        byte[] bytes = part.getInputStream().readAllBytes();
        return new org.springframework.mock.web.MockMultipartFile(
                filename, filename, contentType, bytes);
    }

    // ========================================================================
    // Cloudinary upload signature (for direct cover image upload)
    // ========================================================================

    @Operation(
            summary = "Get Cloudinary upload signature",
            description = "Admin only. Returns signed params for direct browser-to-Cloudinary cover image upload."
    )
    @PostMapping("/admin/upload/cloudinary")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getCloudinarySignature(
            @RequestParam(value = "folder", defaultValue = "music-covers") String folder
    ) {
        if (!cloudinaryService.isConfigured()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Cloudinary is not configured"
            ));
        }

        try {
            long timestamp = System.currentTimeMillis() / 1000;
            String publicId = timestamp + "_" + UUID.randomUUID().toString().substring(0, 8);

            String toSign = "folder=" + folder + "&public_id=" + publicId + "&timestamp=" + timestamp
                    + cloudinaryService.getApiSecret();
            String signature = cloudinaryService.sign(toSign);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", Map.of(
                            "cloudName", cloudinaryService.getCloudName(),
                            "apiKey", cloudinaryService.getApiKey(),
                            "timestamp", timestamp,
                            "signature", signature,
                            "folder", folder,
                            "publicId", publicId
                    )
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    // ========================================================================
    // Helpers
    // ========================================================================

    private String getExtension(String filename) {
        if (filename == null || filename.lastIndexOf('.') == -1) {
            return ".mp3";
        }
        return filename.substring(filename.lastIndexOf('.')).toLowerCase();
    }
}
