import { create } from 'zustand';
import type { Track } from '@/types';

type RepeatMode = 'none' | 'one' | 'all';

interface MusicState {
  // Playlist
  tracks: Track[];
  currentTrack: Track | null;
  currentIndex: number;

  // Player state
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffled: boolean;
  repeatMode: RepeatMode;

  // Queue
  queue: Track[];
  originalOrder: Track[];

  // Actions
  setTracks: (tracks: Track[]) => void;
  playTrack: (track: Track) => void;
  playTrackAtIndex: (index: number) => void;
  togglePlay: () => void;
  play: () => void;
  pause: () => void;
  next: () => void;
  previous: () => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  clearQueue: () => void;
}

function parseDuration(dur: string): number {
  const parts = dur.split(':').map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
}

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export const useMusicStore = create<MusicState>()((set, get) => ({
  tracks: [],
  currentTrack: null,
  currentIndex: -1,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.7,
  isMuted: false,
  isShuffled: false,
  repeatMode: 'none',
  queue: [],
  originalOrder: [],

  setTracks: (tracks) => {
    const first = tracks[0] || null;
    set({
      tracks,
      queue: tracks,
      originalOrder: tracks,
      currentTrack: first,
      currentIndex: first ? 0 : -1,
    });
  },

  playTrack: (track) => {
    const { tracks, isShuffled, originalOrder } = get();
    const source = isShuffled ? tracks : originalOrder;
    const idx = source.findIndex((t) => t.id === track.id);
    set({
      currentTrack: track,
      currentIndex: idx,
      isPlaying: true,
      currentTime: 0,
    });
  },

  playTrackAtIndex: (index) => {
    const { tracks } = get();
    if (index < 0 || index >= tracks.length) return;
    set({
      currentTrack: tracks[index],
      currentIndex: index,
      isPlaying: true,
      currentTime: 0,
    });
  },

  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),

  next: () => {
    const { tracks, currentIndex, repeatMode, isShuffled, originalOrder } = get();
    if (tracks.length === 0) return;

    if (repeatMode === 'one') {
      set((s) => ({ currentTime: 0 }));
      return;
    }

    let nextIndex = currentIndex + 1;
    if (nextIndex >= tracks.length) {
      if (repeatMode === 'all') {
        nextIndex = 0;
      } else {
        set({ isPlaying: false });
        return;
      }
    }

    set({
      currentTrack: tracks[nextIndex],
      currentIndex: nextIndex,
      isPlaying: true,
      currentTime: 0,
    });
  },

  previous: () => {
    const { tracks, currentIndex, currentTime } = get();
    if (tracks.length === 0) return;

    if (currentTime > 3) {
      set({ currentTime: 0 });
      return;
    }

    let prevIndex = currentIndex - 1;
    if (prevIndex < 0) prevIndex = tracks.length - 1;
    set({
      currentTrack: tracks[prevIndex],
      currentIndex: prevIndex,
      currentTime: 0,
      isPlaying: true,
    });
  },

  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration }),
  setVolume: (volume) => set({ volume, isMuted: false }),
  toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),

  toggleShuffle: () =>
    set((s) => {
      const newShuffle = !s.isShuffled;
      if (newShuffle) {
        const shuffled = shuffleArray(s.originalOrder);
        let nextTrack = shuffled[0];
        if (s.currentTrack) {
          const idx = shuffled.findIndex((t) => t.id === s.currentTrack!.id);
          if (idx > 0) {
            [shuffled[0], shuffled[idx]] = [shuffled[idx], shuffled[0]];
          }
          nextTrack = s.currentTrack;
        }
        return {
          isShuffled: true,
          queue: shuffled,
          tracks: shuffled,
          currentTrack: nextTrack,
        };
      } else {
        return {
          isShuffled: false,
          tracks: s.originalOrder,
          queue: s.originalOrder,
        };
      }
    }),

  cycleRepeat: () =>
    set((s) => {
      const modes: RepeatMode[] = ['none', 'all', 'one'];
      const idx = modes.indexOf(s.repeatMode);
      return { repeatMode: modes[(idx + 1) % modes.length] };
    }),

  clearQueue: () => set({ queue: [] }),
}));
