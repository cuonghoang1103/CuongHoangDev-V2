'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Project } from '@/types';
import { ssrSafeStorage } from './ssrSafeStorage';

export const SEED_PROJECTS: Project[] = [
  {
    id: 1,
    title: 'CuongHoang Dev Portal',
    slug: 'cuonghoang-dev-portal',
    description: 'Personal portfolio & e-commerce platform featuring a digital marketplace, online academy, AI-powered chatbot, and music streaming — all built with Next.js 14, Spring Boot, and modern web technologies.',
    content: '',
    technologies: ['Next.js 14', 'TypeScript', 'Tailwind CSS', 'Spring Boot', 'MySQL', 'Redis', 'JWT', 'Shadcn/ui', 'Zustand', 'Framer Motion'],
    status: 'COMPLETED',
    projectUrl: 'https://cuonghoang.dev',
    githubUrl: 'https://github.com/cuonghoangdev',
    thumbnailUrl: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&q=80',
    featured: true,
    startDate: '2024-01-01',
    endDate: '2024-06-01',
    role: 'Full-Stack Developer',
    duration: '6 months',
    skillNames: ['Next.js', 'React', 'TypeScript', 'Java', 'Spring Boot', 'MySQL'],
    viewCount: 1250,
    createdAt: '2024-06-01T00:00:00Z',
    updatedAt: '2024-12-01T00:00:00Z',
  },
  {
    id: 2,
    title: 'E-Commerce Dashboard',
    slug: 'e-commerce-dashboard',
    description: 'A comprehensive admin dashboard for managing products, orders, customers, and analytics. Features real-time sales tracking, inventory management, and automated reporting.',
    content: '',
    technologies: ['React', 'Node.js', 'Express', 'MongoDB', 'Chart.js', 'Redux'],
    status: 'COMPLETED',
    projectUrl: '',
    githubUrl: 'https://github.com/cuonghoangdev/ecommerce-dashboard',
    thumbnailUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',
    featured: true,
    startDate: '2023-06-01',
    endDate: '2023-10-01',
    role: 'Frontend Developer',
    duration: '4 months',
    skillNames: ['React', 'Node.js', 'MongoDB', 'Chart.js'],
    viewCount: 890,
    createdAt: '2023-10-01T00:00:00Z',
  },
  {
    id: 3,
    title: 'AI Content Generator',
    slug: 'ai-content-generator',
    description: 'An AI-powered web application that generates marketing copy, blog posts, social media content, and product descriptions using OpenAI GPT models with custom fine-tuning.',
    content: '',
    technologies: ['Next.js', 'Python', 'FastAPI', 'OpenAI API', 'PostgreSQL', 'Stripe'],
    status: 'COMPLETED',
    projectUrl: '',
    githubUrl: 'https://github.com/cuonghoangdev/ai-content-gen',
    thumbnailUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80',
    featured: true,
    startDate: '2023-11-01',
    endDate: '2024-02-01',
    role: 'Full-Stack Developer',
    duration: '3 months',
    skillNames: ['Next.js', 'Python', 'FastAPI', 'OpenAI', 'PostgreSQL'],
    viewCount: 670,
    createdAt: '2024-02-01T00:00:00Z',
  },
  {
    id: 4,
    title: 'Real-Time Chat Application',
    slug: 'realtime-chat-app',
    description: 'A scalable real-time messaging platform supporting individual chats, group channels, file sharing, reactions, and video calls using WebRTC. Built with Socket.io for real-time communication.',
    content: '',
    technologies: ['React', 'Socket.io', 'Node.js', 'Redis', 'WebRTC', 'MongoDB'],
    status: 'COMPLETED',
    projectUrl: '',
    githubUrl: 'https://github.com/cuonghoangdev/chat-app',
    thumbnailUrl: 'https://images.unsplash.com/photo-1611746872915-64382b5c76da?w=800&q=80',
    featured: false,
    startDate: '2023-03-01',
    endDate: '2023-06-01',
    role: 'Backend Developer',
    duration: '3 months',
    skillNames: ['React', 'Node.js', 'Socket.io', 'Redis', 'WebRTC'],
    viewCount: 450,
    createdAt: '2023-06-01T00:00:00Z',
  },
  {
    id: 5,
    title: 'Task Management System',
    slug: 'task-management-system',
    description: 'A Kanban-style project management tool with drag-and-drop boards, team collaboration, time tracking, Gantt charts, and Slack integration for notifications.',
    content: '',
    technologies: ['Vue.js', 'TypeScript', 'Django', 'PostgreSQL', 'Docker', 'CI/CD'],
    status: 'IN_PROGRESS',
    projectUrl: '',
    githubUrl: 'https://github.com/cuonghoangdev/task-manager',
    thumbnailUrl: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=800&q=80',
    featured: false,
    startDate: '2024-03-01',
    role: 'Full-Stack Developer',
    duration: 'Ongoing',
    skillNames: ['Vue.js', 'TypeScript', 'Django', 'PostgreSQL', 'Docker'],
    viewCount: 320,
    createdAt: '2024-03-01T00:00:00Z',
  },
  {
    id: 6,
    title: 'Weather Forecast App',
    slug: 'weather-forecast-app',
    description: 'A beautiful weather application with 7-day forecasts, interactive maps, historical weather data, and severe weather alerts using the OpenWeatherMap API.',
    content: '',
    technologies: ['React Native', 'Expo', 'OpenWeatherMap API', 'Mapbox', 'TypeScript'],
    status: 'COMPLETED',
    projectUrl: '',
    githubUrl: 'https://github.com/cuonghoangdev/weather-app',
    thumbnailUrl: 'https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?w=800&q=80',
    featured: false,
    startDate: '2023-08-01',
    endDate: '2023-09-01',
    role: 'Mobile Developer',
    duration: '1 month',
    skillNames: ['React Native', 'TypeScript', 'REST APIs'],
    viewCount: 280,
    createdAt: '2023-09-01T00:00:00Z',
  },
  {
    id: 7,
    title: 'Fitness Tracker Dashboard',
    slug: 'fitness-tracker-dashboard',
    description: 'A comprehensive fitness tracking application that syncs with wearable devices, provides workout analytics, nutrition tracking, and personalized training plans with AI coaching.',
    content: '',
    technologies: ['Angular', 'Firebase', 'Google Fit API', 'D3.js', 'PWA'],
    status: 'PLANNING',
    projectUrl: '',
    githubUrl: '',
    thumbnailUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80',
    featured: false,
    startDate: '2025-01-01',
    role: 'Solo Developer',
    duration: 'Planned 6 months',
    skillNames: ['Angular', 'Firebase', 'PWA'],
    viewCount: 150,
    createdAt: '2024-12-01T00:00:00Z',
  },
  {
    id: 8,
    title: 'Blog CMS Platform',
    slug: 'blog-cms-platform',
    description: 'A full-featured content management system for bloggers with markdown support, SEO optimization, social sharing, email newsletters, and monetization through ad integration.',
    content: '',
    technologies: ['Next.js', 'MDX', 'Prisma', 'PostgreSQL', 'Vercel', 'Cloudflare'],
    status: 'COMPLETED',
    projectUrl: 'https://blog.cuonghoang.dev',
    githubUrl: 'https://github.com/cuonghoangdev/blog-cms',
    thumbnailUrl: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&q=80',
    featured: true,
    startDate: '2023-01-01',
    endDate: '2023-03-01',
    role: 'Full-Stack Developer',
    duration: '2 months',
    skillNames: ['Next.js', 'MDX', 'Prisma', 'PostgreSQL'],
    viewCount: 520,
    createdAt: '2023-03-01T00:00:00Z',
  },
  {
    id: 9,
    title: 'Restaurant Reservation System',
    slug: 'restaurant-reservation-system',
    description: 'An end-to-end restaurant management solution with online reservations, table management, POS integration, inventory tracking, and customer loyalty programs.',
    content: '',
    technologies: ['React', 'Spring Boot', 'MySQL', 'RabbitMQ', 'Docker', 'AWS'],
    status: 'MAINTENANCE',
    projectUrl: '',
    githubUrl: '',
    thumbnailUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
    featured: false,
    startDate: '2022-09-01',
    endDate: '2023-01-01',
    role: 'Full-Stack Developer',
    duration: '4 months',
    skillNames: ['React', 'Java', 'Spring Boot', 'MySQL', 'AWS'],
    viewCount: 390,
    createdAt: '2023-01-01T00:00:00Z',
  },
];

