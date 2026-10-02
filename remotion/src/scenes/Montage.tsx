import React from 'react';
import { useCurrentFrame } from 'remotion';
import { beatPulse, multi, pop } from '../anim';
import { Page } from '../components/Page';
import { Stage } from '../components/Stage';
import { DESIGNS, jpOf, numberOf, tagOf } from '../designs';
import { C, F } from '../theme';
import { BEAT } from '../timeline';

// One design per beat, 16 beats.
const ORDER = [3, 2, 7, 10, 12, 0, 17, 20, 26, 33, 38, 39, 42, 44, 11, 5];

export const Montage: React.FC = () => {
  const f = useCurrentFrame();
  const current = Math.min(ORDER.length - 1, Math.floor(f / BEAT));
  const pulse = beatPulse(f);
  const cards: React.ReactNode[] = [];
  for (let i = Math.max(0, current - 3); i <= current; i++) {
    const design = DESIGNS[ORDER[i]];
    const d = (f - i * BEAT) / BEAT;
    const side = i % 2 === 0 ? -1 : 1;
    const enter = pop(f, i * BEAT, 210, 18);
    const scale = multi(d, [0, 1, 2, 3], [1, 0.8, 0.64, 0.52]) * (0.72 + 0.28 * enter);
    const x = multi(d, [0, 1, 2, 3], [0, 430 * side, 720 * side, 900 * side]) - side * 520 * (1 - enter);
    const y = multi(d, [0, 1, 2, 3], [0, -30, -60, -90]) + 60 * (1 - enter);
    const opacity = multi(d, [0, 1, 2, 3, 3.6], [1, 0.65, 0.35, 0.15, 0]);
    cards.push(
      <div key={i} style={{ position: 'absolute', left: 960 - 320, top: 540 - 450, zIndex: 100 + i, transform: `translate(${x}px, ${y}px) scale(${scale})`, opacity }}>
        <Page design={design} width={640} height={900} chrome scroll={(f - i * BEAT) * 4} />
      </div>,
    );
  }
  const design = DESIGNS[ORDER[current]];
  const labelIn = pop(f, current * BEAT, 240, 16);
  return (
    <Stage glow={{ x: 960, y: 540, opacity: 0.08 + 0.3 * pulse, size: 1400 }}>
      {cards}
      <div style={{ position: 'absolute', left: 110, bottom: 120, zIndex: 300 }}>
        <div style={{ fontSize: 54, fontWeight: 900, color: C.fg, opacity: labelIn, transform: `translateY(${(1 - labelIn) * 30}px)`, textShadow: '0 10px 40px rgba(0,0,0,0.6)' }}>
          {jpOf(design)}
        </div>
        <div
          style={{
            fontFamily: F.latin,
            fontWeight: 800,
            fontSize: 150,
            lineHeight: 1,
            letterSpacing: '-0.03em',
            color: C.lime,
            opacity: labelIn,
            transform: `translateY(${(1 - labelIn) * 60}px)`,
            textShadow: '0 10px 40px rgba(0,0,0,0.6)',
            whiteSpace: 'nowrap',
          }}
        >
          {tagOf(design)}
        </div>
      </div>
      <div style={{ position: 'absolute', right: 110, bottom: 130, zIndex: 300, fontFamily: F.mono, fontSize: 30, color: C.muted, letterSpacing: '0.1em' }}>
        <span style={{ color: C.lime }}>{numberOf(design)}</span> / 45
      </div>
      <div style={{ position: 'absolute', left: 110, right: 110, bottom: 80, zIndex: 300, display: 'flex', gap: 6 }}>
        {ORDER.map((_, i) => (
          <div key={i} style={{ flex: 1, height: 4, background: i <= current ? C.lime : C.border }} />
        ))}
      </div>
    </Stage>
  );
};
