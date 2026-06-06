'use client';

import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Eye, Calendar, ArrowRight, Zap, Bot, Cpu, X } from 'lucide-react';
import { useState, useCallback, useEffect } from 'react';
import type { Post } from '@/types';

interface BlogCardProps {
  post: Post;
  index?: number;
  variant?: 'default' | 'featured' | 'compact';
}

// ── AI Metadata mock — deterministic from post.id for consistent display ───────
function getAiMeta(postId: number | string) {
  const id = typeof postId === 'string' ? parseInt(postId, 36) : postId;
  const confidence = 93 + (id % 7);
  const tokens = 8 + (id % 9);
  return {
    confidence: `${(confidence + Math.random()).toFixed(1)}%`,
    tokens: `~${tokens}k`,
    model: 'Gemini-1.5-Pro',
  };
}

// ── Typewriter hook ────────────────────────────────────────────────────────────
function useTypewriter(text: string, speed = 18, active: boolean) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!active) { setDisplayed(''); setDone(false); return; }
    setDisplayed('');
    setDone(false);
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) { clearInterval(id); setDone(true); }
    }, speed);
    return () => clearInterval(id);
  }, [text, speed, active]);

  return { displayed, done };
}

// ── Mock AI TL;DR bullet points ────────────────────────────────────────────────
function getTldrPoints(post: Post): string[] {
  const title = post.title || '';
  const excerpt = post.excerpt || '';
  const words = title.split(' ').slice(0, 4).join(' ');
  return [
    `This article explores ${words}... with practical implementation patterns for production environments.`,
    `Key architectures covered include modular component design, type-safe APIs, and performance patterns.`,
    `Best suited for developers working with ${(post.tagNames || [])[0] || 'modern web stacks'}.`,
  ];
}

// ── AI Badge ─────────────────────────────────────────────────────────────────
function AIBadge({ pulse }: { pulse?: boolean }) {
  return (
    <span
      className="relative inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold"
      style={{
        background: 'rgba(34,211,238,0.12)',
        border: '1px solid rgba(34,211,238,0.3)',
        color: '#22d3ee',
        textShadow: '0 0 8px #22d3ee60',
      }}
    >
      {pulse && (
        <motion.span
          className="absolute inset-0 rounded-full"
          animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{ background: '#22d3ee', display: 'block' }}
        />
      )}
      <Cpu className="w-2.5 h-2.5 relative" />
      AI-Generated &amp; Verified
    </span>
  );
}

// ── AI Metadata Panel ─────────────────────────────────────────────────────────
function AiMetadataPanel({ postId }: { postId: number | string }) {
  const meta = getAiMeta(postId);
  return (
    <div
      className="flex flex-wrap items-center gap-3 py-2 px-3 rounded-lg"
      style={{
        background: 'rgba(168,85,247,0.08)',
        border: '1px solid rgba(168,85,247,0.15)',
      }}
    >
      <span className="text-[10px] font-mono" style={{ color: '#a855f7' }}>
        <Bot className="w-3 h-3 inline mr-0.5 -mt-0.5" />
        Co-Author: <span style={{ color: '#e879f9' }}>{meta.model}</span>
      </span>
      <span className="text-[10px] font-mono" style={{ color: '#22d3ee' }}>
        Confidence: {meta.confidence}
      </span>
      <span className="text-[10px] font-mono" style={{ color: '#64748b' }}>
        Tokens: {meta.tokens}
      </span>
    </div>
  );
}

