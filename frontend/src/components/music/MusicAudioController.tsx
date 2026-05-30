'use client';

import { useEffect, useRef } from 'react';
import { useMusicStore } from '@/store/musicStore';

/**
 * MusicAudioController — the single audio engine for the entire app.
 *
 * Lives at the root layout level (via dynamic ssr:false import).
 * Keeps ONE <audio> element alive for the full lifetime of the app.
 * This is what makes playback survive across page navigations.
 *
 * Architecture:
 * - Module-level ref ensures the Audio element is created only once.
 * - Subscribes to Zustand store and drives <audio> based on store state.
 * - GlobalMusicPlayer (MiniBar / ExpandedPlayer) only writes store actions —
 *   it never touches <audio> directly.
 */
export default function MusicAudioController() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const {
    currentTrack,
    isPlaying,
    currentTime,
    volume,
    isMuted,
    setCurrentTime,
    setDuration,
    next,
  } = useMusicStore();

  // Create audio element exactly once (singleton pattern)
  useEffect(() => {
    if (audioRef.current) return;

    const audio = new Audio();
    audio.setAttribute('crossOrigin', 'anonymous');
    audio.preload = 'auto';

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => next();

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    audioRef.current = audio;

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load new track when currentTrack or its audioUrl changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // No track selected — pause and clear src
    if (!currentTrack || !currentTrack.audioUrl) {
      audio.pause();
      audio.src = '';
      return;
    }

    // Load the track if src changed
    const srcChanged = audio.src !== currentTrack.audioUrl;
    if (srcChanged) {
      audio.src = currentTrack.audioUrl;
      audio.load();
    }

    // Sync play/pause state
    if (isPlaying) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [currentTrack?.id, currentTrack?.audioUrl, isPlaying]);

  // Sync volume changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  // Sync seek (progress bar dragging)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    const diff = Math.abs(audio.currentTime - currentTime);
    if (diff > 0.5) {
      audio.currentTime = currentTime;
    }
  }, [currentTime, currentTrack]);

  return null;
}
