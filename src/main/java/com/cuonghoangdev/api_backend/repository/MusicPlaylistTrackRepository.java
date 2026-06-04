package com.cuonghoangdev.api_backend.repository;

import com.cuonghoangdev.api_backend.entity.MusicPlaylistTrack;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MusicPlaylistTrackRepository extends JpaRepository<MusicPlaylistTrack, Long> {

    List<MusicPlaylistTrack> findByPlaylistIdOrderByPositionAsc(Long playlistId);

    Optional<MusicPlaylistTrack> findByPlaylistIdAndTrackId(Long playlistId, Long trackId);

    boolean existsByPlaylistIdAndTrackId(Long playlistId, Long trackId);

    void deleteByPlaylistIdAndTrackId(Long playlistId, Long trackId);

    @Query("SELECT COALESCE(MAX(mpt.position), -1) FROM MusicPlaylistTrack mpt WHERE mpt.playlist.id = :playlistId")
    Integer findMaxPositionByPlaylistId(@Param("playlistId") Long playlistId);
}
