'use client';

import { motion } from 'framer-motion';
import { Zap, Star, Shield } from 'lucide-react';
import { expToNextLevel } from './store';

const AVATAR_URL = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=200&h=200&fit=crop&q=80';

interface Props {
  level: number;
  exp: number;
  username?: string;
}

export default function AvatarCard({ level, exp, username }: Props) {
  const needed = expToNextLevel(level);
  const pct = Math.min((exp / needed) * 100, 100);

  const glowColors = [
    'shadow-violet-500/30',
    'shadow-fuchsia-500/20',
    'shadow-cyan-500/15',
  ];

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#1a1c2e]/90 via-[#161830] to-[#0f111a]/90 p-6 md:p-8 backdrop-blur-xl">
      {/* Background orbs */}
      <div className="absolute -top-12 -left-12 w-40 h-40 rounded-full bg-violet-600/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-fuchsia-600/15 blur-3xl pointer-events-none" />

      <div className="relative flex items-center gap-5 md:gap-7">
        {/* Avatar */}
        <div className="shrink-0 relative">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 p-0.5">
            <div className="w-full h-full rounded-full bg-gradient-to-br from-[#1a1c2e] to-[#0f111a] p-0.5">
              <img
                src={AVATAR_URL}
                alt="Avatar"
                className="w-full h-full rounded-full object-cover"
              />
            </div>
          </div>
          {/* Glow ring */}
          <div className="absolute -inset-2 rounded-full bg-gradient-to-br from-violet-500/40 to-fuchsia-500/40 blur-md opacity-60 animate-pulse" />
          {/* Level badge */}
          <div className="absolute -bottom-1 -right-1 flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-[10px] font-black text-white shadow-lg shadow-violet-500/50 border border-white/20">
            <Star className="w-3 h-3" />
            Lv.{level}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-4 h-4 text-violet-400 shrink-0" />
            <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">
              {username ? `Chào ${username}` : 'Chào Chiến binh'}
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-black bg-gradient-to-r from-violet-200 via-fuchsia-200 to-cyan-200 bg-clip-text text-transparent mb-3 truncate">
            {username ? `${username}'s Dashboard` : 'Dashboard Chiến Binh'}
          </h1>

          {/* EXP bar */}
          <div>
            <div className="flex justify-between text-[11px] text-slate-400 mb-1.5">
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-violet-400" />
                EXP
              </span>
              <span className="font-mono">
                <span className="text-white font-bold">{exp}</span>
                <span className="text-slate-500"> / {needed}</span>
              </span>
            </div>
            <div className="relative h-3 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400"
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 1.2, ease: [0.34, 1.56, 0.64, 1] }}
                style={{ boxShadow: '0 0 16px rgba(168,85,247,0.7)' }}
              />
              {/* Shimmer */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_2s_ease-in-out_infinite]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
