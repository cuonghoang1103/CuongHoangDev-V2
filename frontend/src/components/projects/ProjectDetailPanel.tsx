'use client';

import { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  X, ExternalLink, Github, Calendar, Code2, Eye, Star, GitFork,
  Clock, ChevronRight, BookOpen, Layers, MapPin, CheckCircle2, Circle,
  Zap, Target, Rocket, Wrench,
} from 'lucide-react';
import ImageCarousel from './ImageCarousel';
import type { Project } from '@/types';

const STATUS_LABELS: Record<string, string> = {
  COMPLETED: 'Hoàn thành',
  IN_PROGRESS: 'Đang phát triển',
  PLANNING: 'Lên kế hoạch',
  MAINTENANCE: 'Bảo trì',
  ON_HOLD: 'Tạm dừng',
};

const STATUS_COLORS: Record<string, { bg: string; text: string; glow: string }> = {
  COMPLETED: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', glow: 'rgba(52,211,153,0.3)' },
  IN_PROGRESS: { bg: 'bg-yellow-500/15', text: 'text-yellow-400', glow: 'rgba(250,204,21,0.3)' },
  PLANNING: { bg: 'bg-blue-500/15', text: 'text-blue-400', glow: 'rgba(59,130,246,0.3)' },
  MAINTENANCE: { bg: 'bg-purple-500/15', text: 'text-purple-400', glow: 'rgba(168,85,247,0.3)' },
  ON_HOLD: { bg: 'bg-gray-500/15', text: 'text-gray-400', glow: 'rgba(100,116,139,0.3)' },
};

const MOCK_STATS: Record<number, { views: number; stars: number; forks: number }> = {
  1: { views: 1420, stars: 89, forks: 24 },
  2: { views: 890, stars: 45, forks: 12 },
  3: { views: 670, stars: 38, forks: 9 },
  4: { views: 450, stars: 22, forks: 6 },
  5: { views: 320, stars: 15, forks: 4 },
  6: { views: 280, stars: 18, forks: 3 },
  7: { views: 150, stars: 8, forks: 2 },
  8: { views: 520, stars: 31, forks: 7 },
  9: { views: 390, stars: 19, forks: 5 },
};

interface TimelineEntry {
  label: string;
  description: string;
  date?: string;
  icon: React.ElementType;
  status: 'done' | 'active' | 'pending';
}

function buildTimeline(project: Project): TimelineEntry[] {
  const statusOrder = ['PLANNING', 'IN_PROGRESS', 'COMPLETED', 'MAINTENANCE'];
  const currentIdx = statusOrder.indexOf(project.status);

  const phases: TimelineEntry[] = [
    {
      label: 'Lên kế hoạch',
      description: 'Phân tích yêu cầu, nghiên cứu công nghệ, thiết kế kiến trúc hệ thống.',
      date: project.startDate,
      icon: Target,
      status: currentIdx >= 0 ? 'done' : 'pending',
    },
    {
      label: 'Phát triển',
      description: 'Xây dựng tính năng cốt lõi, API endpoints, giao diện người dùng.',
      icon: Zap,
      status: currentIdx >= 1 ? 'done' : currentIdx === 1 ? 'active' : 'pending',
    },
    {
      label: 'Kiểm thử',
      description: 'Unit tests, integration tests, QA, sửa lỗi và tối ưu hiệu năng.',
      icon: Wrench,
      status: currentIdx >= 2 ? 'done' : currentIdx === 2 ? 'active' : 'pending',
    },
    {
      label: 'Triển khai',
      description: 'Deploy lên production, monitoring, documentation và bàn giao.',
      icon: Rocket,
      status: project.status === 'COMPLETED' || project.status === 'MAINTENANCE' ? 'done'
        : project.status === 'IN_PROGRESS' ? 'active' : 'pending',
    },
  ];

  if (project.status !== 'IN_PROGRESS' && project.status !== 'COMPLETED' && project.status !== 'MAINTENANCE') {
    if (currentIdx >= 0) phases[0].status = 'done';
  }

  return phases;
}

