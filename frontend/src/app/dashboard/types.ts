// Shared types for the Dashboard page

export type ActivityType =
  | 'study'
  | 'work'
  | 'exercise'
  | 'cook'
  | 'sleep'
  | 'rest'
  | 'leisure'
  | 'social';

export interface TimelineSlot {
  /** 0-23 */
  hour: number;
  /** Optional activity assigned to this hour */
  activity?: {
    type: ActivityType;
    label: string;
  };
}

export type TaskScope = 'today' | 'week' | 'month';

export interface Task {
  id: string;
  title: string;
  scope: TaskScope;
  done: boolean;
  /** ISO date (yyyy-mm-dd) — defaults to today/week-start/month-start */
  date: string;
  exp: number;
}

export interface DashboardState {
  level: number;
  exp: number;
  /** YYYY-MM-DD of the last "end of day" celebration */
  lastCelebrationDate: string | null;
  /** YYYY-MM-DD of the last reset that locked tomorrow's plan */
  tomorrowPlanLockedDate: string | null;
  timeline: TimelineSlot[];
  tasks: Task[];
}
