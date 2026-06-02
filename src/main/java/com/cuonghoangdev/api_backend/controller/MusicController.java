package com.cuonghoangdev.api_backend.controller;

import com.cuonghoangdev.api_backend.dto.ApiResponse;
import com.cuonghoangdev.api_backend.dto.MusicTrackDto;
import com.cuonghoangdev.api_backend.entity.MusicTrack;
import com.cuonghoangdev.api_backend.service.MusicTrackService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/music")
@CrossOrigin(origins = "*")
public class MusicController {

    @Autowired
    private MusicTrackService musicTrackService;

    @Autowired
    private com.cuonghoangdev.api_backend.service.CloudinaryFileStorageService cloudinaryService;

    // Public: anyone can view active tracks
    @GetMapping("/tracks")
    public ResponseEntity<?> getTracks() {
        return ResponseEntity.ok(Map.of(
            "success", true,
            "data", musicTrackService.getAllActiveTracks()
        ));
    }

    // Admin: get all tracks including inactive
    @GetMapping("/admin/tracks")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllTracksAdmin() {
        return ResponseEntity.ok(Map.of(
            "success", true,
            "data", musicTrackService.getAllTracks()
        ));
    }

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

    @PostMapping("/admin/tracks")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createTrack(@RequestBody MusicTrack track) {
        MusicTrackDto created = musicTrackService.createTrack(track);
        return ResponseEntity.ok(Map.of(
            "success", true,
            "data", created
        ));
    }

    @PutMapping("/admin/tracks/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateTrack(@PathVariable Long id, @RequestBody MusicTrack track) {
        try {
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", musicTrackService.updateTrack(id, track)
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }

    @DeleteMapping("/admin/tracks/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteTrack(@PathVariable Long id) {
        try {
            musicTrackService.deleteTrack(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (IOException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Xoa file that bai: " + e.getMessage()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }

    // Upload audio file to Cloudinary
    @PostMapping("/admin/upload")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> uploadAudio(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "title", defaultValue = "") String title,
            @RequestParam(value = "artist", defaultValue = "") String artist,
            @RequestParam(value = "coverUrl", defaultValue = "") String coverUrl,
            @RequestParam(value = "durationSeconds", defaultValue = "0") int durationSeconds) {

        try {
            var result = cloudinaryService.upload(file, "music");

            MusicTrack track = new MusicTrack();
            track.setTitle(title.isBlank() ? file.getOriginalFilename() : title);
            track.setArtist(artist.isBlank() ? "Unknown Artist" : artist);
            track.setAudioUrl(result.getUrl());
            track.setCoverImage(coverUrl.isBlank() ? null : coverUrl);
            track.setDurationSeconds(durationSeconds);
            track.setFileSize(result.getFileSize());
            track.setPublicId(result.getPublicId());
            track.setCloudinaryUrl(result.getUrl());
            track.setActive(true);

            MusicTrackDto created = musicTrackService.createTrack(track);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", Map.of(
                    "track", created,
                    "url", result.getUrl(),
                    "publicId", result.getPublicId()
                )
            ));
        } catch (IOException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Upload failed: " + e.getMessage()
            ));
        }
    }

    private String formatDuration(int seconds) {
        int m = seconds / 60;
        int s = seconds % 60;
        return String.format("%d:%02d", m, s);
    }
}
