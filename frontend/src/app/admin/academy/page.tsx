'use client';

import { useEffect, useMemo, useState } from 'react';
import { BookOpen, ChevronDown, ChevronRight, ClipboardList, Code2, FileText, FolderTree, GraduationCap, Image as ImageIcon, Link2, Plus, Save, Trash2, Video } from 'lucide-react';
import { academyApi, adminCoursesApi } from '@/lib/api';
import type { Assignment, Course, LessonDto, Semester } from '@/types';
import ImageUpload from '@/components/admin/ImageUpload';
import RichTextEditor from '@/components/admin/RichTextEditor';
import { toast } from 'sonner';

interface CourseFormState {
  id?: number;
  title: string;
  courseCode: string;
  shortDescription: string;
  description: string;
  thumbnailUrl: string;
  previewVideoUrl: string;
  semesterId?: number;
  academyType: string;
  level: string;
  language: string;
  isFree: boolean;
  isFeatured: boolean;
  status: string;
  requirements: string;
  whatYouLearn: string;
}

interface SectionFormState {
  id?: number;
  title: string;
  description: string;
  sortOrder: number;
  isLocked: boolean;
  lessons: LessonFormState[];
}

interface LessonFormState {
  id?: number;
  title: string;
  slug: string;
  description: string;
  content: string;
  lessonType: string;
  videoUrl: string;
  videoPlatform: 'EMBED' | 'YOUTUBE_TAB' | 'DIRECT';
  sourceCodeUrl: string;
  teachingNotes: string;
  videoDurationSeconds: number;
  thumbnailUrl: string;
  isFreePreview: boolean;
  isPublished: boolean;
  sortOrder: number;
  assignments: Assignment[];
}

const emptyCourse: CourseFormState = {
  title: '',
  courseCode: '',
  shortDescription: '',
  description: '',
  thumbnailUrl: '',
  previewVideoUrl: '',
  semesterId: undefined,
  academyType: 'FPT',
  level: 'BEGINNER',
  language: 'Vietnamese',
  isFree: true,
  isFeatured: false,
  status: 'DRAFT',
  requirements: '',
  whatYouLearn: '',
};

function buildEmptyLesson(sortOrder: number): LessonFormState {
  return {
    title: '',
    slug: '',
    description: '',
    content: '',
    lessonType: 'VIDEO',
    videoUrl: '',
    videoPlatform: 'EMBED',
    sourceCodeUrl: '',
    teachingNotes: '',
    videoDurationSeconds: 0,
    thumbnailUrl: '',
    isFreePreview: true,
    isPublished: true,
    sortOrder,
    assignments: [],
  };
}

