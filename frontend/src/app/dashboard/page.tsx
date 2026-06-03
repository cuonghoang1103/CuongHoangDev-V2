'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChevronRight, Zap } from 'lucide-react';
import { toast } from 'sonner';

import AvatarCard from './AvatarCard';
import Timeline from './Timeline';
import TaskList from './TaskList';
import StatsModal from './StatsModal';
import { createDashboardStore } from './store';
import { useAuthStore } from '@/store/authStore';
import type { TaskScope } from './types';

export default function DashboardPage() {
  const { user } = useAuthStore();

  const userId = user?.id
    ? String(user.id)
    : typeof window !== 'undefined'
    ? localStorage.getItem('userId') || 'guest'
    : 'guest';

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

  useEffect(() => {
    if (!hydrated) return;
    (['today', 'week', 'month'] as TaskScope[]).forEach((s) => ensureScopeSeeded(s));
  }, [hydrated]); // eslint-disable-line react-hooks/exhaustive-deps

  const todayTasks = tasks.filter((t) => t.scope === 'today');
  const doneToday = todayTasks.filter((t) => t.done).length;
  const totalToday = todayTasks.length;
  const todayPct = totalToday ? Math.round((doneToday / totalToday) * 100) : 0;
  const todayExpGained = doneToday * 25;

  const todayIso = new Date().toISOString().slice(0, 10);
  const alreadyCelebrated = lastCelebrationDate === todayIso;
  const alreadyPlanned = tomorrowPlanLockedDate === todayIso;
  const isAllDone = totalToday > 0 && todayTasks.every((t) => t.done);

  const [statsOpen, setStatsOpen] = useState(false);

  const handleEndOfDay = () => {
    awardExp(todayExpGained);
    setStatsOpen(true);
  };

  const handleCelebrate = () => markCelebrated();

  const handlePlanTomorrow = (titles: string[]) => {
    planTomorrow(titles);
    toast.success('Đã lưu kế hoạch cho ngày mai!');
  };

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-[#0f111a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-violet-500/30 border-t-violet-400 rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">Đang tải Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f111a] text-white pb-16">
      {/* Background ambience */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-violet-600/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-fuchsia-600/8 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-cyan-600/4 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 pt-6 space-y-6">
        {/* ── Header ── */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-sm text-slate-500 mt-1">Theo dõi ngày làm việc của bạn</p>
          </div>

          {/* Quick stat pills */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/[0.04] border border-white/[0.06] text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-300 font-medium">{doneToday}/{totalToday}</span>
              <span className="text-slate-600">hôm nay</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/[0.04] border border-white/[0.06] text-xs">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-white font-black">Lv.{level}</span>
            </div>
          </div>
        </div>

        {/* ── Avatar / Level Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <AvatarCard level={level} exp={exp} username={user?.username} />
        </motion.div>

        {/* ── Main grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Left: Timeline */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="lg:col-span-2"
          >
            <Timeline timeline={timeline} onSetActivity={setActivity} />
          </motion.div>

          {/* Right: Tasks + End-of-day */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="lg:col-span-3 space-y-4"
          >
            <TaskList
              tasks={tasks}
              onToggle={toggleTask}
              onAddTask={addTask}
              onRemove={removeTask}
            />

            {/* ── End-of-Day panel ── */}
            {totalToday > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="rounded-3xl border border-white/[0.06] overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
                  backdropFilter: 'blur(20px)',
                }}
              >
                {/* Top accent bar */}
                <div className="h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400" />

                <div className="p-5 flex flex-col sm:flex-row items-center gap-4">
                  {/* Left: info */}
                  <div className="flex-1 text-center sm:text-left">
                    <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                      <Zap className="w-4 h-4 text-violet-400" />
                      <span className="text-sm font-black text-white">Tổng kết ngày</span>
                      {isAllDone && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                          HOÀN THÀNH
                        </span>
                      )}
                    </div>
                    <div className="text-[12px] text-slate-500">
                      {doneToday}/{totalToday} task · {todayPct}% · +{todayExpGained} EXP
                    </div>

                    {/* Mini progress bar */}
                    <div className="mt-2 max-w-[200px] mx-auto sm:mx-0 h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${todayPct}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        style={{ boxShadow: '0 0 8px rgba(168,85,247,0.5)' }}
                      />
                    </div>
                  </div>

                  {/* Right: button */}
                  <div className="shrink-0">
                    <motion.button
                      whileHover={!alreadyCelebrated && isAllDone ? { scale: 1.04 } : {}}
                      whileTap={!alreadyCelebrated && isAllDone ? { scale: 0.97 } : {}}
                      onClick={handleEndOfDay}
                      disabled={alreadyCelebrated}
                      className={`relative flex items-center gap-2.5 px-6 py-3 rounded-2xl font-bold text-sm transition-all duration-300
                        ${alreadyCelebrated
                          ? 'bg-white/[0.04] text-slate-500 cursor-not-allowed border border-white/[0.06]'
                          : isAllDone
                          ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white'
                          : 'bg-white/[0.06] text-slate-400 border border-white/[0.06] hover:border-white/[0.1]'}`}
                      style={isAllDone && !alreadyCelebrated ? {
                        boxShadow: '0 0 30px rgba(168,85,247,0.4), 0 8px 20px rgba(0,0,0,0.3)',
                      } : {}}
                    >
                      <Sparkles className="w-4 h-4" />
                      {alreadyCelebrated ? 'Đã tổng kết hôm nay'
                        : isAllDone ? 'Tổng kết ngay!'
                        : 'Tổng kết ngày'}
                      <ChevronRight className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-slate-700 pb-4">
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
