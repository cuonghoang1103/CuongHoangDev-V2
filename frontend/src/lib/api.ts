import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse, AuthResponse } from '@/types';

export type ApiError = AxiosError<ApiResponse<unknown>> & {
  userFriendlyMessage?: string;
};

export function getFriendlyErrorMessage(error: ApiError): string {
  if (error.response) {
    const status = error.response.status;
    const rawMsg = error.response.data?.message?.toLowerCase() ?? '';

    // 401 Unauthorized — bad credentials
    if (status === 401) {
      if (rawMsg.includes('bad') || rawMsg.includes('invalid') || rawMsg.includes('credentials')) {
        return 'Incorrect username or password. Please try again.';
      }
      if (rawMsg.includes('not found') || rawMsg.includes('user not found')) {
        return 'Account not found. Please check your username.';
      }
      if (rawMsg.includes('locked') || rawMsg.includes('disabled') || rawMsg.includes('banned')) {
        return 'Your account has been locked. Please contact support.';
      }
      return 'Authentication failed. Please log in again.';
    }

    // 400 Bad Request — bad credentials (direct password check, no AuthManager)
    if (status === 400) {
      if (rawMsg.includes('bad') || rawMsg.includes('invalid') || rawMsg.includes('credentials')) {
        return 'Incorrect username or password. Please try again.';
      }
      if (rawMsg.includes('not found') || rawMsg.includes('user not found')) {
        return 'Account not found. Please check your username.';
      }
      if (rawMsg.includes('locked') || rawMsg.includes('disabled')) {
        return 'Your account has been locked. Please contact support.';
      }
      if (rawMsg.includes('exists') || rawMsg.includes('already')) {
        return 'This record already exists. Please use a different value.';
      }
      // Generic 400 — show the actual message from backend
      const msg = error.response.data?.message;
      if (msg) return msg;
    }

    if (status === 403) return 'Access denied. You do not have permission.';
    if (status === 404) return 'Resource not found.';
    if (status === 409 || rawMsg.includes('already') || rawMsg.includes('exists')) {
      return 'This record already exists. Please use a different value.';
    }
    if (status === 422) return 'Invalid data. Please check your input.';
    if (status === 429) return 'Too many requests. Please wait a moment.';
    if (status >= 500) return 'Server error. Please try again later.';
  }
  if (error.code === 'ECONNABORTED') {
    return 'Request timed out. Please check your connection.';
  }
  return 'Something went wrong. Please try again.';
}

