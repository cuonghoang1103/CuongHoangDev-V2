'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
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
  avatarUrl?: string;
  /** The OAuth provider (google/github/facebook) or null for credentials accounts */
  provider?: string;
  roles: string[];
  enabled: boolean;
  accountNonLocked: boolean;
  createdAt: string;
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
  credentials: { label: 'Thường', color: 'bg-neon-indigo/15 text-neon-indigo' },
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
  // filterMode: 'all' | 'credentials' | 'oauth'
  const [filterMode, setFilterMode] = useState<'all' | 'credentials' | 'oauth'>('all');
  const [allUsers, setAllUsers] = useState<BackendUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editRoles, setEditRoles] = useState<string[]>([]);
  const [selfRoleChanged, setSelfRoleChanged] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isOAuthAdmin, setIsOAuthAdmin] = useState(false);
  const initialRoleVersion = useRef<number | null>(null);
  const pageSize = 15;

  // Read backendUser and token from Zustand store (reactive)
  const backendUser = useAuthStore((s) => s.user);
  const backendToken = useAuthStore((s) => s.token);

  // Detect super-admin (only cuong03dx can change roles) — runs when BOTH session and backendUser change
  useEffect(() => {
    const currentUser = session?.user as any;
    const isSAdmin = currentUser?.username === 'cuong03dx' ||
      backendUser?.username === 'cuong03dx' ||
      (currentUser?.email || '').toLowerCase() === 'cuong03dx@gmail.com' ||
      (backendUser?.email || '').toLowerCase() === 'cuong03dx@gmail.com';
    setIsSuperAdmin(isSAdmin);
    // Detect OAuth admin (has NextAuth session but no credentials token) — role may be stale
    setIsOAuthAdmin(!!session?.user && !backendToken);
  }, [session, backendUser, backendToken]);

  // Detect when the current user's role was changed by the admin (cuong03dx)
  useEffect(() => {
    const currentUser = session?.user as any;
    if (!currentUser) return;
    if (initialRoleVersion.current === null) {
      initialRoleVersion.current = currentUser.roleVersion ?? 0;
      return;
    }
    const currentVersion = currentUser.roleVersion ?? 0;
    if (initialRoleVersion.current > 0 && currentVersion > initialRoleVersion.current) {
      const role = (currentUser.role as string || '').replace('ROLE_', '').toUpperCase();
      if (role !== 'ADMIN') {
        setSelfRoleChanged(true);
      }
    }
  }, [session]);

  // Unified fetch — all users come from the backend DB, filtered by provider field
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        size: String(pageSize),
        ...(search && { keyword: search }),
      });
      const res = await api.get<{ data: PageData<BackendUser> }>(`/admin/users?${params}`);
      const data = res.data?.data;
      setAllUsers(data?.content || []);
      setTotalPages(data?.totalPages || 0);
      setTotalElements(data?.totalElements || 0);
    } catch {
      toast.error('Lỗi tải danh sách users');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Filter users by auth type in the UI (backend returns ALL users with provider field)
  const filteredUsers = allUsers.filter((user: BackendUser) => {
    if (filterMode === 'all') return true;
    if (filterMode === 'oauth') return !!user.provider;
    return !user.provider;
  });

  const getRoles = (user: BackendUser): string[] => {
    if (!user.roles) return [];
    if (Array.isArray(user.roles)) return user.roles.map((r: string) => r.replace('ROLE_', ''));
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
    const userBeingEdited = allUsers.find(u => u.id === userId);
    const currentUser = (session?.user as any);
    const isEditingSelf = currentUser && (
      currentUser.email === userBeingEdited?.email ||
      String(currentUser.id) === String(userBeingEdited?.id)
    );

      try {
        await api.put(`/admin/users/${userId}/roles`, { roles: editRoles });
        toast.success('Cập nhật roles thành công!');
        setEditingId(null);

        if (isEditingSelf) {
          toast.info('Vai trò của bạn đã thay đổi. Đang đăng nhập lại...', { duration: 3000 });
          await signOut({ redirect: false });
          setTimeout(() => {
            router.push('/login');
          }, 1500);
          return;
        }

        fetchUsers();
      } catch (err: any) {
        // Show backend error message if available
        const msg = err?.response?.data?.message ||
          err?.message ||
          'Cập nhật thất bại';
        toast.error(msg);
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
      fetchUsers();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Thao tác thất bại';
      toast.error(msg);
    }
  };

  const refreshOAuthSession = async () => {
    toast.info('Đang làm mới phiên...');
    await signOut({ redirect: false });
    setTimeout(() => router.push('/login'), 500);
  };

  const allRoles = ['ADMIN', 'USER', 'MODERATOR', 'EDITOR'];

  return (
    <div className="space-y-6">
      {/* OAuth admin warning — NextAuth JWT role is cached for up to 1h, may be stale */}
      {isOAuthAdmin && (session?.user as any)?.role === 'ADMIN' && (
        <div className="flex items-center gap-3 px-4 py-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-400">Phiên OAuth có thể chưa cập nhật vai trò mới nhất</p>
            <p className="text-xs text-yellow-300/70">Vai trò trong session được cache 1 giờ. Nếu bạn mới được thêm ADMIN, hãy đăng nhập lại để cập nhật.</p>
          </div>
          <button
            onClick={refreshOAuthSession}
            className="px-3 py-1.5 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 text-xs font-medium rounded-lg transition-colors shrink-0"
          >
            Đăng nhập lại
          </button>
        </div>
      )}

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
            Tất cả tài khoản — credentials và OAuth (Google/GitHub)
          </p>
        </div>
        <button
          onClick={fetchUsers}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-darkcard border border-darkborder text-sm text-text-secondary hover:text-text-primary hover:bg-white/5 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          <span className="hidden sm:inline">Làm mới</span>
        </button>
      </div>

      {/* Filter + search row */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1 bg-darkcard border border-darkborder rounded-xl p-1">
          {(['all', 'credentials', 'oauth'] as const).map((mode) => {
            const label = mode === 'all' ? 'Tất cả' : mode === 'credentials' ? 'Tài khoản thường' : 'OAuth (Google/GitHub)';
            return (
              <button
                key={mode}
                onClick={() => { setFilterMode(mode); setPage(0); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filterMode === mode
                    ? 'bg-neon-violet text-white shadow-sm'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Tìm kiếm user..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="w-full pl-10 pr-4 py-2 bg-darkcard border border-darkborder rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-neon-violet/50 transition-colors"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-darkcard border border-darkborder rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-darkborder">
                <th className="text-left px-5 py-4 text-xs font-medium text-text-muted uppercase tracking-wider">User</th>
                <th className="text-left px-5 py-4 text-xs font-medium text-text-muted uppercase tracking-wider hidden md:table-cell">Loại</th>
                <th className="text-left px-5 py-4 text-xs font-medium text-text-muted uppercase tracking-wider hidden sm:table-cell">Roles</th>
                <th className="text-left px-5 py-4 text-xs font-medium text-text-muted uppercase tracking-wider hidden md:table-cell">Trạng thái</th>
                <th className="text-left px-5 py-4 text-xs font-medium text-text-muted uppercase tracking-wider hidden lg:table-cell">Ngày tạo</th>
                <th className="text-right px-5 py-4 text-xs font-medium text-text-muted uppercase tracking-wider">Thao tác</th>
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
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-text-muted">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Không có user nào</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user: BackendUser) => (
                  <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                    {/* User info */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-neon-indigo to-neon-violet flex items-center justify-center text-white text-sm font-medium flex-shrink-0 overflow-hidden">
                          {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            (user.username || user.email || 'U')?.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-text-primary truncate">{user.username || '—'}</p>
                          <p className="text-xs text-text-muted truncate">{user.email || '—'}</p>
                        </div>
                      </div>
                    </td>

                    {/* Provider type badge */}
                    <td className="px-5 py-4 hidden md:table-cell">
                      {(() => {
                        const provider = user.provider;
                        const style = provider ? (PROVIDER_LABELS[provider] || { label: provider, color: 'bg-gray-500/15 text-gray-300' }) : PROVIDER_LABELS['credentials'];
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

                    {/* Roles */}
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
                          {getRoles(user).map((role: string) => (
                            <RoleBadge key={role} role={role} />
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Status */}
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

                    {/* Created at */}
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <span className="text-sm text-text-muted">
                        {(() => {
                          try {
                            return new Date(user.createdAt).toLocaleDateString('vi-VN', {
                              day: '2-digit', month: '2-digit', year: 'numeric',
                            });
                          } catch {
                            return '—';
                          }
                        })()}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {editingId === user.id ? (
                          <>
                            <button onClick={() => saveRoles(user.id)} className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-colors text-xs px-2 py-1 font-medium">
                              Lưu
                            </button>
                            <button onClick={cancelEdit} className="p-1.5 rounded-lg hover:bg-white/5 text-text-muted hover:text-text-primary transition-colors">
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <>
                            {isSuperAdmin ? (
                              <button onClick={() => startEditRoles(user)} className="p-2 rounded-lg hover:bg-white/5 text-text-muted hover:text-neon-violet transition-colors" title="Phân quyền (chỉ cuong03dx)">
                                ⚙️
                              </button>
                            ) : (
                              <button disabled className="p-2 rounded-lg text-darkborder cursor-not-allowed opacity-30" title="Chỉ cuong03dx có quyền phân quyền">
                                ⚙️
                              </button>
                            )}
                            <button
                              onClick={() => toggleEnabled(user)}
                              className={`p-2 rounded-lg transition-colors ${
                                user.enabled
                                  ? 'hover:bg-red-500/10 text-text-muted hover:text-red-400'
                                  : 'hover:bg-emerald-500/10 text-text-muted hover:text-emerald-400'
                              }`}
                              title={user.enabled ? 'Vô hiệu hóa' : 'Kích hoạt'}
                            >
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-darkborder flex items-center justify-between">
            <span className="text-sm text-text-muted">
              Tổng: {totalElements} user • Trang {page + 1} / {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="p-2 rounded-lg hover:bg-white/5 text-text-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-text-primary px-2">{page + 1}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="p-2 rounded-lg hover:bg-white/5 text-text-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
