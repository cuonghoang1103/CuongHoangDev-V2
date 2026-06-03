'use client';

/**
 * Per-user dashboard state — uses React useSyncExternalStore for correct
 * hydration semantics. Zero Zustand, zero async rehydration issues.
 *
 * Key per user: "{userId}_dashboard"  (e.g. "42_dashboard", "guest_dashboard")
 *
 * Timing guarantee:
 *  - Server / first render: returns default state (no localStorage)
 *  - After auth rehydrates (user known): loads from correct user key
 *  - Actions only write to the current user's key
 *  - User switch: saves old user → loads new user → notifies
 */
import { useSyncExternalStore } from 'react';
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

function makeDefault(): DashboardState & { userId: string } {
  return {
    userId: 'guest',
    level: 1,
    exp: 0,
    lastCelebrationDate: null,
    tomorrowPlanLockedDate: null,
    timeline: makeEmptyTimeline(),
    activityFilter: null,
    tasks: [],
  };
}

function storageKey(userId: string): string {
  return `${userId}_dashboard`;
}

// ── Module-level singleton (mutable — OK because we always notify on write) ──

let currentState: DashboardState & { userId: string } = makeDefault();
const listeners = new Set<() => void>();

function notify() {
  saveToStorage(currentState);
  listeners.forEach((l) => l());
}

function saveToStorage(s: DashboardState & { userId: string }) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(storageKey(s.userId), JSON.stringify(s));
  } catch { /* private mode / quota */ }
}

function loadFromStorage(userId: string): DashboardState & { userId: string } {
  if (typeof window === 'undefined') return makeDefault();
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return makeDefault();
    const parsed = JSON.parse(raw) as DashboardState & { userId: string };
    if (parsed.userId === userId) return parsed;
  } catch { /* corrupt */ }
  return makeDefault();
}

// ── Public API ──────────────────────────────────────────────────────────────

export { currentState as getState };

export function subscribeStore(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSnapshot(): DashboardState & { userId: string } {
  return currentState;
}

/** Call this whenever auth userId changes (including logout → guest). */
export function switchUser(newUserId: string): void {
  const oldId = currentState.userId;
  if (oldId === newUserId) return;
  console.log(`[Dashboard] switchUser: "${oldId}" → "${newUserId}"`);
  saveToStorage(currentState); // persist old user
  currentState = loadFromStorage(newUserId);
  notify();
}

// ── Actions ────────────────────────────────────────────────────────────────

export function setActivity(hour: number, activity: TimelineSlot['activity']): void {
  const next = [...currentState.timeline];
  next[hour] = { hour, activity };
  currentState = { ...currentState, timeline: next };
  notify();
}

export function setActivityFilter(filter: ActivityType | null): void {
  currentState = { ...currentState, activityFilter: filter };
  notify();
}

export function addTask(title: string, scope: TaskScope, activityType?: ActivityType): Task {
  const t: Task = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: title.trim(),
    scope,
    done: false,
    date: scopeDate(scope),
    exp: EXP_PER_TASK,
    activityType,
  };
  currentState = { ...currentState, tasks: [...currentState.tasks, t] };
  notify();
  return t;
}

export function toggleTask(id: string): void {
  currentState = {
    ...currentState,
    tasks: currentState.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
  };
  notify();
}

export function removeTask(id: string): void {
  currentState = { ...currentState, tasks: currentState.tasks.filter((t) => t.id !== id) };
  notify();
}

export function awardExp(amount: number): void {
  let exp = currentState.exp + amount;
  let level = currentState.level;
  let needed = expToNextLevel(level);
  while (exp >= needed) {
    exp -= needed;
    level += 1;
    needed = expToNextLevel(level);
  }
  currentState = { ...currentState, exp, level };
  notify();
}

export function markCelebrated(): void {
  currentState = { ...currentState, lastCelebrationDate: todayIso() };
  notify();
}

export function planTomorrow(titles: string[]): void {
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
  currentState = {
    ...currentState,
    tasks: [...currentState.tasks, ...newOnes],
    tomorrowPlanLockedDate: todayIso(),
  };
  notify();
}

export function ensureScopeSeeded(scope: TaskScope): void {
  const target = scopeDate(scope);
  if (currentState.tasks.some((t) => t.scope === scope && t.date === target)) return;
  const fresh: Task[] = seedTitles[scope].map((title, idx) => ({
    id: `${Date.now()}-${scope}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
    title,
    scope,
    done: false,
    date: target,
    exp: EXP_PER_TASK,
  }));
  currentState = { ...currentState, tasks: [...currentState.tasks, ...fresh] };
  notify();
}

const seedTitles: Record<TaskScope, string[]> = {
  today: ['Học 1 chương sách / khóa học', 'Hoàn thành 1 task công việc', 'Tập thể dục 30 phút'],
  week:  ['Đọc xong 2 chương sách', 'Hoàn thành project cá nhân', 'Dọn dẹp phòng / không gian làm việc'],
  month: ['Hoàn thành mục tiêu lớn tháng này', 'Tiết kiệm đủ ngân sách', 'Học được kỹ năng mới'],
};
