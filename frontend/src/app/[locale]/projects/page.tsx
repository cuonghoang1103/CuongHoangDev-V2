'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Search, ExternalLink, Github, Loader2, Calendar, Users, Code2 } from 'lucide-react';
import { projectsApi } from '@/lib/api';
import type { Project } from '@/types';

interface PageData {
  content: Project[];
  totalElements: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
}

const STATUS_LABELS: Record<string, string> = {
  COMPLETED: 'Completed',
  IN_PROGRESS: 'In Progress',
  PLANNING: 'Planning',
  ON_HOLD: 'On Hold',
};

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: 'bg-green-500/20 text-green-400 border-green-500/30',
  IN_PROGRESS: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  PLANNING: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  ON_HOLD: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await projectsApi.getAll({
        page: currentPage - 1,
        size: 9,
        keyword: searchKeyword || undefined,
        status: statusFilter || undefined,
      });
      // Backend: ApiResponse<Page<ProjectDto>> → res.data.data = Page
      const raw = res.data;
      const pageData: PageData = (raw?.data || raw || {});
      setProjects(Array.isArray(pageData.content) ? pageData.content : []);
      setTotalPages(pageData.totalPages || 1);
    } catch (err) {
      console.error('Projects fetch error:', err);
      setError('Unable to load projects. Retrying...');
      // Retry once after 2s
      setTimeout(() => fetchProjects(), 2000);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchKeyword, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        setLoading(false);
        setError('API connection slow or backend not running. Check http://localhost:8082/api/v1/projects');
      }
    }, 10000);
    return () => clearTimeout(timer);
  }, [loading]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchProjects();
  };

  return (
    <div className="min-h-screen bg-darkbg pt-24 pb-20">
      {/* Header */}
      <section className="relative py-16 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-indigo/15 rounded-full blur-[128px]" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-violet/15 rounded-full blur-[128px]" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-text-primary mb-6">
            My <span className="bg-clip-text text-transparent bg-gradient-to-r from-neon-indigo via-neon-violet to-neon-fuchsia">Projects</span>
          </h1>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            Products I have built throughout my learning and development journey
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
        <div className="flex flex-col sm:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-darkcard border border-darkborder text-text-primary placeholder:text-text-muted focus:outline-none focus:border-neon-violet/50 transition-colors"
              />
            </div>
            <button type="submit" className="px-6 py-3 bg-gradient-to-r from-neon-indigo to-neon-violet text-white font-medium rounded-xl hover:opacity-90 transition-opacity">
              Search
            </button>
          </form>

          <div className="flex gap-2 flex-wrap">
            {['', 'COMPLETED', 'IN_PROGRESS', 'PLANNING', 'ON_HOLD'].map((status) => (
              <button
                key={status}
                onClick={() => { setStatusFilter(status); setCurrentPage(1); }}
                className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                  statusFilter === status
                    ? 'bg-neon-violet/20 border-neon-violet text-neon-violet'
                    : 'bg-darkcard border-darkborder text-text-secondary hover:border-neon-violet/30 hover:text-text-primary'
                }`}
              >
                {status === '' ? 'All' : STATUS_LABELS[status] || status}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Projects Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {loading && (
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
        )}

        {error && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/10 rounded-full mb-4">
              <Search className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-text-secondary mb-4">{error}</p>
            <button onClick={fetchProjects} className="px-6 py-2 bg-neon-violet/20 text-neon-violet rounded-xl">
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && projects.length === 0 && (
          <div className="text-center py-20">
            <Code2 className="w-16 h-16 text-text-muted mx-auto mb-4" />
            <h3 className="text-xl font-heading font-semibold text-text-primary mb-2">No projects found</h3>
            <p className="text-text-secondary">Try different keywords or filters</p>
          </div>
        )}

        {!loading && !error && projects.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <article key={project.id} className="group bg-darkcard rounded-2xl border border-darkborder/50 hover:border-neon-violet/40 transition-all duration-300 overflow-hidden">
                  {/* Thumbnail */}
                  <div className="relative h-48 bg-gradient-to-br from-neon-indigo/30 via-neon-violet/20 to-neon-fuchsia/20 flex items-center justify-center overflow-hidden">
                    {project.thumbnailUrl ? (
                      <img src={project.thumbnailUrl} alt={project.title} className="w-full h-full object-cover" />
                    ) : (
                      <Code2 className="w-16 h-16 text-neon-violet/40" />
                    )}
                    {project.featured && (
                      <div className="absolute top-3 left-3 px-2.5 py-1 bg-gradient-to-r from-neon-indigo to-neon-violet text-white text-xs font-bold rounded-lg">
                        FEATURED
                      </div>
                    )}
                    {project.status && (
                      <div className={`absolute top-3 right-3 px-2.5 py-1 text-xs font-medium rounded-lg border ${STATUS_COLORS[project.status] || ''}`}>
                        {STATUS_LABELS[project.status] || project.status}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-lg font-heading font-bold text-text-primary mb-2 group-hover:text-neon-violet transition-colors line-clamp-1">
                      {project.title}
                    </h3>
                    <p className="text-sm text-text-secondary line-clamp-2 mb-4">
                      {project.description}
                    </p>

                    {/* Tech stack */}
                    {project.technologies && project.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {project.technologies.slice(0, 4).map((tech) => (
                          <span key={tech} className="px-2 py-0.5 bg-darkbg text-text-muted text-xs rounded-md border border-darkborder">
                            {tech}
                          </span>
                        ))}
                        {project.technologies.length > 4 && (
                          <span className="px-2 py-0.5 text-text-muted text-xs">+{project.technologies.length - 4}</span>
                        )}
                      </div>
                    )}

                    {/* Meta */}
                    <div className="flex items-center gap-4 text-xs text-text-muted mb-4">
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

                    {/* Links */}
                    <div className="flex gap-3 pt-4 border-t border-darkborder">
                      <Link
                        href={`/projects/${project.slug}`}
                        className="flex-1 py-2 text-center text-sm bg-gradient-to-r from-neon-indigo/20 to-neon-violet/20 border border-neon-violet/30 text-neon-violet rounded-lg hover:from-neon-indigo/30 hover:to-neon-violet/30 transition-all font-medium"
                      >
                        Details
                      </Link>
                      {project.projectUrl && (
                        <a
                          href={project.projectUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-darkbg border border-darkborder rounded-lg text-text-muted hover:text-neon-violet hover:border-neon-violet/30 transition-colors"
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
                        >
                          <Github className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-12">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-darkcard border border-darkborder rounded-xl text-text-secondary disabled:opacity-30 hover:border-neon-violet/30 hover:text-text-primary transition-colors"
                >
                  ←
                </button>
                {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                  const page = totalPages <= 5 ? i + 1 : currentPage <= 3 ? i + 1 : currentPage + i - 2;
                  if (page < 1 || page > totalPages) return null;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                        currentPage === page
                          ? 'bg-neon-violet text-white'
                          : 'bg-darkcard border border-darkborder text-text-secondary hover:border-neon-violet/30'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-darkcard border border-darkborder rounded-xl text-text-secondary disabled:opacity-30 hover:border-neon-violet/30 hover:text-text-primary transition-colors"
                >
                  →
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
