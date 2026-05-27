// API Response types
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

// Page Response
export interface PageResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

// User types
export interface User {
  id: number;
  username: string;
  email: string;
  fullName?: string;
  roles: string[];
  enabled: boolean;
  accountNonLocked: boolean;
  createdAt: string;
  updatedAt?: string;
}

// Auth types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  email: string;
  fullName?: string;
}

export interface AuthResponse {
  token: string;
  id: number;
  username: string;
  email: string;
  role: string;
}

// Blog types
export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  createdAt: string;
  postCount?: number;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
  createdAt: string;
}

export interface Post {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  thumbnailUrl?: string;
  status: string;
  viewCount: number;
  isFeatured: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt?: string;
  categoryId?: number;
  categoryName?: string;
  authorId?: number;
  authorName?: string;
  tagNames?: string[];
}

// AI Chat types
export interface ChatMessage {
  id: number;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  tokenCount?: number;
  createdAt: string;
}

export interface ChatSession {
  id: number;
  sessionId: string;
  userId?: number;
  title?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ChatRequest {
  message: string;
  sessionId?: string;
  documentType?: string;
  topK?: number;
}

export interface ChatResponse {
  answer: string;
  sessionId: string;
  sources?: string[];
  tokenUsage?: number;
}

export interface FeedbackRequest {
  messageId: number;
  rating: number;
  feedbackType: 'helpful' | 'not_helpful' | 'accurate' | 'inaccurate';
  comment?: string;
}

// Admin types
export interface CreateUserRequest {
  username: string;
  password: string;
  email: string;
  fullName?: string;
  roleName: string;
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  fullName?: string;
  password?: string;
  enabled?: boolean;
  accountNonLocked?: boolean;
  roleName?: string;
}

// AI Admin types
export interface DocumentChunk {
  id: number;
  content: string;
  metadata?: string;
  documentId: string;
  documentType: string;
  chunkIndex: number;
  createdAt: string;
}

export interface IndexingResult {
  postsIndexed: number;
  profilesIndexed: number;
  skillsIndexed: number;
  projectsIndexed: number;
  errors: number;
}

export interface IndexStats {
  totalChunks: number;
  postsCount: number;
  profileCount: number;
  skillsCount: number;
  projectsCount: number;
}

// File upload
export interface FileUploadResponse {
  id: number;
  originalName: string;
  storedName: string;
  contentType: string;
  fileSize: number;
  url: string;
  uploadedAt: string;
}
