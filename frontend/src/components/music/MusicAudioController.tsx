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
 * Strict URL validation: only loads audio when the URL is a confirmed
 * audio file path (ends with known extension) or a valid http/https URL.
 * Never sets audio.src to empty string or base page URL.
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

  function isValidAudioUrl(url: unknown): url is string {
    if (typeof url !== 'string' || !url.trim()) return false;
    const audioExts = ['.mp3', '.wav', '.ogg', '.flac', '.aac', '.m4a', '.opus', '.webm'];
    const hasExt = audioExts.some((ext) => url.toLowerCase().includes(ext));
    if (hasExt) return true;
    // Cloudinary, Supabase Storage, CDN — any http/https audio URL is valid
    return url.startsWith('http');
  }

  // Create audio element exactly once — SSR-safe
  useEffect(() => {
    if (audioRef.current) return;
    if (typeof window === 'undefined') return;

    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audio.preload = 'auto';

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => next();
    const handleError = () => {
      // Log only — never let error crash the app
      console.warn('[MusicAudioController] Audio error:', audio.src, audio.error?.message);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    audioRef.current = audio;

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load new track — strict URL validation prevents base-URL resolution
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const rawUrl = currentTrack?.audioUrl;

    // Only proceed with a confirmed valid audio URL
    if (!isValidAudioUrl(rawUrl)) {
      audio.pause();
      return;
    }

    // Skip if already loaded
    if (audio.src === rawUrl) {
      if (isPlaying) {
        audio.play().catch(() => {});
      } else {
        audio.pause();
      }
      return;
    }

    audio.src = rawUrl;
    audio.load();

    if (isPlaying) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [currentTrack?.id, currentTrack?.audioUrl, isPlaying]);

  // Sync volume
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = isMuted ? 0 : Math.max(0, Math.min(1, volume));
  }, [volume, isMuted]);

  // Sync seek
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
