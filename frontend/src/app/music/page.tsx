'use client';

import { useEffect, useState } from 'react';
import { Headphones, ListMusic } from 'lucide-react';
import TrackList from '@/components/music/TrackList';
import { useMusicStore } from '@/store/musicStore';
import type { Track } from '@/types';
import { Loader2 } from 'lucide-react';

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
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isHydrated || initialized) return;

    const init = async () => {
      const backendTracks = await fetchBackendTracks();

      // Only set backend tracks if the store is empty (no localStorage data)
      if (tracks.length === 0) {
        setTracks(backendTracks);
      }
      setInitialized(true);
      setLoading(false);
    };

    init();
  }, [isHydrated, initialized]);

  const totalSeconds = tracks.reduce((acc, t) => {
    const parts = t.duration.split(':').map(Number);
    return acc + (parts[0] * 60 + (parts[1] || 0));
  }, 0);

  const formatTotal = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const showSkeleton = !initialized || (isHydrated && tracks.length === 0 && !initialized);

  return (
    <div className="min-h-screen bg-darkbg">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-neon-indigo/10 rounded-full blur-[200px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-neon-violet/10 rounded-full blur-[200px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 right-1/3 w-[400px] h-[400px] bg-neon-fuchsia/8 rounded-full blur-[180px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <section className="relative py-14 overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-14 h-14 bg-gradient-to-br from-neon-indigo to-neon-violet rounded-2xl flex items-center justify-center">
              <Headphones className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-heading font-bold text-text-primary">
              Music{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-indigo via-neon-violet to-neon-fuchsia">
                Vibes
              </span>
            </h1>
          </div>
          <p className="text-text-muted max-w-xl">
            Chill beats for coding sessions, late-night debugging, and productive mornings.
          </p>
        </div>
      </section>

      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
        {loading || showSkeleton ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-3 text-text-muted">
              <Loader2 className="w-5 h-5 border-2 border-neon-violet border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Loading your music...</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1 min-w-0">
              <div className="bg-darkcard rounded-2xl border border-darkborder p-6 mb-6">
                <div className="flex items-start gap-5">
                  <div className="w-28 h-28 rounded-2xl overflow-hidden shadow-lg shadow-neon-violet/10 shrink-0">
                    <img
                      src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&q=80"
                      alt="Playlist"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-neon-violet font-medium uppercase tracking-wider">Playlist</span>
                    <h2 className="text-2xl font-heading font-bold text-text-primary mt-1">Chill Coding Vibes</h2>
                    <p className="text-sm text-text-muted mt-2 line-clamp-2">
                      Lo-fi beats, ambient sounds, and chill electronic music for deep focus coding sessions.
                    </p>
                    <div className="flex items-center gap-4 mt-3 text-sm text-text-muted">
                      <span className="flex items-center gap-1.5">
                        <ListMusic className="w-4 h-4" />
                        {tracks.length} tracks
                      </span>
                      <span>{formatTotal(totalSeconds)}</span>
                      <span>By CuongHoang</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-darkcard rounded-2xl border border-darkborder p-5">
                <TrackList onUploadClick={() => {}} />
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
