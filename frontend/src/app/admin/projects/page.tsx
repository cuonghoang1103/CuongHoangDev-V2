'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  ExternalLink,
  GitBranch,
} from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import type { Project } from '@/types';

const STATUS_OPTIONS = ['PLANNING', 'IN_PROGRESS', 'COMPLETED', 'MAINTENANCE'];

const defaultForm = {
  title: '',
  description: '',
  technologies: ['', '', ''] as string[],
  status: 'IN_PROGRESS',
  projectUrl: '',
  githubUrl: '',
  thumbnailUrl: '',
  featured: false,
};

const statusConfig: Record<string, string> = {
  PLANNING: 'bg-blue-500/15 text-blue-400',
  IN_PROGRESS: 'bg-yellow-500/15 text-yellow-400',
  COMPLETED: 'bg-emerald-500/15 text-emerald-400',
  MAINTENANCE: 'bg-purple-500/15 text-purple-400',
};

const statusLabels: Record<string, string> = {
  PLANNING: 'Lên kế hoạch',
  IN_PROGRESS: 'Đang phát triển',
  COMPLETED: 'Hoàn thành',
  MAINTENANCE: 'Bảo trì',
};

export default function AdminProjectsPage() {
  const { projects, addProject, updateProject, deleteProject } = useProjectStore();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize] = useState(8);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...defaultForm, technologies: ['', '', ''] });
  const [saving, setSaving] = useState(false);

  const filtered = projects.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q) ||
      (p.technologies || []).some((t) => t.toLowerCase().includes(q))
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice(page * pageSize, (page + 1) * pageSize);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...defaultForm, technologies: ['', '', ''] });
    setShowForm(true);
  };

  const openEdit = (project: Project) => {
    setEditingId(project.id);
    const techArr = Array.isArray(project.technologies) ? project.technologies : [];
    setForm({
      title: project.title,
      description: project.description || '',
      technologies: [...techArr, '', '', ''].slice(0, 5),
      status: project.status,
      projectUrl: project.projectUrl || '',
      githubUrl: project.githubUrl || '',
      thumbnailUrl: project.thumbnailUrl || '',
      featured: project.featured || false,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ ...defaultForm, technologies: ['', '', ''] });
  };

  const handleTechChange = (index: number, value: string) => {
    const newTech = [...form.technologies];
    newTech[index] = value;
    setForm({ ...form, technologies: newTech });
    if (index === newTech.length - 1 && value.trim()) {
      setForm({ ...form, technologies: [...newTech, ''] });
    }
  };

  const slugify = (text: string) =>
    text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error('Tên dự án không được để trống');
      return;
    }
    if (!form.description.trim()) {
      toast.error('Mô tả không được để trống');
      return;
    }

    const techs = form.technologies.filter((t) => t.trim());
    setSaving(true);

    await new Promise((r) => setTimeout(r, 500));

    const projectData: Project = {
      id: editingId || 0,
      title: form.title,
      slug: slugify(form.title),
      description: form.description,
      technologies: techs,
      status: form.status,
      projectUrl: form.projectUrl,
      githubUrl: form.githubUrl,
      thumbnailUrl: form.thumbnailUrl,
      featured: form.featured,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (editingId) {
      updateProject(editingId, projectData);
      toast.success('Cập nhật dự án thành công!');
    } else {
      addProject(projectData);
      toast.success('Tạo dự án thành công!');
    }

    setSaving(false);
    closeForm();
  };

  const handleDelete = (id: number) => {
    if (!confirm('Xóa dự án này?')) return;
    deleteProject(id);
    toast.success('Đã xóa dự án');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-text-primary">Quản lý Dự án</h1>
          <p className="text-text-secondary mt-1">{projects.length} dự án</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-neon-indigo to-neon-violet text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Thêm dự án
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          type="text"
          placeholder="Tìm kiếm dự án..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          className="w-full pl-10 pr-4 py-2.5 bg-darkcard border border-darkborder rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-neon-violet/50 transition-colors"
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {paginated.length === 0 ? (
          <div className="col-span-full text-center py-16 text-text-muted">
            <GitBranch className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Chưa có dự án nào</p>
          </div>
        ) : (
          paginated.map((project) => (
            <div
              key={project.id}
              className="bg-darkcard border border-darkborder rounded-2xl overflow-hidden hover:border-neon-violet/20 transition-colors group"
            >
              <div className="h-32 bg-gradient-to-br from-neon-indigo/10 via-neon-violet/10 to-neon-fuchsia/10 flex items-center justify-center relative">
                {project.thumbnailUrl ? (
                  <img src={project.thumbnailUrl} alt={project.title} className="w-full h-full object-cover" />
                ) : (
                  <GitBranch className="w-12 h-12 text-neon-violet/30" />
                )}
                {project.featured && (
                  <span className="absolute top-2 right-2 px-2 py-0.5 bg-yellow-400/20 text-yellow-300 text-xs rounded-full font-medium">
                    Nổi bật
                  </span>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-sm font-medium text-text-primary truncate flex-1 pr-2">{project.title}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${statusConfig[project.status] || 'bg-gray-500/10 text-gray-400'}`}>
                    {statusLabels[project.status] || project.status}
                  </span>
                </div>
                <p className="text-xs text-text-muted line-clamp-2 mb-3">{project.description}</p>
                <div className="flex flex-wrap gap-1 mb-3">
                  {((project.technologies as string[]) || []).slice(0, 3).map((tech, i) => (
                    <span key={i} className="px-2 py-0.5 bg-neon-indigo/10 text-neon-indigo rounded text-xs">
                      {tech}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {project.projectUrl && (
                    <a href={project.projectUrl} target="_blank" rel="noopener noreferrer"
                      className="p-1.5 rounded-lg hover:bg-white/5 text-text-muted hover:text-neon-emerald transition-colors">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <button
                    onClick={() => openEdit(project)}
                    className="p-1.5 rounded-lg hover:bg-white/5 text-text-muted hover:text-neon-violet transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(project.id)}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-text-muted hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="p-2 rounded-lg hover:bg-white/5 text-text-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-text-secondary px-3">Trang {page + 1} / {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="p-2 rounded-lg hover:bg-white/5 text-text-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeForm} />
          <div className="relative bg-darkbg border border-darkborder rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading font-bold text-text-primary">
                {editingId ? 'Chỉnh sửa dự án' : 'Thêm dự án mới'}
              </h2>
              <button onClick={closeForm} className="p-1.5 rounded-lg hover:bg-white/5 text-text-muted transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Tên dự án *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="VD: Portfolio Website, AI Chat App..."
                  className="w-full px-4 py-2.5 bg-darkcard border border-darkborder rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-neon-violet/50 transition-colors"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Mô tả *</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Mô tả ngắn về dự án..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-darkcard border border-darkborder rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-neon-violet/50 transition-colors resize-none"
                />
              </div>

              {/* Technologies */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Công nghệ sử dụng</label>
                <div className="space-y-2">
                  {form.technologies.map((tech: string, i: number) => (
                    <input
                      key={i}
                      type="text"
                      value={tech}
                      onChange={(e) => handleTechChange(i, e.target.value)}
                      placeholder={`VD: React, Node.js, PostgreSQL...`}
                      className="w-full px-4 py-2 bg-darkcard border border-darkborder rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-neon-violet/50 transition-colors"
                    />
                  ))}
                </div>
              </div>

              {/* Status + Featured */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">Trạng thái</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-4 py-2.5 bg-darkcard border border-darkborder rounded-xl text-sm text-text-primary focus:outline-none focus:border-neon-violet/50 transition-colors cursor-pointer"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{statusLabels[s]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">Nổi bật</label>
                  <select
                    value={form.featured ? 'true' : 'false'}
                    onChange={(e) => setForm({ ...form, featured: e.target.value === 'true' })}
                    className="w-full px-4 py-2.5 bg-darkcard border border-darkborder rounded-xl text-sm text-text-primary focus:outline-none focus:border-neon-violet/50 transition-colors cursor-pointer"
                  >
                    <option value="false">Không</option>
                    <option value="true">Có</option>
                  </select>
                </div>
              </div>

              {/* URLs */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">Live URL</label>
                  <input
                    type="url"
                    value={form.projectUrl}
                    onChange={(e) => setForm({ ...form, projectUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-4 py-2.5 bg-darkcard border border-darkborder rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-neon-violet/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">GitHub URL</label>
                  <input
                    type="url"
                    value={form.githubUrl}
                    onChange={(e) => setForm({ ...form, githubUrl: e.target.value })}
                    placeholder="https://github.com/..."
                    className="w-full px-4 py-2.5 bg-darkcard border border-darkborder rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-neon-violet/50 transition-colors"
                  />
                </div>
              </div>

              {/* Thumbnail */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Thumbnail URL</label>
                <input
                  type="url"
                  value={form.thumbnailUrl}
                  onChange={(e) => setForm({ ...form, thumbnailUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-4 py-2.5 bg-darkcard border border-darkborder rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-neon-violet/50 transition-colors"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 mt-6">
              <button onClick={closeForm} className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors">
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2.5 bg-gradient-to-r from-neon-indigo to-neon-violet text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {saving ? 'Đang lưu...' : editingId ? 'Cập nhật' : 'Tạo mới'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
