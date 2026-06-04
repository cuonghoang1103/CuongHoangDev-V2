'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, ImagePlus, Loader2, GripVertical } from 'lucide-react';
import { toast } from 'sonner';

interface MultiImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

export default function MultiImageUploader({
  images,
  onChange,
  maxImages = 10,
}: MultiImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(
    async (file: File): Promise<string | null> => {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('category', 'thumbnails');

      try {
        const res = await fetch('/api/v1/files/upload', {
          method: 'POST',
          credentials: 'include',
          body: fd,
        });
        const data = await res.json();
        if (data.success && data.data?.downloadUrl) {
          return data.data.downloadUrl as string;
        }
        return null;
      } catch {
        return null;
      }
    },
    []
  );

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      if (images.length + fileArray.length > maxImages) {
        toast.error(`Tối đa ${maxImages} ảnh.`);
        return;
      }

      setUploading(true);
      const uploaded: string[] = [];

      for (const file of fileArray) {
        if (!file.type.startsWith('image/')) continue;
        const url = await uploadFile(file);
        if (url) uploaded.push(url);
      }

      if (uploaded.length > 0) {
        onChange([...images, ...uploaded]);
      }

      setUploading(false);
    },
    [images, maxImages, onChange, uploadFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleRemove = (index: number) => {
    const next = images.filter((_, i) => i !== index);
    onChange(next);
  };

  const handleReorder = (from: number, to: number) => {
    const next = [...images];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  const c = {
    border: 'rgba(168,85,247,0.2)',
    borderHover: 'rgba(168,85,247,0.45)',
    borderActive: 'rgba(168,85,247,0.6)',
    primary: '#a855f7',
    secondary: '#ec4899',
    text: '#f8fafc',
    textMuted: '#64748b',
    glassBg: 'rgba(15,10,30,0.5)',
    cardBg: 'rgba(255,255,255,0.03)',
  };

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className="relative flex flex-col items-center justify-center gap-3 py-8 rounded-xl border-2 border-dashed cursor-pointer transition-all"
        style={{
          borderColor: dragOver ? c.borderActive : c.border,
          background: dragOver ? `${c.primary}08` : c.cardBg,
          transform: dragOver ? 'scale(1.01)' : 'scale(1)',
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => { if (e.target.files) handleFiles(e.target.files); }}
        />

        {uploading ? (
          <>
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: c.primary }} />
            <p className="text-sm" style={{ color: c.textMuted }}>Đang upload...</p>
          </>
        ) : (
          <>
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: `${c.primary}15` }}
            >
              <ImagePlus className="w-6 h-6" style={{ color: c.primary }} />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium" style={{ color: c.text }}>
                Kéo thả ảnh hoặc bấm để chọn
              </p>
              <p className="text-xs mt-1" style={{ color: c.textMuted }}>
                PNG, JPG, WEBP • Tối đa {maxImages} ảnh
              </p>
            </div>
          </>
        )}
      </div>

      {/* Image grid preview */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          <AnimatePresence>
            {images.map((url, i) => (
              <motion.div
                key={url + i}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                className="relative group rounded-xl overflow-hidden aspect-square border"
                style={{ borderColor: c.border }}
              >
                <Image
                  src={url}
                  alt={`Image ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="120px"
                />

                {/* Overlay on hover */}
                <div
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2"
                >
                  {/* Remove */}
                  <button
                    type="button"
                    onClick={() => handleRemove(i)}
                    className="w-7 h-7 rounded-full bg-red-500/80 flex items-center justify-center hover:bg-red-500 transition-colors"
                    title="Xoá ảnh"
                  >
                    <X className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>

                {/* Index badge */}
                <div
                  className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                  style={{ background: c.primary, color: '#fff' }}
                >
                  {i + 1}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {images.length > 0 && (
        <p className="text-xs" style={{ color: c.textMuted }}>
          {images.length} / {maxImages} ảnh
        </p>
      )}
    </div>
  );
}
