'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpen, Clock, TrendingUp, Loader2, Play, X } from 'lucide-react';
import { coursesApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import type { Enrollment } from '@/types';

function formatDuration(seconds: number): string {
  if (!seconds) return '0 min';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
}

export default function MyCoursesPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    loadEnrollments();
  }, [isAuthenticated]);

  const loadEnrollments = async () => {
    setLoading(true);
    try {
      const res = await coursesApi.getMyCourses({ status: 'ACTIVE' });
      setEnrollments(res.data.data?.content || []);
    } catch {
      setEnrollments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (courseId: number) => {
    if (!confirm('Are you sure you want to unenroll from this course?')) return;
    setCancelling(courseId);
    try {
      await coursesApi.cancelEnrollment(courseId);
      setEnrollments(prev => prev.filter(e => e.courseId !== courseId));
      toast.success('Unenrolled successfully');
    } catch {
      toast.error('Unenrollment failed');
    } finally {
      setCancelling(null);
    }
  };

  return (
    <div className="min-h-screen bg-darkbg">
      {/* Hero */}
      <section className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-neon-indigo/10 rounded-full blur-[150px]" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-neon-violet/10 rounded-full blur-[150px]" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-heading font-bold text-text-primary mb-4">
            My <span className="bg-gradient-to-r from-neon-indigo to-neon-violet bg-clip-text text-transparent">Courses</span>
          </h1>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto">
            Track your learning progress and continue with enrolled courses.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 pb-20">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-neon-violet" />
          </div>
        ) : enrollments.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-2xl font-semibold text-text-primary mb-2">No courses yet</h3>
            <p className="text-text-muted mb-6">Enroll in a course to start learning.</p>
            <Link
              href="/courses"
              className="inline-block px-6 py-3 bg-gradient-to-r from-neon-indigo to-neon-violet text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
            >
              Explore Courses
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {enrollments.map(enrollment => (
              <div
                key={enrollment.id}
                className="bg-darkcard border border-darkborder/50 rounded-2xl overflow-hidden hover:border-neon-violet/20 transition-all"
              >
                <div className="flex flex-col md:flex-row">
                  {/* Thumbnail */}
                  <div className="md:w-64 shrink-0">
                    <img
                      src={enrollment.courseThumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400'}
                      alt={enrollment.courseTitle}
                      className="w-full h-36 md:h-full object-cover"
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-5">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-text-primary mb-1">
                          {enrollment.courseTitle}
                        </h3>
                        <div className="flex items-center gap-4 text-text-muted text-xs">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            Enrolled {new Date(enrollment.enrolledAt).toLocaleDateString('vi-VN')}
                          </span>
                          {enrollment.lastLessonTitle && (
                            <span className="text-text-muted">
                              Last: {enrollment.lastLessonTitle}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleCancel(enrollment.courseId)}
                        disabled={cancelling === enrollment.courseId}
                        className="p-2 text-text-muted hover:text-red-400 transition-colors shrink-0"
                        title="Unenroll"
                      >
                        {cancelling === enrollment.courseId
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <X className="w-4 h-4" />
                        }
                      </button>
                    </div>

                    {/* Progress bar */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-xs text-text-muted mb-1.5">
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-3.5 h-3.5" />
                            Learning Progress
                          </span>
                        <span className="text-neon-violet font-medium">
                          {Number(enrollment.progressPercent || 0).toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-darkbg rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-neon-indigo to-neon-violet rounded-full transition-all"
                          style={{ width: `${enrollment.progressPercent || 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/courses/${enrollment.courseSlug}/learn`}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-neon-indigo to-neon-violet text-white font-medium rounded-xl hover:opacity-90 transition-opacity text-sm"
                      >
                        {enrollment.progressPercent && Number(enrollment.progressPercent) > 0 ? 'Continue Learning' : 'Start Learning'}
                        <Play className="w-4 h-4" />
                      </Link>
                      <Link
                        href={`/courses/${enrollment.courseSlug}`}
                        className="flex items-center gap-2 px-4 py-2 bg-darkbg border border-darkborder rounded-xl text-text-primary hover:border-neon-violet/30 transition-colors text-sm"
                      >
                        <BookOpen className="w-4 h-4" />
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
