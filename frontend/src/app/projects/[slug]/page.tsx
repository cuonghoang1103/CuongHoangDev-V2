'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ExternalLink,
  Github,
  Calendar,
  Code2,
  Sparkles,
  ChevronRight,
  Clock,
} from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import type { Project } from '@/types';

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  PLANNING: { label: 'Lên kế hoạch', color: 'text-blue-400', bg: 'bg-blue-500/15' },
  IN_PROGRESS: { label: 'Đang phát triển', color: 'text-yellow-400', bg: 'bg-yellow-500/15' },
  COMPLETED: { label: 'Hoàn thành', color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
  MAINTENANCE: { label: 'Bảo trì', color: 'text-purple-400', bg: 'bg-purple-500/15' },
};

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { getProjectBySlug, getProjectsByStatus } = useProjectStore();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedProjects, setRelatedProjects] = useState<Project[]>([]);

  const slug = params?.slug as string;

  useEffect(() => {
    if (!slug) return;

    const found = getProjectBySlug(slug);
    if (!found) {
      router.push('/projects');
      return;
    }

    setProject(found);

    // Related: same status, different slug
    const related = getProjectsByStatus(found.status)
      .filter((p) => p.slug !== slug)
      .slice(0, 3);
    setRelatedProjects(related);
    setLoading(false);
  }, [slug, getProjectBySlug, getProjectsByStatus, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-darkbg pt-24 pb-16 px-4 sm:px-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-neon-violet border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-muted">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!project) return null;

  const status = statusConfig[project.status] || statusConfig.PLANNING;
  const techs = Array.isArray(project.technologies) ? project.technologies : [];

  return (
    <div className="min-h-screen bg-darkbg pt-24 pb-16 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Back */}
        <button
          onClick={() => router.push('/projects')}
          className="flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Quay lại dự án</span>
        </button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 mb-4">
            <h1 className="text-3xl sm:text-4xl font-heading font-bold text-text-primary">
              {project.title}
            </h1>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color} flex-shrink-0 mt-2`}>
              {status.label}
            </span>
          </div>

          {project.role && (
            <p className="text-sm text-neon-violet font-medium mb-2">Vai trò: {project.role}</p>
          )}

          <p className="text-lg text-text-secondary leading-relaxed mb-6">
            {project.description}
          </p>

          <div className="flex flex-wrap gap-3">
            {project.projectUrl && (
              <a
                href={project.projectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-neon-indigo to-neon-violet text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity"
              >
                <ExternalLink className="w-4 h-4" />
                Xem trực tuyến
              </a>
            )}
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-darkcard border border-darkborder text-text-primary text-sm font-medium rounded-xl hover:border-neon-indigo/30 transition-colors"
              >
                <Github className="w-4 h-4" />
                Mã nguồn
              </a>
            )}
          </div>
        </div>

        {/* Thumbnail */}
        {project.thumbnailUrl && (
          <div className="rounded-2xl overflow-hidden mb-8 border border-darkborder">
            <img
              src={project.thumbnailUrl}
              alt={project.title}
              className="w-full object-cover max-h-96"
            />
          </div>
        )}

        {/* Technologies */}
        {techs.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-heading font-bold text-text-primary mb-4 flex items-center gap-2">
              <Code2 className="w-5 h-5 text-neon-violet" />
              Công nghệ sử dụng
            </h2>
            <div className="flex flex-wrap gap-2">
              {techs.map((tech, i) => (
                <span
                  key={i}
                  className="px-4 py-2 bg-darkcard border border-darkborder rounded-xl text-sm text-text-secondary hover:text-neon-violet hover:border-neon-violet/30 transition-colors"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Timeline */}
        {(project.startDate || project.endDate) && (
          <div className="mb-8 bg-darkcard border border-darkborder rounded-2xl p-5">
            <h2 className="text-lg font-heading font-bold text-text-primary mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-neon-violet" />
              Thời gian dự án
            </h2>
            <div className="flex items-center gap-4">
              {project.startDate && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-text-muted" />
                  <span className="text-sm text-text-secondary">
                    {new Date(project.startDate).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
                  </span>
                </div>
              )}
              {project.startDate && project.endDate && (
                <ChevronRight className="w-4 h-4 text-text-muted" />
              )}
              {project.endDate ? (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-text-muted" />
                  <span className="text-sm text-text-secondary">
                    {new Date(project.endDate).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
                  </span>
                </div>
              ) : project.startDate ? (
                <span className="text-sm text-neon-violet font-medium">Hiện tại</span>
              ) : null}
            </div>
          </div>
        )}

        {/* Content */}
        {project.content && (
          <div className="prose prose-invert max-w-none">
            <div dangerouslySetInnerHTML={{ __html: project.content }} />
          </div>
        )}

        {/* Related Projects */}
        {relatedProjects.length > 0 && (
          <div className="mt-12 pt-8 border-t border-darkborder">
            <h2 className="text-xl font-heading font-bold text-text-primary mb-6 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-neon-violet" />
              Dự án liên quan
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {relatedProjects.map((rp) => (
                <button
                  key={rp.id}
                  onClick={() => router.push(`/projects/${rp.slug}`)}
                  className="text-left bg-darkcard border border-darkborder rounded-2xl p-5 hover:border-neon-violet/30 transition-colors group"
                >
                  <h3 className="font-medium text-text-primary group-hover:text-neon-violet transition-colors">
                    {rp.title}
                  </h3>
                  <p className="text-sm text-text-muted mt-1 line-clamp-2">{rp.description}</p>
                  <div className="flex flex-wrap gap-1 mt-3">
                    {(Array.isArray(rp.technologies) ? rp.technologies.slice(0, 3) : []).map((t, i) => (
                      <span key={i} className="px-2 py-0.5 bg-neon-indigo/10 text-neon-indigo rounded text-xs">
                        {t}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
