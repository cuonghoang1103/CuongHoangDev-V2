'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Upload, X, ImagePlus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ThumbnailUploaderProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}

export default function ThumbnailUploader({
  value,
  onChange,
  label = 'Ảnh đại diện dự án',
}: ThumbnailUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File): Promise<string | null> => {
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
      toast.error(data.message || 'Upload thất bại');
      return null;
    } catch {
      toast.error('Upload thất bại. Vui lòng thử lại.');
      return null;
    }
  };

  const handleFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    const file = fileArray[0];
    if (!file.type.startsWith('image/')) {
      toast.error('Chỉ chấp nhận file ảnh.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File quá lớn. Tối đa 10MB.');
      return;
    }

    setUploading(true);
    const url = await uploadFile(file);
    if (url) {
      onChange(url);
    }
    setUploading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleRemove = () => {
    onChange('');
  };

  const c = {
    primary: '#a855f7',
    border: 'rgba(168,85,247,0.2)',
    borderHover: 'rgba(168,85,247,0.45)',
    borderActive: 'rgba(168,85,247,0.6)',
    textMuted: '#64748b',
  };

  const hasImage = value && value.trim().length > 0 && value.startsWith('http');

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-text-primary mb-1.5">
        {label}
      </label>

      {hasImage ? (
        /* Preview mode */
        <div className="relative rounded-xl overflow-hidden border group"
          style={{ borderColor: c.border }}>
          <Image
            src={value}
            alt="Thumbnail"
            width={400}
            height={225}
            className="w-full h-40 object-cover"
            style={{ aspectRatio: '16/9' }}
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
              title="Đổi ảnh"
            >
              <Upload className="w-4 h-4 text-white" />
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="w-9 h-9 rounded-full bg-red-500/80 flex items-center justify-center hover:bg-red-500 transition-colors"
              title="Xóa ảnh"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { if (e.target.files) handleFiles(e.target.files); }}
          />
        </div>
      ) : (
        /* Drop zone */
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className="relative flex flex-col items-center justify-center gap-2 py-7 rounded-xl border-2 border-dashed cursor-pointer transition-all"
          style={{
            borderColor: dragOver ? c.borderActive : c.border,
            background: dragOver ? `${c.primary}08` : 'rgba(255,255,255,0.02)',
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
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
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: `${c.primary}15` }}
              >
                <ImagePlus className="w-5 h-5" style={{ color: c.primary }} />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-text-primary">
                  Kéo thả ảnh hoặc bấm để chọn
                </p>
                <p className="text-xs mt-1" style={{ color: c.textMuted }}>
                  PNG, JPG, WEBP • Tối đa 10MB
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* URL input fallback */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-px" style={{ background: c.border }} />
        <span className="text-[10px]" style={{ color: c.textMuted }}>hoặc dán URL</span>
        <div className="flex-1 h-px" style={{ background: c.border }} />
      </div>
      <input
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://images.unsplash.com/..."
        className="w-full px-4 py-2.5 bg-darkcard border border-darkborder rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-neon-violet/50 transition-colors"
      />
    </div>
  );
}
