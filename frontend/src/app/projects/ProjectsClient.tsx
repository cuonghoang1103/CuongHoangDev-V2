'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ExternalLink, Github, Calendar, Users, Code2, Eye, Star, GitFork, SlidersHorizontal } from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import { projectsApi } from '@/lib/api';
import type { Project } from '@/types';
import ProjectDetailDrawer from '@/components/projects/ProjectDetailDrawer';

const STATUS_LABELS: Record<string, string> = {
  COMPLETED: 'Completed',
  IN_PROGRESS: 'In Progress',
  PLANNING: 'Planning',
  MAINTENANCE: 'Maintenance',
  ON_HOLD: 'On Hold',
};

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  IN_PROGRESS: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  PLANNING: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  MAINTENANCE: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  ON_HOLD: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
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

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

// ─── Mini Carousel for Project Cards ──────────────────────────────────────────
function CardCarousel({ project }: { project: Project }) {
  const [current, setCurrent] = useState(0);

  const allImages = [
    project.thumbnailUrl,
    ...(project.images ?? []),
  ].filter((u): u is string => typeof u === 'string' && u.trim().length > 0 && u.startsWith('http'));

  if (allImages.length === 0) return null;

  const hasMultiple = allImages.length > 1;

  return (
    <div className="relative h-48 overflow-hidden" style={{ borderRadius: '0' }}>
      <AnimatePresence mode="wait">
        {allImages[current] && (
          <motion.img
            key={current}
            src={allImages[current]}
            alt={project.title}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
      </AnimatePresence>

      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

      {project.featured && (
        <div className="absolute top-3 left-3 px-2.5 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-bold rounded-lg shadow-lg">
          NOI BAT
        </div>
      )}

      {project.status && (
        <div className={`absolute top-3 right-3 px-2.5 py-1 text-xs font-medium rounded-lg border ${STATUS_COLORS[project.status] || ''}`}>
          {STATUS_LABELS[project.status] || project.status}
        </div>
      )}

      {hasMultiple && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); setCurrent((c) => c === 0 ? allImages.length - 1 : c - 1); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center transition-all hover:scale-110 z-10"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M7 2L4 5L7 8" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setCurrent((c) => c === allImages.length - 1 ? 0 : c + 1); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center transition-all hover:scale-110 z-10"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M3 2L6 5L3 8" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </>
      )}

      {hasMultiple && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 z-10">
          {allImages.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: i === current ? '16px' : '4px',
                background: i === current ? '#a855f7' : 'rgba(255,255,255,0.4)',
              }}
            />
          ))}
        </div>
      )}

      {hasMultiple && (
        <div
          className="absolute top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[10px] font-medium z-10"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', color: '#fff' }}
        >
          {current + 1}/{allImages.length}
        </div>
      )}
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(9)].map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="bg-darkcard rounded-2xl overflow-hidden border border-darkborder/50">
            <div className="h-48 bg-darkbg" />
            <div className="p-6 space-y-3">
              <div className="h-6 bg-darkbg rounded-lg w-3/4" />
              <div className="h-4 bg-darkbg rounded w-full" />
              <div className="h-4 bg-darkbg rounded w-2/3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Project Card ───────────────────────────────────────────────────────────────
