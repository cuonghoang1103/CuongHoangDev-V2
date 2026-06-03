'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ssrSafeStorage } from '@/store/ssrSafeStorage';
import type { DashboardState, Task, TimelineSlot, TaskScope } from './types';

const EXP_PER_TASK = 25;
const EXP_PER_LEVEL_BASE = 200;

/** XP required to reach the next level from `level` */
export function expToNextLevel(level: number): number {
  return EXP_PER_LEVEL_BASE + (level - 1) * 50;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function scopeDate(scope: TaskScope, ref = new Date()): string {
  if (scope === 'today') return todayIso();
  if (scope === 'week') {
    const d = new Date(ref);
    const day = d.getDay() || 7; // Sun=0 → 7
    d.setDate(d.getDate() - (day - 1));
    return d.toISOString().slice(0, 10);
  }
  // month
  return `${ref.getFullYear()}-${String(ref.getMonth() + 1).padStart(2, '0')}-01`;
}

function makeEmptyTimeline(): TimelineSlot[] {
  return Array.from({ length: 24 }, (_, h) => ({ hour: h }));
}

interface DashboardStore extends DashboardState {
  setActivity: (hour: number, activityType: TimelineSlot['activity']) => void;
  addTask: (title: string, scope: TaskScope) => Task;
  toggleTask: (id: string) => void;
  removeTask: (id: string) => void;
  /** Award EXP for finishing all tasks of `scope` today (called by End-of-Day modal) */
  awardExp: (amount: number) => void;
  markCelebrated: () => void;
  /** Replace the 3 planned tasks for "tomorrow" */
  planTomorrow: (titles: string[]) => void;
  /** Seed fresh task list for a scope (used by daily reset) */
  ensureScopeSeeded: (scope: TaskScope) => void;
}

interface CreateOptions {
  userId: string;
}

const seedTitles: Record<TaskScope, string[]> = {
  today: [
    'Học 1 chương sách / khóa học',
    'Hoàn thành 1 task công việc',
    'Tập thể dục 30 phút',
  ],
  week: [
    'Đọc xong 2 chương sách',
    'Hoàn thành project cá nhân',
    'Dọn dẹp phòng / không gian làm việc',
  ],
  month: [
    'Hoàn thành mục tiêu lớn tháng này',
    'Tiết kiệm đủ ngân sách',
    'Học được kỹ năng mới',
  ],
};

export function createDashboardStore(opts: CreateOptions) {
  const storageKey = `dashboard-${opts.userId}`;

  return create<DashboardStore>()(
    persist(
      (set, get) => ({
        level: 1,
        exp: 0,
        lastCelebrationDate: null,
        tomorrowPlanLockedDate: null,
        timeline: makeEmptyTimeline(),
        tasks: [],

        setActivity: (hour, activityType) =>
          set((s) => {
            const next = [...s.timeline];
            next[hour] = { hour, activity: activityType };
            return { timeline: next };
          }),

        addTask: (title, scope) => {
          const t: Task = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            title: title.trim(),
            scope,
            done: false,
            date: scopeDate(scope),
            exp: EXP_PER_TASK,
          };
          set((s) => ({ tasks: [...s.tasks, t] }));
          return t;
        },

        toggleTask: (id) =>
          set((s) => {
            const next = s.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
            return { tasks: next };
          }),

        removeTask: (id) =>
          set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),

        awardExp: (amount) =>
          set((s) => {
            let exp = s.exp + amount;
            let level = s.level;
            let needed = expToNextLevel(level);
            while (exp >= needed) {
              exp -= needed;
              level += 1;
              needed = expToNextLevel(level);
            }
            return { exp, level };
          }),

        markCelebrated: () =>
          set(() => ({ lastCelebrationDate: todayIso() })),

        planTomorrow: (titles) =>
          set((s) => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const iso = tomorrow.toISOString().slice(0, 10);
            const newOnes: Task[] = titles
              .map((t) => t.trim())
              .filter((t) => t.length > 0)
              .map((title, idx) => ({
                id: `${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
                title,
                scope: 'today',
                done: false,
                date: iso,
                exp: EXP_PER_TASK,
              }));
            return {
              tasks: [...s.tasks, ...newOnes],
              tomorrowPlanLockedDate: todayIso(),
            };
          }),

        ensureScopeSeeded: (scope) =>
          set((s) => {
            const target = scopeDate(scope);
            const has = s.tasks.some((t) => t.scope === scope && t.date === target);
            if (has) return s;
            const fresh: Task[] = seedTitles[scope].map((title, idx) => ({
              id: `${Date.now()}-${scope}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
              title,
              scope,
              done: false,
              date: target,
              exp: EXP_PER_TASK,
            }));
            return { tasks: [...s.tasks, ...fresh] };
          }),
      }),
      {
        name: storageKey,
        storage: createJSONStorage(() => ssrSafeStorage),
      }
    )
  );
}

// Type alias for the hook returned by create
export type DashboardStoreHook = ReturnType<typeof createDashboardStore>;

// Helper: list of task scope seeds
export const SCOPES: TaskScope[] = ['today', 'week', 'month'];
