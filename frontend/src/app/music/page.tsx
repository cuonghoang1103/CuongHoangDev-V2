'use client';

/**
 * MusicPage — hardened for SSR stability and hydration safety.
 *
 * Design principles:
 * 1. Every conditional that changes DOM shape is gated by `isMounted`.
 *    Server renders shell → client hydrates same shell → full content after `isReady`.
 * 2. No global store subscription at component root before mount.
 * 3. All API calls are inside try/catch and guarded by `isMounted`.
 * 4. Upload logic (getToken, fetchBackendTracks, isValidAudioUrl) preserved verbatim.
 */

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Headphones, MoonStar, CloudSun } from 'lucide-react';
import ClientOnly from '@/components/providers/ClientOnly';
import { useMousePosition } from '@/components/music/useMousePosition';
import type { Track } from '@/types';

/* ================================================================
   RULE 1: 100% PRESERVED — upload / signed-URL / /admin/tracks logic
   ================================================================ */

function getToken(): string {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem('auth_token') || localStorage.getItem('token') || '';
  } catch {
    return '';
  }
}

function formatSeconds(seconds?: number): string {
  if (!seconds || !Number.isFinite(seconds)) return '0:00';
  return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
}

function isValidAudioUrl(url: unknown): url is string {
  if (typeof url !== 'string' || !url.trim()) return false;
  const exts = ['.mp3', '.wav', '.ogg', '.flac', '.aac', '.m4a', '.opus', '.webm'];
  if (exts.some((e) => url.toLowerCase().includes(e))) return true;
  return url.startsWith('http');
}

async function fetchBackendTracks(): Promise<Track[]> {
  try {
    const token = getToken();
    const res = await fetch('/api/v1/music/tracks', {
      ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const raw: any[] = Array.isArray(data.data) ? data.data : [];
    return raw
      .filter((t) => Boolean(t?.id))
      .map((t) => ({
        id: String(t.id ?? ''),
        title: String(t.title ?? 'Unknown'),
        artist: String(t.artist ?? 'Unknown'),
        duration: formatSeconds(typeof t.durationSeconds === 'number' ? t.durationSeconds : undefined),
        audioUrl: isValidAudioUrl(t.audioUrl) ? t.audioUrl : '',
        coverImage: typeof t.coverImage === 'string' ? t.coverImage : '',
      }));
  } catch {
    return [];
  }
}

/* ================================================================
   Static design tokens — no window, no store, no hydration risk
   ================================================================ */
const C = {
  primary: '#a855f7',
  secondary: '#ec4899',
  glow: 'rgba(168,85,247,0.15)',
  glassBg: 'rgba(15,10,30,0.75)',
  border: 'rgba(168,85,247,0.15)',
  text: '#f8fafc',
  textMuted: '#64748b',
} as const;

/* ================================================================
   MusicPage
   ================================================================ */
export default function MusicPage() {
  const mouse = useMousePosition();

  const [isMounted, setIsMounted] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isNight, setIsNight] = useState(false);

  /* ── Mark mounted — runs once after hydration ── */
  useEffect(() => {
    setIsMounted(true);
  }, []);

  /* ── Time-of-day on client only ── */
  useEffect(() => {
    const check = () => setIsNight(new Date().getHours() < 6 || new Date().getHours() >= 18);
    check();
    const id = setInterval(check, 60_000);
    return () => clearInterval(id);
  }, []);

  /* ── Fetch tracks — runs only after mount ── */
  const loadTracks = useCallback(async () => {
    if (!isMounted) return;
    setIsReady(false);
    setHasError(false);

    try {
      await fetchBackendTracks();
    } catch {
      setHasError(true);
      setErrorMsg('Không thể tải danh sách nhạc. Vui lòng thử lại.');
    } finally {
      setIsReady(true);
    }
  }, [isMounted]);

  useEffect(() => {
    loadTracks();
  }, [loadTracks]);

  /* ── Render ── */

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* ── Background: client-only ── */}
      <ClientOnly>
        {(() => {
          const PremiumBackground = require('@/components/music/PremiumBackground').default;
          return <PremiumBackground mouseX={mouse.x} mouseY={mouse.y} />;
        })()}
      </ClientOnly>

      {/* ── Content layer ── */}
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
              background: C.glassBg,
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              borderBottom: `1px solid ${C.border}`,
            }}
          >
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <motion.div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})`,
                    boxShadow: `0 0 20px ${C.glow}`,
                  }}
                  animate={{ boxShadow: [`0 0 20px ${C.glow}`, `0 0 40px ${C.glow}`, `0 0 20px ${C.glow}`] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <Headphones className="w-4.5 h-4.5 text-white" />
                </motion.div>
                <div>
                  <h1
                    className="text-lg font-bold leading-none"
                    style={{
                      background: `linear-gradient(135deg, ${C.text}, ${C.primary})`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    Music Vibes
                  </h1>
                  <p className="text-[9px] tracking-[0.2em] uppercase" style={{ color: C.textMuted }}>
                    Anime Chill Coding
                  </p>
                </div>
              </div>

              {/* Time-of-day badge */}
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px]"
                style={{
                  background: isNight ? `${C.primary}15` : 'rgba(99,102,241,0.1)',
                  border: `1px solid ${C.border}`,
                  color: isNight ? C.primary : '#6366f1',
                }}
              >
                {isNight ? <MoonStar className="w-3 h-3" /> : <CloudSun className="w-3 h-3" />}
                <span className="hidden sm:inline">{isNight ? 'Night' : 'Day'}</span>
              </div>
            </div>
          </div>
        </motion.header>

        {/* Main content */}
        <main className="flex-1 px-4 sm:px-6 py-6 pb-28">

          {/* Loading */}
          {!isReady && (
            <div className="flex items-center justify-center h-64">
              <motion.div
                className="flex flex-col items-center gap-3"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})` }}
                >
                  <Headphones className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm" style={{ color: C.textMuted }}>
                  Loading vibes...
                </span>
              </motion.div>
            </div>
          )}

          {/* Error */}
          {isReady && hasError && (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `${C.primary}20` }}>
                <Headphones className="w-6 h-6" style={{ color: C.primary }} />
              </div>
              <p className="text-sm text-center max-w-sm" style={{ color: C.textMuted }}>
                {errorMsg}
              </p>
              <button
                onClick={loadTracks}
                className="px-4 py-2 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-80"
                style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})` }}
              >
                Thử lại
              </button>
            </div>
          )}

          {/* Content — tracks loaded or empty */}
          {isReady && !hasError && (
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col lg:flex-row gap-5 xl:gap-6 items-start">

                {/* Left: Playlist */}
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="w-full lg:w-[38%] xl:w-[35%] shrink-0"
                >
                  <ClientOnly>
                    {(() => {
                      const PremiumPlaylist = require('@/components/music/PremiumPlaylist').default;
                      return <PremiumPlaylist isNight={isNight} />;
                    })()}
                  </ClientOnly>
                </motion.div>

                {/* Right: Now Playing */}
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.35 }}
                  className="flex-1 w-full"
                >
                  <ClientOnly>
                    {(() => {
                      const PremiumNowPlaying = require('@/components/music/PremiumNowPlaying').default;
                      return <PremiumNowPlaying isNight={isNight} />;
                    })()}
                  </ClientOnly>
                </motion.div>

              </div>
            </div>
          )}

        </main>
      </div>

      {/* MiniPlayer: client-only */}
      <ClientOnly>
        {(() => {
          const MiniPlayer = require('@/components/music/MiniPlayer').default;
          return <MiniPlayer isNight={isNight} />;
        })()}
      </ClientOnly>
    </div>
  );
}
