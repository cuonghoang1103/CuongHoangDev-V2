'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Music, Plus, Upload, Search, Trash2, Edit, X,
  Loader2, ImageIcon, CheckCircle2, Headphones
} from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';
import { fileApi } from '@/lib/api';
import { useTranslation } from '@/hooks/useTranslation';

interface Track {
  id: number;
  title: string;
  artist: string;
  audioUrl: string;
  coverImage?: string;
  durationSeconds?: number;
  fileSize?: number;
  active?: boolean;
  createdAt?: string;
  supabasePath?: string;
}

function formatDuration(seconds?: number): string {
  if (!seconds) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatSize(bytes?: number): string {
  if (!bytes) return '-';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const API = '/api/v1/music';

function getToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('auth_token') || localStorage.getItem('token') || '';
}

async function apiFetch(path: string, options: RequestInit = {}): Promise<any> {
  const token = getToken();
  const res = await fetch(`${API}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string>),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.json();
}

const DEFAULT_COVER = 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&q=80';

function TrackCoverImage({ track, className }: { track: { coverImage?: string; title: string }; className?: string }) {
  const [imgError, setImgError] = useState(false);
  const src = !imgError && track.coverImage ? track.coverImage : DEFAULT_COVER;
  return (
    <Image
      src={src}
      alt={track.title}
      fill
      className={className}
      onError={() => setImgError(true)}
      unoptimized={src.startsWith('http')}
    />
  );
}

export default function AdminMusicPage() {
  const { t } = useTranslation();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState('');

  const audioRef = useRef<HTMLAudioElement>(null);

  const fetchTracks = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/music/admin/tracks', {
        credentials: 'include',
      });
      const data = await res.json();
      console.log('[AdminMusic] fetchTracks:', res.status, data);
      setTracks(data.data || []);
    } catch (err) {
      console.error('[AdminMusic] fetchTracks error:', err);
      toast.error('Không thể tải danh sách nhạc: ' + (err instanceof Error ? err.message : String(err)));
      setTracks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTracks(); }, []);

  const filtered = tracks.filter((t) =>
    !search ||
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.artist.toLowerCase().includes(search.toLowerCase())
  );

  const resetForm = () => {
    setTitle('');
    setArtist('');
    setCoverImage('');
    setAudioUrl('');
    setDurationSeconds(0);
    setAudioFile(null);
    setCoverFile(null);
    setAudioPreviewUrl('');
    if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
  };

  const openCreate = () => {
    resetForm();
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (track: Track) => {
    setTitle(track.title);
    setArtist(track.artist);
    setCoverImage(track.coverImage || '');
    setAudioUrl(track.audioUrl || '');
    setDurationSeconds(track.durationSeconds || 0);
    setAudioFile(null);
    setCoverFile(null);
    setAudioPreviewUrl('');
    setEditingId(track.id);
    setShowForm(true);
  };

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAudioFile(file);
    if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
    const blobUrl = URL.createObjectURL(file);
    setAudioPreviewUrl(blobUrl);

    // Get duration
    const audio = new Audio(blobUrl);
    audio.addEventListener('loadedmetadata', () => {
      setDurationSeconds(Math.floor(audio.duration));
    });
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    const blobUrl = URL.createObjectURL(file);
    setCoverImage(blobUrl);
  };

  // ──────────────────────────────────────────────────────────────
  // handleSave: single-step upload — file goes through Vercel proxy
  //   → backend (server-to-Supabase, no 4.5MB browser limit)
  //   → backend saves DB record
  //   All errors are logged to console AND shown in the toast.
  // ──────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!title.trim() || !artist.trim()) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (!editingId && !audioFile) {
      toast.error('Vui lòng tải lên file nhạc');
      return;
    }

    setSaving(true);
    setUploading(true);
    try {
      // Step 1: Upload cover image via fileApi (Cloudinary)
      let coverUrl: string | null = null;
      if (coverFile) {
        toast.info('Đang upload ảnh bìa...');
        const coverRes = await fileApi.upload(coverFile, 'music-covers');
        coverUrl = coverRes.data?.data?.url || null;
        if (!coverUrl) {
          toast.warning('Upload ảnh bìa thất bại — tiếp tục không có ảnh');
        } else {
          console.log('[AdminMusic] Cover uploaded:', coverUrl);
        }
      } else if (coverImage && !coverImage.startsWith('blob:')) {
        coverUrl = coverImage;
      }

      // Step 2: Create/update DB record
      if (editingId) {
        // Editing: PATCH metadata + optional new audio
        const body: Record<string, unknown> = {
          title: title.trim(),
          artist: artist.trim(),
          durationSeconds,
          coverImageUrl: coverUrl || undefined,
        };
        if (audioUrl) body.audioUrl = audioUrl;

        console.log('[AdminMusic] Updating track', editingId, 'with body:', body);
        const res = await apiFetch(`/admin/tracks/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(body),
        });
        console.log('[AdminMusic] Update response:', res);
        toast.success('Cập nhật thành công');
      } else {
        // Creating: single POST to /admin/upload
        // Backend receives audio → uploads to Supabase → creates DB record
        const formData = new FormData();
        formData.append('audio', audioFile!);
        formData.append('title', title.trim());
        formData.append('artist', artist.trim());
        formData.append('durationSeconds', String(durationSeconds));
        if (coverUrl) formData.append('cover', coverUrl); // backend expects "cover" param

        const token = getToken();
        console.log('[AdminMusic] Uploading audio:', audioFile!.name, `(${(audioFile!.size / 1024 / 1024).toFixed(1)} MB)`);

        const res = await fetch('/api/v1/music/admin/upload', {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
          credentials: 'include',
        });

        const rawText = await res.text();
        console.log('[AdminMusic] Upload response:', res.status, rawText.slice(0, 500));

        let data: Record<string, unknown> = {};
        try { data = JSON.parse(rawText); } catch { /* raw text used below */ }

        if (!res.ok || data.success === false) {
          const msg = (data.message as string) || `Lỗi HTTP ${res.status}: ${rawText.slice(0, 200)}`;
          toast.error(msg);
          return;
        }

        toast.success('Tạo track thành công!');
      }

      setShowForm(false);
      resetForm();
      fetchTracks();
    } catch (err: any) {
      console.error('[AdminMusic] handleSave error:', err);
      toast.error(err.message || 'Lưu thất bại');
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const handleDelete = async (id: number, hasPublicId?: string) => {
    if (!confirm('Ban co chac muon xoa track nay?')) return;
    try {
      await apiFetch(`/admin/tracks/${id}`, { method: 'DELETE' });
      toast.success('Xoa thanh cong');
      fetchTracks();
    } catch (err: any) {
      toast.error(err.message || 'Xoa that bai');
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-text-primary flex items-center gap-3">
            <Headphones className="w-6 h-6 text-neon-violet" />
            Quan ly Nhac
          </h1>
          <p className="text-text-muted text-sm mt-1">{tracks.length} tracks</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-neon-indigo to-neon-violet text-white font-medium rounded-xl hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Them Track
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tim kiem theo ten hoac artist..."
          className="w-full pl-9 pr-4 py-2.5 bg-darkcard border border-darkborder rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-neon-violet/50"
        />
      </div>

      {/* Table */}
      <div className="bg-darkcard border border-darkborder rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-darkborder">
                <th className="text-left px-4 py-3 text-text-muted font-medium">Track</th>
                <th className="text-left px-4 py-3 text-text-muted font-medium hidden md:table-cell">Artist</th>
                <th className="text-left px-4 py-3 text-text-muted font-medium hidden sm:table-cell">Thoi luong</th>
                <th className="text-left px-4 py-3 text-text-muted font-medium hidden lg:table-cell">Kich thuoc</th>
                <th className="text-right px-4 py-3 text-text-muted font-medium">Hanh dong</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-neon-violet mx-auto" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-text-muted">
                    Khong co track nao
                  </td>
                </tr>
              ) : (
                filtered.map((track) => (
                  <tr key={track.id} className="border-b border-darkborder/50 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-darkbg">
                          <TrackCoverImage track={track} className="object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-text-primary truncate max-w-[200px]">{track.title}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-text-secondary">{track.artist}</span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-text-muted text-xs">
                        {track.durationSeconds ? formatDuration(track.durationSeconds) : '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-text-muted text-xs">{formatSize(track.fileSize)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(track)}
                          className="p-1.5 rounded-lg text-text-muted hover:text-neon-violet hover:bg-neon-violet/10 transition-colors"
                          title="Chinh sua"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(track.id)}
                          className="p-1.5 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Xoa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative w-full max-w-lg max-h-[90vh] bg-darkcard border border-darkborder rounded-2xl shadow-2xl overflow-y-auto">
            <div className="sticky top-0 bg-darkcard border-b border-darkborder px-6 py-4 flex items-center justify-between z-10">
              <h2 className="font-heading font-bold text-text-primary">
                {editingId ? 'Chinh sua Track' : 'Them Track moi'}
              </h2>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-text-muted hover:text-text-primary transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Audio File */}
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">
                  File nhac <span className="text-red-400">*</span>
                </label>
                <audio ref={audioRef} className="hidden" />
                <label className={`flex flex-col items-center justify-center w-full h-24 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
                  audioFile || audioUrl
                    ? 'border-neon-violet/50 bg-neon-violet/5'
                    : 'border-darkborder hover:border-neon-violet/40 bg-white/[0.02]'
                }`}>
                  <div className="flex flex-col items-center justify-center pt-3 pb-3">
                    {audioFile ? (
                      <>
                        <CheckCircle2 className="w-6 h-6 text-neon-violet mb-1" />
                        <span className="text-sm text-neon-violet font-medium">{audioFile.name}</span>
                        <span className="text-xs text-text-muted mt-0.5">{(audioFile.size / 1024 / 1024).toFixed(1)} MB</span>
                      </>
                    ) : audioUrl ? (
                      <>
                        <CheckCircle2 className="w-6 h-6 text-neon-emerald mb-1" />
                        <span className="text-sm text-neon-emerald font-medium">Da co file</span>
                        <span className="text-xs text-text-muted mt-0.5">Tai file khac de thay the</span>
                      </>
                    ) : (
                      <>
                        <Music className="w-6 h-6 text-text-muted mb-1" />
                        <span className="text-sm text-text-muted">Drop MP3 here hoac click de chon</span>
                      </>
                    )}
                  </div>
                  <input type="file" accept="audio/*" onChange={handleAudioChange} className="hidden" />
                </label>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">Tieu de <span className="text-red-400">*</span></label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                  placeholder="VD: Midnight Code"
                  className="w-full px-4 py-2.5 bg-darkbg border border-darkborder rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-neon-violet/50" />
              </div>

              {/* Artist */}
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">Artist <span className="text-red-400">*</span></label>
                <input type="text" value={artist} onChange={(e) => setArtist(e.target.value)}
                  placeholder="VD: LoFi Beats"
                  className="w-full px-4 py-2.5 bg-darkbg border border-darkborder rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-neon-violet/50" />
              </div>

              {/* Cover Image */}
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">Anh bia</label>
                <div className="flex gap-3">
                  <label className={`flex flex-col items-center justify-center w-20 h-20 rounded-xl border-2 border-dashed cursor-pointer transition-colors shrink-0 ${
                    coverImage ? 'border-neon-violet/50 bg-neon-violet/5' : 'border-darkborder hover:border-neon-violet/40 bg-white/[0.02]'
                  }`}>
                    {coverImage ? (
                      <img src={coverImage} alt="Cover preview" className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-text-muted" />
                    )}
                    <input type="file" accept="image/*" onChange={handleCoverChange} className="hidden" />
                  </label>
                  <div className="flex-1">
                    <input type="text" value={coverImage} onChange={(e) => setCoverImage(e.target.value)}
                      placeholder="Hoac paste URL..."
                      className="w-full px-4 py-2.5 bg-darkbg border border-darkborder rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-neon-violet/50" />
                    <p className="text-xs text-text-muted/60 mt-1.5">Upload anh hoac paste URL</p>
                  </div>
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">Thoi luong (giay)</label>
                <input type="number" value={durationSeconds} onChange={(e) => setDurationSeconds(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-darkbg border border-darkborder rounded-xl text-sm text-text-primary focus:outline-none focus:border-neon-violet/50" />
                <p className="text-xs text-text-muted mt-1">Tu dong tinh khi chon file nhac</p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 text-sm text-text-muted hover:text-text-primary transition-colors">
                  Huy
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || (uploading && !audioUrl)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-neon-indigo to-neon-violet text-white font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {(saving || uploading) && <Loader2 className="w-4 h-4 animate-spin" />}
                  {saving ? 'Dang luu...' : 'Luu'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
