'use client';

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Image as ImageIcon, GripVertical, Loader2 } from 'lucide-react';

interface UploadedImage {
  id: string;
  url: string;
  isUploading?: boolean;
}

interface MultiImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

function generateMockSignedUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.readAsDataURL(file);
  });
}

export default function MultiImageUploader({
  images,
  onChange,
  maxImages = 10,
}: MultiImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const remaining = maxImages - images.length;
      if (remaining <= 0) return;

      const validFiles = Array.from(files)
        .filter((f) => f.type.startsWith('image/'))
        .slice(0, remaining);

      setIsUploading(true);

      const newUrls: string[] = [];
      for (const file of validFiles) {
        const url = await generateMockSignedUrl(file);
        newUrls.push(url);
      }

      onChange([...images, ...newUrls]);
      setIsUploading(false);
    },
    [images, maxImages, onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      processFiles(e.dataTransfer.files);
    },
    [processFiles]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      processFiles(e.target.files);
      if (inputRef.current) inputRef.current.value = '';
    },
    [processFiles]
  );

  const removeImage = useCallback(
    (index: number) => {
      onChange(images.filter((_, i) => i !== index));
    },
    [images, onChange]
  );

  const c = {
    primary: '#a855f7',
    secondary: '#ec4899',
    border: 'rgba(168,85,247,0.25)',
    borderActive: 'rgba(168,85,247,0.6)',
    borderDrag: 'rgba(168,85,247,0.8)',
    bg: '#12121a',
    bgHover: 'rgba(168,85,247,0.05)',
    text: '#f8fafc',
    textMuted: '#64748b',
    glow: 'rgba(168,85,247,0.15)',
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-text-primary mb-1.5">
        Bộ sưu tập ảnh
        <span className="text-text-muted font-normal ml-1">
          ({images.length}/{maxImages})
        </span>
      </label>

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => images.length < maxImages && inputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer
          transition-all duration-200 select-none
          ${images.length >= maxImages ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        style={{
          borderColor: isDragging ? c.borderDrag : c.border,
          background: isDragging ? c.bgHover : c.bg,
          boxShadow: isDragging ? `0 0 20px ${c.glow}` : 'none',
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileInput}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-2">
          {isUploading ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Loader2 className="w-8 h-8" style={{ color: c.primary }} />
              </motion.div>
              <p className="text-sm text-text-muted">Đang tải ảnh lên...</p>
            </>
          ) : (
            <>
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: `${c.primary}15` }}
              >
                <Upload className="w-6 h-6" style={{ color: c.primary }} />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: c.text }}>
                  Kéo thả ảnh hoặc nhấn để chọn
                </p>
                <p className="text-xs text-text-muted mt-1">
                  Hỗ trợ JPG, PNG, WebP, GIF · Tối đa {maxImages} ảnh
                </p>
              </div>
            </>
          )}
        </div>

        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{
              border: `2px solid ${c.primary}`,
              background: `${c.primary}08`,
            }}
          />
        )}
      </div>

      {/* Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          <AnimatePresence>
            {images.map((url, index) => (
              <motion.div
                key={url + index}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className="group relative aspect-square rounded-lg overflow-hidden border"
                style={{ borderColor: `${c.primary}30` }}
              >
                <img
                  src={url}
                  alt={`Ảnh ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                  <span className="text-white text-xs font-medium">
                    {index + 1}
                  </span>
                </div>
                {/* Delete button */}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeImage(index); }}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                  style={{ background: 'rgba(244,63,94,0.9)' }}
                  title="Xóa ảnh"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
                {/* Primary badge */}
                {index === 0 && (
                  <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-bold text-white"
                    style={{ background: `linear-gradient(135deg, ${c.primary}, ${c.secondary})` }}>
                    Cover
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {images.length > 1 && (
        <p className="text-xs text-text-muted">
          Ảnh đầu tiên sẽ là ảnh cover. Kéo thả để sắp xếp thứ tự.
        </p>
      )}
    </div>
  );
}