interface ProjectState {
  projects: Project[];
  isLoaded: boolean;
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  updateProject: (id: number, project: Project) => void;
  deleteProject: (id: number) => void;
  getProject: (id: number) => Project | undefined;
  getProjectBySlug: (slug: string) => Project | undefined;
  getFeaturedProjects: () => Project[];
  getProjectsByStatus: (status: string) => Project[];
  toggleFeatured: (id: number) => void;
  searchProjects: (query: string) => Project[];
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: SEED_PROJECTS,
      isLoaded: false,

      setProjects: (projects: Project[]) => {
        set({ projects });
      },

      addProject: (project: Project) => {
        set((state) => ({
          projects: [{ ...project, id: Date.now(), createdAt: new Date().toISOString() }, ...state.projects],
        }));
      },

      updateProject: (id: number, project: Project) => {
        set((state) => ({
          projects: state.projects.map((p) => (p.id === id ? { ...project, id } : p)),
        }));
      },

      deleteProject: (id: number) => {
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
        }));
      },

      getProject: (id: number) => get().projects.find((p) => p.id === id),

      getProjectBySlug: (slug: string) => get().projects.find((p) => p.slug === slug),

      getFeaturedProjects: () => get().projects.filter((p) => p.featured),

      getProjectsByStatus: (status: string) => get().projects.filter((p) => p.status === status),

      toggleFeatured: (id: number) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, featured: !p.featured } : p
          ),
        }));
      },

      searchProjects: (query: string) => {
        const q = query.toLowerCase();
        return get().projects.filter(
          (p) =>
            p.title.toLowerCase().includes(q) ||
            (p.description || '').toLowerCase().includes(q) ||
            (p.technologies || []).some((t) => t.toLowerCase().includes(q))
        );
      },
    }),
    {
      name: 'projects-storage',
      storage: createJSONStorage(() => ssrSafeStorage),
      partialize: (state) => ({ projects: state.projects }),
    }
  )
);