function parseMarkdown(content: string): string {
  if (!content) return '';
  return content
    .replace(/^## (.+)$/gm, '<h3 class="text-base font-bold text-text-primary mt-5 mb-2 flex items-center gap-2"><span class="w-1 h-5 rounded-full bg-gradient-to-b from-neon-violet to-neon-indigo shrink-0"></span>$1</h3>')
    .replace(/^### (.+)$/gm, '<h4 class="text-sm font-semibold text-neon-violet mt-3 mb-1.5">$1</h4>')
    .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-neon-violet/50 pl-4 py-2 my-3 rounded-r-lg bg-neon-violet/5 text-text-secondary italic text-sm">$1</blockquote>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-neon-violet font-semibold">$1</strong>')
    .replace(/_(.+?)_/g, '<em class="text-neon-indigo">$1</em>')
    .replace(/`(.+?)`/g, '<code class="px-1.5 py-0.5 rounded text-xs bg-neon-violet/10 text-purple-300 border border-neon-violet/20">$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-purple-400 hover:underline">$1</a>')
    .replace(/^- (.+)$/gm, '<li class="flex items-start gap-2 text-text-secondary my-1.5 text-sm"><span class="w-1.5 h-1.5 rounded-full mt-2 shrink-0 flex-shrink-0" style="background:linear-gradient(135deg,#a855f7,#ec4899)"></span>$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="flex items-start gap-2 text-text-secondary my-1.5 text-sm list-none"><span class="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 bg-neon-indigo/15 text-neon-indigo mt-0.5 border border-neon-indigo/20">$1</span>$2</li>')
    .replace(/^---$/gm, '<hr class="my-4 border-0 h-px" style="background:linear-gradient(90deg,transparent,rgba(168,85,247,0.3),transparent)" />')
    .replace(/\n\n/g, '</p><p class="text-text-secondary leading-relaxed mt-2 text-sm">')
    .replace(/^(?!<[hlpb]|<a|<code|<li|<hr)(.+)$/gm, '$1');
}

function renderContent(content: string): string {
  if (!content) return '';
  const paragraphs = content.split(/\n\n+/);
  return paragraphs
    .map((p) => {
      const trimmed = p.trim();
      if (!trimmed) return '';
      if (
        trimmed.startsWith('<h') ||
        trimmed.startsWith('<blockquote') ||
        trimmed.startsWith('<li') ||
        trimmed.startsWith('<hr')
      ) {
        return trimmed;
      }
      return `<p class="text-text-secondary leading-relaxed mt-2 text-sm">${parseMarkdown(trimmed)}</p>`;
    })
    .join('\n');
}

function formatDate(dateStr?: string) {
  if (!dateStr) return null;
  try {
    return new Date(dateStr).toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function formatCount(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

interface ProjectDetailPanelProps {
  project: Project | null;
  onClose: () => void;
  starred?: boolean;
  onToggleStar?: () => void;
}

export default function ProjectDetailPanel({
  project,
  onClose,
  starred = false,
  onToggleStar,
}: ProjectDetailPanelProps) {
  const c = {
    primary: '#a855f7',
    secondary: '#ec4899',
    tertiary: '#22d3ee',
    text: '#f8fafc',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    glassBg: 'rgba(10,6,25,0.95)',
    surface: 'rgba(20,15,40,0.6)',
    border: 'rgba(168,85,247,0.18)',
    borderLight: 'rgba(168,85,247,0.08)',
  };

  const stats = project ? (MOCK_STATS[project.id] ?? { views: 0, stars: 0, forks: 0 }) : null;
  const statusStyle = project ? STATUS_COLORS[project.status] : null;
  const techs = Array.isArray(project?.technologies) ? project.technologies : [];
  const timeline = useMemo(() => (project ? buildTimeline(project) : []), [project]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <AnimatePresence>
      {project && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Slide-over Panel */}
          <motion.div
            key="panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-2xl flex flex-col"
            style={{ background: c.glassBg }}
          >
            {/* Glass border */}
            <div className="absolute inset-0 pointer-events-none" style={{
              borderLeft: `1px solid ${c.border}`,
              boxShadow: `-20px 0 60px rgba(168,85,247,0.08)`,
            }} />

            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-4 shrink-0"
              style={{ borderBottom: `1px solid ${c.border}` }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `linear-gradient(135deg, ${c.primary}, ${c.secondary})` }}
                >
                  <Layers className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: c.primary }}>
                    Chi tiết dự án
                  </p>
                  <h2 className="text-base font-heading font-bold truncate" style={{ color: c.text }}>
                    {project.title}
                  </h2>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors"
                style={{ color: c.textMuted }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-6 py-5 space-y-5">

                {/* ── Image Gallery ─────────────────────────────────────── */}
                <ImageCarousel
                  images={project.images ?? []}
                  thumbnailUrl={project.thumbnailUrl}
                  title={project.title}
                />

                {/* ── Status + Stats row ─────────────────────────────────── */}
                <div className="flex items-center gap-2 flex-wrap">
                  {statusStyle && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${statusStyle.bg} ${statusStyle.text}`}
                    >
                      {STATUS_LABELS[project.status] ?? project.status}
                    </motion.span>
                  )}
                  {project.featured && (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-400/15 text-yellow-300">
                      ★ Nổi bật
                    </span>
                  )}
                  {stats && (
                    <div className="ml-auto flex items-center gap-3">
                      <span className="flex items-center gap-1 text-xs" style={{ color: c.textMuted }}>
                        <Eye className="w-3.5 h-3.5" />
                        {formatCount(stats.views)}
                      </span>
                      {onToggleStar && (
                        <button
                          onClick={onToggleStar}
                          className={`flex items-center gap-1 text-xs transition-all hover:scale-110 ${
                            starred ? 'text-yellow-400' : 'text-text-muted hover:text-yellow-400'
                          }`}
                        >
                          <Star className="w-3.5 h-3.5" fill={starred ? 'currentColor' : 'none'} />
                          {formatCount(stats.stars + (starred ? 1 : 0))}
                        </button>
                      )}
                      <span className="flex items-center gap-1 text-xs" style={{ color: c.textMuted }}>
                        <GitFork className="w-3.5 h-3.5" />
                        {formatCount(stats.forks)}
                      </span>
                    </div>
                  )}
                </div>

                {/* ── Description ───────────────────────────────────────── */}
                <p className="text-sm leading-relaxed" style={{ color: c.textSecondary }}>
                  {project.description}
                </p>

                {/* ── Meta row ───────────────────────────────────────────── */}
                <div className="flex flex-wrap gap-x-5 gap-y-2">
                  {project.role && (
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: c.textSecondary }}>
                      <Code2 className="w-3.5 h-3.5 shrink-0" style={{ color: c.primary }} />
                      <span>{project.role}</span>
                    </div>
                  )}
                  {project.duration && (
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: c.textSecondary }}>
                      <Clock className="w-3.5 h-3.5 shrink-0" style={{ color: c.primary }} />
                      <span>{project.duration}</span>
                    </div>
                  )}
                  {(project.startDate || project.endDate) && (
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: c.textSecondary }}>
                      <Calendar className="w-3.5 h-3.5 shrink-0" style={{ color: c.primary }} />
                      <span>{formatDate(project.startDate)}</span>
                      {project.startDate && project.endDate && (
                        <>
                          <ChevronRight className="w-3 h-3" />
                          <span>{formatDate(project.endDate)}</span>
                        </>
                      )}
                      {project.startDate && !project.endDate && (
                        <span className="text-neon-violet">— Hiện tại</span>
                      )}
                    </div>
                  )}
                </div>

                {/* ── Tech Stack ────────────────────────────────────────── */}
                {techs.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-2.5" style={{ color: `${c.primary}cc` }}>
                      Công nghệ sử dụng
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {techs.map((tech) => (
                        <span
                          key={tech}
                          className="px-3 py-1 rounded-lg text-xs font-medium border"
                          style={{
                            background: `${c.primary}0d`,
                            borderColor: `${c.primary}35`,
                            color: c.primary,
                          }}
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Dev Timeline ───────────────────────────────────────── */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: `${c.primary}cc` }}>
                    <MapPin className="w-3.5 h-3.5" />
                    Lộ trình phát triển
                  </p>
                  <div className="relative pl-5">
                    {/* Vertical line */}
                    <div
                      className="absolute left-[7px] top-2 bottom-2 w-px rounded-full"
                      style={{
                        background: `linear-gradient(180deg, ${c.primary}, ${c.secondary}, ${c.tertiary})`,
                        opacity: 0.4,
                      }}
                    />
                    <div className="space-y-3">
                      {timeline.map((entry, index) => {
                        const Icon = entry.icon;
                        const isDone = entry.status === 'done';
                        const isActive = entry.status === 'active';
                        return (
                          <motion.div
                            key={entry.label}
                            initial={{ opacity: 0, x: 12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.06, duration: 0.3 }}
                            className="relative flex items-start gap-3"
                          >
                            {/* Node */}
                            <div
                              className="absolute -left-5 w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5"
                              style={{
                                background: isDone
                                  ? `linear-gradient(135deg, ${c.primary}, ${c.secondary})`
                                  : isActive
                                  ? c.surface
                                  : c.surface,
                                borderColor: isDone
                                  ? c.primary
                                  : isActive
                                  ? c.primary
                                  : `${c.border}`,
                                boxShadow: isActive
                                  ? `0 0 12px ${statusStyle?.glow ?? c.primary}80`
                                  : isDone
                                  ? `0 0 6px ${c.primary}40`
                                  : 'none',
                              }}
                            >
                              {isDone && (
                                <CheckCircle2 className="w-2 h-2 text-white" />
                              )}
                              {isActive && (
                                <Circle className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: c.primary }} />
                              )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 pb-3" style={{ borderBottom: index < timeline.length - 1 ? `1px solid ${c.borderLight}` : 'none' }}>
                              <div className="flex items-center gap-2 mb-0.5">
                                <span
                                  className="text-xs font-semibold"
                                  style={{ color: isDone || isActive ? c.text : c.textMuted }}
                                >
                                  {entry.label}
                                </span>
                                {isActive && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase"
                                    style={{ background: `${c.primary}20`, color: c.primary }}>
                                    Đang làm
                                  </span>
                                )}
                              </div>
                              <p className="text-xs leading-relaxed" style={{ color: isDone || isActive ? c.textSecondary : `${c.textMuted}99` }}>
                                {entry.description}
                              </p>
                              {entry.date && (
                                <span className="text-[10px] mt-1 block" style={{ color: `${c.textMuted}aa` }}>
                                  {formatDate(entry.date)}
                                </span>
                              )}
                            </div>

                            {/* Icon */}
                            <div
                              className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5"
                              style={{
                                background: isDone || isActive ? `${c.primary}15` : `${c.border}`,
                              }}
                            >
                              <Icon
                                className="w-3 h-3"
                                style={{ color: isDone || isActive ? c.primary : c.textMuted }}
                              />
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* ── Case Study ─────────────────────────────────────────── */}
                {project.content && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: `${c.primary}cc` }}>
                      <BookOpen className="w-3.5 h-3.5" />
                      Hành trình phát triển
                    </p>
                    <div
                      className="rounded-xl p-5 border"
                      style={{
                        background: `rgba(255,255,255,0.015)`,
                        borderColor: `${c.primary}20`,
                      }}
                    >
                      <div
                        className="text-sm"
                        dangerouslySetInnerHTML={{ __html: renderContent(project.content) }}
                      />
                    </div>
                  </div>
                )}

                {/* ── CTA ───────────────────────────────────────────────── */}
                <div className="flex gap-3 pt-1">
                  {project.projectUrl && (
                    <a
                      href={project.projectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2.5 text-center text-sm font-semibold rounded-xl text-white transition-all hover:opacity-90 hover:shadow-lg"
                      style={{
                        background: `linear-gradient(135deg, ${c.primary}, ${c.secondary})`,
                        boxShadow: `0 4px 20px ${c.primary}40`,
                      }}
                    >
                      <span className="flex items-center justify-center gap-2">
                        <ExternalLink className="w-4 h-4" />
                        Xem trực tuyến
                      </span>
                    </a>
                  )}
                  {project.githubUrl && (
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors"
                      style={{ borderColor: c.border, color: c.textSecondary }}
                      onMouseEnter={(e) => {
                        const el = e.currentTarget as HTMLElement;
                        el.style.borderColor = c.primary;
                        el.style.color = c.text;
                      }}
                      onMouseLeave={(e) => {
                        const el = e.currentTarget as HTMLElement;
                        el.style.borderColor = c.border;
                        el.style.color = c.textSecondary;
                      }}
                    >
                      <Github className="w-4 h-4" />
                      GitHub
                    </a>
                  )}
                  <Link
                    href={`/projects/${project.slug}`}
                    onClick={onClose}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors"
                    style={{ borderColor: c.border, color: c.textSecondary }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.borderColor = c.primary;
                      el.style.color = c.text;
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.borderColor = c.border;
                      el.style.color = c.textSecondary;
                    }}
                  >
                    Chi tiết →
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
