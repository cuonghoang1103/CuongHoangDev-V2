'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
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

interface Project {
  id: number;
  title: string;
  slug: string;
  description: string;
  technologies: string[];
  status: string;
  projectUrl?: string;
  githubUrl?: string;
  thumbnailUrl?: string;
  featured: boolean;
  startDate?: string;
  endDate?: string;
}

const statusOptions = ['PLANNING', 'IN_PROGRESS', 'COMPLETED', 'MAINTENANCE'];

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

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [form, setForm] = useState({ ...defaultForm, technologies: ['', '', ''] });
  const [saving, setSaving] = useState(false);
  const pageSize = 12;

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        size: String(pageSize),
        ...(search && { keyword: search }),
      });
      const res = await api.get(`/api/v1/projects?${params}`);
      const data = res.data?.data;
      setProjects(data?.content || []);
      setTotalPages(data?.totalPages || 0);
    } catch {
      toast.error('Lỗi tải danh sách dự án');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);
  useEffect(() => { setPage(0); }, [search]);

  const openCreate = () => {
    setEditingProject(null);
    setForm({ ...defaultForm, technologies: ['', '', ''] });
    setShowForm(true);
  };

  const openEdit = (project: Project) => {
    setEditingProject(project);
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
    setEditingProject(null);
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

  const getTechFromInputs = () =>
    form.technologies.filter((t: string) => t.trim()).join(',');

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Tên dự án không được trống'); return; }
    if (!form.description.trim()) { toast.error('Mô tả không được trống'); return; }
    setSaving(true);
    try {
      const techStack = getTechFromInputs();
      if (editingProject) {
        await api.put(`/api/v1/projects/${editingProject.id}`, {
          ...form,
          slug: editingProject.slug,
          techStack,
        });
        toast.success('Cập nhật dự án thành công!');
      } else {
        await api.post('/api/v1/projects', {
          ...form,
          slug: form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
          techStack,
        });
        toast.success('Tạo dự án thành công!');
      }
      closeForm();
      fetchProjects();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Lỗi khi lưu dự án');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Xóa dự án này?')) return;
    try {
      await api.delete(`/api/v1/projects/${id}`);
      toast.success('Đã xóa dự án');
      fetchProjects();
    } catch {
      toast.error('Xóa thất bại');
    }
  };

  const statusConfig: Record<string, string> = {
    PLANNING: 'bg-blue-500/15 text-blue-400',
    IN_PROGRESS: 'bg-yellow-500/15 text-yellow-400',
    COMPLETED: 'bg-emerald-500/15 text-emerald-400',
    MAINTENANCE: 'bg-purple-500/15 text-purple-400',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-text-primary">Quản lý Dự án</h1>
          <p className="text-text-secondary mt-1">Quản lý portfolio và dự án cá nhân</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-neon-indigo to-neon-violet text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Thêm dự án
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          type="text"
          placeholder="Tìm kiếm dự án..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-darkcard border border-darkborder rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-neon-violet/50 transition-colors"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="bg-darkcard border border-darkborder rounded-2xl h-52 animate-pulse" />
          ))
        ) : projects.length === 0 ? (
          <div className="col-span-full text-center py-16 text-text-muted">
            <GitBranch className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Chưa có dự án nào</p>
          </div>
        ) : (
          projects.map((project) => (
            <div key={project.id} className="bg-darkcard border border-darkborder rounded-2xl overflow-hidden hover:border-neon-violet/20 transition-colors group">
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
                  <h3 className="text-sm font-medium text-text-primary truncate flex-1">{project.title}</h3>
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig[project.status] || 'bg-gray-500/10 text-gray-400'}`}>
                    {project.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-xs text-text-muted line-clamp-2 mb-3">{project.description}</p>
                <div className="flex flex-wrap gap-1 mb-3">
                  {(Array.isArray(project.technologies) ? project.technologies.slice(0, 3) : []).map((tech, i) => (
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
                  <button onClick={() => openEdit(project)} className="p-1.5 rounded-lg hover:bg-white/5 text-text-muted hover:text-neon-violet transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(project.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-text-muted hover:text-red-400 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
            className="p-2 rounded-lg hover:bg-white/5 text-text-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-text-secondary px-3">Trang {page + 1} / {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
            className="p-2 rounded-lg hover:bg-white/5 text-text-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeForm} />
          <div className="relative bg-darkbg border border-darkborder rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading font-bold text-text-primary">
                {editingProject ? 'Chỉnh sửa dự án' : 'Thêm dự án mới'}
              </h2>
              <button onClick={closeForm} className="p-1.5 rounded-lg hover:bg-white/5 text-text-muted transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Tên dự án *</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="VD: Portfolio Website, AI Chat App..."
                  className="w-full px-4 py-2.5 bg-darkcard border border-darkborder rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-neon-violet/50 transition-colors" />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Mô tả *</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Mô tả ngắn về dự án..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-darkcard border border-darkborder rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-neon-violet/50 transition-colors resize-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Công nghệ sử dụng</label>
                <div className="space-y-2">
                  {form.technologies.map((tech: string, i: number) => (
                    <input key={i} type="text" value={tech} onChange={(e) => handleTechChange(i, e.target.value)}
                      placeholder={`VD: React, Node.js, PostgreSQL...`}
                      className="w-full px-4 py-2 bg-darkcard border border-darkborder rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-neon-violet/50 transition-colors" />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">Trạng thái</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-4 py-2.5 bg-darkcard border border-darkborder rounded-xl text-sm text-text-primary focus:outline-none focus:border-neon-violet/50 transition-colors cursor-pointer">
                    {statusOptions.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">Nổi bật</label>
                  <select value={form.featured ? 'true' : 'false'} onChange={(e) => setForm({ ...form, featured: e.target.value === 'true' })}
                    className="w-full px-4 py-2.5 bg-darkcard border border-darkborder rounded-xl text-sm text-text-primary focus:outline-none focus:border-neon-violet/50 transition-colors cursor-pointer">
                    <option value="false">Không</option>
                    <option value="true">Có</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">Live URL</label>
                  <input type="url" value={form.projectUrl} onChange={(e) => setForm({ ...form, projectUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-4 py-2.5 bg-darkcard border border-darkborder rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-neon-violet/50 transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">Source URL</label>
                  <input type="url" value={form.githubUrl} onChange={(e) => setForm({ ...form, githubUrl: e.target.value })}
                    placeholder="https://github.com/..."
                    className="w-full px-4 py-2.5 bg-darkcard border border-darkborder rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-neon-violet/50 transition-colors" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Thumbnail URL</label>
                <input type="url" value={form.thumbnailUrl} onChange={(e) => setForm({ ...form, thumbnailUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 bg-darkcard border border-darkborder rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-neon-violet/50 transition-colors" />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button onClick={closeForm} className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors">Hủy</button>
              <button onClick={handleSave} disabled={saving}
                className="px-5 py-2.5 bg-gradient-to-r from-neon-indigo to-neon-violet text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50">
                {saving ? 'Đang lưu...' : editingProject ? 'Cập nhật' : 'Tạo mới'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