export default function AdminAcademyPage() {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState<number | undefined>();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | undefined>();
  const [courseForm, setCourseForm] = useState<CourseFormState>(emptyCourse);
  const [sections, setSections] = useState<SectionFormState[]>([]);
  const [expandedSections, setExpandedSections] = useState<number[]>([]);
  const [savingCourse, setSavingCourse] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);

  useEffect(() => {
    academyApi.getSemesters()
      .then((res) => {
        const rows = res.data.data || [];
        setSemesters(rows);
        setSelectedSemesterId(rows[0]?.id);
      })
      .catch(() => toast.error('Không tải được danh sách kỳ học'));
  }, []);

  useEffect(() => {
    if (!selectedSemesterId) return;
    setLoadingCourses(true);
    academyApi.getCoursesBySemester(selectedSemesterId)
      .then((res) => setCourses(res.data.data || []))
      .catch(() => toast.error('Không tải được môn học theo kỳ'))
      .finally(() => setLoadingCourses(false));
  }, [selectedSemesterId]);

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === selectedCourseId),
    [courses, selectedCourseId]
  );

  useEffect(() => {
    if (!selectedCourse) {
      setCourseForm({ ...emptyCourse, semesterId: selectedSemesterId });
      setSections([]);
      return;
    }

    setCourseForm({
      id: selectedCourse.id,
      title: selectedCourse.title,
      courseCode: selectedCourse.courseCode || '',
      shortDescription: selectedCourse.shortDescription || '',
      description: selectedCourse.description || '',
      thumbnailUrl: selectedCourse.thumbnailUrl || '',
      previewVideoUrl: selectedCourse.previewVideoUrl || '',
      semesterId: selectedCourse.semesterId,
      academyType: selectedCourse.academyType || 'FPT',
      level: selectedCourse.level || 'BEGINNER',
      language: selectedCourse.language || 'Vietnamese',
      isFree: selectedCourse.isFree,
      isFeatured: selectedCourse.isFeatured,
      status: selectedCourse.status || 'DRAFT',
      requirements: selectedCourse.requirements || '',
      whatYouLearn: selectedCourse.whatYouLearn || '',
    });

    const mappedSections = (selectedCourse.sections || []).map((section, sectionIndex) => ({
      id: section.id,
      title: section.title,
      description: section.description || '',
      sortOrder: section.sortOrder ?? sectionIndex,
      isLocked: section.isLocked,
      lessons: (section.lessons || []).map((lesson, lessonIndex) => ({
        id: lesson.id,
        title: lesson.title,
        slug: lesson.slug || '',
        description: lesson.description || '',
        content: lesson.content || '',
        lessonType: lesson.lessonType || 'VIDEO',
        videoUrl: lesson.videoUrl || '',
        videoPlatform: (lesson.videoPlatform as 'EMBED' | 'YOUTUBE_TAB' | 'DIRECT') || 'EMBED',
        sourceCodeUrl: lesson.sourceCodeUrl || '',
        teachingNotes: lesson.teachingNotes || '',
        videoDurationSeconds: lesson.videoDurationSeconds || 0,
        thumbnailUrl: lesson.thumbnailUrl || '',
        isFreePreview: lesson.isFreePreview,
        isPublished: lesson.isPublished,
        sortOrder: lesson.sortOrder ?? lessonIndex,
        assignments: lesson.assignments || [],
      })),
    }));

    setSections(mappedSections);
    setExpandedSections(mappedSections.map((_, index) => index));
  }, [selectedCourse, selectedSemesterId]);

  const resetForNewCourse = () => {
    setSelectedCourseId(undefined);
    setCourseForm({ ...emptyCourse, semesterId: selectedSemesterId });
    setSections([]);
    setExpandedSections([]);
  };

  const saveCourse = async () => {
    if (!courseForm.title.trim() || !courseForm.semesterId) {
      toast.error('Vui lòng nhập tên môn học và chọn kỳ');
      return;
    }

    setSavingCourse(true);
    try {
      let courseId = courseForm.id;
      const payload = {
        title: courseForm.title,
        courseCode: courseForm.courseCode,
        semesterId: courseForm.semesterId,
        academyType: courseForm.academyType,
        shortDescription: courseForm.shortDescription,
        description: courseForm.description,
        thumbnailUrl: courseForm.thumbnailUrl,
        previewVideoUrl: courseForm.previewVideoUrl,
        level: courseForm.level,
        language: courseForm.language,
        isFree: courseForm.isFree,
        isFeatured: courseForm.isFeatured,
        status: courseForm.status,
        requirements: courseForm.requirements,
        whatYouLearn: courseForm.whatYouLearn,
      };

      if (courseId) {
        await adminCoursesApi.update(courseId, payload);
      } else {
        const created = await adminCoursesApi.create(payload);
        courseId = created.data.data?.id;
      }

      if (!courseId) throw new Error('Course save failed');

      for (const [sectionIndex, section] of sections.entries()) {
        let sectionId = section.id;
        const savedSection = sectionId
          ? await adminCoursesApi.updateSection(sectionId, {
              title: section.title,
              description: section.description,
              sortOrder: sectionIndex,
              isLocked: section.isLocked,
            })
          : await adminCoursesApi.createSection({
              courseId,
              title: section.title,
              description: section.description,
              sortOrder: sectionIndex,
              isLocked: section.isLocked,
            });

        sectionId = savedSection.data.data?.id;
        if (!sectionId) continue;

        for (const [lessonIndex, lesson] of section.lessons.entries()) {
          let lessonId = lesson.id;
          const savedLesson = lessonId
            ? await adminCoursesApi.updateLesson(lessonId, {
                title: lesson.title,
                slug: lesson.slug,
                description: lesson.description,
                content: lesson.content,
                lessonType: lesson.lessonType,
                videoUrl: lesson.videoUrl,
                videoPlatform: lesson.videoPlatform,
                sourceCodeUrl: lesson.sourceCodeUrl,
                teachingNotes: lesson.teachingNotes,
                videoDurationSeconds: lesson.videoDurationSeconds,
                thumbnailUrl: lesson.thumbnailUrl,
                isFreePreview: lesson.isFreePreview,
                isPublished: lesson.isPublished,
                sortOrder: lessonIndex,
              })
            : await adminCoursesApi.createLesson({
                sectionId,
                title: lesson.title,
                slug: lesson.slug,
                description: lesson.description,
                content: lesson.content,
                lessonType: lesson.lessonType,
                videoUrl: lesson.videoUrl,
                videoPlatform: lesson.videoPlatform,
                sourceCodeUrl: lesson.sourceCodeUrl,
                teachingNotes: lesson.teachingNotes,
                videoDurationSeconds: lesson.videoDurationSeconds,
                thumbnailUrl: lesson.thumbnailUrl,
                isFreePreview: lesson.isFreePreview,
                isPublished: lesson.isPublished,
                sortOrder: lessonIndex,
              });

          lessonId = savedLesson.data.data?.id;
          if (!lessonId) continue;

          for (const [assignmentIndex, assignment] of lesson.assignments.entries()) {
            const assignmentPayload = {
              lessonId,
              title: assignment.title,
              instructions: assignment.instructions,
              deadline: assignment.deadline,
              sortOrder: assignmentIndex,
              isPublished: assignment.isPublished,
            };

            if (assignment.id) {
              await adminCoursesApi.updateAssignment(assignment.id, assignmentPayload);
            } else {
              await adminCoursesApi.createAssignment(assignmentPayload);
            }
          }
        }
      }

      toast.success('Đã lưu chương trình học');
      const refreshed = await academyApi.getCoursesBySemester(courseForm.semesterId);
      const nextCourses = refreshed.data.data || [];
      setCourses(nextCourses);
      if (courseId) setSelectedCourseId(courseId);
    } catch (error) {
      console.error(error);
      toast.error('Lưu chương trình học thất bại');
    } finally {
      setSavingCourse(false);
    }
  };

  const removeCourse = async () => {
    if (!courseForm.id) return;
    try {
      await adminCoursesApi.delete(courseForm.id);
      toast.success('Đã xoá môn học');
      setCourses((prev) => prev.filter((course) => course.id !== courseForm.id));
      resetForNewCourse();
    } catch {
      toast.error('Xoá môn học thất bại');
    }
  };

  const addSection = () => {
    setSections((prev) => [...prev, {
      title: '',
      description: '',
      sortOrder: prev.length,
      isLocked: false,
      lessons: [buildEmptyLesson(0)],
    }]);
    setExpandedSections((prev) => [...prev, sections.length]);
  };

  const updateSection = (sectionIndex: number, patch: Partial<SectionFormState>) => {
    setSections((prev) => prev.map((section, index) => index === sectionIndex ? { ...section, ...patch } : section));
  };

  const addLesson = (sectionIndex: number) => {
    setSections((prev) => prev.map((section, index) => index === sectionIndex
      ? { ...section, lessons: [...section.lessons, buildEmptyLesson(section.lessons.length)] }
      : section));
  };

  const updateLesson = (sectionIndex: number, lessonIndex: number, patch: Partial<LessonFormState>) => {
    setSections((prev) => prev.map((section, sIndex) => sIndex === sectionIndex
      ? {
          ...section,
          lessons: section.lessons.map((lesson, lIndex) => lIndex === lessonIndex ? { ...lesson, ...patch } : lesson),
        }
      : section));
  };

  const addAssignment = (sectionIndex: number, lessonIndex: number) => {
    setSections((prev) => prev.map((section, sIndex) => sIndex === sectionIndex
      ? {
          ...section,
          lessons: section.lessons.map((lesson, lIndex) => lIndex === lessonIndex
            ? {
                ...lesson,
                assignments: [...lesson.assignments, {
                  id: Date.now(),
                  title: '',
                  instructions: '',
                  deadline: '',
                  sortOrder: lesson.assignments.length,
                  isPublished: true,
                }],
              }
            : lesson),
        }
      : section));
  };

  const toggleSectionExpand = (sectionIndex: number) => {
    setExpandedSections((prev) => prev.includes(sectionIndex)
      ? prev.filter((index) => index !== sectionIndex)
      : [...prev, sectionIndex]);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <aside className="bg-darkcard border border-darkborder rounded-2xl p-4 h-fit sticky top-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-text-muted">FPT Academy</p>
            <h2 className="text-xl font-heading font-bold text-text-primary mt-1">9 kỳ học</h2>
          </div>
          <GraduationCap className="w-5 h-5 text-neon-violet" />
        </div>

        <div className="space-y-2">
          {semesters.map((semester) => {
            const active = selectedSemesterId === semester.id;
            return (
              <button
                key={semester.id}
                onClick={() => {
                  setSelectedSemesterId(semester.id);
                  setSelectedCourseId(undefined);
                }}
                className={`w-full text-left px-4 py-3 rounded-xl border transition ${active ? 'border-neon-violet bg-neon-violet/10 text-neon-violet' : 'border-darkborder bg-darkbg text-text-secondary hover:border-neon-violet/40'}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{semester.name}</p>
                    <p className="text-xs opacity-70">{semester.code}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-white/5">#{semester.ordinal}</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-darkborder">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-text-primary">Môn học</h3>
            <button onClick={resetForNewCourse} className="p-2 rounded-lg bg-neon-violet/15 text-neon-violet hover:bg-neon-violet/25">
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {loadingCourses ? <p className="text-sm text-text-muted">Đang tải...</p> : courses.map((course) => (
              <button
                key={course.id}
                onClick={() => setSelectedCourseId(course.id)}
                className={`w-full rounded-xl px-3 py-3 text-left border transition ${selectedCourseId === course.id ? 'border-neon-violet bg-neon-violet/10' : 'border-darkborder bg-darkbg hover:border-neon-violet/30'}`}
              >
                <p className="text-sm font-semibold text-text-primary">{course.courseCode || 'COURSE'}</p>
                <p className="text-sm text-text-secondary line-clamp-2">{course.title}</p>
              </button>
            ))}
          </div>
        </div>
      </aside>

      <section className="space-y-6">
        <div className="bg-darkcard border border-darkborder rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Course Info</p>
              <h1 className="text-2xl font-heading font-bold text-text-primary mt-1">{courseForm.id ? 'Chỉnh sửa môn học' : 'Tạo môn học mới'}</h1>
            </div>
            <div className="flex gap-2">
              {courseForm.id && (
                <button onClick={removeCourse} className="px-4 py-2 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 flex items-center gap-2">
                  <Trash2 className="w-4 h-4" /> Xóa
                </button>
              )}
              <button onClick={saveCourse} disabled={savingCourse} className="px-4 py-2 rounded-xl bg-gradient-to-r from-neon-indigo to-neon-violet text-white flex items-center gap-2 disabled:opacity-60">
                <Save className="w-4 h-4" /> {savingCourse ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <input value={courseForm.title} onChange={(e) => setCourseForm((prev) => ({ ...prev, title: e.target.value }))} placeholder="Tên môn học" className="px-4 py-3 rounded-xl bg-darkbg border border-darkborder text-text-primary" />
            <input value={courseForm.courseCode} onChange={(e) => setCourseForm((prev) => ({ ...prev, courseCode: e.target.value }))} placeholder="Mã môn (PRO192)" className="px-4 py-3 rounded-xl bg-darkbg border border-darkborder text-text-primary" />
            <select value={courseForm.semesterId || ''} onChange={(e) => setCourseForm((prev) => ({ ...prev, semesterId: Number(e.target.value) || undefined }))} className="px-4 py-3 rounded-xl bg-darkbg border border-darkborder text-text-primary">
              <option value="">Chọn kỳ học</option>
              {semesters.map((semester) => <option key={semester.id} value={semester.id}>{semester.name}</option>)}
            </select>
            <select value={courseForm.status} onChange={(e) => setCourseForm((prev) => ({ ...prev, status: e.target.value }))} className="px-4 py-3 rounded-xl bg-darkbg border border-darkborder text-text-primary">
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
            </select>
          </div>

          <textarea value={courseForm.shortDescription} onChange={(e) => setCourseForm((prev) => ({ ...prev, shortDescription: e.target.value }))} rows={3} placeholder="Mô tả ngắn" className="w-full px-4 py-3 rounded-xl bg-darkbg border border-darkborder text-text-primary" />
          <textarea value={courseForm.description} onChange={(e) => setCourseForm((prev) => ({ ...prev, description: e.target.value }))} rows={4} placeholder="Mô tả chi tiết" className="w-full px-4 py-3 rounded-xl bg-darkbg border border-darkborder text-text-primary" />

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-text-primary"><ImageIcon className="w-4 h-4 text-neon-violet" /> Thumbnail</div>
              <ImageUpload value={courseForm.thumbnailUrl} onChange={(url) => setCourseForm((prev) => ({ ...prev, thumbnailUrl: url }))} />
            </div>
            <div className="grid gap-4 content-start">
              <input value={courseForm.previewVideoUrl} onChange={(e) => setCourseForm((prev) => ({ ...prev, previewVideoUrl: e.target.value }))} placeholder="Preview video URL" className="px-4 py-3 rounded-xl bg-darkbg border border-darkborder text-text-primary" />
              <input value={courseForm.requirements} onChange={(e) => setCourseForm((prev) => ({ ...prev, requirements: e.target.value }))} placeholder="Yêu cầu đầu vào" className="px-4 py-3 rounded-xl bg-darkbg border border-darkborder text-text-primary" />
              <input value={courseForm.whatYouLearn} onChange={(e) => setCourseForm((prev) => ({ ...prev, whatYouLearn: e.target.value }))} placeholder="Bạn sẽ học được gì" className="px-4 py-3 rounded-xl bg-darkbg border border-darkborder text-text-primary" />
            </div>
          </div>
        </div>

        <div className="bg-darkcard border border-darkborder rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Course Builder</p>
              <h2 className="text-xl font-heading font-bold text-text-primary mt-1">Chapter → Lesson → Assignment</h2>
            </div>
            <button onClick={addSection} className="px-4 py-2 rounded-xl border border-neon-violet/30 text-neon-violet hover:bg-neon-violet/10 flex items-center gap-2">
              <Plus className="w-4 h-4" /> Thêm chương
            </button>
          </div>

          <div className="space-y-4">
            {sections.map((section, sectionIndex) => {
              const expanded = expandedSections.includes(sectionIndex);
              return (
                <div key={`${section.id || 'new'}-${sectionIndex}`} className="border border-darkborder rounded-2xl overflow-hidden bg-darkbg/50">
                  <button onClick={() => toggleSectionExpand(sectionIndex)} className="w-full px-4 py-4 flex items-center justify-between gap-4 hover:bg-white/5">
                    <div className="flex items-center gap-3 text-left">
                      <FolderTree className="w-5 h-5 text-neon-violet" />
                      <div>
                        <p className="font-semibold text-text-primary">{section.title || `Chương ${sectionIndex + 1}`}</p>
                        <p className="text-xs text-text-muted">{section.lessons.length} bài học</p>
                      </div>
                    </div>
                    {expanded ? <ChevronDown className="w-4 h-4 text-text-muted" /> : <ChevronRight className="w-4 h-4 text-text-muted" />}
                  </button>

                  {expanded && (
                    <div className="border-t border-darkborder p-4 space-y-5">
                      <div className="grid gap-3 md:grid-cols-[1fr_120px]">
                        <input value={section.title} onChange={(e) => updateSection(sectionIndex, { title: e.target.value })} placeholder="Tên chương" className="px-4 py-3 rounded-xl bg-darkbg border border-darkborder text-text-primary" />
                        <label className="flex items-center gap-2 px-4 py-3 rounded-xl bg-darkbg border border-darkborder text-sm text-text-secondary">
                          <input type="checkbox" checked={section.isLocked} onChange={(e) => updateSection(sectionIndex, { isLocked: e.target.checked })} /> Khóa
                        </label>
                      </div>
                      <textarea value={section.description} onChange={(e) => updateSection(sectionIndex, { description: e.target.value })} rows={2} placeholder="Mô tả chương" className="w-full px-4 py-3 rounded-xl bg-darkbg border border-darkborder text-text-primary" />

                      <div className="space-y-4">
                        {section.lessons.map((lesson, lessonIndex) => (
                          <div key={`${lesson.id || 'new'}-${lessonIndex}`} className="rounded-2xl border border-darkborder bg-[#100f1a] p-4 space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-text-primary font-semibold">
                                <BookOpen className="w-4 h-4 text-neon-indigo" />
                                Bài học {lessonIndex + 1}
                              </div>
                              <button onClick={() => addAssignment(sectionIndex, lessonIndex)} className="text-xs px-3 py-1.5 rounded-lg border border-neon-violet/30 text-neon-violet hover:bg-neon-violet/10 flex items-center gap-1">
                                <ClipboardList className="w-3.5 h-3.5" /> Bài tập
                              </button>
                            </div>

                            <div className="grid gap-3 md:grid-cols-2">
                              <input value={lesson.title} onChange={(e) => updateLesson(sectionIndex, lessonIndex, { title: e.target.value })} placeholder="Tiêu đề bài học" className="px-4 py-3 rounded-xl bg-darkbg border border-darkborder text-text-primary" />
                              <input value={lesson.slug} onChange={(e) => updateLesson(sectionIndex, lessonIndex, { slug: e.target.value })} placeholder="Slug bài học" className="px-4 py-3 rounded-xl bg-darkbg border border-darkborder text-text-primary" />
                            </div>

                            <textarea value={lesson.description} onChange={(e) => updateLesson(sectionIndex, lessonIndex, { description: e.target.value })} rows={2} placeholder="Mô tả bài học" className="w-full px-4 py-3 rounded-xl bg-darkbg border border-darkborder text-text-primary" />

                            <div className="grid gap-3 lg:grid-cols-3">
                              <label className="rounded-xl border border-darkborder bg-darkbg px-4 py-3 text-sm text-text-secondary flex items-center gap-2"><Video className="w-4 h-4 text-neon-violet" />
                                <select value={lesson.videoPlatform} onChange={(e) => updateLesson(sectionIndex, lessonIndex, { videoPlatform: e.target.value as LessonFormState['videoPlatform'] })} className="bg-transparent text-text-primary outline-none w-full">
                                  <option value="EMBED">Embed trên web</option>
                                  <option value="YOUTUBE_TAB">Mở tab YouTube</option>
                                  <option value="DIRECT">Direct video</option>
                                </select>
                              </label>
                              <input value={lesson.videoUrl} onChange={(e) => updateLesson(sectionIndex, lessonIndex, { videoUrl: e.target.value })} placeholder="Video URL / YouTube URL" className="px-4 py-3 rounded-xl bg-darkbg border border-darkborder text-text-primary lg:col-span-2" />
                            </div>

                            <div className="grid gap-3 md:grid-cols-2">
                              <input value={lesson.sourceCodeUrl} onChange={(e) => updateLesson(sectionIndex, lessonIndex, { sourceCodeUrl: e.target.value })} placeholder="GitHub / source code URL" className="px-4 py-3 rounded-xl bg-darkbg border border-darkborder text-text-primary" />
                              <input type="number" value={lesson.videoDurationSeconds} onChange={(e) => updateLesson(sectionIndex, lessonIndex, { videoDurationSeconds: Number(e.target.value) })} placeholder="Thời lượng video (giây)" className="px-4 py-3 rounded-xl bg-darkbg border border-darkborder text-text-primary" />
                            </div>

                            <div>
                              <p className="mb-2 flex items-center gap-2 text-sm font-medium text-text-primary"><FileText className="w-4 h-4 text-neon-violet" /> Ghi chú giảng dạy</p>
                              <RichTextEditor value={lesson.teachingNotes} onChange={(value) => updateLesson(sectionIndex, lessonIndex, { teachingNotes: value, content: value })} placeholder="Nội dung note giảng dạy, markdown được hỗ trợ..." />
                            </div>

                            <div className="space-y-3">
                              {lesson.assignments.map((assignment, assignmentIndex) => (
                                <div key={`${assignment.id || 'new'}-${assignmentIndex}`} className="rounded-xl border border-darkborder bg-darkbg p-4 space-y-3">
                                  <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                                    <ClipboardList className="w-4 h-4 text-neon-violet" /> Bài tập {assignmentIndex + 1}
                                  </div>
                                  <input value={assignment.title} onChange={(e) => updateLesson(sectionIndex, lessonIndex, { assignments: lesson.assignments.map((item, idx) => idx === assignmentIndex ? { ...item, title: e.target.value } : item) })} placeholder="Tiêu đề bài tập" className="w-full px-4 py-3 rounded-xl bg-[#0b0b12] border border-darkborder text-text-primary" />
                                  <textarea value={assignment.instructions || ''} onChange={(e) => updateLesson(sectionIndex, lessonIndex, { assignments: lesson.assignments.map((item, idx) => idx === assignmentIndex ? { ...item, instructions: e.target.value } : item) })} rows={3} placeholder="Yêu cầu bài tập" className="w-full px-4 py-3 rounded-xl bg-[#0b0b12] border border-darkborder text-text-primary" />
                                  <input type="datetime-local" value={assignment.deadline ? assignment.deadline.slice(0, 16) : ''} onChange={(e) => updateLesson(sectionIndex, lessonIndex, { assignments: lesson.assignments.map((item, idx) => idx === assignmentIndex ? { ...item, deadline: e.target.value ? new Date(e.target.value).toISOString().slice(0, 19) : '' } : item) })} className="w-full px-4 py-3 rounded-xl bg-[#0b0b12] border border-darkborder text-text-primary" />
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}

                        <button onClick={() => addLesson(sectionIndex)} className="w-full rounded-xl border border-dashed border-neon-violet/30 py-3 text-sm text-neon-violet hover:bg-neon-violet/10 flex items-center justify-center gap-2">
                          <Plus className="w-4 h-4" /> Thêm bài học
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
