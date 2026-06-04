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
  try {
    return localStorage.getItem('auth_token') || localStorage.getItem('token') || '';
  } catch {
    return '';
  }
}

function formatSeconds(seconds?: number): string {
  if (!seconds || !Number.isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function isValidAudioUrl(url: unknown): url is string {
  if (typeof url !== 'string' || !url.trim()) return false;
  const audioExts = ['.mp3', '.wav', '.ogg', '.flac', '.aac', '.m4a', '.opus', '.webm'];
  const hasExt = audioExts.some((ext) => url.toLowerCase().includes(ext));
  if (hasExt) return true;
  // Supabase Storage / Cloudinary / any http audio URL is also valid
  return url.startsWith('http');
}

async function fetchBackendTracks(): Promise<Track[]> {
  try {
    const token = getToken();
    const res = await fetch('/api/v1/music/tracks', {
      ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      console.warn('[MusicPage] fetchBackendTracks: HTTP', res.status);
      return [];
    }

    const data = await res.json();
    const raw = Array.isArray(data.data) ? data.data : [];

    return raw
      .filter((t: any) => Boolean(t?.id))
      .map((t: any) => ({
        id: String(t.id),
        title: String(t.title ?? 'Unknown'),
        artist: String(t.artist ?? 'Unknown'),
        duration: formatSeconds(
          typeof t.durationSeconds === 'number' ? t.durationSeconds : undefined
        ),
        audioUrl: isValidAudioUrl(t.audioUrl) ? t.audioUrl : '',
        coverImage: typeof t.coverImage === 'string' ? t.coverImage : '',
      }));
  } catch (err) {
    console.warn('[MusicPage] fetchBackendTracks failed:', err);
    return [];
  }
}

export default function MusicPage() {
  const { setTracks } = useMusicStore();
  const { x: mouseX, y: mouseY } = useMousePosition();

  // ── Rule 4: isMounted — never render real data before client mount ──────────
  const [isMounted, setIsMounted] = useState(false);
  // isReady: both mounted AND data has been fetched at least once
  const [isReady, setIsReady] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Mark client-side mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Compute time-of-day safely on client only
  const [isNight, setIsNight] = useState(false);

  useEffect(() => {
    const checkTime = () => {
      const hour = new Date().getHours();
      setIsNight(hour < 6 || hour >= 18);
    };
    checkTime();
    const id = setInterval(checkTime, 60 * 1000);
    return () => clearInterval(id);
  }, []);

  // ── Rule 2: try/catch on all API calls ──────────────────────────────────────
  // Runs on mount; also re-runs when user clicks "Thử lại" via setFetchError trigger
  useEffect(() => {
    if (!isMounted) return;

    const load = async () => {
      setIsReady(false);
      setFetchError(null);
      try {
        const tracks = await fetchBackendTracks();
        if (tracks.length > 0) {
          setTracks(tracks);
        }
      } catch (err) {
        console.warn('[MusicPage] load error:', err);
        setFetchError('Không thể tải danh sách nhạc. Vui lòng thử lại.');
      } finally {
        setIsReady(true);
      }
    };

    load();
  }, [isMounted]);

  // Manual retry — fetches directly, bypasses the mount-only effect
  const handleRetry = () => {
    setIsReady(false);
    setFetchError(null);
    fetchBackendTracks()
      .then((tracks) => {
        if (tracks.length > 0) setTracks(tracks);
      })
      .catch(() => {
        setFetchError('Tải thất bại. Vui lòng refresh trang.');
      })
      .finally(() => {
        setIsReady(true);
      });
  };

  // ── Rule 3: MusicAudioController strict URL validation ──────────────────────
  // This is handled inside MusicAudioController.tsx via isValidAudioUrl().
  // It only loads audio when URL ends with audio extension or starts with http.

  // ── Colors (static, no hydration risk) ─────────────────────────────────────
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

  // ── Rule 4: if not mounted → bare loading screen (zero logic) ──────────────
  if (!isMounted) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(135deg, #0a0015 0%, #1a0535 40%, #0f0025 70%, #050010 100%)',
          }}
        />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* ── Background — ClientOnly prevents timeOfDay hydration mismatch ─────── */}
      <ClientOnly>
        <PremiumBackground mouseX={mouseX} mouseY={mouseY} />
      </ClientOnly>

      {/* ── Content ──────────────────────────────────────────────────────────── */}
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
              WebkitBackdropFilter: 'blur(24px)',
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
                  animate={{
                    boxShadow: [
                      `0 0 20px ${c.glow}`,
                      `0 0 40px ${c.glow}`,
                      `0 0 20px ${c.glow}`,
                    ],
                  }}
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
                  <p
                    className="text-[9px] tracking-[0.2em] uppercase"
                    style={{ color: c.textMuted }}
                  >
                    Anime Chill Coding
                  </p>
                </div>
              </div>

              {/* Right controls */}
              <div className="flex items-center gap-2">
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
          {/* Loading state — before first data fetch */}
          {!isReady ? (
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
                <span className="text-sm" style={{ color: c.textMuted }}>
                  Loading vibes...
                </span>
              </motion.div>
            </div>
          ) : fetchError ? (
            /* Error state — graceful degradation */
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: `${c.primary}20` }}
              >
                <Headphones className="w-6 h-6" style={{ color: c.primary }} />
              </div>
              <p className="text-sm text-center max-w-sm" style={{ color: c.textMuted }}>
                {fetchError}
              </p>
              <button
                onClick={handleRetry}
                className="px-4 py-2 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-80"
                style={{
                  background: `linear-gradient(135deg, ${c.primary}, ${c.secondary})`,
                }}
              >
                Thử lại
              </button>
            </div>
          ) : (
            /* Main content — tracks loaded or empty */
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col lg:flex-row gap-5 xl:gap-6 items-start">
                {/* Left Column: Playlist */}
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="w-full lg:w-[38%] xl:w-[35%] shrink-0"
                >
                  <PremiumPlaylist isNight={isNight} />
                </motion.div>

                {/* Right Column: Now Playing */}
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

      {/* Mini Player — only after client mount, reads from store */}
      <ClientOnly>
        <MiniPlayer isNight={isNight} />
      </ClientOnly>
    </div>
  );
}
