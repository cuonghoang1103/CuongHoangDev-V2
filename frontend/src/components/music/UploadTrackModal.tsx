'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, ImageIcon, Music, Loader2 } from 'lucide-react';
import { useMusicStore } from '@/store/musicStore';
import type { Track } from '@/types';

interface UploadTrackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UploadTrackModal({ isOpen, onClose }: UploadTrackModalProps) {
  const { addTrack } = useMusicStore();
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setTitle('');
      setArtist('');
      setCoverUrl('');
      setAudioFile(null);
      setCoverFile(null);
      setPreviewUrl('');
      setIsUploading(false);
    }
  }, [isOpen]);

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAudioFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    const url = URL.createObjectURL(file);
    setCoverUrl(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !artist.trim() || !audioFile) return;

    setIsUploading(true);

    // Simulate upload delay
    await new Promise((r) => setTimeout(r, 800));

    let duration = '3:45';
    if (audioRef.current) {
      audioRef.current.src = previewUrl;
    }

    // Get duration after audio loads
    const getDuration = (): Promise<string> => {
      return new Promise((resolve) => {
        const audio = new Audio(previewUrl);
        audio.addEventListener('loadedmetadata', () => {
          const m = Math.floor(audio.duration / 60);
          const s = Math.floor(audio.duration % 60);
          resolve(`${m}:${s.toString().padStart(2, '0')}`);
        });
        audio.addEventListener('error', () => resolve('3:45'));
        setTimeout(() => resolve('3:45'), 3000);
      });
    }

    duration = await getDuration();

    const newTrack: Track = {
      id: `local-${Date.now()}`,
      title: title.trim(),
      artist: artist.trim(),
      duration,
      audioUrl: previewUrl,
      coverImage: coverUrl || '',
    };

    addTrack(newTrack);
    setIsUploading(false);
    onClose();
  };

  const isValid = title.trim() && artist.trim() && audioFile;

  return (
    <>
      <audio ref={audioRef} className="hidden" />
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={onClose}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="bg-darkcard rounded-2xl border border-darkborder shadow-2xl w-full max-w-lg pointer-events-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-darkborder">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-neon-indigo to-neon-violet rounded-xl flex items-center justify-center">
                      <Upload className="w-4.5 h-4.5 text-white" />
                    </div>
                    <div>
                      <h2 className="font-heading font-bold text-text-primary">Upload New Track</h2>
                      <p className="text-xs text-text-muted">Add a track to your playlist</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-white/5 text-text-muted hover:text-text-primary transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                  {/* Audio File */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Audio File <span className="text-red-400">*</span>
                    </label>
                    <label
                      className={`flex flex-col items-center justify-center w-full h-24 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
                        audioFile
                          ? 'border-neon-violet/50 bg-neon-violet/5'
                          : 'border-darkborder hover:border-neon-violet/40 bg-white/[0.02]'
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center pt-3 pb-3">
                        {audioFile ? (
                          <>
                            <Music className="w-6 h-6 text-neon-violet mb-1" />
                            <span className="text-sm text-neon-violet font-medium">{audioFile.name}</span>
                            <span className="text-xs text-text-muted mt-0.5">
                              {(audioFile.size / 1024 / 1024).toFixed(1)} MB
                            </span>
                          </>
                        ) : (
                          <>
                            <Music className="w-6 h-6 text-text-muted mb-1" />
                            <span className="text-sm text-text-muted">Drop MP3 here or click to browse</span>
                          </>
                        )}
                      </div>
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={handleAudioChange}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Title <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Track title"
                      className="w-full px-4 py-2.5 bg-darkbg border border-darkborder rounded-xl text-sm text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:border-neon-violet/50 transition-colors"
                    />
                  </div>

                  {/* Artist */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Artist <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={artist}
                      onChange={(e) => setArtist(e.target.value)}
                      placeholder="Artist name"
                      className="w-full px-4 py-2.5 bg-darkbg border border-darkborder rounded-xl text-sm text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:border-neon-violet/50 transition-colors"
                    />
                  </div>

                  {/* Cover Image */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Cover Image
                    </label>
                    <div className="flex gap-3">
                      <label
                        className={`flex flex-col items-center justify-center w-20 h-20 rounded-xl border-2 border-dashed cursor-pointer transition-colors shrink-0 ${
                          coverUrl
                            ? 'border-neon-violet/50 bg-neon-violet/5'
                            : 'border-darkborder hover:border-neon-violet/40 bg-white/[0.02]'
                        }`}
                      >
                        {coverUrl ? (
                          <img src={coverUrl} alt="Cover preview" className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-text-muted" />
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCoverChange}
                          className="hidden"
                        />
                      </label>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={coverUrl}
                          onChange={(e) => setCoverUrl(e.target.value)}
                          placeholder="Or paste image URL..."
                          className="w-full px-4 py-2.5 bg-darkbg border border-darkborder rounded-xl text-sm text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:border-neon-violet/50 transition-colors h-10"
                        />
                        <p className="text-xs text-text-muted/60 mt-1.5">
                          Upload an image or paste a URL
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2.5 text-sm text-text-muted hover:text-text-primary transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!isValid || isUploading}
                      className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl text-white transition-all ${
                        isValid && !isUploading
                          ? 'bg-gradient-to-r from-neon-indigo to-neon-violet hover:opacity-90 shadow-lg shadow-neon-violet/20'
                          : 'bg-darkborder text-text-muted cursor-not-allowed'
                      }`}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Upload Track
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
