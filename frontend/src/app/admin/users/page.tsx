'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertTriangle,
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
  roleVersion?: number;
}

interface NextAuthUser {
  id: string;
  name: string | null;
  email: string | null;
  username: string | null;
  image: string | null;
  role: string;
  createdAt: string;
  provider: string;
  isSocialUser: boolean;
  accounts: Array<{ provider: string }>;
  roleVersion?: number;
}

interface PageData<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

const PROVIDER_LABELS: Record<string, { label: string; color: string }> = {
  google: { label: 'Google', color: 'bg-red-500/15 text-red-400' },
  github: { label: 'GitHub', color: 'bg-gray-500/15 text-gray-300' },
  facebook: { label: 'Facebook', color: 'bg-blue-500/15 text-blue-400' },
  credentials: { label: 'Credentials', color: 'bg-neon-indigo/15 text-neon-indigo' },
};

function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
      role === 'ADMIN' ? 'bg-yellow-500/15 text-yellow-400' :
      role === 'MODERATOR' ? 'bg-blue-500/15 text-blue-400' :
      role === 'EDITOR' ? 'bg-emerald-500/15 text-emerald-400' :
      'bg-neon-indigo/15 text-neon-indigo'
    }`}>
      {role}
    </span>
  );
}

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'backend' | 'social'>('backend');
  const [backendUsers, setBackendUsers] = useState<BackendUser[]>([]);
  const [socialUsers, setSocialUsers] = useState<NextAuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editRoles, setEditRoles] = useState<string[]>([]);
  const [selfRoleChanged, setSelfRoleChanged] = useState(false);
  const initialRoleVersion = useRef<number | null>(null);
  const pageSize = 15;

  // Detect when the current user's role was changed by the admin (cuong03dx)
  useEffect(() => {
    const currentUser = session?.user as any;
    if (!currentUser) return;

    // Initialize on first load
    if (initialRoleVersion.current === null) {
      initialRoleVersion.current = currentUser.roleVersion ?? 0;
      return;
    }

    // Role version changed — either the user lost admin or the admin refreshed the list
    const currentVersion = currentUser.roleVersion ?? 0;
    if (initialRoleVersion.current > 0 && currentVersion > initialRoleVersion.current) {
      const role = (currentUser.role as string || '').replace('ROLE_', '').toUpperCase();
      if (role !== 'ADMIN') {
        setSelfRoleChanged(true);
      }
    }
  }, [session]);

  const fetchBackendUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        size: String(pageSize),
        ...(search && { keyword: search }),
      });
      const res = await api.get<{ data: PageData<BackendUser> }>(`/admin/users?${params}`);
      const data = res.data?.data;
      setBackendUsers(data?.content || []);
      setTotalPages(data?.totalPages || 0);
      setTotalElements(data?.totalElements || 0);
    } catch {
      toast.error('Lỗi tải danh sách users từ backend');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  // Fetch NextAuth users directly via fetch — calls Next.js API (port 3000).
  // Will return 401 for credentials users (who have no NextAuth session).
  const fetchSocialUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        size: String(pageSize),
        ...(search && { keyword: search }),
      });
      const res = await fetch(`/api/admin/users/nextauth?${params}`, {
        credentials: 'include',
      });

      // 401 = credentials user has no NextAuth session — not an error
      if (res.status === 401) {
        setSocialUsers([]);
        setTotalPages(0);
        setTotalElements(0);
        setLoading(false);
        return;
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const json = await res.json();
      const data: PageData<NextAuthUser> = json?.data;
      setSocialUsers(data?.content || []);
      setTotalPages(data?.totalPages || 0);
      setTotalElements(data?.totalElements || 0);
    } catch (err) {
      console.error('[AdminUsers] fetchSocialUsers error:', err);
      toast.error('Lỗi tải danh sách social users');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    if (activeTab === 'backend') {
      fetchBackendUsers();
    } else {
      fetchSocialUsers();
    }
  }, [activeTab, page, search, fetchBackendUsers, fetchSocialUsers]);

  const getRoles = (user: BackendUser): string[] => {
    if (!user.roles) return [];
    if (Array.isArray(user.roles)) return user.roles.map((r: any) =>
      typeof r === 'string' ? r.replace('ROLE_', '') : r.name?.replace('ROLE_', '') || ''
    );
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
    const userBeingEdited = backendUsers.find(u => u.id === userId);
    const currentUser = (session?.user as any);
    const isEditingSelf = currentUser && (
      currentUser.email === userBeingEdited?.email ||
      String(currentUser.id) === String(userBeingEdited?.id)
    );

    try {
      await api.put(`/admin/users/${userId}/roles`, { roles: editRoles });
      toast.success('Cập nhật roles thành công!');
      setEditingId(null);

      // If editing own account, force re-login so NextAuth gets the new role
      if (isEditingSelf) {
        toast.info('Vai trò của bạn đã thay đổi. Đang đăng nhập lại...', { duration: 3000 });
        await signOut({ redirect: false });
        setTimeout(() => {
          router.push('/login');
        }, 1500);
        return;
      }

      fetchBackendUsers();
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
      await api.patch(`/admin/users/${user.id}/toggle-enabled`);
      toast.success(user.enabled ? 'Đã vô hiệu hóa' : 'Đã kích hoạt');
      fetchBackendUsers();
    } catch {
      toast.error('Thao tác thất bại');
    }
  };

  const allRoles = ['ADMIN', 'USER', 'MODERATOR', 'EDITOR'];

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(0);
  };

  const refreshCurrentTab = () => {
    if (activeTab === 'backend') {
      fetchBackendUsers();
    } else {
      fetchSocialUsers();
    }
  };

  return (
    <div className="space-y-6">
      {/* Self-role-changed warning */}
      {selfRoleChanged && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-400">Quyền admin của bạn đã bị thu hồi</p>
            <p className="text-xs text-red-300/70">Bạn sẽ không còn truy cập được trang admin sau khi thoát.</p>
          </div>
          <button
            onClick={async () => { await signOut({ redirect: false }); router.push('/login'); }}
            className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-medium rounded-lg transition-colors shrink-0"
          >
            Đăng xuất
          </button>
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-text-primary">Quản lý Users</h1>
          <p className="text-text-secondary mt-1">
            Quản lý tài khoản người dùng — bao gồm user đăng ký thường và đăng nhập qua mạng xã hội
          </p>
        </div>
        <button
          onClick={refreshCurrentTab}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-darkcard border border-darkborder text-sm text-text-secondary hover:text-text-primary hover:bg-white/5 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          <span className="hidden sm:inline">Làm mới</span>
        </button>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-darkcard border border-darkborder rounded-xl p-1 w-fit">
        <button
          onClick={() => { setActiveTab('backend'); setPage(0); setSearch(''); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'backend'
              ? 'bg-neon-violet text-white shadow-sm'
              : 'text-text-muted hover:text-text-primary'
          }`}
        >
          Đăng ký thường
        </button>
        <button
          onClick={() => { setActiveTab('social'); setPage(0); setSearch(''); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'social'
              ? 'bg-neon-violet text-white shadow-sm'
              : 'text-text-muted hover:text-text-primary'
          }`}
        >
          Social Login
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          type="text"
          placeholder="Tìm kiếm user..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-darkcard border border-darkborder rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-neon-violet/50 transition-colors"
        />
      </div>

      {/* Table */}
      <div className="bg-darkcard border border-darkborder rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-darkborder">
                <th className="text-left px-5 py-4 text-xs font-medium text-text-muted uppercase tracking-wider">User</th>
                {activeTab === 'social' && (
                  <th className="text-left px-5 py-4 text-xs font-medium text-text-muted uppercase tracking-wider hidden md:table-cell">Provider</th>
                )}
                <th className="text-left px-5 py-4 text-xs font-medium text-text-muted uppercase tracking-wider hidden sm:table-cell">Roles</th>
                <th className="text-left px-5 py-4 text-xs font-medium text-text-muted uppercase tracking-wider hidden md:table-cell">Trạng thái</th>
                <th className="text-left px-5 py-4 text-xs font-medium text-text-muted uppercase tracking-wider hidden lg:table-cell">Ngày tạo</th>
                {activeTab === 'backend' && (
                  <th className="text-right px-5 py-4 text-xs font-medium text-text-muted uppercase tracking-wider">Thao tác</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-darkborder">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-5 py-6">
                      <div className="h-4 bg-darkborder/50 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : (activeTab === 'backend' ? backendUsers : socialUsers).length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-text-muted">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Không có user nào</p>
                    {activeTab === 'social' && (
                      <p className="text-xs mt-1">Chưa có user đăng nhập qua mạng xã hội</p>
                    )}
                  </td>
                </tr>
              ) : (
                (activeTab === 'backend' ? backendUsers : socialUsers).map((user: any) => (
                  <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                    {/* User info */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-neon-indigo to-neon-violet flex items-center justify-center text-white text-sm font-medium flex-shrink-0 overflow-hidden">
                          {user.image ? (
                            <img src={user.image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            (user.username || user.name || user.email || 'U')?.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-text-primary truncate">
                            {user.username || user.name || user.email || '—'}
                          </p>
                          <p className="text-xs text-text-muted truncate">{user.email || '—'}</p>
                        </div>
                      </div>
                    </td>

                    {/* Provider badge (social tab) */}
                    {activeTab === 'social' && (
                      <td className="px-5 py-4 hidden md:table-cell">
                        {(() => {
                          const provider = user.provider || 'unknown';
                          const style = PROVIDER_LABELS[provider] || { label: provider, color: 'bg-gray-500/15 text-gray-300' };
                          return (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${style.color}`}>
                              {provider === 'google' && '🔴'}
                              {provider === 'github' && '🐙'}
                              {provider === 'facebook' && '📘'}
                              {style.label}
                            </span>
                          );
                        })()}
                      </td>
                    )}

                    {/* Roles */}
                    <td className="px-5 py-4 hidden sm:table-cell">
                      {activeTab === 'backend' ? (
                        editingId === user.id ? (
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
                            {getRoles(user).map((role: string) => (
                              <RoleBadge key={role} role={role} />
                            ))}
                          </div>
                        )
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          <RoleBadge role={user.role} />
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4 hidden md:table-cell">
                      {activeTab === 'backend' ? (
                        user.enabled ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                            <CheckCircle className="w-3.5 h-3.5" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-red-400">
                            <XCircle className="w-3.5 h-3.5" /> Disabled
                          </span>
                        )
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                          <CheckCircle className="w-3.5 h-3.5" /> Active
                        </span>
                      )}
                    </td>

                    {/* Created at */}
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <span className="text-sm text-text-muted">
                        {(() => {
                          try {
                            return new Date(user.createdAt).toLocaleDateString('vi-VN', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            });
                          } catch {
                            return '—';
                          }
                        })()}
                      </span>
                    </td>

                    {/* Actions */}
                    {activeTab === 'backend' && (
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {editingId === user.id ? (
                            <>
                              <button
                                onClick={() => saveRoles(user.id)}
                                className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-colors text-xs px-2 py-1 font-medium"
                              >
                                Lưu
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="p-1.5 rounded-lg hover:bg-white/5 text-text-muted hover:text-text-primary transition-colors"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startEditRoles(user)}
                                className="p-2 rounded-lg hover:bg-white/5 text-text-muted hover:text-neon-violet transition-colors"
                                title="Phân quyền"
                              >
                                ⚙️
                              </button>
                              <button
                                onClick={() => toggleEnabled(user)}
                                className={`p-2 rounded-lg transition-colors ${
                                  user.enabled
                                    ? 'hover:bg-red-500/10 text-text-muted hover:text-red-400'
                                    : 'hover:bg-emerald-500/10 text-text-muted hover:text-emerald-400'
                                }`}
                                title={user.enabled ? 'Vô hiệu hóa' : 'Kích hoạt'}
                              >
                                {user.enabled ? (
                                  <XCircle className="w-4 h-4" />
                                ) : (
                                  <CheckCircle className="w-4 h-4" />
                                )}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-darkborder flex items-center justify-between">
            <span className="text-sm text-text-muted">
              Tổng: {totalElements} user • Trang {page + 1} / {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-2 rounded-lg hover:bg-white/5 text-text-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-text-primary px-2">{page + 1}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="p-2 rounded-lg hover:bg-white/5 text-text-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
