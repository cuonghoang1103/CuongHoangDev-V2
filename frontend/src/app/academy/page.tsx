'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Search, SlidersHorizontal, X, ChevronDown, ChevronRight,
  Code2, GraduationCap, Globe, BookOpen, Sparkles,
  Play, Star, Users, Clock, Filter, Zap, ArrowRight,
  TrendingUp, Award, Layers, Cpu, Brain, Terminal,
  Globe2, MessageSquare, CheckCircle2, Lock
} from 'lucide-react';
import { coursesApi, courseCategoryApi } from '@/lib/api';
import type { Course, CourseCategory } from '@/types';
import type { PageResponse } from '@/types';

// ========================================================================
// CONSTANTS & MOCK DATA
// ========================================================================

const LEARNING_MODES = [
  {
    id: 'software-eng',
    icon: Code2,
    title: 'Software Engineering',
    subtitle: 'Full-stack, DevOps, System Design',
    courses: 24,
    color: 'from-neon-indigo to-neon-violet',
    glowColor: 'rgba(99, 102, 241, 0.3)',
    level: 'All Levels',
    gradient: 'from-indigo-500/20 via-violet-500/10 to-transparent',
  },
  {
    id: 'fpt-university',
    icon: GraduationCap,
    title: 'FPT University',
    subtitle: 'Kỳ 0 → Kỳ 9, all subjects',
    courses: 47,
    color: 'from-neon-cyan to-blue-500',
    glowColor: 'rgba(34, 211, 238, 0.3)',
    level: 'Academic',
    gradient: 'from-cyan-500/20 via-blue-500/10 to-transparent',
  },
  {
    id: 'english',
    icon: Globe,
    title: 'English Mastery',
    subtitle: 'IT English, Speaking, TOEIC',
    courses: 12,
    color: 'from-neon-pink to-neon-fuchsia',
    glowColor: 'rgba(236, 72, 153, 0.3)',
    level: 'Beginner → Advanced',
    gradient: 'from-pink-500/20 via-fuchsia-500/10 to-transparent',
  },
  {
    id: 'japanese',
    icon: Globe2,
    title: 'Japanese (JPD)',
    subtitle: 'N5 → N1, JLPT preparation',
    courses: 18,
    color: 'from-neon-red to-orange-500',
    glowColor: 'rgba(244, 63, 94, 0.3)',
    level: 'N5 → N1',
    gradient: 'from-red-500/20 via-orange-500/10 to-transparent',
  },
  {
    id: 'ai-ml',
    icon: Brain,
    title: 'AI & Machine Learning',
    subtitle: 'LLM, RAG, Computer Vision',
    courses: 9,
    color: 'from-neon-violet to-neon-fuchsia',
    glowColor: 'rgba(139, 92, 246, 0.3)',
    level: 'Intermediate → Expert',
    gradient: 'from-violet-500/20 via-fuchsia-500/10 to-transparent',
  },
  {
    id: 'devops',
    icon: Terminal,
    title: 'DevOps & Cloud',
    subtitle: 'Docker, Kubernetes, AWS, CI/CD',
    courses: 15,
    color: 'from-neon-green to-emerald-500',
    glowColor: 'rgba(74, 222, 128, 0.3)',
    level: 'Intermediate → Advanced',
    gradient: 'from-green-500/20 via-emerald-500/10 to-transparent',
  },
];

const FPT_SEMESTERS = [
  { id: 0, label: 'Kỳ 0', subtitle: 'Pre-Foundation', color: 'from-slate-400 to-slate-500', icon: BookOpen },
  { id: 1, label: 'Kỳ 1', subtitle: 'Semester 1', color: 'from-neon-indigo to-blue-500', icon: Layers },
  { id: 2, label: 'Kỳ 2', subtitle: 'Semester 2', color: 'from-neon-violet to-purple-500', icon: Layers },
  { id: 3, label: 'Kỳ 3', subtitle: 'Semester 3', color: 'from-neon-cyan to-blue-500', icon: Cpu },
  { id: 4, label: 'Kỳ 4', subtitle: 'Semester 4', color: 'from-blue-500 to-indigo-500', icon: Cpu },
  { id: 5, label: 'Kỳ 5', subtitle: 'Semester 5', color: 'from-neon-fuchsia to-pink-500', icon: Sparkles },
  { id: 6, label: 'Kỳ 6', subtitle: 'Semester 6', color: 'from-pink-500 to-rose-500', icon: Award },
  { id: 7, label: 'Kỳ 7', subtitle: 'Semester 7', color: 'from-neon-green to-emerald-500', icon: TrendingUp },
  { id: 8, label: 'Kỳ 8', subtitle: 'Semester 8', color: 'from-yellow-500 to-orange-500', icon: GraduationCap },
  { id: 9, label: 'Kỳ 9', subtitle: 'Graduation', color: 'from-gold-400 to-yellow-500', icon: Award },
];

