package com.cuonghoangdev.api_backend.service;

import com.cuonghoangdev.api_backend.dto.MusicPlaylistDto;
import com.cuonghoangdev.api_backend.entity.MusicPlaylist;
import com.cuonghoangdev.api_backend.entity.MusicPlaylistTrack;
import com.cuonghoangdev.api_backend.entity.MusicTrack;
import com.cuonghoangdev.api_backend.repository.MusicPlaylistRepository;
import com.cuonghoangdev.api_backend.repository.MusicPlaylistTrackRepository;
import com.cuonghoangdev.api_backend.repository.MusicTrackRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class MusicPlaylistService {

    private static final Logger log = LoggerFactory.getLogger(MusicPlaylistService.class);

    @Autowired
    private MusicPlaylistRepository playlistRepository;

    @Autowired
    private MusicPlaylistTrackRepository playlistTrackRepository;

    @Autowired
    private MusicTrackRepository trackRepository;

    public List<MusicPlaylistDto> getAllPublicPlaylists() {
        return playlistRepository.findAllPublic().stream()
                .map(MusicPlaylistDto::fromEntityLight)
                .collect(Collectors.toList());
    }

    public List<MusicPlaylistDto> getPlaylistsByUser(Long userId) {
        return playlistRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(MusicPlaylistDto::fromEntity)
                .collect(Collectors.toList());
    }

    public MusicPlaylistDto getPlaylistById(Long id) {
        MusicPlaylist playlist = playlistRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Playlist not found: " + id));
        return MusicPlaylistDto.fromEntity(playlist);
    }

    @Transactional
    public MusicPlaylistDto createPlaylist(String name, String description, String coverUrl, Long userId) {
        MusicPlaylist playlist = new MusicPlaylist(name);
        playlist.setDescription(description);
        playlist.setCoverUrl(coverUrl);
        playlist.setUserId(userId);
        playlist.setIsPublic(true);
        MusicPlaylist saved = playlistRepository.save(playlist);
        log.info("[MusicPlaylist] Created playlist id={} name='{}' cover='{}' userId={}", saved.getId(), name, coverUrl, userId);
        return MusicPlaylistDto.fromEntity(saved);
    }

    @Transactional
    public MusicPlaylistDto updatePlaylist(Long id, String name, String description, String coverUrl) {
        MusicPlaylist playlist = playlistRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Playlist not found: " + id));
        if (name != null && !name.isBlank()) playlist.setName(name);
        if (description != null) playlist.setDescription(description);
        if (coverUrl != null) playlist.setCoverUrl(coverUrl);
        MusicPlaylist saved = playlistRepository.save(playlist);
        log.info("[MusicPlaylist] Updated playlist id={}", saved.getId());
        return MusicPlaylistDto.fromEntity(saved);
    }

    @Transactional
    public void deletePlaylist(Long id) {
        if (!playlistRepository.existsById(id)) {
            throw new RuntimeException("Playlist not found: " + id);
        }
        playlistRepository.deleteById(id);
        log.info("[MusicPlaylist] Deleted playlist id={}", id);
    }

    @Transactional
    public MusicPlaylistDto addTrackToPlaylist(Long playlistId, Long trackId) {
        MusicPlaylist playlist = playlistRepository.findById(playlistId)
                .orElseThrow(() -> new RuntimeException("Playlist not found: " + playlistId));
        MusicTrack track = trackRepository.findById(trackId)
                .orElseThrow(() -> new RuntimeException("Track not found: " + trackId));

        if (playlistTrackRepository.existsByPlaylistIdAndTrackId(playlistId, trackId)) {
            log.info("[MusicPlaylist] Track {} already in playlist {}, skipping", trackId, playlistId);
            return MusicPlaylistDto.fromEntity(playlist);
        }

        Integer maxPos = playlistTrackRepository.findMaxPositionByPlaylistId(playlistId);
        int newPos = maxPos + 1;

        MusicPlaylistTrack pt = new MusicPlaylistTrack(playlist, track, newPos);
        playlistTrackRepository.save(pt);
        log.info("[MusicPlaylist] Added track {} to playlist {} at position {}", trackId, playlistId, newPos);

        // Refresh playlist to get updated tracks
        return getPlaylistById(playlistId);
    }

    @Transactional
    public MusicPlaylistDto removeTrackFromPlaylist(Long playlistId, Long trackId) {
        if (!playlistRepository.existsById(playlistId)) {
            throw new RuntimeException("Playlist not found: " + playlistId);
        }
        playlistTrackRepository.deleteByPlaylistIdAndTrackId(playlistId, trackId);
        log.info("[MusicPlaylist] Removed track {} from playlist {}", trackId, playlistId);
        return getPlaylistById(playlistId);
    }
}
