'use client';

import { useEffect, useRef } from 'react';
import { useMusicStore } from '@/store/musicStore';

interface WaveformVisualizerProps {
  barCount?: number;
  width?: number;
  height?: number;
  className?: string;
  barColor?: string;
  gradientColors?: [string, string];
  isNight?: boolean;
}

export default function WaveformVisualizer({
  barCount = 40,
  width = 300,
  height = 60,
  className = '',
  barColor,
  gradientColors,
  isNight = true,
}: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const { isPlaying, currentTrack } = useMusicStore();

  const primaryColor = barColor || (isNight ? '#8b5cf6' : '#6366f1');
  const secondaryColor = gradientColors
    ? gradientColors[1]
    : isNight
    ? '#ec4899'
    : '#d946ef';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, primaryColor);
    gradient.addColorStop(0.5, secondaryColor);
    gradient.addColorStop(1, primaryColor);

    // Bar configuration
    const barWidth = width / barCount - 1;
    const minHeight = 2;

    // Animation state
    let phase = 0;

    // Generate bar heights based on frequency simulation
    const generateBarHeights = (): number[] => {
      return Array.from({ length: barCount }, (_, i) => {
        const normalizedPos = i / barCount;
        // Create wave patterns
        const wave1 = Math.sin(phase + normalizedPos * Math.PI * 4) * 0.5 + 0.5;
        const wave2 = Math.sin(phase * 1.5 + normalizedPos * Math.PI * 6) * 0.3 + 0.5;
        const wave3 = Math.sin(phase * 0.7 + normalizedPos * Math.PI * 2) * 0.2 + 0.5;
        const noise = Math.random() * 0.2;

        // Combine waves
        const combined = wave1 * 0.5 + wave2 * 0.3 + wave3 * 0.2 + noise;

        // Center the bars
        return minHeight + combined * (height * 0.8);
      });
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      const barHeights = isPlaying ? generateBarHeights() : Array(barCount).fill(minHeight);

      // Draw bars
      barHeights.forEach((barHeight, i) => {
        const x = i * (barWidth + 1);
        const y = (height - barHeight) / 2;

        // Glow effect for night mode
        if (isNight) {
          ctx.shadowColor = primaryColor;
          ctx.shadowBlur = 8;
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, barWidth / 2);
        ctx.fill();

        // Reset shadow
        ctx.shadowBlur = 0;

        // Add reflection
        if (isNight) {
          ctx.fillStyle = `rgba(${hexToRgb(primaryColor)}, 0.15)`;
          ctx.beginPath();
          ctx.roundRect(x, height - y, barWidth, barHeight * 0.3, barWidth / 2);
          ctx.fill();
        }
      });

      if (isPlaying) {
        phase += 0.08;
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [width, height, barCount, isPlaying, primaryColor, secondaryColor, isNight]);

  // Re-animate when track changes
  useEffect(() => {
    if (currentTrack) {
      phase = 0;
    }
  }, [currentTrack?.id]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ display: 'block' }}
    />
  );
}

// Helper to convert hex to RGB for rgba() usage
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '139, 92, 246';
  return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
}
