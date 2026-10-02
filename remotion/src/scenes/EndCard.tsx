import React from 'react';
import { useCurrentFrame } from 'remotion';
import { ease, expoOut, pop } from '../anim';
import { Stage } from '../components/Stage';
import { COPY } from '../copy';
import { C, F } from '../theme';

// 差し替え前提の仮エンドカード。
export const EndCard: React.FC = () => {
  const f = useCurrentFrame();
  const s = pop(f, 2, 160, 13);
  const t = pop(f, 16, 200, 16);
  const line = ease(f, 20, 50, 0, 1, expoOut);
  return (
    <Stage grid={false} glow={{ x: 960, y: 520, opacity: 0.16, size: 1500 }}>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 34 }}>
        <div
          style={{
            width: 220,
            height: 220,
            borderRadius: 48,
            background: C.lime,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: F.latin,
            fontWeight: 800,
            fontSize: 118,
            color: '#000',
            letterSpacing: '-0.04em',
            transform: `scale(${s}) rotate(${(1 - s) * -12}deg)`,
            boxShadow: '0 30px 120px rgba(217,255,63,0.35)',
          }}
        >
          SD
        </div>
        <div style={{ width: 360 * line, height: 3, background: C.border }} />
        <div style={{ fontSize: 76, fontWeight: 900, letterSpacing: '0.04em', opacity: t, transform: `translateY(${(1 - t) * 30}px)` }}>{COPY.company}</div>
      </div>
    </Stage>
  );
};