const LEVELS = ['All', 'Beginner', 'Intermediate', 'Advanced'];
const SORT_OPTIONS = [
  { label: 'Newest', value: 'newest' },
  { label: 'Popular', value: 'popular' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
];

const ACADEMY_STATS = [
  { value: '120+', label: 'Courses', icon: BookOpen },
  { value: '15K+', label: 'Students', icon: Users },
  { value: '500h+', label: 'Video Content', icon: Clock },
  { value: '4.8', label: 'Avg. Rating', icon: Star },
];

// ========================================================================
// UTILITY FUNCTIONS
// ========================================================================

function formatDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function formatPrice(price: number, isFree: boolean) {
  if (isFree || price === 0) return { label: 'Free', className: 'bg-neon-green/20 text-neon-green border-neon-green/30' };
  return { label: `${price.toLocaleString('vi-VN')} VND`, className: 'bg-neon-indigo/20 text-neon-indigo border-neon-indigo/30' };
}

// ========================================================================
// SKELETON COMPONENTS
// ========================================================================

function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-darkcard border border-darkborder rounded-2xl overflow-hidden animate-pulse ${className}`}>
      <div className="aspect-video bg-darksurface" />
      <div className="p-5 space-y-3">
        <div className="h-3 w-16 bg-darksurface rounded" />
        <div className="h-5 w-full bg-darksurface rounded" />
        <div className="h-3 w-3/4 bg-darksurface rounded" />
        <div className="flex gap-4 mt-2">
          <div className="h-3 w-12 bg-darksurface rounded" />
          <div className="h-3 w-12 bg-darksurface rounded" />
        </div>
      </div>
    </div>
  );
}

// ========================================================================
// SECTION 1: HERO SECTION
// ========================================================================

function HeroSection() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section ref={ref} className="relative min-h-[92vh] flex items-center justify-center overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-neon-indigo/10 blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-neon-fuchsia/10 blur-3xl animate-float" style={{ animationDelay: '-1.5s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-neon-violet/5 blur-3xl" />
        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      {/* Noise overlay */}
      <div className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"
        }}
      />

      <motion.div style={{ y, opacity }} className="relative z-10 text-center max-w-5xl mx-auto px-6 pt-20">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-neon-violet/30 bg-neon-violet/5 backdrop-blur-sm mb-8"
        >
          <Sparkles className="w-4 h-4 text-neon-fuchsia" />
          <span className="text-sm text-text-secondary">Vietnam&apos;s Premier Coding Academy</span>
          <Sparkles className="w-4 h-4 text-neon-fuchsia" />
        </motion.div>

        {/* Main title */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-6xl md:text-7xl lg:text-8xl font-heading font-bold mb-6 leading-[1.1]"
        >
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-neon-violet to-neon-fuchsia">
            CuongHoangDev
          </span>
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-indigo via-neon-violet to-neon-fuchsia">
            Academy
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="text-xl md:text-2xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Transform Your Future Through Code. Learn software engineering, ace university exams,
          and master new skills with our premium curriculum.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link href="#all-courses" className="group relative px-8 py-4 rounded-2xl font-heading font-semibold text-white overflow-hidden transition-all duration-300 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-r from-neon-indigo via-neon-violet to-neon-fuchsia" />
            <div className="absolute inset-0 bg-gradient-to-r from-neon-indigo via-neon-violet to-neon-fuchsia opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Browse All Courses
            </div>
          </Link>

          <Link href="#fpt-university" className="group px-8 py-4 rounded-2xl font-heading font-semibold border border-darkborder hover:border-neon-violet/50 bg-darkcard/50 backdrop-blur-sm transition-all duration-300 hover:scale-105 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-neon-cyan" />
            <span className="bg-gradient-to-r from-neon-cyan to-blue-400 bg-clip-text text-transparent">
              Start Learning Free
            </span>
            <ArrowRight className="w-4 h-4 text-neon-cyan group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="mt-16 flex flex-col items-center gap-2"
        >
          <span className="text-xs text-text-muted uppercase tracking-widest">Scroll to explore</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-6 h-10 rounded-full border-2 border-darkborder flex items-start justify-center p-1.5"
          >
            <div className="w-1.5 h-3 rounded-full bg-neon-violet/60" />
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}

// ========================================================================
// SECTION 2: LEARNING MODES
// ========================================================================

function LearningModesSection() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <section className="py-24 px-6 max-w-7xl mx-auto">
      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <span className="text-neon-fuchsia text-sm font-mono uppercase tracking-widest">Explore Paths</span>
        <h2 className="text-4xl md:text-5xl font-heading font-bold mt-3 mb-4">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-text-secondary">Choose Your</span>{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-indigo to-neon-fuchsia">Learning Mode</span>
        </h2>
        <p className="text-text-secondary max-w-xl mx-auto">
          From university curriculum to industry skills — find the perfect learning path for your goals.
        </p>
      </motion.div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {LEARNING_MODES.map((mode, i) => {
          const Icon = mode.icon;
          const isHovered = hoveredId === mode.id;

          return (
            <motion.div
              key={mode.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              onMouseEnter={() => setHoveredId(mode.id)}
              onMouseLeave={() => setHoveredId(null)}
              className="group relative cursor-pointer"
            >
              {/* Glow effect on hover */}
              <div
                className="absolute -inset-0.5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm"
                style={{ background: `linear-gradient(135deg, ${mode.glowColor}, transparent)` }}
              />

              <div className={`
                relative rounded-2xl p-7 border border-darkborder bg-darkcard overflow-hidden
                transition-all duration-500 group-hover:border-transparent
                ${isHovered ? 'scale-[1.02]' : 'scale-100'}
              `}>
                {/* Background gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${mode.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                {/* Top accent line */}
                <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${mode.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                <div className="relative z-10">
                  {/* Icon */}
                  <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5 bg-gradient-to-br ${mode.color} shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-heading font-bold text-text-primary mb-1 group-hover:text-white transition-colors">
                    {mode.title}
                  </h3>
                  <p className="text-sm text-text-muted mb-4">{mode.subtitle}</p>

                  {/* Stats row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-text-secondary">
                        {mode.courses}
                      </span>
                      <span className="text-xs text-text-muted">courses</span>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-lg bg-gradient-to-r ${mode.color} text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300`}>
                      {mode.level}
                    </span>
                  </div>

                  {/* Explore arrow */}
                  <div className={`flex items-center gap-1 mt-4 text-sm font-medium text-transparent bg-clip-text bg-gradient-to-r ${mode.color} opacity-0 group-hover:opacity-100 transition-all duration-300 ${isHovered ? 'translate-x-1' : ''}`}>
                    Explore <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

