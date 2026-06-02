'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Headphones, Volume2, VolumeX, CloudSun, MoonStar,
  Loader2,
} from 'lucide-react';
import CinematicBackground from '@/components/music/CinematicBackground';
import ParticleRain from '@/components/music/ParticleRain';
import CinematicPlayer from '@/components/music/CinematicPlayer';
import CinematicPlaylist from '@/components/music/CinematicPlaylist';
import { useMousePosition } from '@/components/music/useMousePosition';
import { useMusicStore } from '@/store/musicStore';
import type { Track } from '@/types';

function getToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('auth_token') || localStorage.getItem('token') || '';
}

async function fetchBackendTracks(): Promise<Track[]> {
  try {
    const token = getToken();
    const res = await fetch('/api/v1/music/tracks', {
      ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data || []).map((t: any) => ({
      id: String(t.id),
      title: t.title,
      artist: t.artist,
      duration: formatSeconds(t.durationSeconds),
      audioUrl: t.audioUrl,
      coverImage: t.coverImage || '',
    }));
  } catch {
    return [];
  }
}

function formatSeconds(seconds?: number): string {
  if (!seconds) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function MusicPage() {
  const { tracks, setTracks, isHydrated } = useMusicStore();
  const { x: mouseX, y: mouseY } = useMousePosition();
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [timeOfDay, setTimeOfDay] = useState<'day' | 'night'>('night');
  const [ambientSound, setAmbientSound] = useState(false);

  // Detect time of day
  useEffect(() => {
    const checkTime = () => {
      const hour = new Date().getHours();
      setTimeOfDay(hour >= 6 && hour < 18 ? 'day' : 'night');
    };
    checkTime();
    const interval = setInterval(checkTime, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Load tracks
  useEffect(() => {
    if (!isHydrated || initialized) return;

    const init = async () => {
      const backendTracks = await fetchBackendTracks();
      if (tracks.length === 0) {
        setTracks(backendTracks);
      }
      setInitialized(true);
      setLoading(false);
    };

    init();
  }, [isHydrated, initialized]);

  const isNight = timeOfDay === 'night';

  // Theme colors
  const neonColors = {
    primary: isNight ? '#8b5cf6' : '#6366f1',
    secondary: isNight ? '#ec4899' : '#d946ef',
    tertiary: isNight ? '#22d3ee' : '#3b82f6',
    glow: isNight ? 'rgba(139,92,246,0.4)' : 'rgba(99,102,241,0.3)',
    text: isNight ? '#f8fafc' : '#1e293b',
    textSecondary: isNight ? '#94a3b8' : '#475569',
    textMuted: isNight ? '#64748b' : '#94a3b8',
    glassBg: isNight ? 'rgba(10,10,15,0.6)' : 'rgba(255,255,255,0.6)',
    glassBorder: isNight ? 'rgba(139,92,246,0.2)' : 'rgba(99,102,241,0.2)',
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background layers */}
      <CinematicBackground mouseX={mouseX} mouseY={mouseY} />

      {/* Rain particles for night */}
      <AnimatePresence>
        {isNight && <ParticleRain isNight={isNight} intensity="medium" />}
      </AnimatePresence>

      {/* Content layer */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="sticky top-0 z-30"
        >
          <div
            className="px-6 py-4"
            style={{
              background: neonColors.glassBg,
              backdropFilter: 'blur(20px)',
              borderBottom: `1px solid ${neonColors.glassBorder}`,
            }}
          >
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <motion.div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${neonColors.primary}, ${neonColors.secondary})`,
                    boxShadow: `0 0 20px ${neonColors.glow}`,
                  }}
                  animate={{ boxShadow: [
                    `0 0 20px ${neonColors.glow}`,
                    `0 0 40px ${neonColors.glow}`,
                    `0 0 20px ${neonColors.glow}`,
                  ]}}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <Headphones className="w-5 h-5 text-white" />
                </motion.div>
                <div>
                  <h1
                    className="text-xl font-bold leading-none"
                    style={{
                      background: `linear-gradient(135deg, ${neonColors.text}, ${neonColors.primary})`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    Music Vibes
                  </h1>
                  <p className="text-[10px] tracking-widest uppercase" style={{ color: neonColors.textMuted }}>
                    Chill Coding Edition
                  </p>
                </div>
              </div>

              {/* Right controls */}
              <div className="flex items-center gap-3">
                {/* Time indicator */}
                <div
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
                  style={{
                    background: isNight ? 'rgba(139,92,246,0.15)' : 'rgba(99,102,241,0.1)',
                    border: `1px solid ${neonColors.glassBorder}`,
                    color: neonColors.textMuted,
                  }}
                >
                  {isNight ? (
                    <MoonStar className="w-3.5 h-3.5" style={{ color: neonColors.primary }} />
                  ) : (
                    <CloudSun className="w-3.5 h-3.5" style={{ color: neonColors.tertiary }} />
                  )}
                  <span>{isNight ? 'Night Mode' : 'Day Mode'}</span>
                </div>

                {/* Ambient sound toggle */}
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setAmbientSound(!ambientSound)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs transition-all"
                  style={{
                    background: ambientSound
                      ? `linear-gradient(135deg, ${neonColors.primary}, ${neonColors.secondary})`
                      : 'transparent',
                    border: `1px solid ${neonColors.glassBorder}`,
                    color: ambientSound ? '#fff' : neonColors.textMuted,
                  }}
                >
                  {ambientSound ? (
                    <Volume2 className="w-3.5 h-3.5" />
                  ) : (
                    <VolumeX className="w-3.5 h-3.5" />
                  )}
                  <span>Ambient</span>
                </motion.button>
              </div>
            </div>
          </div>
        </motion.header>

        {/* Main content */}
        <main className="flex-1 px-6 py-8 pb-40">
          {loading || !initialized ? (
            <div className="flex items-center justify-center h-64">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Loader2 className="w-8 h-8" style={{ color: neonColors.primary }} />
              </motion.div>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto">
              {/* Hero section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-center mb-12"
              >
                <h2
                  className="text-4xl md:text-6xl font-bold mb-4"
                  style={{
                    background: `linear-gradient(135deg, ${neonColors.text}, ${neonColors.primary}, ${neonColors.secondary})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {isNight ? 'Late Night Coding' : 'Daydream Coding'}
                </h2>
                <p className="text-base md:text-lg max-w-2xl mx-auto" style={{ color: neonColors.textSecondary }}>
                  {isNight
                    ? 'Neon lights, rain sounds, and beats to fuel your midnight debugging sessions.'
                    : 'Sunlit code, ambient vibes, and the perfect playlist for productive days.'}
                </p>
              </motion.div>

              {/* Content grid */}
              <div className="flex flex-col lg:flex-row gap-8 items-start justify-center">
                {/* Left: Playlist */}
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  className="w-full lg:w-auto flex justify-center"
                >
                  <CinematicPlaylist isNight={isNight} />
                </motion.div>

                {/* Right: Visualizer area */}
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.7 }}
                  className="hidden lg:block"
                >
                  <div
                    className="w-80 rounded-3xl overflow-hidden"
                    style={{
                      background: neonColors.glassBg,
                      backdropFilter: 'blur(24px)',
                      border: `1px solid ${neonColors.glassBorder}`,
                    }}
                  >
                    {/* Now playing visualization */}
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <motion.div
                          className="w-3 h-3 rounded-full"
                          style={{ background: neonColors.primary }}
                          animate={useMusicStore.getState().isPlaying
                            ? { scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }
                            : {}}
                          transition={{ duration: 1, repeat: Infinity }}
                        />
                        <span
                          className="text-[10px] font-semibold uppercase tracking-widest"
                          style={{ color: neonColors.primary }}
                        >
                          Visualizer
                        </span>
                      </div>

                      {/* Album art */}
                      <div className="relative mb-6">
                        <motion.div
                          className="w-full aspect-square rounded-2xl overflow-hidden"
                          style={{
                            background: `linear-gradient(135deg, ${neonColors.primary}30, ${neonColors.secondary}30)`,
                            boxShadow: `0 0 60px ${neonColors.glow}`,
                          }}
                          animate={useMusicStore.getState().isPlaying
                            ? { scale: [1, 1.02, 1] }
                            : {}}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          {useMusicStore.getState().currentTrack?.coverImage ? (
                            <img
                              src={useMusicStore.getState().currentTrack?.coverImage}
                              alt="Album art"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Headphones
                                className="w-20 h-20"
                                style={{ color: `${neonColors.primary}40` }}
                              />
                            </div>
                          )}
                        </motion.div>

                        {/* Glow ring when playing */}
                        {useMusicStore.getState().isPlaying && (
                          <motion.div
                            className="absolute inset-0 rounded-2xl"
                            style={{ border: `2px solid ${neonColors.primary}` }}
                            animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.02, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          />
                        )}
                      </div>

                      {/* Track info */}
                      <div className="text-center mb-4">
                        <h3 className="font-bold text-lg truncate" style={{ color: neonColors.text }}>
                          {useMusicStore.getState().currentTrack?.title || 'No track selected'}
                        </h3>
                        <p className="text-sm truncate" style={{ color: neonColors.textMuted }}>
                          {useMusicStore.getState().currentTrack?.artist || 'Select a track to play'}
                        </p>
                      </div>

                      {/* Waveform visualizer */}
                      <div className="flex justify-center">
                        <div
                          className="rounded-full p-3"
                          style={{
                            background: `${neonColors.primary}15`,
                            border: `1px solid ${neonColors.glassBorder}`,
                          }}
                        >
                          {/* Mini bars visualizer */}
                          <div className="flex items-end gap-0.5 h-8">
                            {[...Array(12)].map((_, i) => (
                              <motion.div
                                key={i}
                                className="w-1 rounded-full"
                                style={{
                                  background: `linear-gradient(180deg, ${neonColors.primary}, ${neonColors.secondary})`,
                                }}
                                animate={useMusicStore.getState().isPlaying
                                  ? {
                                      height: [
                                        `${8 + Math.random() * 16}px`,
                                        `${8 + Math.random() * 16}px`,
                                        `${8 + Math.random() * 16}px`,
                                      ],
                                    }
                                  : { height: '4px' }}
                                transition={{
                                  duration: 0.4 + Math.random() * 0.3,
                                  repeat: Infinity,
                                  ease: 'easeInOut',
                                  delay: i * 0.05,
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex justify-center gap-6 mt-4 text-center">
                        <div>
                          <div className="text-lg font-bold" style={{ color: neonColors.primary }}>
                            {tracks.length}
                          </div>
                          <div className="text-[10px] uppercase tracking-wider" style={{ color: neonColors.textMuted }}>
                            Tracks
                          </div>
                        </div>
                        <div
                          className="w-px"
                          style={{ background: neonColors.glassBorder }}
                        />
                        <div>
                          <div className="text-lg font-bold" style={{ color: neonColors.secondary }}>
                            {tracks.length > 0 ? Math.ceil(tracks.reduce((acc, t) => {
                              const parts = t.duration.split(':').map(Number);
                              return acc + parts[0] * 60 + (parts[1] || 0);
                            }, 0) / 60) : 0}m
                          </div>
                          <div className="text-[10px] uppercase tracking-wider" style={{ color: neonColors.textMuted }}>
                            Total
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Mobile: show player status */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="lg:hidden mt-8"
              >
                <div
                  className="rounded-2xl p-4 text-center"
                  style={{
                    background: neonColors.glassBg,
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${neonColors.glassBorder}`,
                    color: neonColors.textSecondary,
                  }}
                >
                  <p className="text-sm">
                    Scroll up to see the full player and playlist
                  </p>
                </div>
              </motion.div>
            </div>
          )}
        </main>
      </div>

      {/* Cinematic Player at bottom */}
      <CinematicPlayer isNight={isNight} />
    </div>
  );
}
