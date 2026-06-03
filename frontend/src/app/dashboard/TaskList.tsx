'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Check, Plus, Trash2, Sparkles } from 'lucide-react';
import type { Task, TaskScope } from './types';

const SCOPE_LABELS: Record<TaskScope, string> = {
  today: 'Hôm nay',
  week: 'Tuần này',
  month: 'Mục tiêu tháng',
};

const SCOPE_COLORS: Record<TaskScope, string> = {
  today: 'from-violet-500 to-fuchsia-500',
  week: 'from-cyan-500 to-blue-500',
  month: 'from-amber-400 to-orange-500',
};

interface Props {
  tasks: Task[];
  onToggle: (id: string) => void;
  onAddTask: (title: string, scope: TaskScope) => void;
  onRemove: (id: string) => void;
}

function fireConfetti() {
  const colors = ['#a855f7', '#ec4899', '#06b6d4', '#f59e0b', '#10b981'];
  confetti({
    particleCount: 90,
    spread: 80,
    origin: { y: 0.5 },
    colors,
    startVelocity: 35,
    gravity: 0.9,
    scalar: 1.2,
  });
}

export default function TaskList({ tasks, onToggle, onAddTask, onRemove }: Props) {
  const [activeScope, setActiveScope] = useState<TaskScope>('today');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [adding, setAdding] = useState(false);
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());

  const visible = tasks.filter((t) => t.scope === activeScope);
  const done = visible.filter((t) => t.done);
  const pct = visible.length ? Math.round((done.length / visible.length) * 100) : 0;

  const handleToggle = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const wasDone = doneIds.has(id);
    if (!wasDone) {
      fireConfetti();
      setDoneIds((s) => new Set([...Array.from(s), id]));
    } else {
      setDoneIds((s) => { const n = new Set(Array.from(s)); n.delete(id); return n; });
    }
    onToggle(id);
  };

  const handleAdd = () => {
    if (!newTaskTitle.trim()) return;
    onAddTask(newTaskTitle.trim(), activeScope);
    setNewTaskTitle('');
    setAdding(false);
  };

  return (
    <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-[#161830]/80 to-[#0f111a]/80 backdrop-blur-xl p-5 md:p-7 shadow-2xl shadow-violet-500/5">
      {/* Tab bar */}
      <div className="flex gap-1.5 mb-5">
        {(Object.keys(SCOPE_LABELS) as TaskScope[]).map((scope) => {
          const count = tasks.filter((t) => t.scope === scope && !t.done).length;
          const scopeDone = tasks.filter((t) => t.scope === scope && t.done).length;
          const scopeTotal = tasks.filter((t) => t.scope === scope).length;
          const scopePct = scopeTotal ? Math.round((scopeDone / scopeTotal) * 100) : 0;
          return (
            <button
              key={scope}
              onClick={() => setActiveScope(scope)}
              className={`flex-1 relative px-3 py-2 rounded-xl text-sm font-medium transition-all overflow-hidden
                ${activeScope === scope
                  ? `bg-gradient-to-r ${SCOPE_COLORS[scope]} text-white shadow-lg`
                  : 'bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] hover:text-white'}`}
            >
              {activeScope === scope && (
                <motion.div
                  layoutId="taskTabBg"
                  className="absolute inset-0 bg-gradient-to-r from-violet-600 to-fuchsia-600"
                  style={{ zIndex: -1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">{SCOPE_LABELS[scope]}</span>
              {count > 0 && (
                <span className={`relative z-10 ml-1.5 px-1.5 py-0.5 rounded-full text-[11px] font-bold
                  ${activeScope === scope ? 'bg-white/20 text-white' : 'bg-white/10 text-slate-400'}`}>
                  {count}
                </span>
              )}
              {scopePct === 100 && scopeTotal > 0 && (
                <Sparkles className="relative z-10 ml-1.5 w-3.5 h-3.5 text-yellow-300" />
              )}
            </button>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-slate-400 mb-1.5">
          <span>{done.length}/{visible.length} hoàn thành</span>
          <span className="font-mono font-bold text-white">{pct}%</span>
        </div>
        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
          <motion.div
            className={`h-full rounded-full bg-gradient-to-r ${SCOPE_COLORS[activeScope]}`}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
            style={{ boxShadow: '0 0 12px rgba(168,85,247,0.5)' }}
          />
        </div>
      </div>

      {/* Task list */}
      <div className="space-y-2 min-h-[100px]">
        <AnimatePresence>
          {visible.map((task) => (
            <motion.div
              key={task.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex items-center gap-3 group"
            >
              <button
                onClick={() => handleToggle(task.id)}
                className={`shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all
                  ${task.done
                    ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500 border-transparent shadow-[0_0_10px_rgba(168,85,247,0.6)]'
                    : 'border-white/20 hover:border-violet-400/60 bg-white/5 hover:bg-violet-500/10'}`}
              >
                {task.done && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
              </button>
              <span
                className={`flex-1 text-sm transition-all ${
                  task.done
                    ? 'line-through text-slate-500'
                    : 'text-slate-200 group-hover:text-white'
                }`}
              >
                {task.title}
              </span>
              <span className={`shrink-0 text-[11px] font-mono px-1.5 py-0.5 rounded-md
                ${task.done ? 'bg-violet-500/10 text-violet-300' : 'bg-white/5 text-slate-500'}`}>
                +{task.exp} EXP
              </span>
              <button
                onClick={() => onRemove(task.id)}
                className="shrink-0 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/15 text-slate-600 hover:text-red-400 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {visible.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-slate-500">
            <Sparkles className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-sm">Chưa có task nào. Thêm ngay!</p>
          </div>
        )}
      </div>

      {/* Add task */}
      {adding ? (
        <div className="mt-4 flex gap-2">
          <input
            autoFocus
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Tên task..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50 focus:bg-violet-500/5 transition-all"
          />
          <button onClick={handleAdd} className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-medium hover:opacity-90 transition-opacity">
            Thêm
          </button>
          <button onClick={() => { setAdding(false); setNewTaskTitle(''); }} className="px-3 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:bg-white/5 text-sm">
            Hủy
          </button>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-white/10 text-slate-500 hover:text-white hover:border-white/20 transition-all text-sm group"
        >
          <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
          Thêm task
        </button>
      )}
    </div>
  );
}
