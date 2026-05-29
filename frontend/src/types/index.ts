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
  avatarUrl?: string;
  bio?: string;
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
  userId: number;
  username: string;
  email: string;
  role: string;
  roles: string[];
}

// Skill & Project types
export interface Skill {
  id: number;
  name: string;
  slug: string;
  category: string;
  proficiency: number;
  description?: string;
  yearsExperience?: number;
  isFeatured: boolean;
  displayOrder: number;
}

export interface Project {
  id: number;
  title: string;
  slug: string;
  description?: string;
  content?: string;
  thumbnailUrl?: string;
  projectUrl?: string;
  githubUrl?: string;
  technologies?: string[];
  role?: string;
  duration?: string;
  status: string;
  featured: boolean;
  startDate?: string;
  endDate?: string;
  skillNames?: string[];
  viewCount?: number;
  createdAt: string;
  updatedAt?: string;
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
  categorySlug?: string;
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

// === COURSE TYPES ===

export interface CourseCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  sortOrder: number;
  courseCount?: number;
}

export interface LessonDto {
  id: number;
  sectionId?: number;
  title: string;
  slug?: string;
  description?: string;
  content?: string;
  lessonType: string;
  videoUrl?: string;
  videoDurationSeconds: number;
  thumbnailUrl?: string;
  isFreePreview: boolean;
  isPublished: boolean;
  sortOrder: number;
  documents?: CourseDocument[];
}

export interface CourseDocument {
  id: number;
  lessonId?: number;
  title: string;
  fileUrl: string;
  fileSizeBytes: number;
  fileType?: string;
  downloadCount: number;
}

export interface CourseSection {
  id: number;
  title: string;
  description?: string;
  sortOrder: number;
  isLocked: boolean;
  lessonCount: number;
  totalDurationSeconds: number;
  lessons?: LessonDto[];
}

export interface Course {
  id: number;
  title: string;
  slug: string;
  shortDescription?: string;
  description?: string;
  thumbnailUrl?: string;
  previewVideoUrl?: string;
  price: number;
  discountPrice?: number;
  discountExpiresAt?: string;
  level: string;
  language: string;
  isFree: boolean;
  isFeatured: boolean;
  isPublished: boolean;
  publishedAt?: string;
  totalDurationSeconds: number;
  totalLessons: number;
  totalStudents: number;
  totalReviews: number;
  avgRating: number;
  requirements?: string;
  whatYouLearn?: string;
  status: string;
  createdAt: string;
  categoryId?: number;
  categoryName?: string;
  categorySlug?: string;
  instructorId?: number;
  instructorName?: string;
  instructorAvatar?: string;
  sections?: CourseSection[];
  tags?: string[];
  isEnrolled?: boolean;
  enrollmentProgress?: number;
}

export interface Enrollment {
  id: number;
  userId?: number;
  courseId: number;
  courseTitle: string;
  courseSlug: string;
  courseThumbnail?: string;
  enrolledAt: string;
  expiresAt?: string;
  status: string;
  progressPercent: number;
  lastLessonId?: number;
  lastLessonTitle?: string;
  lastAccessedAt?: string;
}

export interface CourseReview {
  id: number;
  courseId?: number;
  userId?: number;
  userFullName: string;
  userAvatar?: string;
  rating: number;
  title?: string;
  content?: string;
  createdAt: string;
}

export interface LessonProgress {
  lessonId: number;
  isCompleted: boolean;
  watchTimeSeconds: number;
  lastPositionSeconds: number;
}

// === MUSIC TYPES ===

export interface Track {
  id: string;
  title: string;
  artist: string;
  duration: string;
  audioUrl: string;
  coverImage: string;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  coverUrl: string;
  trackCount: number;
  totalDuration: string;
  tracks: Track[];
}
