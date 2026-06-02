package com.cuonghoangdev.api_backend.service;

import com.cuonghoangdev.api_backend.dto.MusicTrackDto;
import com.cuonghoangdev.api_backend.entity.MusicTrack;
import com.cuonghoangdev.api_backend.repository.MusicTrackRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class MusicTrackService {

    @Autowired
    private MusicTrackRepository musicTrackRepository;

    @Autowired
    private CloudinaryFileStorageService cloudinaryService;

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
                .orElseThrow(() -> new RuntimeException("Track not found"));
        return MusicTrackDto.fromEntity(track);
    }

    @Transactional
    public MusicTrackDto createTrack(MusicTrack track) {
        MusicTrack saved = musicTrackRepository.save(track);
        return MusicTrackDto.fromEntity(saved);
    }

    @Transactional
    public MusicTrackDto updateTrack(Long id, MusicTrack updated) {
        MusicTrack track = musicTrackRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Track not found"));

        if (updated.getTitle() != null) track.setTitle(updated.getTitle());
        if (updated.getArtist() != null) track.setArtist(updated.getArtist());
        if (updated.getAudioUrl() != null) track.setAudioUrl(updated.getAudioUrl());
        if (updated.getCoverImage() != null) track.setCoverImage(updated.getCoverImage());
        if (updated.getDurationSeconds() != null) track.setDurationSeconds(updated.getDurationSeconds());
        if (updated.getFileSize() != null) track.setFileSize(updated.getFileSize());
        if (updated.getPublicId() != null) track.setPublicId(updated.getPublicId());
        if (updated.getCloudinaryUrl() != null) track.setCloudinaryUrl(updated.getCloudinaryUrl());
        if (updated.getActive() != null) track.setActive(updated.getActive());

        return MusicTrackDto.fromEntity(musicTrackRepository.save(track));
    }

    @Transactional
    public void deleteTrack(Long id) throws IOException {
        MusicTrack track = musicTrackRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Track not found"));

        if (track.getPublicId() != null && !track.getPublicId().isBlank()) {
            cloudinaryService.delete(track.getPublicId());
        }

        musicTrackRepository.delete(track);
    }
}
