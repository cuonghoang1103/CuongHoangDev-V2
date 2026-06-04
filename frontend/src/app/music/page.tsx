'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Headphones, MoonStar, CloudSun } from 'lucide-react';
import PremiumBackground from '@/components/music/PremiumBackground';
import PremiumNowPlaying from '@/components/music/PremiumNowPlaying';
import PremiumPlaylist from '@/components/music/PremiumPlaylist';
import MiniPlayer from '@/components/music/MiniPlayer';
import ClientOnly from '@/components/providers/ClientOnly';
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
  const { setTracks } = useMusicStore();
  const { x: mouseX, y: mouseY } = useMousePosition();
  const [loading, setLoading] = useState(true);
  const [timeOfDay, setTimeOfDay] = useState<'day' | 'night'>('night');

  useEffect(() => {
    const checkTime = () => {
      const hour = new Date().getHours();
      setTimeOfDay(hour >= 6 && hour < 18 ? 'day' : 'night');
    };
    checkTime();
    const interval = setInterval(checkTime, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Always fetch from backend — no persistence, always fresh data
  useEffect(() => {
    const init = async () => {
      const backendTracks = await fetchBackendTracks();
      if (backendTracks.length > 0) {
        setTracks(backendTracks);
      }
      setLoading(false);
    };
    init();
  }, []);

  const isNight = timeOfDay === 'night';

  const c = {
    primary: '#a855f7',
    secondary: '#ec4899',
    tertiary: '#22d3ee',
    glow: 'rgba(168,85,247,0.15)',
    text: '#f8fafc',
    textMuted: '#64748b',
    glassBg: 'rgba(15,10,30,0.75)',
    border: 'rgba(168,85,247,0.15)',
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background — wrapped in ClientOnly to prevent hydration mismatch from timeOfDay computation */}
      <ClientOnly>
        <PremiumBackground mouseX={mouseX} mouseY={mouseY} />
      </ClientOnly>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="sticky top-0 z-30"
        >
          <div
            className="px-4 sm:px-6 py-3"
            style={{
              background: c.glassBg,
              backdropFilter: 'blur(24px)',
              borderBottom: `1px solid ${c.border}`,
            }}
          >
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <motion.div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${c.primary}, ${c.secondary})`,
                    boxShadow: `0 0 20px ${c.glow}`,
                  }}
                  animate={{ boxShadow: [`0 0 20px ${c.glow}`, `0 0 40px ${c.glow}`, `0 0 20px ${c.glow}`] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <Headphones className="w-4.5 h-4.5 text-white" />
                </motion.div>
                <div>
                  <h1
                    className="text-lg font-bold leading-none"
                    style={{
                      background: `linear-gradient(135deg, ${c.text}, ${c.primary})`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    Music Vibes
                  </h1>
                  <p className="text-[9px] tracking-[0.2em] uppercase" style={{ color: c.textMuted }}>
                    Anime Chill Coding
                  </p>
                </div>
              </div>

              {/* Right controls */}
              <div className="flex items-center gap-2">
                {/* Time mode badge */}
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px]"
                  style={{
                    background: isNight ? `${c.primary}15` : 'rgba(99,102,241,0.1)',
                    border: `1px solid ${c.border}`,
                    color: isNight ? c.primary : '#6366f1',
                  }}
                >
                  {isNight ? (
                    <MoonStar className="w-3 h-3" />
                  ) : (
                    <CloudSun className="w-3 h-3" />
                  )}
                  <span className="hidden sm:inline">{isNight ? 'Night' : 'Day'}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.header>

        {/* Main Content */}
        <main className="flex-1 px-4 sm:px-6 py-6 pb-28">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <motion.div
                className="flex flex-col items-center gap-3"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${c.primary}, ${c.secondary})`,
                  }}
                >
                  <Headphones className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm" style={{ color: c.textMuted }}>Loading vibes...</span>
              </motion.div>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto">
              {/* Two-column layout */}
              <div className="flex flex-col lg:flex-row gap-5 xl:gap-6 items-start">

                {/* Left Column: Playlist (40%) */}
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="w-full lg:w-[38%] xl:w-[35%] shrink-0"
                >
                  <PremiumPlaylist isNight={isNight} />
                </motion.div>

                {/* Right Column: Now Playing (60%) */}
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.35 }}
                  className="flex-1 w-full"
                >
                  <PremiumNowPlaying isNight={isNight} />
                </motion.div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Mini Player — only renders after client mount */}
      <ClientOnly>
        <MiniPlayer isNight={isNight} />
      </ClientOnly>
    </div>
  );
}