// ========================================================================
// SECTION 3: FPT UNIVERSITY TIMELINE
// ========================================================================

function FptUniversitySection() {
  const [openSemester, setOpenSemester] = useState<number | null>(0);

  // FPT subjects per semester (realistic mapping)
  const semesterSubjects: Record<number, Array<{ code: string; name: string; credits: number; tags: string[]; progress?: number }>> = {
    0: [
      { code: 'PRE001', name: 'Introduction to Programming', credits: 3, tags: ['Video', 'Lab', 'Assignment'] },
      { code: 'PRE002', name: 'Computer Fundamentals', credits: 2, tags: ['Video', 'Quiz'] },
      { code: 'PRE003', name: 'Mathematics for IT', credits: 3, tags: ['Video', 'Problem Set'] },
    ],
    1: [
      { code: 'PRF192', name: 'C Programming', credits: 3, tags: ['Video', 'Lab', 'Assignment', 'Exam'] },
      { code: 'SSA104', name: 'Networking Essentials', credits: 3, tags: ['Video', 'Lab', 'Quiz'] },
      { code: 'MGM101', name: 'Business & IT', credits: 3, tags: ['Video', 'Essay'] },
    ],
    2: [
      { code: 'PRO192', name: 'Object-Oriented Programming (Java)', credits: 4, tags: ['Video', 'Lab', 'Project', 'Assignment'] },
      { code: 'DBI202', name: 'Database Management', credits: 3, tags: ['Video', 'Lab', 'SQL Quiz'] },
      { code: 'MAD101', name: 'Discrete Mathematics', credits: 3, tags: ['Video', 'Problem Set'] },
    ],
    3: [
      { code: 'JPD113', name: 'Japanese N5', credits: 3, tags: ['Video', 'Kanji', 'Dialogue'] },
      { code: 'WPD', name: 'Web Programming', credits: 4, tags: ['Video', 'Lab', 'Project'] },
      { code: 'HCI', name: 'Human-Computer Interaction', credits: 3, tags: ['Video', 'Case Study'] },
    ],
    4: [
      { code: 'SEP206', name: 'Software Engineering Principles', credits: 3, tags: ['Video', 'UML', 'Project'] },
      { code: 'OSG', name: 'Operating Systems', credits: 3, tags: ['Video', 'Lab', 'Assignment'] },
      { code: 'JSB', name: 'JavaScript Basics', credits: 3, tags: ['Video', 'Lab', 'Mini Project'] },
    ],
    5: [
      { code: 'JPD123', name: 'Japanese N4', credits: 3, tags: ['Video', 'Kanji', 'Grammar'] },
      { code: 'AJS101', name: 'Advanced JavaScript & Frameworks', credits: 4, tags: ['Video', 'React', 'Project'] },
      { code: 'AI1', name: 'Introduction to AI', credits: 3, tags: ['Video', 'Notebook'] },
    ],
    6: [
      { code: 'JPD133', name: 'Japanese N3', credits: 3, tags: ['Video', 'Kanji', 'JLPT Prep'] },
      { code: 'PRM', name: 'Mobile App Development', credits: 4, tags: ['Video', 'React Native', 'Project'] },
      { code: 'SRE', name: 'Site Reliability Engineering', credits: 3, tags: ['Video', 'Lab', 'Docker'] },
    ],
    7: [
      { code: 'JPD143', name: 'Japanese N2', credits: 3, tags: ['Video', 'Kanji', 'JLPT N2'] },
      { code: 'CLD', name: 'Cloud Computing (AWS/Azure)', credits: 4, tags: ['Video', 'Lab', 'Certification'] },
      { code: 'CAP', name: 'Capstone Project', credits: 6, tags: ['Project', 'Thesis'] },
    ],
    8: [
      { code: 'JPD153', name: 'Japanese N1', credits: 3, tags: ['Video', 'JLPT N1 Prep'] },
      { code: 'DSB', name: 'Data Science & Big Data', credits: 4, tags: ['Video', 'Python', 'Project'] },
      { code: 'CSI', name: 'Cybersecurity', credits: 3, tags: ['Video', 'Lab', 'CTF'] },
    ],
    9: [
      { code: 'INT3120', name: 'Internship / Graduation Thesis', credits: 10, tags: ['Internship', 'Thesis'] },
    ],
  };

  const totalSubjects = Object.values(semesterSubjects).reduce((acc, subs) => acc + subs.length, 0);

  return (
    <section id="fpt-university" className="py-24 px-6 relative">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 right-0 w-96 h-96 rounded-full bg-neon-cyan/5 blur-3xl" />
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-neon-indigo/5 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-neon-cyan text-sm font-mono uppercase tracking-widest">University Prep</span>
          <h2 className="text-4xl md:text-5xl font-heading font-bold mt-3 mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-text-secondary">FPT University</span>{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan to-blue-400">Curriculum</span>
          </h2>
          <p className="text-text-secondary max-w-xl mx-auto">
            Complete study path from Kỳ 0 to graduation — all subjects, all semesters, all covered.
          </p>
          <div className="inline-flex items-center gap-3 mt-5 px-4 py-2 rounded-full bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan text-sm font-medium">
            <GraduationCap className="w-4 h-4" />
            {totalSubjects} subjects across 10 semesters
          </div>
        </motion.div>

        {/* Semester timeline */}
        <div className="space-y-3">
          {FPT_SEMESTERS.map((sem, i) => {
            const Icon = sem.icon;
            const isOpen = openSemester === sem.id;
            const subjects = semesterSubjects[sem.id] || [];
            const isGraduation = sem.id === 9;

            return (
              <motion.div
                key={sem.id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.04 }}
                className="rounded-2xl border border-darkborder bg-darkcard/50 overflow-hidden backdrop-blur-sm"
              >
                {/* Semester header */}
                <button
                  onClick={() => setOpenSemester(isOpen ? null : sem.id)}
                  className="w-full px-6 py-5 flex items-center gap-4 hover:bg-darksurface/50 transition-colors"
                >
                  {/* Semester number */}
                  <div className={`flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br ${sem.color} flex items-center justify-center shadow-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>

                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-3">
                      <span className={`text-xl font-heading font-bold bg-gradient-to-r ${sem.color} bg-clip-text text-transparent`}>
                        {sem.label}
                      </span>
                      <span className="text-sm text-text-muted">{sem.subtitle}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-text-muted">{subjects.length} subjects</span>
                      <span className="text-xs text-text-muted">·</span>
                      <span className="text-xs text-text-muted">{subjects.reduce((s, sub) => s + sub.credits, 0)} credits</span>
                      {isGraduation && (
                        <>
                          <span className="text-xs text-text-muted">·</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gold-500/20 text-gold-400 border border-gold-500/30">
                            Final Year
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-8 h-8 rounded-full bg-darksurface flex items-center justify-center"
                  >
                    <ChevronDown className="w-4 h-4 text-text-muted" />
                  </motion.div>
                </button>

                {/* Subject grid */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {subjects.map((sub, j) => (
                          <motion.div
                            key={sub.code}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: j * 0.05 }}
                            className="group flex items-start gap-3 p-4 rounded-xl bg-darksurface/50 border border-darkborder/50 hover:border-neon-violet/30 hover:bg-darksurface transition-all duration-200 cursor-pointer"
                          >
                            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-neon-indigo/30 to-neon-violet/20 flex items-center justify-center">
                              <BookOpen className="w-4 h-4 text-neon-violet" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="text-xs font-mono text-neon-violet/70">{sub.code}</p>
                                  <p className="text-sm font-medium text-text-primary group-hover:text-white transition-colors line-clamp-1">
                                    {sub.name}
                                  </p>
                                </div>
                                <span className="flex-shrink-0 text-xs px-2 py-0.5 rounded-md bg-neon-indigo/10 text-neon-indigo border border-neon-indigo/20">
                                  {sub.credits}cr
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                {sub.tags.map(tag => (
                                  <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-darkbg/80 text-text-muted border border-darkborder/50">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ========================================================================
// SECTION 4: FEATURED COURSES CAROUSEL
// ========================================================================

function FeaturedCoursesSection({ featuredCourses }: { featuredCourses: Course[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const canScrollLeft = false; // controlled by scroll position
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const amount = 380;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -amount : amount,
        behavior: 'smooth',
      });
    }
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setAtStart(scrollLeft === 0);
      setAtEnd(scrollLeft + clientWidth >= scrollWidth - 5);
    }
  };

  return (
    <section className="py-24 px-6 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="flex items-end justify-between mb-12"
      >
        <div>
          <span className="text-neon-fuchsia text-sm font-mono uppercase tracking-widest">Trending Now</span>
          <h2 className="text-4xl md:text-5xl font-heading font-bold mt-3">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-text-secondary">Featured &</span>{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-fuchsia to-neon-pink">Trending</span>
          </h2>
        </div>

        {/* Carousel controls */}
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={() => scroll('left')}
            className="w-10 h-10 rounded-full border border-darkborder bg-darkcard hover:border-neon-violet/50 hover:bg-darksurface transition-all flex items-center justify-center"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="w-10 h-10 rounded-full border border-darkborder bg-darkcard hover:border-neon-violet/50 hover:bg-darksurface transition-all flex items-center justify-center"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      {/* Scrollable track */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-5 overflow-x-auto pb-4 scroll-smooth scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {featuredCourses.length === 0 ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-80">
              <CardSkeleton />
            </div>
          ))
        ) : (
          featuredCourses.map((course, i) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="flex-shrink-0 w-80"
            >
              <FeaturedCourseCard course={course} />
            </motion.div>
          ))
        )}
      </div>
    </section>
  );
}

function FeaturedCourseCard({ course }: { course: Course }) {
  const [isHovered, setIsHovered] = useState(false);
  const priceInfo = formatPrice(course.price, course.isFree);
  const duration = formatDuration(course.totalDurationSeconds || 0);

  return (
    <motion.div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative bg-darkcard border border-darkborder rounded-2xl overflow-hidden h-full flex flex-col"
    >
      {/* Thumbnail */}
      <Link href={`/academy/courses/${course.slug}`} className="block relative aspect-[4/3] overflow-hidden">
        {course.thumbnailUrl ? (
          <img
            src={course.thumbnailUrl}
            alt={course.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-neon-indigo/30 to-neon-violet/30 flex items-center justify-center">
            <BookOpen className="w-12 h-12 text-neon-violet/40" />
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-darkcard via-transparent to-transparent" />

        {/* Play button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: isHovered ? 1 : 0, scale: isHovered ? 1 : 0.8 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
            <Play className="w-7 h-7 text-white fill-white ml-1" />
          </div>
        </motion.div>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${priceInfo.className}`}>
            {priceInfo.label}
          </span>
          {course.isFeatured && (
            <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-neon-fuchsia/20 text-neon-fuchsia border border-neon-fuchsia/30">
              Featured
            </span>
          )}
        </div>

        {/* Rating */}
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-lg bg-black/50 backdrop-blur-sm">
          <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
          <span className="text-xs font-medium text-white">{course.avgRating?.toFixed(1) || '0.0'}</span>
        </div>
      </Link>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        {course.categoryName && (
          <span className="text-xs text-neon-violet font-medium mb-2">{course.categoryName}</span>
        )}
        <Link href={`/academy/courses/${course.slug}`}>
          <h3 className="text-base font-heading font-bold text-text-primary group-hover:text-neon-violet transition-colors line-clamp-2 mb-2">
            {course.title}
          </h3>
        </Link>

        <p className="text-xs text-text-muted line-clamp-2 mb-4 flex-1">{course.shortDescription}</p>

        {/* Meta */}
        <div className="flex items-center gap-3 text-xs text-text-muted mb-4">
          <div className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /><span>{duration}</span></div>
          <div className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /><span>{course.totalLessons || 0} lessons</span></div>
          <div className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /><span>{(course.totalStudents || 0).toLocaleString()}</span></div>
        </div>

        {/* CTA */}
        <Link
          href={`/academy/courses/${course.slug}`}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-neon-indigo/20 to-neon-violet/20 hover:from-neon-indigo/30 hover:to-neon-violet/30 border border-neon-indigo/20 hover:border-neon-violet/40 text-neon-violet text-sm font-medium transition-all duration-200"
        >
          View Course <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </motion.div>
  );
}

// ========================================================================
// SECTION 5: ALL COURSES WITH SEARCH & FILTER
// ========================================================================

function AllCoursesSection({
  courses, loading, total, page, hasMore,
  onLoadMore, onFilterChange, search, onSearchChange,
  level, onLevelChange, sortBy, onSortByChange,
}: {
  courses: Course[];
  loading: boolean;
  total: number;
  page: number;
  hasMore: boolean;
  onLoadMore: () => void;
  onFilterChange: () => void;
  search: string;
  onSearchChange: (v: string) => void;
  level: string;
  onLevelChange: (v: string) => void;
  sortBy: string;
  onSortByChange: (v: string) => void;
}) {
  const [showFilters, setShowFilters] = useState(false);
  const [searchInput, setSearchInput] = useState(search);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== search) onSearchChange(searchInput);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  return (
    <section id="all-courses" className="py-24 px-6 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-12"
      >
        <span className="text-neon-indigo text-sm font-mono uppercase tracking-widest">Course Library</span>
        <div className="flex items-end justify-between mt-3">
          <h2 className="text-4xl md:text-5xl font-heading font-bold">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-text-secondary">All</span>{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-indigo to-neon-violet">Courses</span>
          </h2>
          <span className="text-text-muted text-sm hidden md:block">{total} courses found</span>
        </div>
      </motion.div>

      {/* Search + Filter bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="flex flex-col sm:flex-row gap-3 mb-8"
      >
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted pointer-events-none" />
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search courses, topics, skills..."
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-darkcard border border-darkborder text-text-primary placeholder:text-text-muted focus:outline-none focus:border-neon-violet/50 transition-all duration-200"
          />
          {searchInput && (
            <button
              onClick={() => { setSearchInput(''); onSearchChange(''); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-5 py-3.5 rounded-2xl border transition-all duration-200 ${showFilters ? 'border-neon-violet/50 bg-neon-violet/10 text-neon-violet' : 'border-darkborder bg-darkcard text-text-secondary hover:border-darkborder/80'}`}
        >
          <Filter className="w-5 h-5" />
          <span className="font-medium">Filters</span>
        </button>

        {/* Sort dropdown */}
        <div className="relative">
          <select
            value={sortBy}
            onChange={e => { onSortByChange(e.target.value); onFilterChange(); }}
            className="appearance-none pl-4 pr-10 py-3.5 rounded-2xl bg-darkcard border border-darkborder text-text-secondary hover:border-darkborder/80 focus:outline-none focus:border-neon-violet/50 transition-all duration-200 cursor-pointer"
          >
            {SORT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value} className="bg-darkcard">{opt.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
        </div>
      </motion.div>

      {/* Filter panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden mb-8"
          >
            <div className="p-6 bg-darkcard/80 backdrop-blur-xl border border-darkborder rounded-2xl">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm text-text-muted font-medium mr-2">Level:</span>
                {LEVELS.map(lv => (
                  <button
                    key={lv}
                    onClick={() => { onLevelChange(lv); setTimeout(onFilterChange, 0); }}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      level === lv
                        ? 'bg-gradient-to-r from-neon-indigo to-neon-violet text-white shadow-neon'
                        : 'bg-darksurface text-text-secondary hover:text-text-primary border border-darkborder'
                    }`}
                  >
                    {lv}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Course grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {loading && courses.length === 0 ? (
          Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} className="w-full" />)
        ) : courses.length === 0 ? (
          <div className="col-span-full text-center py-20">
            <BookOpen className="w-16 h-16 text-text-muted mx-auto mb-4 opacity-50" />
            <p className="text-text-muted text-lg">No courses found</p>
            <button
              onClick={() => { onSearchChange(''); onLevelChange('All'); }}
              className="mt-3 text-neon-violet hover:text-neon-indigo transition-colors text-sm"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          courses.map((course, i) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (i % 12) * 0.05 }}
            >
              <CourseCardItem course={course} />
            </motion.div>
          ))
        )}
      </div>

      {/* Load more */}
      {hasMore && (
        <div className="flex justify-center mt-12">
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="px-8 py-3.5 rounded-2xl border border-darkborder hover:border-neon-violet/50 bg-darkcard text-text-secondary hover:text-text-primary transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Loading...
              </>
            ) : (
              <>
                Load More Courses
                <ChevronDown className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      )}
    </section>
  );
}

function CourseCardItem({ course }: { course: Course }) {
  const priceInfo = formatPrice(course.price, course.isFree);
  const duration = formatDuration(course.totalDurationSeconds || 0);
  const levelColor = course.level === 'BEGINNER' ? 'text-neon-green' : course.level === 'INTERMEDIATE' ? 'text-yellow-400' : 'text-neon-red';

  return (
    <div className="group bg-darkcard border border-darkborder rounded-2xl overflow-hidden hover:border-neon-violet/30 hover:shadow-neon transition-all duration-300 flex flex-col h-full">
      {/* Thumbnail */}
      <Link href={`/academy/courses/${course.slug}`} className="block relative aspect-video overflow-hidden">
        {course.thumbnailUrl ? (
          <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-neon-indigo/30 to-neon-violet/30 flex items-center justify-center">
            <BookOpen className="w-10 h-10 text-neon-violet/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center">
            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
          </div>
        </div>
        <div className="absolute top-2 left-2 flex gap-1.5">
          <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${priceInfo.className}`}>
            {priceInfo.label}
          </span>
        </div>
        <div className="absolute top-2 right-2">
          <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium bg-black/50 backdrop-blur-sm ${levelColor}`}>
            {course.level?.toLowerCase()}
          </span>
        </div>
      </Link>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        {course.categoryName && (
          <span className="text-[11px] text-neon-violet font-medium mb-1.5">{course.categoryName}</span>
        )}
        <Link href={`/academy/courses/${course.slug}`}>
          <h3 className="text-sm font-heading font-bold text-text-primary group-hover:text-neon-violet transition-colors line-clamp-2 mb-2">
            {course.title}
          </h3>
        </Link>
        <p className="text-xs text-text-muted line-clamp-2 mb-3 flex-1">{course.shortDescription}</p>

        <div className="flex items-center gap-2.5 text-[11px] text-text-muted mb-3">
          <div className="flex items-center gap-1"><Clock className="w-3 h-3" /><span>{duration}</span></div>
          <div className="flex items-center gap-1"><BookOpen className="w-3 h-3" /><span>{course.totalLessons || 0}</span></div>
          <div className="flex items-center gap-1"><Users className="w-3 h-3" /><span>{(course.totalStudents || 0).toLocaleString()}</span></div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-darkborder/50">
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
            <span className="text-xs font-semibold text-text-primary">{course.avgRating?.toFixed(1) || '0.0'}</span>
            <span className="text-xs text-text-muted">({course.totalReviews || 0})</span>
          </div>
          <Link href={`/academy/courses/${course.slug}`} className="text-xs font-medium text-neon-violet hover:text-neon-indigo transition-colors">
            View →
          </Link>
        </div>
      </div>
    </div>
  );
}

// ========================================================================
// SECTION 6: ACADEMY STATS
// ========================================================================

function AcademyStatsSection() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto relative">
        {/* Background */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-neon-indigo/10 via-neon-violet/5 to-neon-fuchsia/10 border border-darkborder backdrop-blur-sm" />

        <div className="relative z-10 px-8 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-text-primary">
              Trusted by <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-indigo to-neon-fuchsia">Thousands</span> of Learners
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {ACADEMY_STATS.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="text-center"
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-neon-indigo/20 to-neon-violet/10 mb-3">
                    <Icon className="w-6 h-6 text-neon-violet" />
                  </div>
                  <div className="text-3xl md:text-4xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-text-secondary mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-text-muted">{stat.label}</div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

// ========================================================================
// MAIN PAGE COMPONENT
// ========================================================================

export default function AcademyPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [featuredCourses, setFeaturedCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState('All');
  const [sortBy, setSortBy] = useState('newest');

  const fetchCourses = useCallback(async (targetPage: number) => {
    if (targetPage === 0) setLoading(true);
    try {
      const params: Record<string, string | number> = {
        page: targetPage,
        size: 12,
      };
      if (search) params.keyword = search;
      if (level !== 'All') params.level = level.toUpperCase();
      if (sortBy === 'popular') params.sortBy = 'popular';
      if (sortBy === 'newest') params.sortBy = 'newest';

      const res = await coursesApi.getAll(params);
      const data: PageResponse<Course> = res.data?.data;
      const newCourses = data?.content || [];

      if (targetPage === 0) {
        setCourses(newCourses);
      } else {
        setCourses(prev => [...prev, ...newCourses]);
      }
      setTotal(data?.totalElements || 0);
      setHasMore(!data?.last);
    } catch {
      if (targetPage === 0) setCourses([]);
    } finally {
      if (targetPage === 0) setLoading(false);
    }
  }, [search, level, sortBy]);

  const fetchFeatured = useCallback(async () => {
    try {
      const res = await coursesApi.getFeatured(8);
      const data = res.data?.data || [];
      setFeaturedCourses(data);
    } catch {
      setFeaturedCourses([]);
    }
  }, []);

  useEffect(() => {
    fetchCourses(0);
    fetchFeatured();
  }, []);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchCourses(nextPage);
  };

  const handleFilterChange = () => {
    setPage(0);
    fetchCourses(0);
  };

  return (
    <div className="min-h-screen bg-darkbg">
      <HeroSection />
      <LearningModesSection />
      <FptUniversitySection />
      <FeaturedCoursesSection featuredCourses={featuredCourses} />
      <AllCoursesSection
        courses={courses}
        loading={loading}
        total={total}
        page={page}
        hasMore={hasMore}
        onLoadMore={handleLoadMore}
        onFilterChange={handleFilterChange}
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(0); }}
        level={level}
        onLevelChange={setLevel}
        sortBy={sortBy}
        onSortByChange={setSortBy}
      />
      <AcademyStatsSection />
    </div>
  );
}
