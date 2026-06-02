package com.cuonghoangdev.api_backend.repository;

import com.cuonghoangdev.api_backend.entity.MusicTrack;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MusicTrackRepository extends JpaRepository<MusicTrack, Long> {

    List<MusicTrack> findByActiveTrueOrderByCreatedAtDesc();
}
