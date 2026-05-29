'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, PlayCircle, CheckCircle, Clock, TrendingUp, Award, Target } from 'lucide-react';
import { coursesApi } from '@/lib/api';
import type { Enrollment } from '@/types';
import MyCourseCard from '@/components/academy/MyCourseCard';

type TabType = 'in_progress' | 'completed' | 'wishlist';

const TABS: { id: TabType; label: string; icon: typeof PlayCircle }[] = [
  { id: 'in_progress', label: 'In Progress', icon: PlayCircle },
  { id: 'completed', label: 'Completed', icon: CheckCircle },
  { id: 'wishlist', label: 'Wishlist', icon: BookOpen },
];

export default function MyCoursesPage() {
  const [activeTab, setActiveTab] = useState<TabType>('in_progress');
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyCourses = async () => {
      try {
        setLoading(true);
        const params = activeTab === 'completed'
          ? { status: 'COMPLETED' }
          : activeTab === 'in_progress'
          ? { status: 'IN_PROGRESS' }
          : {};

        const res = await coursesApi.getMyCourses(params);
        setEnrollments(res.data?.data?.content || []);
      } catch (err) {
        console.error('Failed to fetch my courses:', err);
        setEnrollments([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMyCourses();
  }, [activeTab]);

  const inProgress = enrollments.filter(e => e.status === 'IN_PROGRESS');
  const completed = enrollments.filter(e => e.status === 'COMPLETED');

  // Stats
  const stats = {
    total: inProgress.length + completed.length,
    inProgress: inProgress.length,
    completed: completed.length,
    totalHours: Math.round((inProgress.length + completed.length) * 4.5), // estimate 4.5h per course
  };

  return (
    <div className="min-h-screen bg-darkbg pt-20">
      {/* Hero */}
      <section className="relative py-12 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-neon-indigo/20 rounded-full blur-[150px]" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-neon-violet/20 rounded-full blur-[150px]" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-text-primary mb-4">
              My Learning <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-indigo to-neon-violet">Journey</span>
            </h1>
            <p className="text-lg text-text-secondary">Track your progress and continue learning</p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-10"
          >
            {[
              { label: 'Enrolled Courses', value: stats.total, icon: BookOpen, color: 'from-neon-indigo to-neon-violet' },
              { label: 'In Progress', value: stats.inProgress, icon: PlayCircle, color: 'from-yellow-400 to-orange-500' },
              { label: 'Completed', value: stats.completed, icon: CheckCircle, color: 'from-green-400 to-emerald-500' },
              { label: 'Learning Hours', value: `${stats.totalHours}h`, icon: Clock, color: 'from-neon-cyan to-blue-500' },
            ].map((stat, i) => (
              <div key={i} className="bg-darkcard/50 border border-darkborder/50 rounded-2xl p-5 text-center backdrop-blur-sm">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mx-auto mb-3`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-bold text-text-primary">{stat.value}</p>
                <p className="text-xs text-text-muted mt-1">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Tabs */}
      <section className="sticky top-16 z-30 bg-darkbg/90 backdrop-blur-md border-b border-darkborder">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 py-3 overflow-x-auto">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-neon-indigo to-neon-violet text-white'
                    : 'text-text-muted hover:text-text-primary hover:bg-white/5'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                <span className={`px-1.5 py-0.5 rounded text-xs ${
                  activeTab === tab.id ? 'bg-white/20' : 'bg-darkcard'
                }`}>
                  {tab.id === 'in_progress' ? inProgress.length : tab.id === 'completed' ? completed.length : 0}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-darkcard rounded-2xl overflow-hidden border border-darkborder/50">
                    <div className="aspect-video bg-darkbg" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-darkbg rounded w-3/4" />
                      <div className="h-2 bg-darkbg rounded w-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : enrollments.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {enrollments.map((enrollment, i) => (
                <MyCourseCard key={enrollment.id} enrollment={enrollment} index={i} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              {activeTab === 'in_progress' ? (
                <>
                  <Target className="w-16 h-16 text-text-muted/30 mx-auto mb-4" />
                  <h3 className="text-xl font-heading font-bold text-text-primary mb-2">No courses in progress</h3>
                  <p className="text-text-muted mb-6">Start learning something new today</p>
                  <a
                    href="/academy"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-neon-indigo to-neon-violet text-white font-medium rounded-xl hover:opacity-90 transition-opacity"
                  >
                    Browse Courses
                  </a>
                </>
              ) : activeTab === 'completed' ? (
                <>
                  <Award className="w-16 h-16 text-text-muted/30 mx-auto mb-4" />
                  <h3 className="text-xl font-heading font-bold text-text-primary mb-2">No completed courses yet</h3>
                  <p className="text-text-muted mb-6">Keep going, you're doing great!</p>
                </>
              ) : (
                <>
                  <BookOpen className="w-16 h-16 text-text-muted/30 mx-auto mb-4" />
                  <h3 className="text-xl font-heading font-bold text-text-primary mb-2">Wishlist is empty</h3>
                  <p className="text-text-muted mb-6">Save courses you want to take later</p>
                </>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
