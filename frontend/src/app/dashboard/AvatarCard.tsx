'use client';

import { motion } from 'framer-motion';
import { Zap, Star, Shield } from 'lucide-react';
import { expToNextLevel } from './store';

const AVATAR_URL = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&h=400&fit=crop&q=85';

interface Props {
  level: number;
  exp: number;
  username?: string;
}

export default function AvatarCard({ level, exp, username }: Props) {
  const needed = expToNextLevel(level);
  const pct = Math.min((exp / needed) * 100, 100);
  const greeting = username ? `Chào ${username}` : 'Chào Chiến binh';

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#1a1c2e]/95 via-[#161830] to-[#0f111a]/95 p-6 md:p-8 backdrop-blur-2xl">
      {/* Ambient background orbs */}
      <div className="absolute -top-16 -left-16 w-56 h-56 rounded-full bg-violet-600/20 blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-fuchsia-600/15 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-cyan-600/5 blur-3xl pointer-events-none" />

      <div className="relative flex items-center gap-5 md:gap-8">
        {/* ── Avatar with neon ring + hover glow ── */}
        <div className="shrink-0 relative group cursor-pointer">
          {/* Outer glow ring */}
          <div className="absolute -inset-3 rounded-full bg-gradient-to-br from-violet-500/50 via-fuchsia-500/30 to-cyan-500/20 blur-lg opacity-0 group-hover:opacity-70 transition-opacity duration-500 animate-pulse" />

          {/* Neon border */}
          <div className="relative p-[3px] rounded-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-400 shadow-lg"
               style={{ boxShadow: '0 0 25px rgba(168,85,247,0.4), 0 0 50px rgba(168,85,247,0.15)' }}>
            <div className="w-full h-full rounded-full bg-gradient-to-br from-[#1a1c2e] to-[#0f111a] p-[3px]">
              <motion.img
                whileHover={{ scale: 1.08 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                src={AVATAR_URL}
                alt="Avatar"
                className="w-full h-full rounded-full object-cover"
                style={{ boxShadow: '0 0 20px rgba(168,85,247,0.3)' }}
              />
            </div>
          </div>

          {/* Level badge */}
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 18, delay: 0.3 }}
            className="absolute -bottom-2 -right-2 flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-[10px] font-black text-white shadow-xl border border-white/20"
            style={{ boxShadow: '0 0 15px rgba(168,85,247,0.6)' }}
          >
            <Star className="w-3 h-3 text-yellow-300 fill-yellow-300" />
            Lv.{level}
          </motion.div>
        </div>

        {/* ── Info panel ── */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <Shield className="w-4 h-4 text-violet-400 shrink-0" />
            <span className="text-[11px] text-slate-400 uppercase tracking-widest font-bold">
              {greeting}
            </span>
          </div>

          <h1 className="text-xl md:text-2xl font-black bg-gradient-to-r from-violet-200 via-fuchsia-200 to-cyan-200 bg-clip-text text-transparent mb-5 truncate">
            {username ? `${username}'s Dashboard` : 'Dashboard Chiến Binh'}
          </h1>

          {/* ── EXP bar ── */}
          <div>
            <div className="flex justify-between items-center text-[11px] mb-2">
              <span className="flex items-center gap-1.5 text-slate-400 font-medium">
                <Zap className="w-3.5 h-3.5 text-violet-400" />
                EXP
              </span>
              <div className="flex items-center gap-2">
                <motion.span
                  key={exp}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="font-mono font-black text-white text-sm"
                >
                  {exp}
                </motion.span>
                <span className="text-slate-600 font-mono text-xs">/ {needed}</span>
              </div>
            </div>

            <div className="relative h-3.5 rounded-full bg-white/[0.04] overflow-hidden border border-white/[0.06]">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400"
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 1.4, ease: [0.34, 1.56, 0.64, 1] }}
                style={{
                  boxShadow: '0 0 20px rgba(168,85,247,0.7), 0 0 40px rgba(168,85,247,0.3)',
                }}
              />
              {/* Shimmer */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/25 to-transparent animate-[shimmer_2.5s_ease-in-out_infinite]" />
              {/* Stars particles */}
              {pct >= 25 && (
                <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white/60" style={{ boxShadow: '0 0 6px rgba(255,255,255,0.8)' }} />
              )}
              {pct >= 75 && (
                <div className="absolute top-1/2 left-2/3 -translate-y-1/2 w-1 h-1 rounded-full bg-yellow-200/70" style={{ boxShadow: '0 0 4px rgba(253,224,71,0.8)' }} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
