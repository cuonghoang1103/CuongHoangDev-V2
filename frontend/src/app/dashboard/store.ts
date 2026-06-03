'use client';

/**
 * Per-user dashboard store with strict data isolation.
 *
 * Architecture: ONE store singleton. userId lives inside the store state.
 * When userId changes, switchUser() WIPES all in-memory state and reloads
 * from that user's localStorage key.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ssrSafeStorage } from '@/store/ssrSafeStorage';
import type { DashboardState, Task, TimelineSlot, TaskScope, ActivityType } from './types';

const EXP_PER_TASK = 25;
const EXP_PER_LEVEL_BASE = 200;

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
    const day = d.getDay() || 7;
    d.setDate(d.getDate() - (day - 1));
    return d.toISOString().slice(0, 10);
  }
  return `${ref.getFullYear()}-${String(ref.getMonth() + 1).padStart(2, '0')}-01`;
}

function makeEmptyTimeline(): TimelineSlot[] {
  return Array.from({ length: 24 }, (_, h) => ({ hour: h }));
}

export interface DashboardStore extends DashboardState {
  setActivity: (hour: number, activityType: TimelineSlot['activity']) => void;
  setActivityFilter: (filter: ActivityType | null) => void;
  addTask: (title: string, scope: TaskScope, activityType?: ActivityType) => Task;
  toggleTask: (id: string) => void;
  removeTask: (id: string) => void;
  awardExp: (amount: number) => void;
  markCelebrated: () => void;
  planTomorrow: (titles: string[]) => void;
  ensureScopeSeeded: (scope: TaskScope) => void;
  getFilteredTasks: (scope: TaskScope) => Task[];
  /** Switch to a different user — wipes ALL current data immediately */
  switchUser: (newUserId: string) => void;
}

const seedTitles: Record<TaskScope, string[]> = {
  today: ['Học 1 chương sách / khóa học', 'Hoàn thành 1 task công việc', 'Tập thể dục 30 phút'],
  week:  ['Đọc xong 2 chương sách', 'Hoàn thành project cá nhân', 'Dọn dẹp phòng / không gian làm việc'],
  month: ['Hoàn thành mục tiêu lớn tháng này', 'Tiết kiệm đủ ngân sách', 'Học được kỹ năng mới'],
};

/** ONE singleton store. Single localStorage key: 'dashboard-state'. */
/** Internal Zustand store — exposed as useDashboardStore for components */
export const useDashboardStoreBase = create<DashboardStore>()(
  persist(
    (set, get) => ({
      userId: 'guest',
      level: 1,
      exp: 0,
      lastCelebrationDate: null,
      tomorrowPlanLockedDate: null,
      timeline: makeEmptyTimeline(),
      activityFilter: null,
      tasks: [],

      setActivity: (hour, activityType) =>
        set((s) => {
          const next = [...s.timeline];
          next[hour] = { hour, activity: activityType };
          return { timeline: next };
        }),

      setActivityFilter: (filter) => set({ activityFilter: filter }),

      addTask: (title, scope, activityType?: ActivityType) => {
        const t: Task = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          title: title.trim(),
          scope,
          done: false,
          date: scopeDate(scope),
          exp: EXP_PER_TASK,
          activityType,
        };
        set((s) => ({ tasks: [...s.tasks, t] }));
        return t;
      },

      toggleTask: (id) =>
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
        })),

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

      markCelebrated: () => set({ lastCelebrationDate: todayIso() }),

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
              scope: 'today' as TaskScope,
              done: false,
              date: iso,
              exp: EXP_PER_TASK,
            }));
          return { tasks: [...s.tasks, ...newOnes], tomorrowPlanLockedDate: todayIso() };
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

      getFilteredTasks: (scope) => {
        const { tasks, activityFilter } = get();
        const base = tasks.filter((t) => t.scope === scope);
        if (!activityFilter) return base;
        return base.filter((t) => t.activityType === activityFilter);
      },

      switchUser: (newUserId) => {
        const { userId: old } = get();
        if (old === newUserId) return;
        console.log(`[Dashboard] switchUser: "${old}" → "${newUserId}"`);
        set({
          userId: newUserId,
          level: 1,
          exp: 0,
          lastCelebrationDate: null,
          tomorrowPlanLockedDate: null,
          timeline: makeEmptyTimeline(),
          activityFilter: null,
          tasks: [],
        });
      },
    }),
    {
      name: 'dashboard-state',
      storage: createJSONStorage(() => ssrSafeStorage),
    }
  )
);
