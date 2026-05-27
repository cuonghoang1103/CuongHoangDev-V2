import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse } from '@/types';

// Tạo axios instance
const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - thêm token vào header
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - xử lý lỗi
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse<unknown>>) => {
    if (error.response) {
      // Server trả về lỗi
      const message = error.response.data?.message || 'Đã xảy ra lỗi';
      console.error('API Error:', message);

      // Xử lý lỗi 401 - Unauthorized
      if (error.response.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      }
    } else if (error.request) {
      // Request đã gửi nhưng không nhận được response
      console.error('Network Error:', error.request);
    } else {
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (data: { username: string; password: string }) =>
    api.post('/api/v1/auth/login', data),

  register: (data: {
    username: string;
    password: string;
    email: string;
    fullName?: string;
  }) => api.post('/api/v1/auth/register', data),

  getProfile: () => api.get('/api/v1/profile'),

  updateProfile: (data: { fullName?: string; email?: string }) =>
    api.patch('/api/v1/profile', data),
};

// User API
export const userApi = {
  getAll: (params?: {
    page?: number;
    size?: number;
    keyword?: string;
    sortBy?: string;
    sortDir?: string;
  }) => api.get('/api/v1/admin/users', { params }),

  getById: (id: number) => api.get(`/api/v1/admin/users/${id}`),

  create: (data: {
    username: string;
    password: string;
    email: string;
    fullName?: string;
    roleName: string;
  }) => api.post('/api/v1/admin/users', data),

  update: (
    id: number,
    data: {
      username?: string;
      email?: string;
      fullName?: string;
      password?: string;
      enabled?: boolean;
      accountNonLocked?: boolean;
      roleName?: string;
    }
  ) => api.put(`/api/v1/admin/users/${id}`, data),

  delete: (id: number) => api.delete(`/api/v1/admin/users/${id}`),

  lock: (id: number) => api.patch(`/api/v1/admin/users/${id}/lock`),

  unlock: (id: number) => api.patch(`/api/v1/admin/users/${id}/unlock`),

  count: () => api.get('/api/v1/admin/users/count'),
};

// Blog API
export const blogApi = {
  getPosts: (params?: {
    page?: number;
    size?: number;
    category?: string;
  }) => api.get('/api/v1/blog/posts', { params }),

  getPostBySlug: (slug: string) => api.get(`/api/v1/blog/posts/${slug}`),

  getFeatured: () => api.get('/api/v1/blog/posts/featured'),

  getPopular: (limit?: number) =>
    api.get('/api/v1/blog/posts/popular', { params: { limit } }),

  search: (params: {
    keyword?: string;
    category?: string;
    page?: number;
    size?: number;
  }) => api.get('/api/v1/blog/posts/search', { params }),

  getCategories: () => api.get('/api/v1/blog/categories'),
};

// AI Chat API
export const aiApi = {
  chat: (data: {
    message: string;
    sessionId?: string;
    documentType?: string;
    topK?: number;
  }) => api.post('/api/v1/ai/chat', data),

  getChatHistory: (sessionId: string) =>
    api.get(`/api/v1/ai/chat/history/${sessionId}`),

  getSessions: () => api.get('/api/v1/ai/chat/sessions'),

  deleteSession: (sessionId: string) =>
    api.delete(`/api/v1/ai/chat/sessions/${sessionId}`),

  submitFeedback: (data: {
    messageId: number;
    rating: number;
    feedbackType: string;
    comment?: string;
  }) => api.post('/api/v1/ai/feedback', data),

  getFeedbackStats: () => api.get('/api/v1/ai/feedback/stats'),

  getAnalyticsOverview: () => api.get('/api/v1/ai/analytics/overview'),
};

// AI Admin API
export const aiAdminApi = {
  indexAll: () =>
    api.post('/api/v1/ai/admin/knowledge/index-all'),

  reindexAll: () =>
    api.post('/api/v1/ai/admin/knowledge/reindex-all'),

  clearAll: () =>
    api.delete('/api/v1/ai/admin/knowledge/clear-all'),

  indexPosts: () =>
    api.post('/api/v1/ai/admin/knowledge/index-posts'),

  indexProfiles: () =>
    api.post('/api/v1/ai/admin/knowledge/index-profiles'),

  indexDocument: (data: {
    documentId: string;
    documentType: string;
    content: string;
    metadata?: Record<string, unknown>;
  }) => api.post('/api/v1/ai/admin/documents', data),

  deleteDocument: (documentId: string) =>
    api.delete(`/api/v1/ai/admin/documents/${documentId}`),

  getAllChunks: (documentType?: string) =>
    api.get('/api/v1/ai/admin/documents', { params: { documentType } }),

  getStats: () => api.get('/api/v1/ai/admin/stats'),

  getConfig: () => api.get('/api/v1/ai/admin/config'),

  updateConfig: (key: string, data: { value?: string; description?: string }) =>
    api.put(`/api/v1/ai/admin/config/${key}`, data),
};

// System API
export const systemApi = {
  health: () => api.get('/api/v1/system/health'),
};

export default api;
