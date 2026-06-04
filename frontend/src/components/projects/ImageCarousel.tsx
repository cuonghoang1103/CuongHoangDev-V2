'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageCarouselProps {
  images: string[];
  thumbnailUrl?: string;
  title?: string;
}

function isSafeUrl(url: unknown): url is string {
  return typeof url === 'string' && url.trim().length > 0 && url.startsWith('http');
}

export default function ImageCarousel({
  images,
  thumbnailUrl,
  title,
}: ImageCarouselProps) {
  const allImages = isSafeUrl(thumbnailUrl)
    ? [thumbnailUrl, ...images.filter((u) => u !== thumbnailUrl)]
    : images;

  const [current, setCurrent] = useState(0);

  if (allImages.length === 0) return null;

  const prev = () => setCurrent((c) => (c === 0 ? allImages.length - 1 : c - 1));
  const next = () => setCurrent((c) => (c === allImages.length - 1 ? 0 : c + 1));

  const c = {
    primary: '#a855f7',
    secondary: '#ec4899',
    tertiary: '#22d3ee',
    glow: 'rgba(168,85,247,0.3)',
    text: '#f8fafc',
    textMuted: '#64748b',
  };

  return (
    <div className="relative rounded-2xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
      {/* Main image */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0"
        >
          {isSafeUrl(allImages[current]) ? (
            <Image
              src={allImages[current]}
              alt={`${title ?? 'Project'} — ảnh ${current + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority={current === 0}
            />
          ) : null}
        </motion.div>
      </AnimatePresence>

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent" />

      {/* Navigation arrows — only show when > 1 image */}
      {allImages.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110 z-10"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110 z-10"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {allImages.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
          {allImages.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: i === current ? '24px' : '6px',
                background: i === current ? c.primary : 'rgba(255,255,255,0.4)',
              }}
            />
          ))}
        </div>
      )}

      {/* Image counter */}
      {allImages.length > 1 && (
        <div
          className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-medium z-10"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', color: '#fff' }}
        >
          {current + 1} / {allImages.length}
        </div>
      )}
    </div>
  );
}
