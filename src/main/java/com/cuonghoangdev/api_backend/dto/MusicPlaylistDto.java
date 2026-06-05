package com.cuonghoangdev.api_backend.dto;

import com.cuonghoangdev.api_backend.entity.MusicPlaylist;
import com.cuonghoangdev.api_backend.entity.MusicPlaylistTrack;
import com.cuonghoangdev.api_backend.entity.MusicTrack;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

public class MusicPlaylistDto {

    public Long id;
    public String name;
    public String description;
    public String coverUrl;
    public Long userId;
    public String createdByName;
    public Boolean isPublic;
    public int trackCount;
    public int totalDurationSeconds;
    public List<MusicTrackDto> tracks;
    public LocalDateTime createdAt;
    public LocalDateTime updatedAt;

    public MusicPlaylistDto() {}

    public static MusicPlaylistDto fromEntity(MusicPlaylist playlist) {
        MusicPlaylistDto dto = new MusicPlaylistDto();
        dto.id = playlist.getId();
        dto.name = playlist.getName();
        dto.description = playlist.getDescription();
        dto.coverUrl = playlist.getCoverUrl();
        dto.userId = playlist.getUserId();
        dto.isPublic = playlist.getIsPublic();
        dto.createdAt = playlist.getCreatedAt();
        dto.updatedAt = playlist.getUpdatedAt();

        List<MusicPlaylistTrack> pts = playlist.getPlaylistTracks();
        dto.trackCount = pts != null ? pts.size() : 0;
        dto.totalDurationSeconds = pts != null
                ? pts.stream()
                        .filter(pt -> pt.getTrack() != null && pt.getTrack().getDurationSeconds() != null)
                        .mapToInt(pt -> pt.getTrack().getDurationSeconds())
                        .sum()
                : 0;

        if (pts != null && !pts.isEmpty()) {
            dto.tracks = pts.stream()
                    .map(pt -> MusicTrackDto.fromEntity(pt.getTrack()))
                    .collect(Collectors.toList());
            if (dto.coverUrl == null || dto.coverUrl.isBlank()) {
                MusicTrack firstTrack = pts.get(0).getTrack();
                if (firstTrack != null && firstTrack.getCoverImage() != null) {
                    dto.coverUrl = firstTrack.getCoverImage();
                }
            }
        } else {
            dto.tracks = List.of();
        }

        return dto;
    }

    public static MusicPlaylistDto fromEntityLight(MusicPlaylist playlist) {
        MusicPlaylistDto dto = new MusicPlaylistDto();
        dto.id = playlist.getId();
        dto.name = playlist.getName();
        dto.description = playlist.getDescription();
        dto.coverUrl = playlist.getCoverUrl();
        dto.userId = playlist.getUserId();
        dto.isPublic = playlist.getIsPublic();
        dto.createdAt = playlist.getCreatedAt();
        dto.updatedAt = playlist.getUpdatedAt();
        dto.tracks = null;
        dto.trackCount = playlist.getPlaylistTracks() != null ? playlist.getPlaylistTracks().size() : 0;
        dto.totalDurationSeconds = 0;
        return dto;
    }
}
