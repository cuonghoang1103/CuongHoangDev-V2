package com.cuonghoangdev.api_backend.service;

import com.cuonghoangdev.api_backend.dto.MusicPlaylistDto;
import com.cuonghoangdev.api_backend.entity.MusicPlaylist;
import com.cuonghoangdev.api_backend.entity.MusicPlaylistTrack;
import com.cuonghoangdev.api_backend.entity.MusicTrack;
import com.cuonghoangdev.api_backend.entity.User;
import com.cuonghoangdev.api_backend.repository.MusicPlaylistRepository;
import com.cuonghoangdev.api_backend.repository.MusicPlaylistTrackRepository;
import com.cuonghoangdev.api_backend.repository.MusicTrackRepository;
import com.cuonghoangdev.api_backend.repository.UserRepository;
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

    @Autowired
    private UserRepository userRepository;

    public List<MusicPlaylistDto> getAllPublicPlaylists() {
        return playlistRepository.findAllPublic().stream()
                .map(this::toDtoWithCreator)
                .collect(Collectors.toList());
    }

    public List<MusicPlaylistDto> getPlaylistsByUser(Long userId) {
        return playlistRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::toDtoWithCreator)
                .collect(Collectors.toList());
    }

    public MusicPlaylistDto getPlaylistById(Long id) {
        MusicPlaylist playlist = playlistRepository.findWithTracksById(id)
                .orElseThrow(() -> new RuntimeException("Playlist not found: " + id));
        return toDtoWithCreator(playlist);
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
        return getPlaylistById(saved.getId());
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
        return getPlaylistById(saved.getId());
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
            return getPlaylistById(playlistId);
        }

        Integer maxPos = playlistTrackRepository.findMaxPositionByPlaylistId(playlistId);
        int newPos = (maxPos != null ? maxPos : -1) + 1;

        MusicPlaylistTrack pt = new MusicPlaylistTrack(playlist, track, newPos);
        playlistTrackRepository.save(pt);
        log.info("[MusicPlaylist] Added track {} to playlist {} at position {}", trackId, playlistId, newPos);
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

    private MusicPlaylistDto toDtoWithCreator(MusicPlaylist playlist) {
        MusicPlaylistDto dto = MusicPlaylistDto.fromEntity(playlist);
        if (playlist.getUserId() != null) {
            User user = userRepository.findById(playlist.getUserId()).orElse(null);
            if (user != null) {
                dto.createdByName = user.getFullName() != null && !user.getFullName().isBlank()
                        ? user.getFullName()
                        : user.getUsername();
            }
        }
        return dto;
    }
}
