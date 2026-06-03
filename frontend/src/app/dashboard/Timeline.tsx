'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, BookOpen, Briefcase, Dumbbell, UtensilsCrossed, Moon, Coffee, Gamepad2, Users } from 'lucide-react';
import type { ActivityType, TimelineSlot } from './types';

const ACTIVITY_PRESETS: {
  type: ActivityType;
  label: string;
  icon: any;
  gradient: string;
  ring: string;
  glowColor: string;
  dotColor: string;
}[] = [
  { type: 'study',    label: 'Học tập',  icon: BookOpen,        gradient: 'from-violet-500/35 to-fuchsia-500/20', ring: 'ring-violet-400/60',  glowColor: '#8b5cf6', dotColor: '#7c3aed' },
  { type: 'work',    label: 'Làm việc', icon: Briefcase,       gradient: 'from-cyan-500/35 to-sky-500/20',   ring: 'ring-cyan-400/60',   glowColor: '#06b6d4', dotColor: '#0891b2' },
  { type: 'exercise', label: 'Thể dục',  icon: Dumbbell,        gradient: 'from-emerald-500/35 to-mint-500/20', ring: 'ring-emerald-400/60', glowColor: '#10b981', dotColor: '#059669' },
  { type: 'cook',    label: 'Nấu ăn',   icon: UtensilsCrossed, gradient: 'from-orange-500/35 to-rose-500/20',  ring: 'ring-orange-400/60',  glowColor: '#f97316', dotColor: '#ea580c' },
  { type: 'sleep',   label: 'Đi ngủ',   icon: Moon,            gradient: 'from-indigo-500/35 to-blue-500/20',   ring: 'ring-indigo-400/60',  glowColor: '#6366f1', dotColor: '#4f46e5' },
  { type: 'rest',    label: 'Nghỉ ngơi', icon: Coffee,          gradient: 'from-pink-500/35 to-rose-400/20',    ring: 'ring-pink-400/60',    glowColor: '#ec4899', dotColor: '#db2777' },
  { type: 'leisure', label: 'Giải trí', icon: Gamepad2,        gradient: 'from-amber-500/35 to-yellow-500/20', ring: 'ring-amber-400/60',   glowColor: '#f59e0b', dotColor: '#d97706' },
  { type: 'social',  label: 'Bạn bè',   icon: Users,           gradient: 'from-teal-500/35 to-cyan-500/20',    ring: 'ring-teal-400/60',    glowColor: '#14b8a6', dotColor: '#0d9488' },
];

const PRESET_BY_TYPE: Record<ActivityType, typeof ACTIVITY_PRESETS[number]> = Object.fromEntries(
  ACTIVITY_PRESETS.map((p) => [p.type, p])
) as any;

const formatHour = (h: number) =>
  h === 0 ? '0:00' : h === 12 ? '12:00 CH' : h < 12 ? `${h} SA` : `${h - 12} CH`;

interface Props {
  timeline: TimelineSlot[];
  onSetActivity: (hour: number, activity: TimelineSlot['activity']) => void;
}

