'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1, Volume2, VolumeX, ListMusic } from 'lucide-react';
import { useMusicStore } from '@/store/musicStore';

export default function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);

  const {
    currentTrack, isPlaying, currentTime, duration, volume, isMuted,
    isShuffled, repeatMode, queue,
    next, previous, togglePlay, setCurrentTime, setDuration,
    setVolume, toggleMute, toggleShuffle, cycleRepeat,
  } = useMusicStore();

  // Sync audio element with state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    audio.src = currentTrack.audioUrl;
    audio.load();
    if (isPlaying) {
      audio.play().catch(() => {});
    }
  }, [currentTrack?.id]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) audio.play().catch(() => {});
    else audio.pause();
  }, [isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentTime(audio.currentTime);
  };

  const handleLoadedMetadata = () => {
    const audio = audioRef.current;
    if (!audio) return;
    setDuration(audio.duration);
  };

  const handleEnded = () => {
    next();
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
    setCurrentTime(time);
  };

  const formatTime = (t: number) => {
    if (!t || isNaN(t)) return '0:00';
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!currentTrack) {
    return (
      <div className="hidden lg:flex flex-col items-center justify-center h-full text-text-muted/30">
        <ListMusic className="w-20 h-20 mb-4" />
        <p className="text-sm">Select a track to play</p>
      </div>
    );
  }

  const RepeatIcon = repeatMode === 'one' ? Repeat1 : Repeat;

  return (
    <div className="flex flex-col h-full">
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        crossOrigin="anonymous"
      />

      {/* Now Playing */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        {/* Cover Art */}
        <motion.div
          key={currentTrack.id}
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="relative w-56 h-56 md:w-64 md:h-64 rounded-2xl overflow-hidden shadow-2xl shadow-neon-violet/20 mb-8"
        >
          {currentTrack.coverImage ? (
            <Image
              src={currentTrack.coverImage}
              alt={currentTrack.title}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-neon-indigo via-neon-violet to-neon-fuchsia flex items-center justify-center">
              <ListMusic className="w-20 h-20 text-white/30" />
            </div>
          )}
          {/* Vinyl ring effect */}
          <div className="absolute inset-0 border-8 border-white/5 rounded-2xl pointer-events-none" />
        </motion.div>

        {/* Track Info */}
        <motion.div
          key={currentTrack.id + '-info'}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="text-center mb-6"
        >
          <h2 className="text-xl font-heading font-bold text-text-primary line-clamp-1">
            {currentTrack.title}
          </h2>
          <p className="text-text-muted mt-1">{currentTrack.artist}</p>
        </motion.div>

        {/* Progress Bar */}
        <div className="w-full max-w-md mb-4">
          <div className="relative h-1 bg-darkborder rounded-full overflow-hidden group cursor-pointer">
            {/* Glow */}
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-neon-indigo to-neon-violet rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {/* Knob */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
              style={{ left: `calc(${progress}% - 6px)` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-text-muted">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleShuffle}
            className={`p-2 rounded-lg transition-all ${isShuffled ? 'text-neon-violet' : 'text-text-muted hover:text-text-primary'}`}
            title="Shuffle"
          >
            <Shuffle className="w-4 h-4" />
          </button>

          <button
            onClick={previous}
            className="p-2 text-text-secondary hover:text-text-primary transition-colors"
            title="Previous"
          >
            <SkipBack className="w-6 h-6" />
          </button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={togglePlay}
            className="w-14 h-14 bg-gradient-to-r from-neon-indigo to-neon-violet rounded-full flex items-center justify-center text-white shadow-lg shadow-neon-violet/30 hover:shadow-neon-violet/50 transition-shadow"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
          </motion.button>

          <button
            onClick={next}
            className="p-2 text-text-secondary hover:text-text-primary transition-colors"
            title="Next"
          >
            <SkipForward className="w-6 h-6" />
          </button>

          <button
            onClick={cycleRepeat}
            className={`p-2 rounded-lg transition-all ${repeatMode !== 'none' ? 'text-neon-violet' : 'text-text-muted hover:text-text-primary'}`}
            title={`Repeat: ${repeatMode}`}
          >
            <RepeatIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Volume */}
        <div className="flex items-center gap-3 mt-6 w-full max-w-xs">
          <button
            onClick={toggleMute}
            className="text-text-muted hover:text-text-primary transition-colors"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <div className="relative flex-1 h-1 bg-darkborder rounded-full overflow-hidden group cursor-pointer">
            <div
              className="absolute top-0 left-0 h-full bg-neon-violet/60 rounded-full transition-all"
              style={{ width: `${isMuted ? 0 : volume * 100}%` }}
            />
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Queue Preview */}
      {queue.length > 1 && (
        <div className="px-6 pb-6">
          <div className="flex items-center gap-2 text-xs text-text-muted mb-3">
            <ListMusic className="w-3.5 h-3.5" />
            <span>Up Next: {queue[(useMusicStore.getState().currentIndex + 1) % queue.length]?.title}</span>
          </div>
        </div>
      )}
    </div>
  );
}