// ── AI TL;DR Expander ─────────────────────────────────────────────────────────
function AITldr({ post }: { post: Post }) {
  const [open, setOpen] = useState(false);
  const points = getTldrPoints(post);

  return (
    <div className="mt-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all duration-200"
        style={{
          background: open ? 'rgba(168,85,247,0.15)' : 'rgba(168,85,247,0.06)',
          border: `1px solid ${open ? 'rgba(168,85,247,0.3)' : 'rgba(168,85,247,0.12)'}`,
          color: open ? '#a855f7' : '#818cf8',
        }}
      >
        <Zap className={`w-3.5 h-3.5 ${open ? 'fill-current' : ''}`} />
        {open ? 'Collapse AI Summary' : 'AI TL;DR'}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="overflow-hidden"
          >
            <div
              className="mt-3 p-4 rounded-xl space-y-2"
              style={{
                background: 'rgba(13,11,23,0.8)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(168,85,247,0.2)',
                boxShadow: '0 0 30px rgba(168,85,247,0.08), inset 0 1px 0 rgba(255,255,255,0.04)',
              }}
            >
              {points.map((point, i) => (
                <TLdrLine key={i} text={point} delay={i * 150} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TLdrLine({ text, delay }: { text: string; delay: number }) {
  const { displayed, done } = useTypewriter(text, 15, true);
  return (
    <div className="flex items-start gap-2 text-xs leading-relaxed" style={{ color: '#94a3b8' }}>
      <span className="shrink-0 mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#a855f7' }} />
      <span className="font-mono">
        {displayed}
        {!done && <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.5, repeat: Infinity }} className="ml-0.5">▋</motion.span>}
      </span>
    </div>
  );
}

// ── Format helpers ────────────────────────────────────────────────────────────
function formatDate(dateStr?: string) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function estimateReadingTime(content?: string) {
  if (!content) return 5;
  const words = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

// ── Main Card ────────────────────────────────────────────────────────────────
export default function BlogCard({ post, index = 0, variant = 'default' }: BlogCardProps) {
  const isFeatured = variant === 'featured';
  const isCompact = variant === 'compact';
  const readingTime = estimateReadingTime(post.content || post.excerpt);

  if (isCompact) {
    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.3 }}
      >
        <Link href={`/blog/${post.slug}`}>
          <article className="flex gap-4 p-3 rounded-xl hover:bg-darkcard/60 transition-all duration-200 group">
            <div className="relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden">
              {post.thumbnailUrl ? (
                <img src={post.thumbnailUrl} alt={post.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-neon-indigo to-neon-violet flex items-center justify-center">
                  <span className="text-white/50 text-xs font-bold">CH</span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-text-primary text-sm line-clamp-2 group-hover:text-neon-violet transition-colors">{post.title}</h3>
              <div className="flex items-center gap-2 mt-1.5 text-xs text-text-muted">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(post.publishedAt || post.createdAt)}</span>
                <span>&bull;</span>
                <Clock className="w-3 h-3" />
                <span>{readingTime}m</span>
              </div>
            </div>
          </article>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: index * 0.07, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="group relative"
    >
      <Link href={`/blog/${post.slug}`}>
        <div
          className={`
            bg-darkcard border border-darkborder rounded-2xl overflow-hidden
            hover:border-neon-violet/40 transition-all duration-300
            ${isFeatured ? 'md:col-span-2' : ''}
          `}
        >
          {/* Thumbnail */}
          <div className={`relative overflow-hidden ${isFeatured ? 'h-52 md:h-72' : 'h-48'}`}>
            {post.thumbnailUrl ? (
              <img src={post.thumbnailUrl} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-neon-indigo/40 via-neon-violet/30 to-neon-fuchsia/20 flex items-center justify-center">
                <span className="text-white/30 text-4xl font-heading font-bold">CH</span>
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-darkbg/80 via-transparent to-transparent" />

            {/* Badges row */}
            <div className="absolute top-3 left-3 flex flex-wrap gap-2">
              <AIBadge pulse />
              {post.isFeatured && (
                <span className="px-3 py-1 bg-neon-fuchsia/90 backdrop-blur-sm text-white text-xs font-semibold rounded-lg">
                  Featured
                </span>
              )}
              {post.categoryName && (
                <span className="px-3 py-1 bg-darkbg/80 backdrop-blur-sm border border-darkborder text-text-secondary text-xs font-medium rounded-lg">
                  {post.categoryName}
                </span>
              )}
            </div>
          </div>

          {/* Content */}
          <div className={`p-5 ${isFeatured ? 'md:p-6' : ''}`}>
            {/* AI Metadata Panel */}
            <div className="mb-3">
              <AiMetadataPanel postId={post.id} />
            </div>

            {/* Title */}
            <h2
              className={`
                font-heading font-bold text-text-primary
                group-hover:text-neon-violet transition-colors duration-200
                line-clamp-2
                ${isFeatured ? 'text-xl md:text-2xl' : 'text-base md:text-lg'}
              `}
            >
              {post.title}
            </h2>

            {/* Excerpt */}
            {post.excerpt && (
              <p className={`text-text-muted mt-2 line-clamp-2 ${isFeatured ? 'text-sm md:text-base' : 'text-sm'}`}>
                {post.excerpt}
              </p>
            )}

            {/* TL;DR */}
            <AITldr post={post} />

            {/* Meta */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-darkborder/50">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-neon-indigo to-neon-fuchsia flex items-center justify-center text-white text-xs font-bold">
                  {post.authorName?.charAt(0).toUpperCase() || 'A'}
                </div>
                <div>
                  <p className="text-xs font-medium text-text-primary">{post.authorName || 'CuongHoang'}</p>
                  <div className="flex items-center gap-2 text-xs text-text-muted">
                    <span>{formatDate(post.publishedAt || post.createdAt)}</span>
                    <span>&bull;</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {readingTime}m read
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-xs text-text-muted">
                  <Eye className="w-3.5 h-3.5" />
                  {post.viewCount > 0 ? post.viewCount.toLocaleString() : '0'}
                </span>
                <span className="text-neon-violet text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                  Read
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </div>

            {/* Tags */}
            {post.tagNames && post.tagNames.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {post.tagNames.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 text-xs bg-neon-indigo/10 text-neon-indigo rounded-md"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
