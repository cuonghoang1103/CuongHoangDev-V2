'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface BackendUser {
  id: number;
  username: string;
  email: string;
  fullName?: string;
  bio?: string;
  roles: any;
  enabled: boolean;
  accountNonLocked: boolean;
  createdAt: string;
}

interface PageData {
  content: BackendUser[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<BackendUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editRoles, setEditRoles] = useState<string[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 15;

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        size: String(pageSize),
        ...(search && { keyword: search }),
      });
      const res = await api.get(`/api/v1/admin/users?${params}`);
      const data: PageData = res.data?.data;
      setUsers(data?.content || []);
      setTotalPages(data?.totalPages || 0);
      setTotalElements(data?.totalElements || 0);
    } catch {
      toast.error('Lỗi tải danh sách users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [page, search]);

  const getRoles = (user: BackendUser): string[] => {
    if (!user.roles) return [];
    if (Array.isArray(user.roles)) return user.roles.map((r: any) => typeof r === 'string' ? r.replace('ROLE_', '') : r.name?.replace('ROLE_', '') || '');
    if (typeof user.roles === 'object' && 'name' in (user.roles as any)) {
      return [(user.roles as any).name.replace('ROLE_', '')];
    }
    return [];
  };

  const startEditRoles = (user: BackendUser) => {
    setEditingId(user.id);
    setEditRoles(getRoles(user));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditRoles([]);
  };

  const saveRoles = async (userId: number) => {
    try {
      await api.put(`/api/v1/admin/users/${userId}/roles`, { roles: editRoles });
      toast.success('Cập nhật roles thành công!');
      setEditingId(null);
      fetchUsers();
    } catch {
      toast.error('Cập nhật thất bại');
    }
  };

  const toggleRole = (role: string) => {
    setEditRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const toggleEnabled = async (user: BackendUser) => {
    try {
      await api.patch(`/api/v1/admin/users/${user.id}/toggle-enabled`);
      toast.success(user.enabled ? 'Đã vô hiệu hóa' : 'Đã kích hoạt');
      fetchUsers();
    } catch {
      toast.error('Thao tác thất bại');
    }
  };

  const allRoles = ['ADMIN', 'USER', 'MODERATOR', 'EDITOR'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-text-primary">Quản lý Users</h1>
        <p className="text-text-secondary mt-1">Quản lý tài khoản và phân quyền người dùng</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          type="text"
          placeholder="Tìm kiếm user..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          className="w-full pl-10 pr-4 py-2.5 bg-darkcard border border-darkborder rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-neon-violet/50 transition-colors"
        />
      </div>

      <div className="bg-darkcard border border-darkborder rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-darkborder">
                <th className="text-left px-5 py-4 text-xs font-medium text-text-muted uppercase tracking-wider">User</th>
                <th className="text-left px-5 py-4 text-xs font-medium text-text-muted uppercase tracking-wider hidden sm:table-cell">Roles</th>
                <th className="text-left px-5 py-4 text-xs font-medium text-text-muted uppercase tracking-wider hidden md:table-cell">Trạng thái</th>
                <th className="text-left px-5 py-4 text-xs font-medium text-text-muted uppercase tracking-wider hidden lg:table-cell">Ngày tạo</th>
                <th className="text-right px-5 py-4 text-xs font-medium text-text-muted uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-darkborder">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}><td colSpan={5} className="px-5 py-6"><div className="h-4 bg-darkborder/50 rounded animate-pulse" /></td></tr>
                ))
              ) : users.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-text-muted"><Users className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>Không có user nào</p></td></tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-neon-indigo to-neon-violet flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                          {user.username?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text-primary">{user.username}</p>
                          <p className="text-xs text-text-muted">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      {editingId === user.id ? (
                        <div className="flex flex-wrap gap-1">
                          {allRoles.map((role) => (
                            <button
                              key={role}
                              onClick={() => toggleRole(role)}
                              className={`px-2 py-0.5 rounded-full text-xs font-medium border transition-colors ${
                                editRoles.includes(role)
                                  ? 'bg-neon-violet/15 text-neon-violet border-neon-violet/30'
                                  : 'bg-darkbg text-text-muted border-darkborder hover:border-neon-violet/20'
                              }`}
                            >
                              {role}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {getRoles(user).map((role) => (
                            <span key={role} className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              role === 'ADMIN' ? 'bg-yellow-500/15 text-yellow-400' : 'bg-neon-indigo/15 text-neon-indigo'
                            }`}>
                              {role}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      {user.enabled ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                          <CheckCircle className="w-3.5 h-3.5" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-red-400">
                          <XCircle className="w-3.5 h-3.5" /> Disabled
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <span className="text-sm text-text-muted">
                        {new Date(user.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {editingId === user.id ? (
                          <>
                            <button onClick={() => saveRoles(user.id)}
                              className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-colors text-xs px-2 py-1 font-medium">
                              Lưu
                            </button>
                            <button onClick={cancelEdit}
                              className="p-1.5 rounded-lg hover:bg-white/5 text-text-muted hover:text-text-primary transition-colors">
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => startEditRoles(user)}
                              className="p-2 rounded-lg hover:bg-white/5 text-text-muted hover:text-neon-violet transition-colors" title="Phân quyền">
                              <span className="text-sm">⚙️</span>
                            </button>
                            <button onClick={() => toggleEnabled(user)}
                              className={`p-2 rounded-lg transition-colors ${user.enabled ? 'hover:bg-red-500/10 text-text-muted hover:text-red-400' : 'hover:bg-emerald-500/10 text-text-muted hover:text-emerald-400'}`} title={user.enabled ? 'Vô hiệu hóa' : 'Kích hoạt'}>
                              {user.enabled ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-darkborder flex items-center justify-between">
            <span className="text-sm text-text-muted">Tổng: {totalElements} users • Trang {page + 1} / {totalPages}</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
                className="p-2 rounded-lg hover:bg-white/5 text-text-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-text-primary px-2">{page + 1}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                className="p-2 rounded-lg hover:bg-white/5 text-text-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
