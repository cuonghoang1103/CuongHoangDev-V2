package com.cuonghoangdev.api_backend.service;

import com.cuonghoangdev.api_backend.dto.MusicTrackDto;
import com.cuonghoangdev.api_backend.entity.MusicTrack;
import com.cuonghoangdev.api_backend.repository.MusicTrackRepository;
import com.cuonghoangdev.api_backend.service.storage.CloudinaryStorageService;
import com.cuonghoangdev.api_backend.service.storage.SupabaseStorageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class MusicTrackService {

    private static final Logger log = LoggerFactory.getLogger(MusicTrackService.class);

    @Autowired
    private MusicTrackRepository musicTrackRepository;

    @Autowired
    private CloudinaryStorageService cloudinaryService;

    @Autowired
    private SupabaseStorageService supabaseService;

    public List<MusicTrackDto> getAllActiveTracks() {
        return musicTrackRepository.findByActiveTrueOrderByCreatedAtDesc()
                .stream()
                .map(MusicTrackDto::fromEntity)
                .collect(Collectors.toList());
    }

    public List<MusicTrackDto> getAllTracks() {
        return musicTrackRepository.findAll()
                .stream()
                .map(MusicTrackDto::fromEntity)
                .collect(Collectors.toList());
    }

    public MusicTrackDto getTrackById(Long id) {
        MusicTrack track = musicTrackRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Track not found: " + id));
        return MusicTrackDto.fromEntity(track);
    }

    @Transactional
    public MusicTrackDto createTrack(MusicTrack track) {
        MusicTrack saved = musicTrackRepository.save(track);
        log.info("[MusicTrack] Created track id={} title='{}' audio={}",
                saved.getId(), saved.getTitle(), saved.getAudioUrl());
        return MusicTrackDto.fromEntity(saved);
    }

    @Transactional
    public MusicTrackDto updateTrack(Long id, MusicTrack updated) {
        MusicTrack track = musicTrackRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Track not found: " + id));

        if (updated.getTitle() != null) track.setTitle(updated.getTitle());
        if (updated.getArtist() != null) track.setArtist(updated.getArtist());
        if (updated.getAudioUrl() != null) track.setAudioUrl(updated.getAudioUrl());
        if (updated.getCoverImage() != null) track.setCoverImage(updated.getCoverImage());
        if (updated.getDurationSeconds() != null) track.setDurationSeconds(updated.getDurationSeconds());
        if (updated.getFileSize() != null) track.setFileSize(updated.getFileSize());
        if (updated.getPublicId() != null) track.setPublicId(updated.getPublicId());
        if (updated.getCloudinaryUrl() != null) track.setCloudinaryUrl(updated.getCloudinaryUrl());
        if (updated.getSupabasePath() != null) track.setSupabasePath(updated.getSupabasePath());
        if (updated.getActive() != null) track.setActive(updated.getActive());

        MusicTrack saved = musicTrackRepository.save(track);
        log.info("[MusicTrack] Updated track id={} title='{}'", saved.getId(), saved.getTitle());
        return MusicTrackDto.fromEntity(saved);
    }

    /**
     * Delete a track and remove its files from storage.
     * Audio is deleted from Supabase, cover image from Cloudinary.
     */
    @Transactional
    public void deleteTrack(Long id) throws IOException {
        MusicTrack track = musicTrackRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Track not found: " + id));

        // Delete audio from Supabase (new storage)
        if (track.getSupabasePath() != null && !track.getSupabasePath().isBlank()) {
            try {
                supabaseService.delete(track.getSupabasePath());
                log.info("[MusicTrack] Deleted audio from Supabase: {}", track.getSupabasePath());
            } catch (IOException e) {
                log.warn("[MusicTrack] Failed to delete audio from Supabase: {}", e.getMessage());
            }
        }

        // Delete audio from Cloudinary (legacy, for backward compatibility)
        if (track.getPublicId() != null && !track.getPublicId().isBlank()) {
            try {
                cloudinaryService.delete(track.getPublicId());
                log.info("[MusicTrack] Deleted audio from Cloudinary: {}", track.getPublicId());
            } catch (IOException e) {
                log.warn("[MusicTrack] Failed to delete audio from Cloudinary: {}", e.getMessage());
            }
        }

        // Delete cover image from Cloudinary
        // Note: coverImage doesn't have a separate publicId stored, so we can't easily delete it.
        // For now we leave cover images in Cloudinary (they're small and cheap).

        log.info("[MusicTrack] Deleted track id={} title='{}'", id, track.getTitle());
        musicTrackRepository.delete(track);
    }
}
