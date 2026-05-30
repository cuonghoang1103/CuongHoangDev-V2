'use client';

import { useEffect, useState, useRef } from 'react';
import { Headphones, ListMusic } from 'lucide-react';
import TrackList from '@/components/music/TrackList';
import UploadTrackModal from '@/components/music/UploadTrackModal';
import { useMusicStore } from '@/store/musicStore';
import type { Track } from '@/types';

const SAMPLE_TRACKS: Track[] = [
  {
    id: 'sample-1',
    title: 'Midnight Code',
    artist: 'LoFi Beats',
    duration: '3:24',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    coverImage: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&q=80',
  },
  {
    id: 'sample-2',
    title: 'Deep Focus',
    artist: 'Chill Wave',
    duration: '4:12',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    coverImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80',
  },
  {
    id: 'sample-3',
    title: 'Neon Dreams',
    artist: 'Synthwave FM',
    duration: '3:58',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    coverImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80',
  },
  {
    id: 'sample-4',
    title: 'Rainy Afternoon',
    artist: 'Ambient Lab',
    duration: '5:33',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    coverImage: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&q=80',
  },
  {
    id: 'sample-5',
    title: 'Coffee Shop Vibes',
    artist: 'Jazz Hop',
    duration: '3:45',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    coverImage: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&q=80',
  },
  {
    id: 'sample-6',
    title: 'Late Night Debugging',
    artist: 'Code & Coffee',
    duration: '4:20',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
    coverImage: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&q=80',
  },
  {
    id: 'sample-7',
    title: 'Sunrise Productivity',
    artist: 'Morning Mix',
    duration: '3:15',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',
    coverImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80',
  },
  {
    id: 'sample-8',
    title: 'Electric Soul',
    artist: 'Neon Pulse',
    duration: '4:48',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
    coverImage: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80',
  },
];

export default function MusicPage() {
  const { tracks, setTracks, isHydrated } = useMusicStore();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Bootstrap sample tracks ONLY when store is empty (no local tracks, no sample tracks)
  useEffect(() => {
    if (!isHydrated || initialized) return;
    if (tracks.length === 0) {
      setTracks(SAMPLE_TRACKS);
    }
    setInitialized(true);
  }, [isHydrated, initialized, tracks.length, setTracks]);

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
        {showSkeleton ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-3 text-text-muted">
              <div className="w-5 h-5 border-2 border-neon-violet border-t-transparent rounded-full animate-spin" />
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
                <TrackList onUploadClick={() => setUploadOpen(true)} />
              </div>
            </div>
          </div>
        )}
      </section>

      <UploadTrackModal isOpen={uploadOpen} onClose={() => setUploadOpen(false)} />
    </div>
  );
}
