package com.cuonghoangdev.api_backend.repository;

import com.cuonghoangdev.api_backend.entity.MusicPlaylist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MusicPlaylistRepository extends JpaRepository<MusicPlaylist, Long> {

    List<MusicPlaylist> findByUserIdOrderByCreatedAtDesc(Long userId);

    @Query(value = """
        SELECT p.* FROM music_playlists p
        WHERE p.is_public = true
        ORDER BY p.created_at DESC
        """, nativeQuery = true)
    List<MusicPlaylist> findAllPublic();
}
