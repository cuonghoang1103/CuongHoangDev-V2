'use client';

import { motion } from 'framer-motion';
import { Play, Pause } from 'lucide-react';
import { useMusicStore } from '@/store/musicStore';
import type { Track } from '@/types';

interface TrackListProps {
  tracks: Track[];
}

function TrackItem({ track, index }: { track: Track; index: number }) {
  const { currentTrack, isPlaying, playTrack, playTrackAtIndex } = useMusicStore();
  const isActive = currentTrack?.id === track.id;

  const handlePlay = () => {
    if (isActive) {
      useMusicStore.getState().togglePlay();
    } else {
      playTrack(track);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.25, delay: index * 0.03 }}
    >
      <button
        onClick={handlePlay}
        className={`
          w-full flex items-center gap-4 px-4 py-3 rounded-xl
          transition-all duration-200 group
          ${isActive
            ? 'bg-neon-violet/15 border border-neon-violet/20'
            : 'hover:bg-darkcard/60 border border-transparent'
          }
        `}
      >
        {/* Index / Play */}
        <div className="w-8 flex items-center justify-center shrink-0">
          {isActive && isPlaying ? (
            <div className="flex items-end gap-0.5 h-4">
              <motion.div
                animate={{ height: [4, 16, 4] }}
                transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut' }}
                className="w-1 bg-neon-violet rounded-full"
              />
              <motion.div
                animate={{ height: [8, 4, 12] }}
                transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut', delay: 0.15 }}
                className="w-1 bg-neon-violet rounded-full"
              />
              <motion.div
                animate={{ height: [12, 4, 8] }}
                transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
                className="w-1 bg-neon-violet rounded-full"
              />
            </div>
          ) : (
            <>
              <span className={`text-sm font-medium ${isActive ? 'text-neon-violet' : 'text-text-muted group-hover:text-transparent'} ${!isActive ? 'group-hover:hidden' : ''}`}>
                {String(index + 1).padStart(2, '0')}
              </span>
              <Play className={`w-4 h-4 text-neon-violet hidden group-hover:block absolute`} style={{ left: '2rem' }} />
            </>
          )}
        </div>

        {/* Cover */}
        <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0">
          {track.coverImage ? (
            <img src={track.coverImage} alt={track.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-neon-indigo to-neon-violet flex items-center justify-center">
              <span className="text-white/40 text-xs font-bold">{track.title.charAt(0)}</span>
            </div>
          )}
          {isActive && (
            <div className="absolute inset-0 bg-neon-violet/10" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 text-left">
          <p className={`text-sm font-medium truncate ${isActive ? 'text-neon-violet' : 'text-text-primary'}`}>
            {track.title}
          </p>
          <p className="text-xs text-text-muted truncate">{track.artist}</p>
        </div>

        {/* Duration */}
        <span className="text-xs text-text-muted shrink-0 font-mono">
          {track.duration}
        </span>
      </button>
    </motion.div>
  );
}

export default function TrackList({ tracks }: TrackListProps) {
  const { playTrackAtIndex, play } = useMusicStore();

  const handlePlayAll = () => {
    if (tracks.length > 0) {
      playTrackAtIndex(0);
    }
  };

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

  return (
    <div>
      {/* Play All Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div>
          <span className="text-sm text-text-muted">
            {tracks.length} tracks &bull; {formatTotal(totalSeconds)}
          </span>
        </div>
        <button
          onClick={handlePlayAll}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-neon-indigo to-neon-violet text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity"
        >
          <Play className="w-4 h-4" fill="currentColor" />
          Play All
        </button>
      </div>

      {/* Track list */}
      <div className="space-y-1">
        {tracks.map((track, i) => (
          <TrackItem key={track.id} track={track} index={i} />
        ))}
      </div>
    </div>
  );
}