export default function Timeline({ timeline, onSetActivity }: Props) {
  const [editingHour, setEditingHour] = useState<number | null>(null);
  const currentHour = new Date().getHours();

  return (
    <div className="relative rounded-3xl border border-white/5 bg-gradient-to-br from-[#161830]/90 to-[#0f111a]/90 backdrop-blur-xl p-5 md:p-7 shadow-2xl shadow-violet-500/5">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-black bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
            Timeline 24 giờ
          </h2>
          <p className="text-[11px] text-slate-500 mt-1">Click giờ để gán hoạt động</p>
        </div>
        {/* Color legend */}
        <div className="hidden lg:flex items-center gap-1.5 flex-wrap max-w-[200px]">
          {ACTIVITY_PRESETS.slice(0, 4).map((p) => {
            const Icon = p.icon;
            return (
              <span
                key={p.type}
                className={`flex items-center gap-1 px-1.5 py-1 rounded-lg bg-gradient-to-br ${p.gradient} text-[10px] text-white/90 font-medium ring-1 ${p.ring}`}
              >
                <Icon className="w-2.5 h-2.5 shrink-0" />
                <span className="whitespace-nowrap">{p.label}</span>
              </span>
            );
          })}
        </div>
      </div>

      {/* Hour grid */}
      <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2 mb-5">
        {timeline.map((slot) => {
          const preset = slot.activity ? PRESET_BY_TYPE[slot.activity.type] : null;
          const Icon = preset?.icon;
          const isNow = slot.hour === currentHour;
          const isPast = slot.hour < currentHour;

          return (
            <motion.button
              key={slot.hour}
              whileHover={{ scale: slot.activity ? 1.05 : 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setEditingHour(slot.hour)}
              className={`group relative aspect-square rounded-2xl border text-left p-2 transition-all duration-300 overflow-hidden
                ${slot.activity
                  ? `bg-gradient-to-br ${preset!.gradient} border-white/15 cursor-pointer`
                  : isPast
                  ? 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10'
                  : 'bg-white/[0.04] border-white/8 hover:bg-white/[0.07] hover:border-white/12'}
                ${isNow ? 'ring-2 ring-pink-400/80' : ''}`}
              style={slot.activity ? {
                boxShadow: `0 0 14px ${preset!.glowColor}33, inset 0 0 12px ${preset!.glowColor}15`,
              } : isNow ? {
                boxShadow: '0 0 18px rgba(244,114,182,0.3)',
              } : {}}
              title={`${formatHour(slot.hour)}${slot.activity ? ` — ${slot.activity.label}` : ''}`}
            >
              {/* Hour label */}
              <div className="relative z-10 flex items-center justify-between h-full">
                <span className={`text-[10px] font-mono font-bold ${slot.activity ? 'text-white/90' : isPast ? 'text-slate-600' : 'text-slate-400'}`}>
                  {String(slot.hour).padStart(2, '0')}
                </span>

                {/* Activity icon */}
                {slot.activity && Icon && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    className="self-end"
                  >
                    <Icon className="w-3.5 h-3.5 text-white/90 drop-shadow-lg" />
                  </motion.div>
                )}
              </div>

              {/* Activity color bar at bottom */}
              {slot.activity && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-[3px] rounded-b-2xl"
                  style={{
                    background: `linear-gradient(to right, ${preset!.dotColor}, ${preset!.glowColor})`,
                    boxShadow: `0 0 8px ${preset!.glowColor}`,
                  }}
                />
              )}

              {/* Now indicator */}
              {isNow && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse z-20"
                      style={{ boxShadow: '0 0 8px rgba(244,114,182,0.8)' }} />
              )}

              {/* Activity color dot */}
              {slot.activity && (
                <span
                  className="absolute top-1.5 left-1.5 w-1.5 h-1.5 rounded-full z-20"
                  style={{ background: preset!.dotColor, boxShadow: `0 0 6px ${preset!.glowColor}` }}
                />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Color legend row (mobile) */}
      <div className="flex flex-wrap gap-1.5">
        {ACTIVITY_PRESETS.map((p) => {
          const Icon = p.icon;
          return (
            <span
              key={p.type}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg bg-gradient-to-br ${p.gradient} text-[10px] text-white/90 font-medium ring-1 ${p.ring}`}
            >
              <Icon className="w-2.5 h-2.5" />
              {p.label}
            </span>
          );
        })}
      </div>

      {/* ── Activity picker modal ── */}
      <AnimatePresence>
        {editingHour !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
            onClick={() => setEditingHour(null)}
          >
            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.88, opacity: 0, y: 30 }}
              transition={{ type: 'spring', stiffness: 320, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl bg-gradient-to-br from-[#1a1c2e] via-[#161830] to-[#0f111a] border border-white/10 p-6 shadow-2xl"
              style={{ boxShadow: '0 0 60px rgba(168,85,247,0.15), 0 25px 50px rgba(0,0,0,0.5)' }}
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-lg font-black text-white">
                    Khung giờ <span className="text-violet-300 font-mono">{formatHour(editingHour)}</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">Chọn hoạt động cho giờ này</p>
                </div>
                <button
                  onClick={() => setEditingHour(null)}
                  className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {ACTIVITY_PRESETS.map((p) => {
                  const Icon = p.icon;
                  const isActive = timeline[editingHour]?.activity?.type === p.type;
                  return (
                    <motion.button
                      key={p.type}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        onSetActivity(editingHour, { type: p.type, label: p.label });
                        setEditingHour(null);
                      }}
                      className={`relative flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left text-sm transition-all duration-200 overflow-hidden
                        bg-gradient-to-br ${p.gradient} ring-1 ${p.ring}
                        ${isActive ? 'ring-2 ring-white/60' : 'hover:ring-white/30'}`}
                      style={!isActive ? {
                        boxShadow: `0 0 12px ${p.glowColor}25`,
                      } : {
                        boxShadow: `0 0 20px ${p.glowColor}50`,
                      }}
                    >
                      <Icon className="w-5 h-5 text-white shrink-0 drop-shadow" />
                      <span className="text-white/95 font-bold">{p.label}</span>
                      {isActive && (
                        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-white/80"
                              style={{ boxShadow: `0 0 6px ${p.glowColor}` }} />
                      )}
                    </motion.button>
                  );
                })}
              </div>

              <button
                onClick={() => {
                  onSetActivity(editingHour, undefined);
                  setEditingHour(null);
                }}
                className="mt-3 w-full py-2.5 rounded-2xl border border-white/10 text-slate-400 hover:bg-white/5 hover:text-slate-200 text-sm font-medium transition-all"
              >
                Xóa hoạt động
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
