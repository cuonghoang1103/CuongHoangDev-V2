'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, Layout, CalendarDays, Sparkles, ChevronRight, LogOut } from 'lucide-react';
import { toast } from 'sonner';

import AvatarCard from './AvatarCard';
import Timeline from './Timeline';
import TaskList from './TaskList';
import StatsModal from './StatsModal';
import { createDashboardStore } from './store';
import { useAuthStore } from '@/store/authStore';
import type { TaskScope } from './types';

// ── Seed dashboard into a nav-item-friendly path ──────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  const userId = user?.id
    ? String(user.id)
    : typeof window !== 'undefined'
    ? localStorage.getItem('userId') || 'guest'
    : 'guest';

  // Hydrate userId on client
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    if (user?.id) localStorage.setItem('userId', String(user.id));
    setHydrated(true);
  }, [user?.id]);

  const store = useMemo(() => createDashboardStore({ userId }), [userId]);

  const {
    level, exp, timeline, tasks, lastCelebrationDate,
    tomorrowPlanLockedDate, setActivity,
    addTask, toggleTask, removeTask, awardExp,
    markCelebrated, planTomorrow, ensureScopeSeeded,
  } = store();

  // Seed scopes on first load
  useEffect(() => {
    if (!hydrated) return;
    (['today', 'week', 'month'] as TaskScope[]).forEach((s) => ensureScopeSeeded(s));
  }, [hydrated]); // eslint-disable-line react-hooks/exhaustive-deps

  const todayTasks = tasks.filter((t) => t.scope === 'today');
  const weekTasks = tasks.filter((t) => t.scope === 'week');
  const monthTasks = tasks.filter((t) => t.scope === 'month');

  const doneToday = todayTasks.filter((t) => t.done).length;
  const totalToday = todayTasks.length;
  const todayPct = totalToday ? Math.round((doneToday / totalToday) * 100) : 0;
  const todayExpGained = doneToday * 25;

  const todayIso = new Date().toISOString().slice(0, 10);
  const alreadyCelebrated = lastCelebrationDate === todayIso;
  const alreadyPlanned = tomorrowPlanLockedDate === todayIso;

  const [statsOpen, setStatsOpen] = useState(false);

  const canShowEndOfDay = totalToday > 0 && todayTasks.every((t) => t.done) && !alreadyCelebrated;

  const handleEndOfDay = () => {
    awardExp(todayExpGained);
    setStatsOpen(true);
  };

  const handleCelebrate = () => {
    markCelebrated();
  };

  const handlePlanTomorrow = (titles: string[]) => {
    planTomorrow(titles);
    toast.success('Đã lưu kế hoạch cho ngày mai!');
  };

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-[#0f111a] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-violet-500/30 border-t-violet-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f111a] text-white">
      {/* Background ambience */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-fuchsia-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-600/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">Theo dõi ngày làm việc của bạn</p>
          </div>

          {/* Quick stats pills */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/5 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-300">{doneToday}/{totalToday}</span>
              <span className="text-slate-500">hôm nay</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/5 text-xs">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-white font-bold">Lv.{level}</span>
            </div>
          </div>
        </div>

        {/* Avatar / Level Card */}
        <AvatarCard
          level={level}
          exp={exp}
          username={user?.username}
        />

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: Timeline (2/5) */}
          <div className="lg:col-span-2">
            <Timeline
              timeline={timeline}
              onSetActivity={setActivity}
            />
          </div>

          {/* Right: Task list (3/5) */}
          <div className="lg:col-span-3 space-y-4">
            <TaskList
              tasks={tasks}
              onToggle={toggleTask}
              onAddTask={addTask}
              onRemove={removeTask}
            />

            {/* End-of-Day button */}
            {totalToday > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-white/5 bg-gradient-to-br from-[#161830]/80 to-[#0f111a]/80 p-4 flex items-center justify-between"
              >
                <div>
                  <div className="text-sm font-bold text-white">Tổng kết ngày</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {doneToday}/{totalToday} task hoàn thành — {todayPct}% — +{todayExpGained} EXP
                  </div>
                </div>
                <button
                  onClick={handleEndOfDay}
                  disabled={alreadyCelebrated}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all
                    ${alreadyCelebrated
                      ? 'bg-white/5 text-slate-500 cursor-not-allowed'
                      : canShowEndOfDay
                      ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/30 hover:opacity-90'
                      : 'bg-white/10 text-slate-300 hover:bg-white/15'}`}
                >
                  <Sparkles className="w-4 h-4" />
                  {alreadyCelebrated ? 'Đã tổng kết' : canShowEndOfDay ? 'Tổng kết ngay!' : 'Tổng kết ngày'}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </div>
        </div>

        {/* Footer hint */}
        <p className="text-center text-xs text-slate-600 pb-4">
          Dữ liệu được lưu cục bộ trên thiết bị này
        </p>
      </div>

      {/* End-of-Day Modal */}
      <AnimatePresence>
        {statsOpen && (
          <StatsModal
            open={statsOpen}
            todayTasks={todayTasks}
            expGained={todayExpGained}
            currentExp={exp}
            currentLevel={level}
            alreadyPlanned={alreadyPlanned}
            onClose={() => setStatsOpen(false)}
            onPlanTomorrow={handlePlanTomorrow}
            onCelebrate={handleCelebrate}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
