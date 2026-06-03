'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, BookOpen, Briefcase, Dumbbell, UtensilsCrossed, Moon, Coffee, Gamepad2, Users } from 'lucide-react';
import type { ActivityType, TimelineSlot } from './types';

const ACTIVITY_PRESETS: { type: ActivityType; label: string; icon: any; gradient: string; ring: string }[] = [
  { type: 'study',    label: 'Học tập',     icon: BookOpen,        gradient: 'from-violet-500/30 to-fuchsia-500/20',  ring: 'ring-violet-400/50'  },
  { type: 'work',     label: 'Làm việc',    icon: Briefcase,       gradient: 'from-cyan-500/30 to-sky-500/20',        ring: 'ring-cyan-400/50'    },
  { type: 'exercise', label: 'Thể dục',     icon: Dumbbell,        gradient: 'from-emerald-500/30 to-mint-500/20',   ring: 'ring-emerald-400/50' },
  { type: 'cook',     label: 'Nấu ăn',      icon: UtensilsCrossed, gradient: 'from-orange-500/30 to-rose-500/20',     ring: 'ring-orange-400/50'  },
  { type: 'sleep',    label: 'Đi ngủ',      icon: Moon,            gradient: 'from-indigo-500/30 to-blue-500/20',     ring: 'ring-indigo-400/50'  },
  { type: 'rest',     label: 'Nghỉ ngơi',   icon: Coffee,          gradient: 'from-pink-500/30 to-rose-400/20',       ring: 'ring-pink-400/50'    },
  { type: 'leisure',  label: 'Giải trí',    icon: Gamepad2,        gradient: 'from-amber-500/30 to-yellow-500/20',   ring: 'ring-amber-400/50'   },
  { type: 'social',   label: 'Bạn bè',      icon: Users,           gradient: 'from-teal-500/30 to-cyan-500/20',       ring: 'ring-teal-400/50'    },
];

const PRESET_BY_TYPE: Record<ActivityType, typeof ACTIVITY_PRESETS[number]> = Object.fromEntries(
  ACTIVITY_PRESETS.map((p) => [p.type, p])
) as any;

const formatHour = (h: number) =>
  h === 0 ? '0:00' : h === 12 ? '12:00' : h < 12 ? `${h}:00 SA` : `${h - 12}:00 CH`;

interface Props {
  timeline: TimelineSlot[];
  onSetActivity: (hour: number, activity: TimelineSlot['activity']) => void;
}

export default function Timeline({ timeline, onSetActivity }: Props) {
  const [editingHour, setEditingHour] = useState<number | null>(null);

  const currentHour = new Date().getHours();

  return (
    <div className="relative rounded-3xl border border-white/5 bg-gradient-to-br from-[#161830]/80 to-[#0f111a]/80 backdrop-blur-xl p-5 md:p-7 shadow-2xl shadow-violet-500/5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
            Timeline 24 giờ
          </h2>
          <p className="text-xs text-slate-400 mt-1">Click vào khung giờ để gán hoạt động</p>
        </div>
        <div className="hidden md:flex flex-wrap gap-1.5 max-w-md">
          {ACTIVITY_PRESETS.slice(0, 4).map((p) => {
            const Icon = p.icon;
            return (
              <span key={p.type} className={`flex items-center gap-1 px-2 py-1 rounded-lg bg-gradient-to-br ${p.gradient} text-[11px] text-white/90 ring-1 ${p.ring}`}>
                <Icon className="w-3 h-3" />{p.label}
              </span>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2">
        {timeline.map((slot) => {
          const preset = slot.activity ? PRESET_BY_TYPE[slot.activity.type] : null;
          const Icon = preset?.icon;
          const isNow = slot.hour === currentHour;

          return (
            <button
              key={slot.hour}
              onClick={() => setEditingHour(slot.hour)}
              className={`group relative aspect-square rounded-xl border text-left p-1.5 transition-all overflow-hidden
                ${slot.activity
                  ? `bg-gradient-to-br ${preset!.gradient} border-white/10 hover:scale-[1.04]`
                  : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10'}
                ${isNow ? 'ring-2 ring-pink-400/70 shadow-[0_0_18px_rgba(244,114,182,0.35)]' : ''}`}
              title={`${formatHour(slot.hour)}${slot.activity ? ` — ${slot.activity.label}` : ''}`}
            >
              <div className="flex flex-col h-full justify-between">
                <span className={`text-[10px] font-mono ${slot.activity ? 'text-white/90' : 'text-slate-500'}`}>
                  {String(slot.hour).padStart(2, '0')}
                </span>
                {slot.activity && Icon && (
                  <Icon className="w-3.5 h-3.5 text-white/80 self-end drop-shadow" />
                )}
              </div>
              {isNow && (
                <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {editingHour !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setEditingHour(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl bg-gradient-to-br from-[#1a1c2e] to-[#0f111a] border border-white/10 p-6 shadow-2xl shadow-violet-500/20"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">
                  Khung giờ <span className="text-violet-300 font-mono">{formatHour(editingHour)}</span>
                </h3>
                <button onClick={() => setEditingHour(null)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {ACTIVITY_PRESETS.map((p) => {
                  const Icon = p.icon;
                  const isActive = timeline[editingHour]?.activity?.type === p.type;
                  return (
                    <button
                      key={p.type}
                      onClick={() => {
                        onSetActivity(editingHour, { type: p.type, label: p.label });
                        setEditingHour(null);
                      }}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-left text-sm transition-all
                        bg-gradient-to-br ${p.gradient} ring-1 ${p.ring}
                        ${isActive ? 'scale-[0.97] ring-2 ring-white/50' : 'hover:scale-[1.02]'}`}
                    >
                      <Icon className="w-4 h-4 text-white" />
                      <span className="text-white/95 font-medium">{p.label}</span>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => {
                  onSetActivity(editingHour, undefined);
                  setEditingHour(null);
                }}
                className="mt-3 w-full py-2 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 text-sm"
              >
                Xóa hoạt động khung giờ này
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
