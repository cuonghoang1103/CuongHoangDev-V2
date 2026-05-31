'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { Code2, FolderOpen, Cpu, Users } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface StatItem {
  icon: typeof Code2;
  value: number;
  suffix: string;
  labelKey: string;
  color: string;
}

const stats: StatItem[] = [
  { icon: Code2, value: 3, suffix: '+', labelKey: 'stats.yearsExperience', color: 'neon-indigo' },
  { icon: FolderOpen, value: 20, suffix: '+', labelKey: 'stats.projectsDelivered', color: 'neon-violet' },
  { icon: Cpu, value: 15, suffix: '+', labelKey: 'stats.technologiesUsed', color: 'neon-fuchsia' },
  { icon: Users, value: 50, suffix: '+', labelKey: 'stats.happyClients', color: 'neon-cyan' },
];

interface AnimatedCounterProps {
  value: number;
  suffix: string;
  inView: boolean;
}

function AnimatedCounter({ value, suffix, inView }: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!inView) return;

    let start = 0;
    const duration = 2000; // 2 seconds
    const increment = value / (duration / 16); // 60fps

    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [inView, value]);

  return (
    <span className="tabular-nums">
      {displayValue}{suffix}
    </span>
  );
}

interface StatCardProps {
  stat: StatItem;
  index: number;
  inView: boolean;
}

function StatCard({ stat: { icon: Icon, value, suffix, labelKey, color }, index, inView }: StatCardProps) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: 'easeOut' }}
      className="relative group"
    >
      {/* Glow effect on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br ${color}/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

      <div className="relative p-6 bg-darkcard/50 rounded-2xl border border-darkborder/50 hover:border-current/50 transition-all duration-300">
        {/* Icon */}
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color}/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
          <Icon className={`w-6 h-6`} style={{ color: `var(--${color})` }} strokeWidth={1.5} />
        </div>

        {/* Value */}
        <div className="text-4xl md:text-5xl font-heading font-bold mb-2" style={{
          background: `linear-gradient(to right, var(--${color}), var(--${color})/70)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          <AnimatedCounter value={value} suffix={suffix} inView={inView} />
        </div>

        {/* Label */}
        <p className="text-sm text-text-muted">{t(labelKey)}</p>

        {/* Bottom accent line */}
        <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 group-hover:w-full transition-all duration-700`} style={{ background: `linear-gradient(to right, transparent, var(--${color}), transparent)` }} />
      </div>
    </motion.div>
  );
}

export default function StatsSection() {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section className="py-20 border-y border-darkborder relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-neon-indigo/5 via-transparent to-neon-violet/5" />

      <div ref={ref} className="max-w-6xl mx-auto px-4 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <StatCard
              key={stat.labelKey}
              stat={stat}
              index={index}
              inView={isInView}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
