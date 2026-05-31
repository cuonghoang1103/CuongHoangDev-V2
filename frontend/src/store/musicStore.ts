import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Track } from '@/types';
import { ssrSafeStorage } from './ssrSafeStorage';

type RepeatMode = 'none' | 'one' | 'all';

const BLOB_STORAGE_KEY = 'music-audio-blobs-v2';
const STORE_KEY = 'music-storage-v2';

// ============================================================
// Persistence strategy for local (blob) tracks:
// - Track metadata (title, artist, cover, duration) IS persisted.
// - Blob URL is NOT persisted (blob: URLs die on reload).
// - After hydration, restoreBlobs() re-creates blob: URLs from
//   the base64 data stored separately in localStorage.
// ============================================================

// ============================================================
// Persistence strategy for local (blob) tracks:
// - Track metadata (title, artist, cover, duration) IS persisted.
// - Blob URL is NOT persisted (blob: URLs die on reload).
// - After hydration, restoreBlobs() re-creates blob: URLs from
//   the base64 data stored separately in localStorage.
// ============================================================

interface LocalTrackMeta {
  id: string;
  title: string;
  artist: string;
  duration: string;
  coverImage: string;
  blobBase64?: string; // embedded base64 for small files
  blobStored: boolean;  // whether blob is in blob storage
}

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Module-level set to track broken local tracks across reloads
const brokenLocalTracks = new Set<string>();

interface MusicState {
  tracks: Track[];
  currentTrack: Track | null;
  currentIndex: number;
  isPlaying: boolean;
  isHydrated: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffled: boolean;
  repeatMode: RepeatMode;
  queue: Track[];
  savedPositions: Record<string, number>;

  setTracks: (tracks: Track[]) => void;
  addTrack: (track: Track) => void;
  deleteTrack: (id: string) => void;
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
      setHydrated: (v: boolean) => void;
      restoreBlobs: () => void;
      markTrackBroken: (id: string) => void;
      stop: () => void;
}

