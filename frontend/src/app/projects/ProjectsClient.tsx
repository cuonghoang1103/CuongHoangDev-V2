'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, ExternalLink, Github, Calendar, Users, Code2 } from 'lucide-react';
import type { Project } from '@/types';

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

export default function ProjectsClient({ initialProjects = [] }: { initialProjects?: Project[] }) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [loading, setLoading] = useState(initialProjects.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    const doFetch = () => {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: String(currentPage - 1),
        size: '9',
      });
      if (searchKeyword) params.set('keyword', searchKeyword);
      if (statusFilter) params.set('status', statusFilter);

      fetch(`http://localhost:8082/api/v1/projects?${params}`)
        .then(r => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json() as Promise<{ data?: { content?: Project[]; totalPages?: number } }>;
        })
        .then(data => {
          setProjects(data?.data?.content ?? []);
          setTotalPages(data?.data?.totalPages ?? 1);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message || 'Failed to load');
          setLoading(false);
        });
    };

    doFetch();
  }, [currentPage, searchKeyword, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchKeyword(searchInput);
    setCurrentPage(1);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  return (
    <>
      {/* Filters */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
        <div className="flex flex-col sm:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
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
                onClick={() => handleStatusFilter(status)}
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

      {/* Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {loading && <SkeletonGrid />}

        {error && (
          <div className="text-center py-20">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={() => setCurrentPage(1)}
              className="px-6 py-2 bg-neon-violet/20 text-neon-violet rounded-xl hover:bg-neon-violet/30 transition-colors"
            >
              Retry
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

                  <div className="p-6">
                    <h3 className="text-lg font-heading font-bold text-text-primary mb-2 group-hover:text-neon-violet transition-colors line-clamp-1">
                      {project.title}
                    </h3>
                    <p className="text-sm text-text-secondary line-clamp-2 mb-4">
                      {project.description}
                    </p>

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

                    <div className="flex gap-3 pt-4 border-t border-darkborder">
                      <Link
                        href={`/projects/${project.slug}`}
                        className="flex-1 py-2 text-center text-sm bg-gradient-to-r from-neon-indigo/20 to-neon-violet/20 border border-neon-violet/30 text-neon-violet rounded-lg hover:from-neon-indigo/30 hover:to-neon-violet/30 transition-all font-medium"
                      >
                        Details
                      </Link>
                      {project.projectUrl && (
                        <a href={project.projectUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-darkbg border border-darkborder rounded-lg text-text-muted hover:text-neon-violet hover:border-neon-violet/30 transition-colors">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      {project.githubUrl && (
                        <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-darkbg border border-darkborder rounded-lg text-text-muted hover:text-text-primary hover:border-darkborder transition-colors">
                          <Github className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-12">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-darkcard border border-darkborder rounded-xl text-text-secondary disabled:opacity-30 hover:border-neon-violet/30 hover:text-text-primary transition-colors"
                >
                  Prev
                </button>
                <span className="px-4 py-2 text-text-secondary text-sm">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-darkcard border border-darkborder rounded-xl text-text-secondary disabled:opacity-30 hover:border-neon-violet/30 hover:text-text-primary transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </>
  );
}
