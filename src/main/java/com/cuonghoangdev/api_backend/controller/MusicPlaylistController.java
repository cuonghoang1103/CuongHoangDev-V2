package com.cuonghoangdev.api_backend.controller;

import com.cuonghoangdev.api_backend.dto.ApiResponse;
import com.cuonghoangdev.api_backend.dto.MusicPlaylistDto;
import com.cuonghoangdev.api_backend.security.UserPrincipal;
import com.cuonghoangdev.api_backend.service.MusicPlaylistService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/music/playlists")
@Tag(name = "Music Playlists", description = "Create and manage music playlists")
public class MusicPlaylistController {

    private static final Logger log = LoggerFactory.getLogger(MusicPlaylistController.class);

    @Autowired
    private MusicPlaylistService playlistService;

    @GetMapping
    @Operation(summary = "List all public playlists")
    public ResponseEntity<ApiResponse<List<MusicPlaylistDto>>> getAllPlaylists() {
        List<MusicPlaylistDto> playlists = playlistService.getAllPublicPlaylists();
        return ResponseEntity.ok(ApiResponse.ok(playlists));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a playlist by ID with all tracks")
    public ResponseEntity<ApiResponse<MusicPlaylistDto>> getPlaylist(@PathVariable Long id) {
        MusicPlaylistDto playlist = playlistService.getPlaylistById(id);
        return ResponseEntity.ok(ApiResponse.ok(playlist));
    }

    @PostMapping
    @Operation(summary = "Create a new playlist")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<MusicPlaylistDto>> createPlaylist(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        String name = (String) body.getOrDefault("name", "");
        String description = (String) body.getOrDefault("description", "");
        String coverUrl = (String) body.getOrDefault("coverUrl", null);
        if (name == null || name.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Playlist name is required"));
        }
        Long userId = principal != null ? principal.getId() : null;
        MusicPlaylistDto created = playlistService.createPlaylist(name, description, coverUrl, userId);
        return ResponseEntity.ok(ApiResponse.ok("Playlist created", created));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a playlist name / description / cover")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<MusicPlaylistDto>> updatePlaylist(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body
    ) {
        String name = (String) body.get("name");
        String description = (String) body.get("description");
        String coverUrl = (String) body.get("coverUrl");
        MusicPlaylistDto updated = playlistService.updatePlaylist(id, name, description, coverUrl);
        return ResponseEntity.ok(ApiResponse.ok("Playlist updated", updated));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a playlist")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> deletePlaylist(@PathVariable Long id) {
        playlistService.deletePlaylist(id);
        return ResponseEntity.ok(ApiResponse.ok("Playlist deleted", null));
    }

    @PostMapping("/{playlistId}/tracks/{trackId}")
    @Operation(summary = "Add a track to a playlist")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<MusicPlaylistDto>> addTrack(
            @PathVariable Long playlistId,
            @PathVariable Long trackId
    ) {
        log.info("[PlaylistController] addTrack playlistId={} trackId={}", playlistId, trackId);
        MusicPlaylistDto updated = playlistService.addTrackToPlaylist(playlistId, trackId);
        return ResponseEntity.ok(ApiResponse.ok("Track added to playlist", updated));
    }

    @DeleteMapping("/{playlistId}/tracks/{trackId}")
    @Operation(summary = "Remove a track from a playlist")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<MusicPlaylistDto>> removeTrack(
            @PathVariable Long playlistId,
            @PathVariable Long trackId
    ) {
        log.info("[PlaylistController] removeTrack playlistId={} trackId={}", playlistId, trackId);
        MusicPlaylistDto updated = playlistService.removeTrackFromPlaylist(playlistId, trackId);
        return ResponseEntity.ok(ApiResponse.ok("Track removed from playlist", updated));
    }
}
