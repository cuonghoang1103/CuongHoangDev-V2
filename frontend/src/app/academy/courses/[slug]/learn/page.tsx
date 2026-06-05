'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { academyApi, coursesApi } from '@/lib/api';
import { sanitizeHtml } from '@/lib/utils';
import type { Assignment, Course, LessonDto, LessonProgress, Semester } from '@/types';
import { ArrowLeft, BookOpen, CheckCircle2, ChevronDown, ChevronRight, Code2, ExternalLink, FileText, GraduationCap, LayoutList, Loader2, PlayCircle, Send, Video } from 'lucide-react';
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

  const isCompleted = (lessonId: number) => progress.find((item) => item.lessonId === lessonId)?.isCompleted;

  const selectLesson = async (lesson: LessonDto) => {
    if (!course?.id) return;
    try {
      const res = await coursesApi.getLesson(course.id, lesson.id);
      setCurrentLesson(res.data.data || lesson);
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
        isCompleted: true,
        watchTimeSeconds: currentLesson.videoDurationSeconds,
        lastPositionSeconds: 0,
      });
      setProgress((prev) => ([
        ...prev.filter((item) => item.lessonId !== currentLesson.id),
        { lessonId: currentLesson.id, isCompleted: true, watchTimeSeconds: currentLesson.videoDurationSeconds || 0, lastPositionSeconds: 0 },
      ]));
      toast.success('Đã cập nhật tiến độ bài học');
    } catch {
      toast.error('Không cập nhật được tiến độ');
    } finally {
      setSavingProgress(false);
    }
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
    return course.sections?.find((section) => section.id === currentLesson.sectionId)?.title || '';
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

  return (
    <div className="min-h-screen bg-darkbg pt-20 pb-10">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 grid gap-6 lg:grid-cols-[330px_1fr]">
        <aside className="rounded-2xl border border-darkborder bg-darkcard p-4 h-fit lg:sticky lg:top-24 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-darkborder">
            <button onClick={() => router.back()} className="p-2 rounded-lg bg-darkbg hover:bg-white/5 text-text-secondary">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Academy</p>
              <h2 className="font-semibold text-text-primary">{course.courseCode || course.title}</h2>
            </div>
          </div>

          <div className="space-y-2 max-h-[75vh] overflow-y-auto pr-1">
            {semesters.map((semester) => {
              const isOpen = expandedSemesters.includes(semester.id);
              const semesterCourses = coursesBySemester[semester.id] || [];
              return (
                <div key={semester.id} className="rounded-xl border border-darkborder bg-darkbg/60 overflow-hidden">
                  <button
                    onClick={() => setExpandedSemesters((prev) => prev.includes(semester.id) ? prev.filter((item) => item !== semester.id) : [...prev, semester.id])}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition text-left"
                  >
                    <div>
                      <p className="font-semibold text-text-primary">{semester.name}</p>
                      <p className="text-xs text-text-muted">{semesterCourses.length} môn</p>
                    </div>
                    {isOpen ? <ChevronDown className="w-4 h-4 text-text-muted" /> : <ChevronRight className="w-4 h-4 text-text-muted" />}
                  </button>

                  {isOpen && (
                    <div className="border-t border-darkborder divide-y divide-darkborder/60">
                      {semesterCourses.map((semesterCourse) => {
                        const isCurrentCourse = semesterCourse.slug === course.slug;
                        return (
                          <div key={semesterCourse.id} className={isCurrentCourse ? 'bg-neon-violet/10' : ''}>
                            <Link href={`/academy/courses/${semesterCourse.slug}/learn`} className="block px-4 py-3 hover:bg-white/5 transition">
                              <p className="text-sm font-semibold text-text-primary">{semesterCourse.courseCode || 'COURSE'}</p>
                              <p className="text-sm text-text-secondary line-clamp-2">{semesterCourse.title}</p>
                            </Link>

                            {isCurrentCourse && semesterCourse.sections?.map((section) => {
                              const sectionOpen = expandedSections.includes(section.id);
                              return (
                                <div key={section.id} className="border-t border-darkborder/60">
                                  <button
                                    onClick={() => setExpandedSections((prev) => prev.includes(section.id) ? prev.filter((item) => item !== section.id) : [...prev, section.id])}
                                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition text-left"
                                  >
                                    <div>
                                      <p className="text-sm font-medium text-text-primary">{section.title}</p>
                                      <p className="text-xs text-text-muted">{section.lessons?.length || 0} bài học</p>
                                    </div>
                                    {sectionOpen ? <ChevronDown className="w-4 h-4 text-text-muted" /> : <ChevronRight className="w-4 h-4 text-text-muted" />}
                                  </button>
                                  {sectionOpen && (
                                    <div className="divide-y divide-darkborder/50">
                                      {section.lessons?.map((lesson) => {
                                        const active = lesson.id === currentLesson?.id;
                                        return (
                                          <button
                                            key={lesson.id}
                                            onClick={() => selectLesson(lesson)}
                                            className={`w-full px-4 py-3 text-left flex items-start gap-3 transition ${active ? 'bg-neon-indigo/15 border-l-2 border-neon-indigo' : 'hover:bg-white/5'}`}
                                          >
                                            <span className={`mt-0.5 ${isCompleted(lesson.id) ? 'text-green-400' : 'text-text-muted'}`}>
                                              {isCompleted(lesson.id) ? <CheckCircle2 className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
                                            </span>
                                            <div>
                                              <p className={`text-sm font-medium ${active ? 'text-neon-indigo' : 'text-text-primary'}`}>{lesson.title}</p>
                                              <p className="text-xs text-text-muted">{lesson.videoPlatform || 'EMBED'}</p>
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

        <main className="space-y-6">
          <section className="rounded-3xl border border-darkborder bg-darkcard p-6">
            <div className="flex flex-wrap items-center gap-3 text-sm text-text-muted mb-4">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neon-violet/10 text-neon-violet"><GraduationCap className="w-4 h-4" /> {course.semesterName || 'FPT Semester'}</span>
              {currentSectionTitle && <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-darkbg text-text-secondary"><LayoutList className="w-4 h-4" /> {currentSectionTitle}</span>}
            </div>

            <h1 className="text-3xl font-heading font-bold text-text-primary">{currentLesson?.title || course.title}</h1>
            <p className="text-text-secondary mt-3 max-w-3xl">{currentLesson?.description || course.shortDescription || course.description}</p>

            <div className="mt-6 aspect-video rounded-2xl overflow-hidden border border-darkborder bg-black">
              {embedUrl ? (
                <iframe
                  src={embedUrl}
                  title={currentLesson?.title || course.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-text-muted">Chưa có video cho bài học này.</div>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              {currentLesson?.videoUrl && (
                <a href={currentLesson.videoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-neon-violet/30 text-neon-violet hover:bg-neon-violet/10">
                  <Video className="w-4 h-4" /> Mở trong YouTube
                </a>
              )}
              <button onClick={markComplete} disabled={savingProgress} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-neon-indigo to-neon-violet text-white disabled:opacity-60">
                <CheckCircle2 className="w-4 h-4" /> {savingProgress ? 'Đang lưu...' : 'Đánh dấu đã học'}
              </button>
            </div>
          </section>

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
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border transition ${activeTab === tab.id ? 'border-neon-violet bg-neon-violet/10 text-neon-violet' : 'border-darkborder text-text-secondary hover:text-text-primary hover:bg-white/5'}`}
                >
                  <tab.icon className="w-4 h-4" /> {tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'notes' && (
              <div className="prose prose-invert max-w-none text-text-secondary" dangerouslySetInnerHTML={{ __html: sanitizeHtml(currentLesson?.teachingNotes || currentLesson?.content || '<p>Chưa có ghi chú.</p>') }} />
            )}

            {activeTab === 'resources' && (
              <div className="space-y-4">
                {currentLesson?.sourceCodeUrl ? (
                  <a href={currentLesson.sourceCodeUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-neon-indigo/10 border border-neon-indigo/30 text-neon-indigo hover:bg-neon-indigo/20">
                    <ExternalLink className="w-4 h-4" /> Mở Source Code / GitHub
                  </a>
                ) : (
                  <p className="text-text-muted">Chưa có source code cho bài học này.</p>
                )}
              </div>
            )}

            {activeTab === 'assignments' && (
              <div className="space-y-4">
                {currentLesson?.assignments?.length ? currentLesson.assignments.map((assignment) => (
                  <div key={assignment.id} className="rounded-2xl border border-darkborder bg-darkbg/70 p-5 space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-text-primary">{assignment.title}</h3>
                      {assignment.deadline && <p className="text-sm text-text-muted mt-1">Deadline: {new Date(assignment.deadline).toLocaleString('vi-VN')}</p>}
                    </div>
                    <div className="prose prose-invert max-w-none text-text-secondary" dangerouslySetInnerHTML={{ __html: sanitizeHtml(assignment.instructions || '<p>Chưa có mô tả bài tập.</p>') }} />
                    <div className="grid gap-3">
                      <input
                        value={submissionUrl[assignment.id] ?? assignment.mySubmission?.submissionUrl ?? ''}
                        onChange={(e) => setSubmissionUrl((prev) => ({ ...prev, [assignment.id]: e.target.value }))}
                        placeholder="Dán link sản phẩm / GitHub / Deploy"
                        className="px-4 py-3 rounded-xl bg-[#0b0b12] border border-darkborder text-text-primary"
                      />
                      <textarea
                        value={submissionNotes[assignment.id] ?? assignment.mySubmission?.notes ?? ''}
                        onChange={(e) => setSubmissionNotes((prev) => ({ ...prev, [assignment.id]: e.target.value }))}
                        rows={3}
                        placeholder="Ghi chú nộp bài"
                        className="px-4 py-3 rounded-xl bg-[#0b0b12] border border-darkborder text-text-primary"
                      />
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        {assignment.mySubmission && <span className="text-sm text-green-400">Đã nộp: {assignment.mySubmission.status}</span>}
                        <button onClick={() => submitAssignment(assignment)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-neon-indigo to-neon-violet text-white">
                          <Send className="w-4 h-4" /> Nộp bài
                        </button>
                      </div>
                    </div>
                  </div>
                )) : <p className="text-text-muted">Chưa có bài tập cho bài học này.</p>}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
