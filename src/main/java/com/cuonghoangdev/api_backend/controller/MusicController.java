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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
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
    public ResponseEntity<?> createTrack(@RequestBody MusicUploadRequest request) {
        try {
            MusicTrack track = new MusicTrack();
            track.setTitle(request.getTitle() != null ? request.getTitle() : "Untitled");
            track.setArtist(request.getArtist() != null ? request.getArtist() : "Unknown Artist");
            track.setDurationSeconds(request.getDurationSeconds());
            track.setCoverImage(request.getCoverImageUrl());
            track.setAudioUrl(request.getAudioUrl());
            track.setSupabasePath(request.getSupabasePath());
            track.setActive(request.getActive() != null ? request.getActive() : true);

            MusicTrackDto created = musicTrackService.createTrack(track);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", Map.of(
                            "track", created,
                            "audioUrl", created.getAudioUrl(),
                            "coverUrl", created.getCoverImage()
                    )
            ));
        } catch (Exception e) {
            log.error("[MusicController] Failed to create track", e);
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
                    Admin only. Returns a pre-signed upload URL for direct browser-to-Supabase upload.
                    This bypasses the Vercel body limit entirely — the audio file goes directly
                    from the browser to Supabase Storage.

                    Frontend should:
                    1. Call this endpoint to get the upload URL
                    2. PUT the audio file directly to the `uploadUrl`
                    3. Call POST /admin/tracks with the returned `path` as `supabasePath`
                    """
    )
    @PostMapping("/admin/upload/supabase")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getSupabaseUploadUrl(
            @RequestParam(value = "fileName", defaultValue = "") String fileName,
            @RequestParam(value = "contentType", defaultValue = "audio/mpeg") String contentType
    ) {
        if (!supabaseService.isConfigured()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Supabase Storage is not configured"
            ));
        }

        try {
            String ext = getExtension(fileName);
            String baseName = UUID.randomUUID().toString();
            String path = "tracks/" + baseName + ext;
            String uploadUrl = supabaseService.buildPublicUrl(path);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", Map.of(
                            "path", path,
                            "uploadUrl", uploadUrl,
                            "publicUrl", supabaseService.buildPublicUrl(path)
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