export const useMusicStore = create<MusicState>()(
  persist(
    (set, get) => ({
      tracks: [],
      currentTrack: null,
      currentIndex: -1,
      isPlaying: false,
      isHydrated: false,
      currentTime: 0,
      duration: 0,
      volume: 0.7,
      isMuted: false,
      isShuffled: false,
      repeatMode: 'none',
      queue: [],
      savedPositions: {},

      setTracks: (tracks) => {
        const first = tracks[0] || null;
        set({
          tracks,
          queue: tracks,
          currentTrack: first,
          currentIndex: first ? 0 : -1,
        });
      },

      addTrack: (track) => {
        set((s) => {
          const newTracks = [...s.tracks, track];
          const wasEmpty = s.tracks.length === 0;
          return {
            tracks: newTracks,
            queue: newTracks,
            currentTrack: wasEmpty ? track : s.currentTrack,
            currentIndex: wasEmpty ? 0 : s.currentIndex,
          };
        });
      },

      deleteTrack: (id) => {
        const { currentTrack } = get();
        if (id.startsWith('local-')) {
          removeBlobFromStorage(id);
          brokenLocalTracks.delete(id);
        }
        set((s) => {
          const newTracks = s.tracks.filter((t) => t.id !== id);
          const deletedIndex = s.tracks.findIndex((t) => t.id === id);
          let newIndex = s.currentIndex;
          let newCurrent = s.currentTrack;

          if (newTracks.length === 0) {
            newCurrent = null;
            newIndex = -1;
          } else if (currentTrack?.id === id) {
            newIndex = Math.min(deletedIndex, newTracks.length - 1);
            newCurrent = newTracks[newIndex];
          } else if (deletedIndex < s.currentIndex) {
            newIndex = s.currentIndex - 1;
          }

          return {
            tracks: newTracks,
            queue: newTracks,
            currentTrack: newCurrent,
            currentIndex: newIndex,
            isPlaying: newCurrent ? s.isPlaying : false,
          };
        });
      },

      playTrack: (track) => {
        const { tracks } = get();
        const idx = tracks.findIndex((t) => t.id === track.id);
        const savedPos = get().savedPositions[track.id] ?? 0;
        set({
          currentTrack: track,
          currentIndex: idx >= 0 ? idx : 0,
          isPlaying: true,
          currentTime: savedPos,
        });
      },

      playTrackAtIndex: (index) => {
        const { tracks, savedPositions } = get();
        if (index < 0 || index >= tracks.length) return;
        const savedPos = savedPositions[tracks[index].id] ?? 0;
        set({
          currentTrack: tracks[index],
          currentIndex: index,
          isPlaying: true,
          currentTime: savedPos,
        });
      },

      togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
      play: () => set({ isPlaying: true }),
      pause: () => set({ isPlaying: false }),

      next: () => {
        const { tracks, currentIndex, repeatMode } = get();
        if (tracks.length === 0) return;

        if (repeatMode === 'one') {
          set({ currentTime: 0 });
          return;
        }

        let nextIndex = currentIndex + 1;
        if (nextIndex >= tracks.length) {
          if (repeatMode === 'all') nextIndex = 0;
          else { set({ isPlaying: false }); return; }
        }

        const savedPos = get().savedPositions[tracks[nextIndex].id] ?? 0;
        set({
          currentTrack: tracks[nextIndex],
          currentIndex: nextIndex,
          isPlaying: true,
          currentTime: savedPos,
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
        const savedPos = get().savedPositions[tracks[prevIndex].id] ?? 0;
        set({
          currentTrack: tracks[prevIndex],
          currentIndex: prevIndex,
          currentTime: savedPos,
          isPlaying: true,
        });
      },

      setCurrentTime: (time) => {
        const { currentTrack } = get();
        set((s) => {
          const newPositions = { ...s.savedPositions };
          if (currentTrack?.id) {
            newPositions[currentTrack.id] = time;
          }
          return { currentTime: time, savedPositions: newPositions };
        });
      },

      setDuration: (duration) => set({ duration }),
      setVolume: (volume) => set({ volume, isMuted: false }),
      toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),

      toggleShuffle: () =>
        set((s) => {
          const newShuffle = !s.isShuffled;
          if (newShuffle) {
            const shuffled = shuffleArray(s.tracks);
            if (s.currentTrack) {
              const ci = shuffled.findIndex((t) => t.id === s.currentTrack!.id);
              if (ci > 0) {
                [shuffled[0], shuffled[ci]] = [shuffled[ci], shuffled[0]];
              }
            }
            return { isShuffled: true, queue: shuffled, tracks: shuffled };
          } else {
            return { isShuffled: false, tracks: s.queue, queue: s.queue };
          }
        }),

      cycleRepeat: () =>
        set((s) => {
          const modes: RepeatMode[] = ['none', 'all', 'one'];
          const idx = modes.indexOf(s.repeatMode);
          return { repeatMode: modes[(idx + 1) % modes.length] };
        }),

      clearQueue: () => set({ queue: [] }),

      setHydrated: (v) => set({ isHydrated: v }),

      restoreBlobs: () => {
        set((s) => {
          const updatedTracks = s.tracks.map((track) => {
            if (!track.id.startsWith('local-')) return track;
            if (brokenLocalTracks.has(track.id)) return track;

            const base64 = loadBlobFromStorage(track.id);
            if (base64) {
              try {
                const mime = base64.match(/:([^;]+)/)?.[1] ?? 'audio/mpeg';
                const binary = atob(base64.split(',')[1]);
                const bytes = new Uint8Array(binary.length);
                for (let i = 0; i < binary.length; i++) {
                  bytes[i] = binary.charCodeAt(i);
                }
                const blob = new Blob([bytes], { type: mime });
                const blobUrl = URL.createObjectURL(blob);
                return { ...track, audioUrl: blobUrl };
              } catch {
                brokenLocalTracks.add(track.id);
                return { ...track, audioUrl: '' };
              }
            }
            brokenLocalTracks.add(track.id);
            return { ...track, audioUrl: '' };
          });
          return { tracks: updatedTracks };
        });
      },

      markTrackBroken: (id) => {
        brokenLocalTracks.add(id);
        set((s) => ({
          tracks: s.tracks.map((t) => (t.id === id ? { ...t, audioUrl: '' } : t)),
        }));
      },

      // Stop playback (pause) — keeps the track, player UI stays visible.
      stop: () => set({ isPlaying: false, currentTime: 0 }),
    }),
    {
      name: STORE_KEY,
      storage: createJSONStorage(() => ssrSafeStorage),
      partialize: (state) => ({
        tracks: state.tracks,
        queue: state.queue,
        currentTrack: state.currentTrack,
        currentIndex: state.currentIndex,
        volume: state.volume,
        isMuted: state.isMuted,
        isShuffled: state.isShuffled,
        repeatMode: state.repeatMode,
        savedPositions: state.savedPositions,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHydrated(true);
          setTimeout(() => state.restoreBlobs(), 200);
        }
      },
    }
  )
);

// ============================================================
// Helpers for blob persistence
// ============================================================

export function saveBlobToStorage(trackId: string, file: File): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  return new Promise((resolve) => {
    const MAX_SIZE = 8 * 1024 * 1024; // 8MB limit
    if (file.size > MAX_SIZE) {
      resolve();
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      try {
        const stored = JSON.parse(ssrSafeStorage.getItem(BLOB_STORAGE_KEY) || '{}');
        stored[trackId] = { data: reader.result, type: file.type, name: file.name };
        ssrSafeStorage.setItem(BLOB_STORAGE_KEY, JSON.stringify(stored));
      } catch {
        // quota exceeded
      }
      resolve();
    };
    reader.onerror = () => resolve();
    reader.readAsDataURL(file);
  });
}

function loadBlobFromStorage(trackId: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = JSON.parse(ssrSafeStorage.getItem(BLOB_STORAGE_KEY) || '{}');
    const entry = stored[trackId];
    if (entry?.data) return entry.data;
  } catch { /* corrupt */ }
  return null;
}

function removeBlobFromStorage(trackId: string) {
  if (typeof window === 'undefined') return;
  try {
    const stored = JSON.parse(ssrSafeStorage.getItem(BLOB_STORAGE_KEY) || '{}');
    delete stored[trackId];
    ssrSafeStorage.setItem(BLOB_STORAGE_KEY, JSON.stringify(stored));
  } catch { /* ignore */ }
}
