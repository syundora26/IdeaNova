import React from 'react';
import { useCurrentFrame } from 'remotion';
import { ease, expoOut, pop } from '../anim';
import { C, F } from '../theme';

export const Reveal: React.FC<{ at: number; dur?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({
  at,
  dur = 18,
  children,
  style,
}) => {
  const f = useCurrentFrame();
  const p = ease(f, at, at + dur, 0, 1, expoOut);
  return (
    <div style={{ overflow: 'hidden', paddingBottom: 6, ...style }}>
      <div style={{ transform: `translateY(${(1 - p) * 110}%)`, opacity: p }}>{children}</div>
    </div>
  );
};

// "■ 見出し" with the square as the marker.
export const Marker: React.FC<{ index: string; title: string; at?: number }> = ({ index, title, at = 0 }) => {
  const f = useCurrentFrame();
  const s = pop(f, at, 200, 14);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 26 }}>
      <div style={{ width: 44, height: 44, background: C.lime, transform: `scale(${s}) rotate(${(1 - s) * 90}deg)`, flex: 'none' }} />
      <Reveal at={at + 3} dur={16}>
        <div style={{ fontSize: 80, fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.15, whiteSpace: 'nowrap' }}>{title}</div>
      </Reveal>
      <div style={{ fontFamily: F.mono, color: C.lime, fontSize: 22, letterSpacing: '0.2em', opacity: s, alignSelf: 'flex-start', marginTop: 4 }}>{index}</div>
    </div>
  );
};

export const Body: React.FC<{ at: number; children: React.ReactNode; size?: number; weight?: number; gap?: number; style?: React.CSSProperties }> = ({
  at,
  children,
  size = 44,
  weight = 700,
  gap = 18,
  style,
}) => (
  <Reveal at={at} dur={20} style={{ marginTop: gap }}>
    <div style={{ fontSize: size, fontWeight: weight, lineHeight: 1.5, letterSpacing: '-0.01em', ...style }}>{children}</div>
  </Reveal>
);

export const Chip: React.FC<{ at: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ at, children, style }) => {
  const f = useCurrentFrame();
  const s = pop(f, at, 220, 14);
  return (
    <div
      style={{
        display: 'inline-block',
        padding: '10px 28px',
        border: `2px solid ${C.lime}`,
        color: C.lime,
        borderRadius: 999,
        fontSize: 30,
        fontWeight: 700,
        transform: `scale(${0.6 + 0.4 * s})`,
        opacity: s,
        ...style,
      }}
    >
      {children}
    </div>
  );
};
