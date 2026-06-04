package com.cuonghoangdev.api_backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "music_playlist_tracks",
        uniqueConstraints = @UniqueConstraint(columnNames = {"playlist_id", "track_id"}))
public class MusicPlaylistTrack {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "playlist_id", nullable = false)
    private MusicPlaylist playlist;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "track_id", nullable = false)
    private MusicTrack track;

    @Column(name = "position")
    private Integer position = 0;

    @Column(name = "added_at")
    private java.time.LocalDateTime addedAt;

    public MusicPlaylistTrack() {}

    public MusicPlaylistTrack(MusicPlaylist playlist, MusicTrack track, int position) {
        this.playlist = playlist;
        this.track = track;
        this.position = position;
        this.addedAt = java.time.LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public MusicPlaylist getPlaylist() { return playlist; }
    public void setPlaylist(MusicPlaylist playlist) { this.playlist = playlist; }
    public MusicTrack getTrack() { return track; }
    public void setTrack(MusicTrack track) { this.track = track; }
    public Integer getPosition() { return position; }
    public void setPosition(Integer position) { this.position = position; }
    public java.time.LocalDateTime getAddedAt() { return addedAt; }
    public void setAddedAt(java.time.LocalDateTime addedAt) { this.addedAt = addedAt; }
}