function ProjectCard({
  project,
  starred,
  onToggleStar,
  onOpenPanel,
}: {
  project: Project;
  starred: boolean;
  onToggleStar: () => void;
  onOpenPanel: () => void;
}) {
  const stats = MOCK_STATS[project.id] ?? { views: 0, stars: 0, forks: 0 };
  const hasGallery = Array.isArray(project.images) && project.images.length > 0;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
      onClick={onOpenPanel}
      className="group flex flex-col bg-darkcard rounded-2xl border border-darkborder/50 hover:border-neon-violet/40 transition-all duration-300 overflow-hidden shadow-lg hover:shadow-neon-violet/10 cursor-pointer"
    >
      {/* Card Carousel */}
      <CardCarousel project={project} />

      {/* Body */}
      <div className="flex flex-col flex-1 p-6">
        {/* Title */}
        <h3 className="text-lg font-heading font-bold text-text-primary mb-2 group-hover:text-neon-violet transition-colors line-clamp-1">
          {project.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-text-secondary line-clamp-2 mb-4 flex-shrink-0">
          {project.description}
        </p>

        {/* Stats bar */}
        <div className="flex items-center gap-4 mb-4 flex-shrink-0">
          <span className="flex items-center gap-1 text-xs text-text-muted">
            <Eye className="w-3.5 h-3.5" />
            {formatCount(stats.views)}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); onToggleStar(); }}
            className={`flex items-center gap-1 text-xs transition-all hover:scale-110 ${starred ? 'text-yellow-400' : 'text-text-muted hover:text-yellow-400'}`}
          >
            <motion.span animate={starred ? { scale: [1, 1.4, 1] } : { scale: 1 }} transition={{ duration: 0.25 }}>
              <Star className="w-3.5 h-3.5" fill={starred ? 'currentColor' : 'none'} />
            </motion.span>
            {formatCount(stats.stars + (starred ? 1 : 0))}
          </button>
          <span className="flex items-center gap-1 text-xs text-text-muted">
            <GitFork className="w-3.5 h-3.5" />
            {formatCount(stats.forks)}
          </span>
          {starred && (
            <span className="ml-auto flex items-center gap-1 text-xs text-neon-violet/60">
              <Star className="w-3.5 h-3.5 fill-current" />
              Gallery
            </span>
          )}
        </div>

        {/* Tech stack tags */}
        {project.technologies && project.technologies.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4 flex-shrink-0">
            {project.technologies.slice(0, 4).map((tech) => (
              <span
                key={tech}
                className="px-2 py-0.5 bg-neon-indigo/10 text-neon-indigo/80 text-xs rounded-md border border-neon-indigo/20"
              >
                {tech}
              </span>
            ))}
            {project.technologies.length > 4 && (
              <span className="px-2 py-0.5 text-text-muted text-xs">
                +{project.technologies.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Meta info */}
        <div className="flex items-center gap-4 text-xs text-text-muted mb-4 flex-shrink-0">
          {project.role && (
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {project.role}
            </span>
          )}
          {project.duration && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {project.duration}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-auto pt-4 border-t border-darkborder/50">
          <button
            onClick={(e) => { e.stopPropagation(); onOpenPanel(); }}
            className="flex-1 py-2 text-center text-sm bg-gradient-to-r from-neon-indigo/20 to-neon-violet/20 border border-neon-violet/30 text-neon-violet rounded-lg hover:from-neon-indigo/30 hover:to-neon-violet/30 transition-all font-medium"
          >
            Chi tiết
          </button>
          {project.projectUrl && (
            <a
              href={project.projectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-darkbg border border-darkborder rounded-lg text-text-muted hover:text-neon-emerald hover:border-neon-emerald/30 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
          {project.githubUrl && (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-darkbg border border-darkborder rounded-lg text-text-muted hover:text-text-primary hover:border-darkborder transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <Github className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </motion.article>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────────
export default function ProjectsClient() {
  const { projects, setProjects } = useProjectStore();

  const [starredIds, setStarredIds] = useState<Set<number>>(() => new Set());
  const [searchInput, setSearchInput] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [techFilter, setTechFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const res = await projectsApi.getAll({ size: 100 });
        const backendProjects: Project[] = res.data?.data?.content || res.data?.data || [];
        if (backendProjects.length > 0) {
          setProjects(backendProjects);
        }
      } catch {
        // fall back to seed data from store
      }
    };
    loadProjects();
  }, [setProjects]);

  const allTechs = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => p.technologies?.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [projects]);

  const pageSize = 9;

  const filtered = useMemo(() => {
    let result = [...projects];
    if (searchKeyword) {
      const q = searchKeyword.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q) ||
          (p.technologies ?? []).some((t) => t.toLowerCase().includes(q))
      );
    }
    if (statusFilter) result = result.filter((p) => p.status === statusFilter);
    if (techFilter) {
      result = result.filter(
        (p) => (p.technologies ?? []).some((t) => t.toLowerCase() === techFilter.toLowerCase())
      );
    }
    return result;
  }, [projects, searchKeyword, statusFilter, techFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchKeyword(searchInput);
    setCurrentPage(1);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status === statusFilter ? '' : status);
    setCurrentPage(1);
  };

  const handleTechFilter = (tech: string) => {
    setTechFilter(tech === techFilter ? '' : tech);
    setCurrentPage(1);
  };

  const toggleStar = (id: number) => {
    setStarredIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openPanel = (project: Project) => setSelectedProject(project);
  const closePanel = () => setSelectedProject(null);

  return (
    <>
      {/* Slide-over Panel */}
      <ProjectDetailDrawer
        project={selectedProject}
        onClose={closePanel}
        starred={selectedProject ? starredIds.has(selectedProject.id) : false}
        onToggleStar={selectedProject ? () => toggleStar(selectedProject.id) : undefined}
      />

      {/* Filters */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 space-y-3">
        {/* Search + Status row */}
        <div className="flex flex-col sm:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <input
                type="text"
                placeholder="Tìm kiếm dự án..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-darkcard border border-darkborder text-text-primary placeholder:text-text-muted focus:outline-none focus:border-neon-violet/50 transition-colors"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-neon-indigo to-neon-violet text-white font-medium rounded-xl hover:opacity-90 transition-opacity whitespace-nowrap"
            >
              Tìm kiếm
            </button>
          </form>

          <div className="flex gap-2 flex-wrap">
            {['', 'COMPLETED', 'IN_PROGRESS', 'PLANNING', 'MAINTENANCE'].map((status) => (
              <button
                key={status}
                onClick={() => handleStatusFilter(status)}
                className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all whitespace-nowrap ${
                  statusFilter === status
                    ? 'bg-neon-violet/20 border-neon-violet text-neon-violet'
                    : 'bg-darkcard border-darkborder text-text-secondary hover:border-neon-violet/30 hover:text-text-primary'
                }`}
              >
                {status === '' ? 'Tất cả' : STATUS_LABELS[status] ?? status}
              </button>
            ))}
          </div>
        </div>

        {/* Tech-stack filter row */}
        {allTechs.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <div className="flex items-center gap-1.5 text-xs text-text-muted shrink-0 pr-1">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Lọc:</span>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {allTechs.map((tech) => (
                <button
                  key={tech}
                  onClick={() => handleTechFilter(tech)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-all shrink-0 ${
                    techFilter === tech
                      ? 'bg-neon-indigo/20 border-neon-indigo text-neon-indigo'
                      : 'bg-darkcard border-darkborder/60 text-text-secondary hover:border-neon-indigo/30 hover:text-neon-indigo/80'
                  }`}
                >
                  {tech}
                </button>
              ))}
              {techFilter && (
                <button
                  onClick={() => setTechFilter('')}
                  className="px-3 py-1 rounded-full text-xs font-medium border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all shrink-0"
                >
                  × Clear
                </button>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Active filter chips */}
      {(statusFilter || techFilter) && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-2 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            {statusFilter && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-neon-violet/10 border border-neon-violet/30 text-neon-violet text-xs rounded-full">
                {STATUS_LABELS[statusFilter] ?? statusFilter}
                <button onClick={() => setStatusFilter('')} className="hover:text-white transition-colors font-bold">×</button>
              </span>
            )}
            {techFilter && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-neon-indigo/10 border border-neon-indigo/30 text-neon-indigo text-xs rounded-full">
                {techFilter}
                <button onClick={() => setTechFilter('')} className="hover:text-white transition-colors font-bold">×</button>
              </span>
            )}
            <span className="text-xs text-text-muted">
              {filtered.length} kết quả
            </span>
          </div>
        </div>
      )}

      {/* Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <Code2 className="w-16 h-16 text-text-muted mx-auto mb-4" />
            <h3 className="text-xl font-heading font-semibold text-text-primary mb-2">
              Không tìm thấy dự án nào
            </h3>
            <p className="text-text-secondary">
              Thử từ khóa hoặc bộ lọc khác
            </p>
          </div>
        ) : (
          <>
            <motion.div
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <AnimatePresence mode="popLayout">
                {paginated.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    starred={starredIds.has(project.id)}
                    onToggleStar={() => toggleStar(project.id)}
                    onOpenPanel={() => openPanel(project)}
                  />
                ))}
              </AnimatePresence>
            </motion.div>

            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-12">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-darkcard border border-darkborder rounded-xl text-text-secondary disabled:opacity-30 hover:border-neon-violet/30 hover:text-text-primary transition-colors"
                >
                  Trước
                </button>
                <span className="px-4 py-2 text-text-secondary text-sm">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-darkcard border border-darkborder rounded-xl text-text-secondary disabled:opacity-30 hover:border-neon-violet/30 hover:text-text-primary transition-colors"
                >
                  Sau
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </>
  );
}
