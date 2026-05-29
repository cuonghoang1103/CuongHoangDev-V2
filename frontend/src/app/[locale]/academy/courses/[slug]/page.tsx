'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Clock, Users, BookOpen, Star, Play, Shield, Award,
  ArrowLeft, CheckCircle, ShoppingCart, PlayCircle, Lock
} from 'lucide-react';
import { coursesApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { Course, CourseReview, CourseSection, LessonDto } from '@/types';
import toast from 'react-hot-toast';
import Link from 'next/link';
import Curriculum from '@/components/academy/Curriculum';
import Reviews from '@/components/academy/Reviews';
import CourseCard from '@/components/academy/CourseCard';

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function CourseDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { isAuthenticated } = useAuthStore();

  const [course, setCourse] = useState<Course | null>(null);
  const [reviews, setReviews] = useState<CourseReview[]>([]);
  const [relatedCourses, setRelatedCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'curriculum' | 'reviews'>('overview');

  useEffect(() => {
    if (!slug) return;
    const fetchCourse = async () => {
      try {
        setLoading(true);
        const [courseRes, reviewsRes, allRes] = await Promise.all([
          coursesApi.getBySlug(slug),
          coursesApi.getAll({ size: 100 }),
          coursesApi.getAll({ size: 20 }),
        ]);
        setCourse(courseRes.data?.data);
        const allCourses: any[] = allRes.data?.data?.content || [];
        setRelatedCourses(allCourses.filter((c: Course) => c.slug !== slug && c.categoryId === courseRes.data?.data?.categoryId).slice(0, 4));
        try {
          const revRes = await coursesApi.getReviews(courseRes.data?.data?.id);
          setReviews(revRes.data?.data || []);
        } catch {}
      } catch (err) {
        console.error('Failed to fetch course:', err);
        toast.error('Course not found');
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [slug]);

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to enroll');
      return;
    }
    if (!course) return;
    setEnrolling(true);
    try {
      await coursesApi.enroll(course.id);
      toast.success('Enrolled successfully!');
      setCourse(prev => prev ? { ...prev, isEnrolled: true } : prev);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to enroll');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-darkbg pt-20 flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-neon-violet border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-darkbg pt-20 flex flex-col items-center justify-center">
        <p className="text-text-muted mb-4">Course not found</p>
        <Link href="/academy" className="text-neon-violet hover:text-neon-indigo transition-colors">Back to Academy</Link>
      </div>
    );
  }

  const priceInfo = course.isFree || course.price === 0
    ? { label: 'Free', display: 'Free', original: null }
    : course.discountPrice && course.discountPrice < course.price
    ? { label: `${course.discountPrice.toLocaleString('vi-VN')} VND`, display: `${course.discountPrice.toLocaleString('vi-VN')} VND`, original: `${course.price.toLocaleString('vi-VN')} VND` }
    : { label: `${course.price.toLocaleString('vi-VN')} VND`, display: `${course.price.toLocaleString('vi-VN')} VND`, original: null };

  const levelColor = course.level === 'Beginner' ? 'text-green-400 bg-green-500/20' : course.level === 'Intermediate' ? 'text-yellow-400 bg-yellow-500/20' : 'text-red-400 bg-red-500/20';

  return (
    <div className="min-h-screen bg-darkbg pt-20">
      {/* Top bar */}
      <div className="bg-darkcard border-b border-darkborder">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <Link href="/academy" className="p-2 rounded-xl bg-darkbg hover:bg-white/5 transition-colors">
              <ArrowLeft className="w-5 h-5 text-text-secondary" />
            </Link>
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <Link href="/academy" className="hover:text-neon-violet transition-colors">Academy</Link>
              <span>/</span>
              <span className="text-text-primary">{course.title}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className={`px-3 py-1 rounded-lg text-xs font-medium ${levelColor}`}>{course.level}</span>
                {course.isFree && <span className="px-3 py-1 rounded-lg text-xs font-medium bg-green-500/20 text-green-400">Free</span>}
                {course.categoryName && <span className="px-3 py-1 rounded-lg text-xs font-medium bg-neon-indigo/20 text-neon-indigo">{course.categoryName}</span>}
              </div>
              <h1 className="text-3xl md:text-4xl font-heading font-bold text-text-primary mb-4">{course.title}</h1>
              {course.shortDescription && (
                <p className="text-lg text-text-secondary leading-relaxed">{course.shortDescription}</p>
              )}

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-text-muted">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-text-primary font-medium">{course.avgRating?.toFixed(1) || '0.0'}</span>
                  <span>({course.totalReviews || 0} reviews)</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{(course.totalStudents || 0).toLocaleString()} students</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{formatDuration(course.totalDurationSeconds || 0)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  <span>{course.totalLessons || 0} lessons</span>
                </div>
              </div>

              {/* Instructor */}
              <div className="flex items-center gap-3 mt-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-indigo to-neon-violet flex items-center justify-center text-white font-bold">
                  {course.instructorAvatar ? (
                    <img src={course.instructorAvatar} alt={course.instructorName || 'Instructor'} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    (course.instructorName || 'I').charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">{course.instructorName || 'CuongHoang'}</p>
                  <p className="text-xs text-text-muted">Instructor</p>
                </div>
              </div>
            </motion.div>

            {/* Tabs */}
            <div className="flex gap-1 bg-darkcard border border-darkborder rounded-2xl p-1.5">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'curriculum', label: 'Curriculum' },
                { id: 'reviews', label: 'Reviews' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-neon-indigo to-neon-violet text-white'
                      : 'text-text-muted hover:text-text-primary hover:bg-white/5'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {activeTab === 'overview' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                {/* Thumbnail / Video */}
                <div className="aspect-video rounded-2xl overflow-hidden bg-darkcard border border-darkborder relative group cursor-pointer">
                  {course.previewVideoUrl ? (
                    <>
                      <video src={course.previewVideoUrl} className="w-full h-full object-cover" poster={course.thumbnailUrl} />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                          <Play className="w-8 h-8 text-white fill-white" />
                        </div>
                      </div>
                    </>
                  ) : course.thumbnailUrl ? (
                    <>
                      <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                          <Play className="w-8 h-8 text-white fill-white" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <PlayCircle className="w-16 h-16 text-text-muted/30" />
                    </div>
                  )}
                </div>

                {/* Description */}
                {course.description && (
                  <div className="bg-darkcard border border-darkborder rounded-2xl p-6">
                    <h3 className="text-lg font-heading font-bold text-text-primary mb-4">About This Course</h3>
                    <div className="prose prose-invert max-w-none text-text-secondary leading-relaxed whitespace-pre-line">
                      {course.description}
                    </div>
                  </div>
                )}

                {/* What you'll learn */}
                {course.whatYouLearn && (
                  <div className="bg-darkcard border border-darkborder rounded-2xl p-6">
                    <h3 className="text-lg font-heading font-bold text-text-primary mb-4">What You'll Learn</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {course.whatYouLearn.split('\n').filter(Boolean).map((item, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                          <span className="text-sm text-text-secondary">{item.replace(/^[-•*]\s*/, '')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Requirements */}
                {course.requirements && (
                  <div className="bg-darkcard border border-darkborder rounded-2xl p-6">
                    <h3 className="text-lg font-heading font-bold text-text-primary mb-4">Requirements</h3>
                    <ul className="space-y-2">
                      {course.requirements.split('\n').filter(Boolean).map((item, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-text-secondary">
                          <Shield className="w-4 h-4 text-neon-indigo shrink-0 mt-0.5" />
                          {item.replace(/^[-•*]\s*/, '')}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'curriculum' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {course.sections && course.sections.length > 0 ? (
                  <Curriculum sections={course.sections} enrolled={course.isEnrolled} />
                ) : (
                  <div className="bg-darkcard border border-darkborder rounded-2xl p-12 text-center">
                    <BookOpen className="w-12 h-12 text-text-muted/30 mx-auto mb-3" />
                    <p className="text-text-muted">Curriculum coming soon</p>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'reviews' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Reviews
                  reviews={reviews}
                  avgRating={course.avgRating || 0}
                  totalReviews={course.totalReviews || 0}
                />
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-darkcard border border-darkborder rounded-2xl overflow-hidden"
              >
                {/* Price display */}
                <div className="p-6 border-b border-darkborder">
                  <div className="flex items-end gap-3 mb-4">
                    <span className="text-3xl font-heading font-bold text-text-primary">{priceInfo.display}</span>
                    {priceInfo.original && (
                      <span className="text-lg text-text-muted line-through">{priceInfo.original}</span>
                    )}
                  </div>

                  {course.isEnrolled ? (
                    <Link
                      href={`/academy/courses/${course.slug}/learn`}
                      className="flex items-center justify-center gap-2 w-full py-3.5 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
                    >
                      <PlayCircle className="w-5 h-5" />
                      Continue Learning
                    </Link>
                  ) : (
                    <button
                      onClick={handleEnroll}
                      disabled={enrolling}
                      className="flex items-center justify-center gap-2 w-full py-3.5 bg-gradient-to-r from-neon-indigo to-neon-violet text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {enrolling ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <ShoppingCart className="w-5 h-5" />
                          {course.isFree ? 'Enroll Free' : 'Buy Now'}
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Course includes */}
                <div className="p-6 space-y-3">
                  <h4 className="text-sm font-semibold text-text-muted uppercase tracking-wider">This course includes</h4>
                  {[
                    { icon: Clock, text: `${formatDuration(course.totalDurationSeconds || 0)} on-demand video` },
                    { icon: BookOpen, text: `${course.totalLessons || 0} lessons` },
                    { icon: Award, text: 'Certificate of completion' },
                    { icon: Play, text: 'Access on mobile and TV' },
                    { icon: Lock, text: 'Full lifetime access' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm text-text-secondary">
                      <item.icon className="w-4 h-4 text-neon-violet shrink-0" />
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Related courses */}
        {relatedCourses.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-heading font-bold text-text-primary mb-6">More Courses You May Like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedCourses.map((c, i) => (
                <CourseCard key={c.id} course={c} index={i} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
