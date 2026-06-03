'use client';

/**
 * Per-user dashboard state management using DIRECT localStorage.
 *
 * Why NOT Zustand persist:
 *  Zustand's persist middleware calls localStorage.setItem() ASYNCHRONOUSLY.
 *  When logout → localStorage cleared → page reloads → Zustand rehydrates from
 *  localStorage BEFORE React effects run. The old user's data briefly appears.
 *
 * Solution: Use localStorage DIRECTLY. All reads/writes are synchronous.
 *  - Key per user: "{userId}_dashboard"  (e.g. "123_dashboard", "guest_dashboard")
 *  - On user switch: overwrite old user's key with their current state
 *  - On login/logout: load from the correct user's key immediately
 */
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

function makeDefaultState(): DashboardState & { userId: string } {
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

function loadFromStorage(userId: string): DashboardState & { userId: string } {
  if (typeof window === 'undefined') return makeDefaultState();
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (raw) {
      const parsed = JSON.parse(raw) as DashboardState & { userId: string };
      // Sanity check — verify the data belongs to this userId
      if (parsed.userId === userId) return parsed;
    }
  } catch { /* corrupt data — use defaults */ }
  return { ...makeDefaultState(), userId };
}

function saveToStorage(state: DashboardState & { userId: string }): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(storageKey(state.userId), JSON.stringify(state));
  } catch { /* quota exceeded or private mode */ }
}

const seedTitles: Record<TaskScope, string[]> = {
  today: ['Học 1 chương sách / khóa học', 'Hoàn thành 1 task công việc', 'Tập thể dục 30 phút'],
  week:  ['Đọc xong 2 chương sách', 'Hoàn thành project cá nhân', 'Dọn dẹp phòng / không gian làm việc'],
  month: ['Hoàn thành mục tiêu lớn tháng này', 'Tiết kiệm đủ ngân sách', 'Học được kỹ năng mới'],
};

/** Singleton state — single source of truth for the current user */
let state: DashboardState & { userId: string } = makeDefaultState();

/** All subscriber callbacks */
type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  saveToStorage(state);
  listeners.forEach((l) => l());
}

// ── Public API ──────────────────────────────────────────────────────────────

export function getState(): DashboardState & { userId: string } {
  return state;
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Switch to a different user — loads their data from localStorage.
 * If no data for that user, returns fresh defaults.
 */
export function switchUser(newUserId: string): void {
  const oldUserId = state.userId;
  if (oldUserId === newUserId) return;
  console.log(`[Dashboard] switchUser: "${oldUserId}" → "${newUserId}"`);

  // Save current user's state before switching
  saveToStorage(state);

  // Load new user's state (synchronous — no async delay)
  state = loadFromStorage(newUserId);
  notify();
}

/** Force-clear and reload for logout */
export function clearAllState(): void {
  state = makeDefaultState();
  notify();
}

// ── Actions ────────────────────────────────────────────────────────────────

export function setActivity(hour: number, activityType: TimelineSlot['activity']): void {
  const next = [...state.timeline];
  next[hour] = { hour, activity: activityType };
  state = { ...state, timeline: next };
  notify();
}

export function setActivityFilter(filter: ActivityType | null): void {
  state = { ...state, activityFilter: filter };
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
  state = { ...state, tasks: [...state.tasks, t] };
  notify();
  return t;
}

export function toggleTask(id: string): void {
  state = {
    ...state,
    tasks: state.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
  };
  notify();
}

export function removeTask(id: string): void {
  state = { ...state, tasks: state.tasks.filter((t) => t.id !== id) };
  notify();
}

export function awardExp(amount: number): void {
  let exp = state.exp + amount;
  let level = state.level;
  let needed = expToNextLevel(level);
  while (exp >= needed) {
    exp -= needed;
    level += 1;
    needed = expToNextLevel(level);
  }
  state = { ...state, exp, level };
  notify();
}

export function markCelebrated(): void {
  state = { ...state, lastCelebrationDate: todayIso() };
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
  state = {
    ...state,
    tasks: [...state.tasks, ...newOnes],
    tomorrowPlanLockedDate: todayIso(),
  };
  notify();
}

export function ensureScopeSeeded(scope: TaskScope): void {
  const target = scopeDate(scope);
  if (state.tasks.some((t) => t.scope === scope && t.date === target)) return;
  const fresh: Task[] = seedTitles[scope].map((title, idx) => ({
    id: `${Date.now()}-${scope}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
    title,
    scope,
    done: false,
    date: target,
    exp: EXP_PER_TASK,
  }));
  state = { ...state, tasks: [...state.tasks, ...fresh] };
  notify();
}
