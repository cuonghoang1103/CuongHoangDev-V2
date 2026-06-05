package com.cuonghoangdev.api_backend.repository;

import com.cuonghoangdev.api_backend.entity.MusicPlaylist;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MusicPlaylistRepository extends JpaRepository<MusicPlaylist, Long> {

    @EntityGraph(attributePaths = {"playlistTracks", "playlistTracks.track"})
    @Query("""
        SELECT DISTINCT p
        FROM MusicPlaylist p
        LEFT JOIN FETCH p.playlistTracks pt
        LEFT JOIN FETCH pt.track
        WHERE p.userId = :userId
        ORDER BY p.createdAt DESC
        """)
    List<MusicPlaylist> findByUserIdOrderByCreatedAtDesc(@Param("userId") Long userId);

    @EntityGraph(attributePaths = {"playlistTracks", "playlistTracks.track"})
    @Query("""
        SELECT DISTINCT p
        FROM MusicPlaylist p
        LEFT JOIN FETCH p.playlistTracks pt
        LEFT JOIN FETCH pt.track
        WHERE p.isPublic = true
        ORDER BY p.createdAt DESC
        """)
    List<MusicPlaylist> findAllPublic();

    @EntityGraph(attributePaths = {"playlistTracks", "playlistTracks.track"})
    Optional<MusicPlaylist> findWithTracksById(Long id);
}
