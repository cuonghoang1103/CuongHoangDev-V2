'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { academyApi, coursesApi } from '@/lib/api';
import { sanitizeHtml } from '@/lib/utils';
import type { Assignment, Course, LessonDto, LessonProgress, Semester } from '@/types';
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, ChevronDown, ChevronRight, Circle, Code2, ExternalLink, FileText, GraduationCap, LayoutList, Loader2, PlayCircle, Send, Video } from 'lucide-react';
import { toast } from 'sonner';

function toEmbedUrl(raw?: string) {
  if (!raw) return '';
  if (raw.includes('youtube.com/embed/')) return raw;
  const watchMatch = raw.match(/[?&]v=([^&]+)/);
  if (watchMatch?.[1]) return `https://www.youtube.com/embed/${watchMatch[1]}`;
  const shortMatch = raw.match(/youtu\.be\/([^?&]+)/);
  if (shortMatch?.[1]) return `https://www.youtube.com/embed/${shortMatch[1]}`;
  if (/^[a-zA-Z0-9_-]{6,}$/.test(raw)) return `https://www.youtube.com/embed/${raw}`;
  return raw;
}

function formatDuration(seconds?: number) {
  if (!seconds) return '';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function AcademyLessonPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const slug = params.slug;

  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [coursesBySemester, setCoursesBySemester] = useState<Record<number, Course[]>>({});
  const [expandedSemesters, setExpandedSemesters] = useState<number[]>([]);
  const [expandedSections, setExpandedSections] = useState<number[]>([]);
  const [course, setCourse] = useState<Course | null>(null);
  const [currentLesson, setCurrentLesson] = useState<LessonDto | null>(null);
  const [progress, setProgress] = useState<LessonProgress[]>([]);
  const [submissionUrl, setSubmissionUrl] = useState<Record<number, string>>({});
  const [submissionNotes, setSubmissionNotes] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'notes' | 'resources' | 'assignments'>('notes');
  const [savingProgress, setSavingProgress] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [semesterRes, courseRes] = await Promise.all([
          academyApi.getSemesters(),
          coursesApi.getBySlug(slug),
        ]);

        const semesterRows = semesterRes.data.data || [];
        setSemesters(semesterRows);

        const loadedCourse = courseRes.data.data as Course;
        setCourse(loadedCourse);
        if (loadedCourse.semesterId) setExpandedSemesters([loadedCourse.semesterId]);
        setExpandedSections((loadedCourse.sections || []).map((section) => section.id));

        const semesterEntries = await Promise.all(
          semesterRows.map(async (semester: Semester) => {
            const res = await academyApi.getCoursesBySemester(semester.id);
            return [semester.id, res.data.data || []] as const;
          })
        );
        setCoursesBySemester(Object.fromEntries(semesterEntries));

        if (loadedCourse.id) {
          try {
            const progressRes = await coursesApi.getProgress(loadedCourse.id);
            setProgress(progressRes.data.data || []);
          } catch {
            setProgress([]);
          }
        }

        const firstLesson = loadedCourse.sections?.[0]?.lessons?.[0] || null;
        if (firstLesson && loadedCourse.id) {
          const lessonRes = await coursesApi.getLesson(loadedCourse.id, firstLesson.id);
          setCurrentLesson(lessonRes.data.data || firstLesson);
        }
      } catch (error) {
        console.error(error);
        toast.error('Không tải được nội dung học tập');
      } finally {
        setLoading(false);
      }
    };

    if (slug) load();
  }, [slug]);

  // Flat list of all lessons for prev/next navigation
  const flatLessons = useMemo(() => {
    if (!course?.sections) return [];
    return course.sections.flatMap((section) =>
      (section.lessons || []).map((lesson) => ({
        sectionId: section.id,
        sectionTitle: section.title,
        sectionLocked: section.isLocked || false,
        lesson,
      }))
    );
  }, [course]);

  const currentIndex = currentLesson
    ? flatLessons.findIndex((f) => f.lesson.id === currentLesson.id)
    : -1;
  const prevLesson = currentIndex > 0 ? flatLessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex >= 0 && currentIndex < flatLessons.length - 1
      ? flatLessons[currentIndex + 1]
      : null;

  const isCompleted = (lessonId: number) =>
    progress.some((item) => item.lessonId === lessonId);

  const isCurrentLessonCompleted = currentLesson ? isCompleted(currentLesson.id) : false;

  const selectLesson = async (lesson: LessonDto) => {
    if (!course?.id) return;
    // If clicking the already-active lesson, do nothing
    if (currentLesson?.id === lesson.id) return;
    try {
      const res = await coursesApi.getLesson(course.id, lesson.id);
      const fullLesson: LessonDto = res.data.data;
      setCurrentLesson(fullLesson);
      // Clear stale submission state for the new lesson
      setActiveTab('notes');
      setSubmissionUrl({});
      setSubmissionNotes({});
    } catch {
      setCurrentLesson(lesson);
    }
  };

  const markComplete = async () => {
    if (!course?.id || !currentLesson || savingProgress) return;
    setSavingProgress(true);
    try {
      await coursesApi.updateProgress(course.id, {
        lessonId: currentLesson.id,
        isCompleted: !isCurrentLessonCompleted,
        watchTimeSeconds: currentLesson.videoDurationSeconds || 0,
        lastPositionSeconds: 0,
      });
      setProgress((prev) => {
        const filtered = prev.filter((item) => item.lessonId !== currentLesson.id);
        return [
          ...filtered,
          {
            lessonId: currentLesson.id,
            isCompleted: !isCurrentLessonCompleted,
            watchTimeSeconds: currentLesson.videoDurationSeconds || 0,
            lastPositionSeconds: 0,
          },
        ];
      });
      toast.success(
        isCurrentLessonCompleted
          ? 'Đã bỏ đánh dấu bài học'
          : 'Đã đánh dấu hoàn thành bài học'
      );
    } catch {
      toast.error('Không cập nhật được tiến độ');
    } finally {
      setSavingProgress(false);
    }
  };

  const navigateToPrev = async () => {
    if (prevLesson) await selectLesson(prevLesson.lesson);
  };

  const navigateToNext = async () => {
    if (nextLesson) await selectLesson(nextLesson.lesson);
  };

  const submitAssignment = async (assignment: Assignment) => {
    const url = submissionUrl[assignment.id] || assignment.mySubmission?.submissionUrl || '';
    const notes = submissionNotes[assignment.id] || assignment.mySubmission?.notes || '';

    if (!url.trim()) {
      toast.error('Vui lòng nhập link bài nộp');
      return;
    }

    try {
      await academyApi.submitAssignment({ assignmentId: assignment.id, submissionUrl: url, notes });
      toast.success('Nộp bài thành công');
      if (currentLesson && course?.id) {
        const refreshed = await coursesApi.getLesson(course.id, currentLesson.id);
        setCurrentLesson(refreshed.data.data || currentLesson);
      }
    } catch {
      toast.error('Nộp bài thất bại');
    }
  };

  const currentSectionTitle = useMemo(() => {
    if (!course || !currentLesson) return '';
    return (
      course.sections?.find((section) => section.id === currentLesson.sectionId)?.title || ''
    );
  }, [course, currentLesson]);

  const currentSection = useMemo(() => {
    if (!course || !currentLesson) return null;
    return course.sections?.find((section) => section.id === currentLesson.sectionId) || null;
  }, [course, currentLesson]);

  if (loading) {
    return (
      <div className="min-h-screen bg-darkbg pt-24 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-neon-violet" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-darkbg pt-24 flex items-center justify-center flex-col gap-4">
        <p className="text-text-secondary">Không tìm thấy khóa học.</p>
        <Link href="/academy" className="text-neon-violet">Quay lại Academy</Link>
      </div>
    );
  }

  const embedUrl = toEmbedUrl(currentLesson?.videoUrl);
  const hasPrev = prevLesson !== null;
  const hasNext = nextLesson !== null;
  const currentLessonIndex = currentIndex >= 0 ? currentIndex + 1 : 0;
  const totalLessons = flatLessons.length;

  return (
    <div className="min-h-screen bg-darkbg pt-20 pb-10">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 grid gap-6 lg:grid-cols-[330px_1fr]">
        {/* Sidebar */}
        <aside className="rounded-2xl border border-darkborder bg-darkcard p-4 h-fit lg:sticky lg:top-24 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-darkborder">
            <button onClick={() => router.back()} className="p-2 rounded-lg bg-darkbg hover:bg-white/5 text-text-secondary">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Academy</p>
              <h2 className="font-semibold text-text-primary text-sm">{course.courseCode || course.title}</h2>
            </div>
          </div>

          {/* Progress bar */}
          <div className="px-1">
            <div className="flex justify-between text-xs text-text-muted mb-1.5">
              <span>Tiến độ</span>
              <span className="text-neon-violet font-medium">
                {progress.filter((p) => p.isCompleted).length}/{totalLessons}
              </span>
            </div>
            <div className="h-1.5 bg-darkbg rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-neon-indigo to-neon-violet rounded-full transition-all duration-500"
                style={{
                  width:
                    totalLessons > 0
                      ? `${(progress.filter((p) => p.isCompleted).length / totalLessons) * 100}%`
                      : '0%',
                }}
              />
            </div>
          </div>

          <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
            {semesters.map((semester) => {
              const isOpen = expandedSemesters.includes(semester.id);
              const semesterCourses = coursesBySemester[semester.id] || [];
              return (
                <div key={semester.id} className="rounded-xl border border-darkborder bg-darkbg/60 overflow-hidden">
                  <button
                    onClick={() =>
                      setExpandedSemesters((prev) =>
                        prev.includes(semester.id)
                          ? prev.filter((item) => item !== semester.id)
                          : [...prev, semester.id]
                      )
                    }
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition text-left"
                  >
                    <div>
                      <p className="font-semibold text-text-primary">{semester.name}</p>
                      <p className="text-xs text-text-muted">{semesterCourses.length} môn</p>
                    </div>
                    {isOpen ? (
                      <ChevronDown className="w-4 h-4 text-text-muted" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-text-muted" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="border-t border-darkborder divide-y divide-darkborder/60">
                      {semesterCourses.map((semesterCourse) => {
                        const isCurrentCourse = semesterCourse.slug === course.slug;
                        return (
                          <div key={semesterCourse.id} className={isCurrentCourse ? 'bg-neon-violet/10' : ''}>
                            <Link
                              href={`/academy/courses/${semesterCourse.slug}/learn`}
                              className="block px-4 py-3 hover:bg-white/5 transition"
                            >
                              <p className="text-sm font-semibold text-text-primary">
                                {semesterCourse.courseCode || 'COURSE'}
                              </p>
                              <p className="text-sm text-text-secondary line-clamp-2">
                                {semesterCourse.title}
                              </p>
                            </Link>

                            {/* Lessons for current course */}
                            {isCurrentCourse && semesterCourse.sections?.map((section) => {
                              const sectionOpen = expandedSections.includes(section.id);
                              const sectionCompletedCount = (section.lessons || []).filter(
                                (l) => isCompleted(l.id)
                              ).length;
                              const sectionTotal = (section.lessons || []).length;
                              return (
                                <div key={section.id} className="border-t border-darkborder/60">
                                  <button
                                    onClick={() =>
                                      setExpandedSections((prev) =>
                                        prev.includes(section.id)
                                          ? prev.filter((item) => item !== section.id)
                                          : [...prev, section.id]
                                      )
                                    }
                                    className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-white/5 transition text-left"
                                  >
                                    <div className="flex items-center gap-2">
                                      {sectionOpen ? (
                                        <ChevronDown className="w-3.5 h-3.5 text-text-muted shrink-0" />
                                      ) : (
                                        <ChevronRight className="w-3.5 h-3.5 text-text-muted shrink-0" />
                                      )}
                                      <div>
                                        <p className="text-xs font-medium text-text-primary">{section.title}</p>
                                        <p className="text-[10px] text-text-muted">
                                          {sectionCompletedCount}/{sectionTotal} hoàn thành
                                        </p>
                                      </div>
                                    </div>
                                    {/* Section progress dot */}
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                        sectionCompletedCount === sectionTotal && sectionTotal > 0
                                          ? 'bg-emerald-400'
                                          : sectionCompletedCount > 0
                                          ? 'bg-neon-violet'
                                          : 'bg-darkborder'
                                      }`}
                                    />
                                  </button>

                                  {sectionOpen && (
                                    <div className="divide-y divide-darkborder/50">
                                      {(section.lessons || []).map((lesson) => {
                                        const active = lesson.id === currentLesson?.id;
                                        const completed = isCompleted(lesson.id);
                                        return (
                                          <button
                                            key={lesson.id}
                                            onClick={() => selectLesson(lesson)}
                                            className={`w-full px-4 py-2.5 text-left flex items-start gap-2.5 transition ${
                                              active
                                                ? 'bg-neon-indigo/15 border-l-2 border-neon-indigo'
                                                : 'hover:bg-white/5'
                                            }`}
                                          >
                                            {/* Status icon */}
                                            <span className={`mt-0.5 shrink-0 ${completed ? 'text-emerald-400' : 'text-text-muted'}`}>
                                              {completed ? (
                                                <CheckCircle2 className="w-4 h-4" />
                                              ) : (
                                                <Circle className="w-4 h-4" />
                                              )}
                                            </span>
                                            <div className="min-w-0">
                                              <p
                                                className={`text-xs font-medium leading-snug ${
                                                  active ? 'text-neon-indigo' : 'text-text-primary'
                                                }`}
                                              >
                                                {lesson.title}
                                              </p>
                                              <p className="text-[10px] text-text-muted mt-0.5">
                                                {lesson.videoDurationSeconds
                                                  ? formatDuration(lesson.videoDurationSeconds)
                                                  : lesson.videoPlatform || 'EMBED'}
                                              </p>
                                            </div>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        {/* Main content */}
        <main className="space-y-6">
          {/* Video + Header */}
          <section className="rounded-3xl border border-darkborder bg-darkcard p-6">
            {/* Breadcrumb + Lesson counter */}
            <div className="flex flex-wrap items-center gap-3 text-sm text-text-muted mb-3">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neon-violet/10 text-neon-violet">
                <GraduationCap className="w-3.5 h-3.5" />
                {course.semesterName || 'FPT Semester'}
              </span>
              {currentSection && (
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-darkbg text-text-secondary">
                  <LayoutList className="w-3.5 h-3.5" />
                  {currentSection.title}
                </span>
              )}
              {totalLessons > 0 && (
                <span className="ml-auto text-xs font-mono text-text-muted">
                  Bài {currentLessonIndex}/{totalLessons}
                </span>
              )}
            </div>

            <h1 className="text-2xl font-heading font-bold text-text-primary mb-1">
              {currentLesson?.title || course.title}
            </h1>
            <p className="text-text-secondary text-sm">
              {currentLesson?.description || course.shortDescription || course.description}
            </p>

            {/* Video */}
            <div className="mt-5 aspect-video rounded-2xl overflow-hidden border border-darkborder bg-black">
              {embedUrl ? (
                <iframe
                  src={embedUrl}
                  title={currentLesson?.title || course.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-text-muted">
                  Chưa có video cho bài học này.
                </div>
              )}
            </div>

            {/* Action bar */}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {/* External links */}
              {currentLesson?.videoUrl && (
                <a
                  href={currentLesson.videoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-neon-violet/30 text-neon-violet hover:bg-neon-violet/10"
                >
                  <Video className="w-4 h-4" />
                  <span className="hidden sm:inline">Mở trong YouTube</span>
                </a>
              )}
              {currentLesson?.sourceCodeUrl && (
                <a
                  href={currentLesson.sourceCodeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-darkborder text-text-secondary hover:text-text-primary hover:bg-white/5"
                >
                  <Code2 className="w-4 h-4" />
                  <span className="hidden sm:inline">GitHub</span>
                </a>
              )}

              <div className="ml-auto flex items-center gap-2">
                {/* Completion toggle */}
                <button
                  onClick={markComplete}
                  disabled={savingProgress}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition disabled:opacity-50 ${
                    isCurrentLessonCompleted
                      ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25'
                      : 'bg-gradient-to-r from-neon-indigo to-neon-violet text-white hover:opacity-90'
                  }`}
                >
                  {savingProgress ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isCurrentLessonCompleted ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Circle className="w-4 h-4" />
                  )}
                  {isCurrentLessonCompleted ? 'Đã hoàn thành' : 'Đánh dấu hoàn thành'}
                </button>
              </div>
            </div>

            {/* Prev / Next navigation */}
            <div className="mt-4 flex items-center gap-3 pt-4 border-t border-darkborder/50">
              <button
                onClick={navigateToPrev}
                disabled={!hasPrev}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-darkborder text-text-secondary hover:text-text-primary hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {prevLesson ? prevLesson.lesson.title : 'Bài trước'}
                </span>
                <span className="sm:hidden">Trước</span>
              </button>

              <div className="flex-1 flex items-center justify-center gap-1.5">
                {flatLessons.map((f, idx) => (
                  <button
                    key={f.lesson.id}
                    onClick={() => selectLesson(f.lesson)}
                    className={`w-2 h-2 rounded-full transition ${
                      f.lesson.id === currentLesson?.id
                        ? 'bg-neon-violet scale-125'
                        : isCompleted(f.lesson.id)
                        ? 'bg-emerald-400/60'
                        : 'bg-darkborder hover:bg-text-muted/50'
                    }`}
                    title={f.lesson.title}
                  />
                ))}
              </div>

              <button
                onClick={navigateToNext}
                disabled={!hasNext}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-darkborder text-text-secondary hover:text-text-primary hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                <span className="hidden sm:inline">
                  {nextLesson ? nextLesson.lesson.title : 'Bài tiếp'}
                </span>
                <span className="sm:hidden">Sau</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </section>

          {/* Tabs: Notes / Resources / Assignments */}
          <section className="rounded-3xl border border-darkborder bg-darkcard p-6">
            <div className="flex gap-2 flex-wrap mb-6">
              {([
                { id: 'notes', label: 'Ghi chú giảng dạy', icon: FileText },
                { id: 'resources', label: 'Tài nguyên & Source Code', icon: Code2 },
                { id: 'assignments', label: 'Bài tập về nhà', icon: BookOpen },
              ] as const).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border transition ${
                    activeTab === tab.id
                      ? 'border-neon-violet bg-neon-violet/10 text-neon-violet'
                      : 'border-darkborder text-text-secondary hover:text-text-primary hover:bg-white/5'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  {tab.id === 'assignments' && currentLesson?.assignments?.length ? (
                    <span className="ml-1 px-1.5 py-0.5 rounded-full bg-neon-indigo/20 text-neon-indigo text-[10px] font-medium">
                      {currentLesson.assignments.length}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>

            {activeTab === 'notes' && (
              <div
                className="prose prose-invert max-w-none text-text-secondary"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(
                    currentLesson?.teachingNotes ||
                      currentLesson?.content ||
                      '<p class="text-text-muted italic">Chưa có ghi chú cho bài học này.</p>'
                  ),
                }}
              />
            )}

            {activeTab === 'resources' && (
              <div className="space-y-4">
                {currentLesson?.sourceCodeUrl ? (
                  <a
                    href={currentLesson.sourceCodeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-neon-indigo/10 border border-neon-indigo/30 text-neon-indigo hover:bg-neon-indigo/20 font-medium"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Mở Source Code / GitHub
                  </a>
                ) : (
                  <p className="text-text-muted italic">Chưa có source code cho bài học này.</p>
                )}
              </div>
            )}

            {activeTab === 'assignments' && (
              <div className="space-y-4">
                {currentLesson?.assignments && currentLesson.assignments.length > 0 ? (
                  currentLesson.assignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="rounded-2xl border border-darkborder bg-darkbg/70 p-5 space-y-4"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-semibold text-text-primary">{assignment.title}</h3>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            {assignment.deadline && (
                              <span className="text-sm text-text-muted">
                                Deadline:{' '}
                                <span className="text-neon-fuchsia font-medium">
                                  {new Date(assignment.deadline).toLocaleString('vi-VN')}
                                </span>
                              </span>
                            )}
                            <span className="text-sm text-text-muted">
                              Điểm tối đa:{' '}
                              <span className="text-text-primary font-medium">
                                {assignment.maxScore ?? 10}
                              </span>
                            </span>
                          </div>
                        </div>
                        {/* Status badge */}
                        {assignment.mySubmission && (
                          <span
                            className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium ${
                              assignment.mySubmission.status === 'GRADED'
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : assignment.mySubmission.status === 'NEED_REVISION'
                                ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30'
                                : 'bg-neon-violet/15 text-neon-violet border border-neon-violet/30'
                            }`}
                          >
                            {assignment.mySubmission.status === 'GRADED'
                              ? `Đã chấm ${assignment.mySubmission.grade ?? ''}`
                              : assignment.mySubmission.status === 'NEED_REVISION'
                              ? 'Cần sửa lại'
                              : 'Đã nộp'}
                          </span>
                        )}
                      </div>

                      {/* Instructions */}
                      {assignment.instructions && (
                        <div className="rounded-xl bg-darkcard/50 border border-darkborder/50 p-4">
                          <p className="text-xs uppercase tracking-[0.1em] text-text-muted font-semibold mb-2">
                            Nội dung bài tập
                          </p>
                          <div
                            className="prose prose-invert prose-sm max-w-none text-text-secondary"
                            dangerouslySetInnerHTML={{ __html: sanitizeHtml(assignment.instructions) }}
                          />
                        </div>
                      )}

                      {/* Submission form */}
                      <div className="grid gap-3">
                        <input
                          value={submissionUrl[assignment.id] ?? assignment.mySubmission?.submissionUrl ?? ''}
                          onChange={(e) =>
                            setSubmissionUrl((prev) => ({ ...prev, [assignment.id]: e.target.value }))
                          }
                          placeholder="Dán link sản phẩm / GitHub / Deploy"
                          className="px-4 py-3 rounded-xl bg-[#0b0b12] border border-darkborder text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-neon-violet/50 focus:ring-1 focus:ring-neon-violet/20 transition"
                        />
                        <textarea
                          value={
                            submissionNotes[assignment.id] ??
                            assignment.mySubmission?.notes ??
                            ''
                          }
                          onChange={(e) =>
                            setSubmissionNotes((prev) => ({ ...prev, [assignment.id]: e.target.value }))
                          }
                          rows={3}
                          placeholder="Ghi chú nộp bài (tùy chọn)"
                          className="px-4 py-3 rounded-xl bg-[#0b0b12] border border-darkborder text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-neon-violet/50 focus:ring-1 focus:ring-neon-violet/20 transition resize-none"
                        />
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          {/* Grade info */}
                          {assignment.mySubmission?.grade != null && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-text-muted">Điểm:</span>
                              <span className="text-lg font-bold text-neon-indigo">
                                {assignment.mySubmission.grade}/{assignment.maxScore ?? 10}
                              </span>
                            </div>
                          )}
                          <button
                            onClick={() => submitAssignment(assignment)}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-neon-indigo to-neon-violet text-white font-medium hover:opacity-90 transition"
                          >
                            <Send className="w-4 h-4" />
                            {assignment.mySubmission ? 'Nộp lại' : 'Nộp bài'}
                          </button>
                        </div>
                      </div>

                      {/* Instructor feedback */}
                      {assignment.mySubmission?.feedback && (
                        <div className="rounded-xl bg-neon-indigo/10 border border-neon-indigo/20 p-4">
                          <p className="text-xs uppercase tracking-[0.1em] text-neon-indigo font-semibold mb-2">
                            Phản hồi từ giảng viên
                          </p>
                          <p className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">
                            {assignment.mySubmission.feedback}
                          </p>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10">
                    <BookOpen className="w-10 h-10 mx-auto text-text-muted/30 mb-3" />
                    <p className="text-text-muted italic">Chưa có bài tập cho bài học này.</p>
                  </div>
                )}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
