'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { X, Star, Trophy, Calendar, Plus, Heart, CheckCircle2 } from 'lucide-react';
import type { Task, TaskScope } from './types';
import { expToNextLevel } from './store';

const CONGRATS_MESSAGES = [
  'Onii-chan hôm nay tuyệt vời lắm! Level up thôi!',
  'Senpai đã hoàn thành xuất sắc nhiệm vụ ngày hôm nay!',
  'Bạn làm được rồi! Ngày mai sẽ còn tuyệt vời hơn!',
  'Fantastic! Tiếp tục phát huy nhé, champion!',
  'Hôm nay bạn đã rất nỗ lực! Tự hào về bạn!',
];

const ENCOURAGE_MESSAGES = [
  'Ngày mai chúng ta sẽ làm tốt hơn! Cố lên nhé!',
  'Không sao cả, ngày mai là cơ hội mới. Đừng bỏ cuộc!',
  'Mỗi ngày là một bước tiến. Tiếp tục nhé!',
  'Bạn đã cố gắng rất nhiều rồi! Ngày mai sẽ thành công!',
];

function pickMsg(arr: string[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

interface Props {
  open: boolean;
  todayTasks: Task[];
  expGained: number;
  currentExp: number;
  currentLevel: number;
  alreadyPlanned: boolean;
  onClose: () => void;
  onPlanTomorrow: (titles: string[]) => void;
  onCelebrate: () => void;
}

export default function StatsModal({
  open,
  todayTasks,
  expGained,
  currentExp,
  currentLevel,
  alreadyPlanned,
  onClose,
  onPlanTomorrow,
  onCelebrate,
}: Props) {
  const [tomorrowPlan, setTomorrowPlan] = useState<string[]>(['', '', '']);
  const [step, setStep] = useState<'stats' | 'plan'>('stats');

  const done = todayTasks.filter((t) => t.done);
  const pct = todayTasks.length ? Math.round((done.length / todayTasks.length) * 100) : 0;
  const isPerfect = pct === 100;

  const neededNext = expToNextLevel(currentLevel);
  const expProgress = (currentExp / neededNext) * 100;

  const handleOpen = () => {
    if (isPerfect) {
      const duration = 2500;
      let fired = 0;
      const interval = setInterval(() => {
        confetti({
          particleCount: 120,
          spread: 100,
          origin: { x: Math.random(), y: 0.5 },
          colors: ['#a855f7', '#ec4899', '#06b6d4', '#f59e0b', '#10b981', '#ffffff'],
          startVelocity: 40,
          gravity: 0.85,
          scalar: 1.3,
        });
        fired++;
        if (fired >= 5) clearInterval(interval);
      }, 500);
    }
    setStep('stats');
  };

  const canClose = step === 'stats'
    ? (isPerfect || alreadyPlanned || tomorrowPlan.filter((t) => t.trim()).length >= 3)
    : true;

  const handleClose = () => {
    if (step === 'stats') {
      if (isPerfect || alreadyPlanned) {
        onCelebrate();
        onClose();
      } else {
        const planned = tomorrowPlan.filter((t) => t.trim());
        if (planned.length >= 3) {
          onPlanTomorrow(planned);
          onCelebrate();
          onClose();
        } else {
          setStep('plan');
        }
      }
    } else {
      const planned = tomorrowPlan.filter((t) => t.trim());
      if (planned.length >= 3) {
        onPlanTomorrow(planned);
        onCelebrate();
        onClose();
      }
    }
  };

  const updatePlan = (i: number, val: string) => {
    setTomorrowPlan((prev) => {
      const next = [...prev];
      next[i] = val;
      return next;
    });
  };

  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
      onAnimationStart={handleOpen}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: 40 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="w-full max-w-md rounded-3xl bg-gradient-to-br from-[#1a1c2e] via-[#161830] to-[#0f111a] border border-white/10 overflow-hidden shadow-2xl shadow-violet-500/20"
      >
        {/* Header */}
        <div className="relative p-6 pb-4 text-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-violet-600/20 to-transparent pointer-events-none" />
          <div className="relative">
            <div className="text-5xl mb-2">{isPerfect ? '🌟' : '💪'}</div>
            <h2 className="text-2xl font-black bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
              {isPerfect ? 'Level Up!' : 'Tổng kết ngày'}
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              {isPerfect ? 'Hôm nay hoàn hảo tuyệt đối!' : 'Ngày của bạn như thế nào?'}
            </p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 'stats' ? (
            <motion.div
              key="stats"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="px-6 pb-6 space-y-4"
            >
              {/* Completion ring */}
              <div className="flex justify-center">
                <div className="relative w-28 h-28">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                    <motion.circle
                      cx="50" cy="50" r="42"
                      fill="none"
                      stroke="url(#grad)"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 42}`}
                      initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                      animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - pct / 100) }}
                      transition={{ duration: 1.2, ease: [0.34, 1.56, 0.64, 1] }}
                    />
                    <defs>
                      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#a855f7" />
                        <stop offset="100%" stopColor="#ec4899" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-white">{pct}%</span>
                    <span className="text-[10px] text-slate-400">hoàn thành</span>
                  </div>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-white/[0.04] border border-white/5 p-3 text-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                  <div className="text-lg font-black text-white">{done.length}</div>
                  <div className="text-[10px] text-slate-400">Đã xong</div>
                </div>
                <div className="rounded-2xl bg-white/[0.04] border border-white/5 p-3 text-center">
                  <Star className="w-5 h-5 text-violet-400 mx-auto mb-1" />
                  <div className="text-lg font-black text-white">+{expGained}</div>
                  <div className="text-[10px] text-slate-400">EXP nhận</div>
                </div>
                <div className="rounded-2xl bg-white/[0.04] border border-white/5 p-3 text-center">
                  <Trophy className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                  <div className="text-lg font-black text-white">{currentLevel}</div>
                  <div className="text-[10px] text-slate-400">Level hiện tại</div>
                </div>
              </div>

              {/* EXP progress */}
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>EXP Level {currentLevel}</span>
                  <span className="font-mono">{currentExp}/{neededNext}</span>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${expProgress}%` }}
                    transition={{ duration: 1, ease: 'easeOut', delay: 0.5 }}
                    style={{ boxShadow: '0 0 10px rgba(168,85,247,0.6)' }}
                  />
                </div>
              </div>

              {/* Message */}
              <div className="rounded-2xl bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20 p-3 text-center">
                <p className="text-sm italic text-slate-300">
                  {isPerfect ? pickMsg(CONGRATS_MESSAGES) : pickMsg(ENCOURAGE_MESSAGES)}
                </p>
              </div>

              {/* Next action */}
              {step === 'stats' && !isPerfect && !alreadyPlanned && (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Calendar className="w-3.5 h-3.5 shrink-0" />
                  <span>Bạn cần lên kế hoạch cho ngày mai để đóng modal</span>
                </div>
              )}

              <button
                onClick={handleClose}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold text-sm shadow-lg shadow-violet-500/30 hover:opacity-90 transition-opacity"
              >
                {isPerfect
                  ? ' Tiếp tục!'
                  : alreadyPlanned
                  ? 'Đã lên kế hoạch rồi! Tiếp tục'
                  : step === 'stats'
                  ? 'Lên kế hoạch cho ngày mai'
                  : 'Hoàn tất'}
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="plan"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="px-6 pb-6 space-y-4"
            >
              <div className="text-center">
                <Calendar className="w-10 h-10 text-cyan-400 mx-auto mb-2" />
                <h3 className="text-lg font-bold text-white">Lên kế hoạch cho ngày mai</h3>
                <p className="text-xs text-slate-400 mt-1">Ít nhất 3 task cho ngày mai nhé!</p>
              </div>

              {tomorrowPlan.map((val, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="shrink-0 w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500/30 to-fuchsia-500/20 text-center text-xs font-bold text-white/80 leading-6">
                    {i + 1}
                  </span>
                  <input
                    autoFocus={i === 0}
                    value={val}
                    onChange={(e) => updatePlan(i, e.target.value)}
                    placeholder={`Task ${i + 1} cho ngày mai...`}
                    className="flex-1 bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 focus:bg-cyan-500/5 transition-all"
                  />
                </div>
              ))}

              <button
                onClick={() => setTomorrowPlan((p) => [...p, ''])}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-white/10 text-slate-500 hover:text-white hover:border-white/20 text-sm transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                Thêm task
              </button>

              <div className="text-xs text-slate-500 text-center">
                {tomorrowPlan.filter((t) => t.trim()).length}/3 task đã nhập
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setStep('stats')}
                  className="flex-1 py-3 rounded-2xl border border-white/10 text-slate-400 text-sm hover:bg-white/5 transition-colors"
                >
                  Quay lại
                </button>
                <button
                  onClick={handleClose}
                  disabled={tomorrowPlan.filter((t) => t.trim()).length < 3}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20 hover:opacity-90 transition-opacity"
                >
                  Xác nhận &amp; tiếp tục
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Close X */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-white/10 text-slate-500 hover:text-white transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </motion.div>
    </motion.div>
  );
}
