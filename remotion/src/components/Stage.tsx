import React from 'react';
import { AbsoluteFill } from 'remotion';
import { C } from '../theme';

type Glow = { x: number; y: number; color?: string; size?: number; opacity?: number };

export const Stage: React.FC<{ grid?: boolean; glow?: Glow; vignette?: boolean; children?: React.ReactNode }> = ({
  grid = true,
  glow,
  vignette = true,
  children,
}) => {
  const size = glow?.size ?? 900;
  return (
    <AbsoluteFill style={{ background: C.bg, overflow: 'hidden' }}>
      {grid && (
        <AbsoluteFill
          style={{
            backgroundImage: `linear-gradient(${C.line} 1px, transparent 1px), linear-gradient(90deg, ${C.line} 1px, transparent 1px)`,
            backgroundSize: '120px 120px',
          }}
        />
      )}
      {glow && (
        <div
          style={{
            position: 'absolute',
            left: glow.x - size / 2,
            top: glow.y - size / 2,
            width: size,
            height: size,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${glow.color ?? C.lime} 0%, transparent 62%)`,
            opacity: glow.opacity ?? 0.2,
          }}
        />
      )}
      {children}
      {vignette && (
        <AbsoluteFill style={{ background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)', pointerEvents: 'none' }} />
      )}
    </AbsoluteFill>
  );
};
