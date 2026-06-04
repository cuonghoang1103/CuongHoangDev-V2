'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Search, Music, Loader2, ListMusic, Plus } from 'lucide-react';
import { useMusicStore } from '@/store/musicStore';
import { usePlaylistStore } from '@/store/playlistStore';
import type { Track } from '@/types';

function isSafeCoverUrl(url: unknown): url is string {
  return typeof url === 'string' && url.trim().length > 0 && url.startsWith('http');
}

interface PremiumPlaylistProps {
  isNight?: boolean;
}

export default function PremiumPlaylist({ isNight = true }: PremiumPlaylistProps) {
  const { tracks, currentTrack, isPlaying, playTrackAtIndex, currentIndex } = useMusicStore();
  const [search, setSearch] = useState('');
  const [isLoading] = useState(false);

  const filteredTracks = tracks.filter((track) =>
    !search ||
    track.title.toLowerCase().includes(search.toLowerCase()) ||
    track.artist.toLowerCase().includes(search.toLowerCase())
  );

  const handlePlayTrack = (track: Track) => {
    const actualIndex = tracks.indexOf(track);
    if (actualIndex === currentIndex && currentTrack?.id === track.id) {
      useMusicStore.getState().togglePlay();
    } else {
      playTrackAtIndex(actualIndex);
    }
  };

  const c = {
    primary: '#a855f7',
    secondary: '#ec4899',
    tertiary: '#22d3ee',
    glow: 'rgba(168,85,247,0.2)',
    text: '#f8fafc',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    glassBg: 'rgba(15,10,30,0.75)',
    glassBgLight: 'rgba(20,15,40,0.6)',
    border: 'rgba(168,85,247,0.15)',
    borderLight: 'rgba(168,85,247,0.08)',
    cardBgHover: 'rgba(168,85,247,0.08)',
    activeBg: 'rgba(168,85,247,0.12)',
  };

  const parseDuration = (d: string | number | undefined): number => {
    if (!d && d !== 0) return 0;
    if (typeof d === 'number') return d;
    if (typeof d === 'string' && d.includes(':')) {
      const parts = d.split(':').map(Number);
      return parts[0] * 60 + (parts[1] || 0);
    }
    return Number(d) || 0;
  };

  const totalDuration = tracks.reduce((acc, t) => acc + parseDuration(t.duration), 0);

  const formatTotal = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m} min`;
  };

  return (
    <div
      className="w-full rounded-3xl overflow-hidden"
      style={{
        background: c.glassBg,
        backdropFilter: 'blur(32px)',
        border: `1px solid ${c.border}`,
      }}
    >
      {/* Top accent */}
      <div
        className="h-0.5 w-full"
        style={{
          background: `linear-gradient(90deg, ${c.primary}, ${c.secondary}, ${c.tertiary})`,
        }}
      />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <motion.div
            className="w-14 h-14 rounded-2xl overflow-hidden shrink-0"
            style={{
              background: `linear-gradient(135deg, ${c.primary}, ${c.secondary})`,
              boxShadow: `0 0 30px ${c.glow}`,
            }}
            whileHover={{ scale: 1.05, rotate: 2 }}
          >
            {isSafeCoverUrl(tracks[0]?.coverImage) ? (
              <Image
                src={tracks[0].coverImage}
                alt="Playlist"
                width={56}
                height={56}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ListMusic className="w-7 h-7 text-white/70" />
              </div>
            )}
          </motion.div>
          <div className="min-w-0">
            <span
              className="text-[10px] font-bold uppercase tracking-[0.2em]"
              style={{ color: c.primary }}
            >
              Playlist
            </span>
            <h2 className="text-base font-bold truncate mt-0.5" style={{ color: c.text }}>
              Chill Coding Vibes
            </h2>
            <p className="text-[11px] truncate" style={{ color: c.textMuted }}>
              with Cuong Hoang &bull; {tracks.length} tracks &bull; {formatTotal(totalDuration)}
            </p>
          </div>
        </div>

        {/* Play All Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => tracks[0] && playTrackAtIndex(0)}
          disabled={tracks.length === 0}
          className="w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2.5 mb-4 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: `linear-gradient(135deg, ${c.primary}, ${c.secondary})`,
            boxShadow: `0 0 30px ${c.glow}`,
          }}
        >
          <Play className="w-4 h-4" fill="currentColor" />
          Play All
        </motion.button>

        {/* Search */}
        <div className="relative mb-4">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
            style={{ color: c.textMuted }}
          />
          <input
            type="text"
            placeholder="Search tracks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${c.border}`,
              color: c.text,
            }}
            onFocus={(e) => {
              e.target.style.borderColor = c.primary;
              e.target.style.background = 'rgba(168,85,247,0.05)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = c.border;
              e.target.style.background = 'rgba(255,255,255,0.04)';
            }}
          />
        </div>
      </div>

      {/* Track List */}
      <div
        className="overflow-y-auto px-3 pb-3"
        style={{
          maxHeight: '440px',
          scrollbarWidth: 'thin',
          scrollbarColor: `${c.primary}40 transparent`,
        }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: c.primary }} />
          </div>
        ) : filteredTracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <Music className="w-12 h-12 mb-3" style={{ color: `${c.primary}40` }} />
            <p className="text-sm font-medium" style={{ color: c.textMuted }}>
              {search ? 'No tracks found' : 'No tracks yet'}
            </p>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="mt-2 text-xs underline"
                style={{ color: c.primary }}
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-0.5">
            <AnimatePresence mode="popLayout">
              {filteredTracks.map((track, idx) => {
                const isActive = currentTrack?.id === track.id;
                const isCurrentlyPlaying = isActive && isPlaying;

                return (
                  <motion.div
                    key={track.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: idx * 0.015 }}
                    layout
                  >
                    <PremiumTrackItem
                      track={track}
                      index={idx}
                      isActive={isActive}
                      isPlaying={isCurrentlyPlaying}
                      onPlay={() => handlePlayTrack(track)}
                      onAddToPlaylist={() => {
                        usePlaylistStore.getState().setPendingTrack(track);
                        usePlaylistStore.getState().openDrawer();
                      }}
                      colors={c}
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

function PremiumTrackItem({
  track,
  index,
  isActive,
  isPlaying,
  onPlay,
  onAddToPlaylist,
  colors,
}: {
  track: Track;
  index: number;
  isActive: boolean;
  isPlaying: boolean;
  onPlay: () => void;
  onAddToPlaylist: () => void;
  colors: {
    primary: string;
    secondary: string;
    tertiary: string;
    glow: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    glassBg: string;
    glassBgLight: string;
    border: string;
    borderLight: string;
    cardBgHover: string;
    activeBg: string;
  };
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.01, x: 2 }}
      whileTap={{ scale: 0.99 }}
      onClick={onPlay}
      className="flex items-center gap-3 p-3 rounded-xl cursor-pointer group transition-all duration-200"
      style={{
        background: isActive ? colors.activeBg : 'transparent',
        border: `1px solid ${isActive ? 'rgba(168,85,247,0.25)' : 'transparent'}`,
      }}
    >
      {/* Index / Playing indicator */}
      <div className="w-7 flex items-center justify-center shrink-0">
        {isPlaying ? (
          <div className="flex items-end gap-0.5 h-5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1 rounded-full"
                style={{ background: colors.primary }}
                animate={{ height: [4, 16 + i * 2, 4] }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 0.12,
                }}
              />
            ))}
          </div>
        ) : (
          <span
            className="text-[11px] font-medium tabular-nums"
            style={{ color: isActive ? colors.primary : colors.textMuted }}
          >
            {String(index + 1).padStart(2, '0')}
          </span>
        )}
      </div>

      {/* Cover */}
      <motion.div
        className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 shadow-md"
        whileHover={{ scale: 1.08 }}
      >
        {isSafeCoverUrl(track.coverImage) ? (
          <Image
            src={track.coverImage}
            alt={track.title}
            width={44}
            height={44}
            className="object-cover w-full h-full"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
            }}
          >
            <span className="text-white/60 text-sm font-bold">{track.title.charAt(0)}</span>
          </div>
        )}

        {/* Hover overlay */}
        <div
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{ background: 'rgba(0,0,0,0.45)' }}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 text-white" />
          ) : (
            <Play className="w-5 h-5 text-white ml-0.5" />
          )}
        </div>

        {/* Active ring */}
        {isActive && (
          <div
            className="absolute inset-0 rounded-lg"
            style={{
              boxShadow: `0 0 0 2px ${colors.primary}`,
              opacity: 0.6,
            }}
          />
        )}
      </motion.div>

      {/* Track info */}
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-semibold truncate"
          style={{ color: isActive ? colors.primary : colors.text }}
        >
          {track.title}
        </p>
        <p className="text-[11px] truncate" style={{ color: colors.textMuted }}>
          {track.artist}
        </p>
      </div>

      {/* Add to Playlist button */}
      <button
        onClick={(e) => { e.stopPropagation(); onAddToPlaylist(); }}
        className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        style={{ color: colors.primary, background: `${colors.primary}15` }}
        title="Add to Playlist"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>

      {/* Duration */}
      <span className="text-[11px] tabular-nums shrink-0 font-mono" style={{ color: colors.textMuted }}>
        {track.duration}
      </span>
    </motion.div>
  );
}