// Tạo axios instance
const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8082',
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
  (error: ApiError) => {
    const friendlyMsg = getFriendlyErrorMessage(error);
    error.userFriendlyMessage = friendlyMsg;

    if (error.response) {
      // Xử lý lỗi 401 - Unauthorized (chỉ redirect khi KHÔNG phải login request)
      if (error.response.status === 401) {
        const isLoginRequest =
          error.config?.url?.includes('/auth/login') ||
          error.config?.url?.includes('/api/auth/signin');
        if (!isLoginRequest && typeof window !== 'undefined') {
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

// Re-export api instance
export { api };

// Auth API
export const authApi = {
  login: (data: { username: string; password: string }) =>
    api.post<ApiResponse<AuthResponse>>('/api/v1/auth/login', data),

  register: (data: {
    username: string;
    password: string;
    email: string;
    fullName?: string;
  }) => api.post('/api/v1/auth/register', data),

  loginWithGoogle: () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/oauth2/authorization/google`;
  },

  loginWithGithub: () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/oauth2/authorization/github`;
  },

  getProfile: () => api.get('/api/v1/profile'),

  updateProfile: (data: {
    fullName?: string;
    email?: string;
    bio?: string;
    avatarUrl?: string;
  }) => api.put('/api/v1/profile', data),

  changePassword: (data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => api.post('/api/v1/auth/change-password', data),

  forgotPassword: (email: string) =>
    api.post('/api/v1/auth/forgot-password', { email }),

  resetPassword: (token: string, newPassword: string) =>
    api.post('/api/v1/auth/reset-password', { token, newPassword }),
};

// File Upload API
export const fileApi = {
  upload: (file: File, category: string = 'thumbnails') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    return api.post('/api/v1/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  delete: (id: number) => api.delete(`/api/v1/files/${id}`),
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

// Skills API
export const skillsApi = {
  getAll: () => api.get('/api/v1/skills'),
  getFeatured: () => api.get('/api/v1/skills/featured'),
  getByCategory: (category: string) => api.get(`/api/v1/skills/category/${category}`),
};

// Projects API
export const projectsApi = {
  getAll: (params?: {
    page?: number;
    size?: number;
    keyword?: string;
    status?: string;
  }) => api.get('/api/v1/projects', { params }),

  getFeatured: (params?: { page?: number; size?: number }) =>
    api.get('/api/v1/projects/featured', { params }),

  getBySlug: (slug: string) => api.get(`/api/v1/projects/${slug}`),
};

// Contact API
export const contactApi = {
  submit: (data: {
    name: string;
    email: string;
    subject?: string;
    message: string;
  }) => api.post('/api/v1/contact', data),
};

// Course Categories API
export const courseCategoryApi = {
  getAll: () => api.get('/api/v1/course-categories'),
  getAdminAll: () => api.get('/api/v1/course-categories/admin/all'),
  create: (data: {
    name: string;
    slug?: string;
    description?: string;
    icon?: string;
    sortOrder?: number;
  }) => api.post('/api/v1/course-categories', data),
  update: (id: number, data: {
    name?: string;
    description?: string;
    icon?: string;
    sortOrder?: number;
    isActive?: boolean;
  }) => api.put(`/api/v1/course-categories/${id}`, data),
  delete: (id: number) => api.delete(`/api/v1/course-categories/${id}`),
};

// Courses API
export const coursesApi = {
  getAll: (params?: {
    page?: number;
    size?: number;
    keyword?: string;
    category?: string;
    level?: string;
  }) => api.get('/api/v1/courses', { params }),

  getFeatured: (limit = 6) =>
    api.get('/api/v1/courses/featured', { params: { limit } }),

  getBySlug: (slug: string) => api.get(`/api/v1/courses/${slug}`),

  getReviews: (courseId: number) =>
    api.get(`/api/v1/courses/${courseId}/reviews`),

  // Enrollment
  enroll: (courseId: number) =>
    api.post(`/api/v1/courses/${courseId}/enroll`),

  cancelEnrollment: (courseId: number) =>
    api.delete(`/api/v1/courses/${courseId}/enroll`),

  // Learning
  getCurriculum: (courseId: number) =>
    api.get(`/api/v1/courses/${courseId}/curriculum`),

  getLesson: (courseId: number, lessonId: number) =>
    api.get(`/api/v1/courses/${courseId}/lessons/${lessonId}`),

  getProgress: (courseId: number) =>
    api.get(`/api/v1/courses/${courseId}/progress`),

  updateProgress: (courseId: number, data: {
    lessonId: number;
    isCompleted?: boolean;
    watchTimeSeconds?: number;
    lastPositionSeconds?: number;
  }) => api.post(`/api/v1/courses/${courseId}/progress`, data),

  // My courses
  getMyCourses: (params?: {
    page?: number;
    size?: number;
    status?: string;
  }) => api.get('/api/v1/courses/my', { params }),

  // Review
  createReview: (data: {
    courseId: number;
    rating: number;
    title?: string;
    content?: string;
  }) => api.post('/api/v1/courses/reviews', data),
};

// Admin Courses API
export const adminCoursesApi = {
  getAll: (params?: {
    page?: number;
    size?: number;
    keyword?: string;
    status?: string;
    categoryId?: number;
  }) => api.get('/api/v1/courses/admin/all', { params }),

  create: (data: {
    title: string;
    categoryId?: number;
    instructorId?: number;
    shortDescription?: string;
    description?: string;
    thumbnailUrl?: string;
    previewVideoUrl?: string;
    price?: number;
    discountPrice?: number;
    discountExpiresAt?: string;
    level?: string;
    language?: string;
    isFree?: boolean;
    isFeatured?: boolean;
    requirements?: string;
    whatYouLearn?: string;
    status?: string;
    tags?: string[];
  }) => api.post('/api/v1/courses', data),

  update: (id: number, data: Partial<{
    title: string;
    categoryId: number;
    instructorId: number;
    shortDescription: string;
    description: string;
    thumbnailUrl: string;
    previewVideoUrl: string;
    price: number;
    discountPrice: number;
    discountExpiresAt: string;
    level: string;
    language: string;
    isFree: boolean;
    isFeatured: boolean;
    isPublished: boolean;
    requirements: string;
    whatYouLearn: string;
    status: string;
    tags: string[];
  }>) => api.put(`/api/v1/courses/${id}`, data),

  delete: (id: number) => api.delete(`/api/v1/courses/${id}`),

  // Sections
  createSection: (data: {
    courseId: number;
    title: string;
    description?: string;
    sortOrder?: number;
    isLocked?: boolean;
  }) => api.post('/api/v1/courses/sections', data),

  updateSection: (id: number, data: {
    courseId?: number;
    title?: string;
    description?: string;
    sortOrder?: number;
    isLocked?: boolean;
  }) => api.put(`/api/v1/courses/sections/${id}`, data),

  deleteSection: (id: number) => api.delete(`/api/v1/courses/sections/${id}`),

  // Lessons
  createLesson: (data: {
    sectionId: number;
    title: string;
    slug?: string;
    description?: string;
    content?: string;
    lessonType?: string;
    videoUrl?: string;
    videoDurationSeconds?: number;
    thumbnailUrl?: string;
    isFreePreview?: boolean;
    isPublished?: boolean;
    sortOrder?: number;
  }) => api.post('/api/v1/courses/lessons', data),

  updateLesson: (id: number, data: Partial<{
    sectionId: number;
    title: string;
    slug: string;
    description: string;
    content: string;
    lessonType: string;
    videoUrl: string;
    videoDurationSeconds: number;
    thumbnailUrl: string;
    isFreePreview: boolean;
    isPublished: boolean;
    sortOrder: number;
  }>) => api.put(`/api/v1/courses/lessons/${id}`, data),

  deleteLesson: (id: number) => api.delete(`/api/v1/courses/lessons/${id}`),

  // Documents
  createDocument: (data: {
    lessonId: number;
    title: string;
    fileUrl: string;
    fileSizeBytes?: number;
    fileType?: string;
  }) => api.post('/api/v1/courses/documents', data),

  deleteDocument: (id: number) => api.delete(`/api/v1/courses/documents/${id}`),
};

export default api;
