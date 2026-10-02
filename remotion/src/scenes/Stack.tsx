import React from 'react';
import { useCurrentFrame } from 'remotion';
import { ease, expoOut, lin, pop } from '../anim';
import { Page } from '../components/Page';
import { Stage } from '../components/Stage';
import { Reveal } from '../components/Text';
import { COPY } from '../copy';
import { DESIGNS } from '../designs';
import { C, F } from '../theme';
import { BEAT } from '../timeline';

const BLOCKS: [number, number, number, number][] = [
  [0, 0, 560, 60],
  [0, 76, 560, 320],
  [0, 412, 172, 190],
  [194, 412, 172, 190],
  [388, 412, 172, 190],
  [0, 618, 560, 182],
];
const DESIGN = DESIGNS[33];

export const Stack: React.FC = () => {
  const f = useCurrentFrame();
  const reveal = ease(f, 62, 108, 0, 1, expoOut);
  const wireOp = lin(f, 70, 100, 1, 0.15);
  return (
    <Stage glow={{ x: 1460, y: 560, opacity: 0.12, size: 1200 }}>
      <div style={{ position: 'absolute', left: 120, top: 210, fontFamily: F.latin, fontWeight: 800, fontSize: 112, lineHeight: 1.12, letterSpacing: '-0.02em' }}>
        {COPY.stack.map((t, i) => {
          const s = pop(f, i * BEAT, 240, 16);
          return (
            <div key={t} style={{ display: 'flex', alignItems: 'baseline', gap: 22, transform: `translateY(${(1 - s) * 60}px) scale(${0.85 + 0.15 * s})`, transformOrigin: 'left center', opacity: s }}>
              {i > 0 && <span style={{ color: C.lime, fontSize: 72 }}>×</span>}
              <span>{t}</span>
              {i === COPY.stack.length - 1 && <span style={{ fontFamily: F.jp, fontWeight: 900 }}>。</span>}
            </div>
          );
        })}
      </div>
      <Reveal at={60} style={{ position: 'absolute', left: 120, top: 640 }}>
        <div style={{ fontSize: 52, fontWeight: 700, letterSpacing: '-0.01em' }}>{COPY.stackLead}</div>
      </Reveal>
      <div style={{ position: 'absolute', left: 1180, top: 150, width: 560, height: 800 }}>
        <svg width={560} height={800} style={{ position: 'absolute', inset: 0, opacity: wireOp }}>
          {BLOCKS.map(([x, y, w, h], i) => {
            const p = ease(f, 4 + i * 9, 18 + i * 9);
            const perim = 2 * (w + h);
            return (
              <rect
                key={i}
                x={x + 1}
                y={y + 1}
                width={w - 2}
                height={h - 2}
                rx={6}
                fill={C.lime}
                fillOpacity={0.06 * p}
                stroke={C.lime}
                strokeWidth={2}
                strokeDasharray={perim}
                strokeDashoffset={perim * (1 - p)}
              />
            );
          })}
        </svg>
        <div style={{ position: 'absolute', inset: 0, clipPath: `inset(0 0 ${(1 - reveal) * 100}% 0)` }}>
          <Page design={DESIGN} width={560} height={800} radius={10} />
        </div>
        {reveal > 0 && reveal < 1 && (
          <div style={{ position: 'absolute', left: -20, right: -20, top: reveal * 800 - 2, height: 4, background: C.lime, boxShadow: `0 0 24px ${C.lime}` }} />
        )}
      </div>
    </Stage>
  );
};
