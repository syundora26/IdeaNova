import React from 'react';
import { useCurrentFrame } from 'remotion';
import { Page } from '../components/Page';
import { Stage } from '../components/Stage';
import { Body, Chip, Marker } from '../components/Text';
import { COPY } from '../copy';
import { DESIGNS } from '../designs';
import { C } from '../theme';
import { BEAT } from '../timeline';

const COLS = [
  [15, 16, 17],
  [18, 19, 21],
  [22, 23, 24],
];
const SPEEDS = [2.4, 3.4, 2.9];
const GAP = 36;
const PAGE_W = 300;
const PAGE_H = 900;
const MASK = 'linear-gradient(transparent 0%, black 12%, black 88%, transparent 100%)';

export const Scratch: React.FC = () => {
  const f = useCurrentFrame();
  const total = COLS[0].length * (PAGE_H + GAP);
  return (
    <Stage glow={{ x: 1450, y: 540, opacity: 0.1, size: 1300 }}>
      <div style={{ position: 'absolute', left: 980, top: -200, width: 1200, height: 1500, perspective: 1800 }}>
        <div style={{ width: '100%', height: '100%', transform: 'rotateY(-26deg) rotateX(6deg)', transformStyle: 'preserve-3d', display: 'flex', gap: GAP }}>
          {COLS.map((col, ci) => {
            const off = (f * SPEEDS[ci] + ci * 500) % total;
            const y = ci % 2 === 1 ? -(total - off) : -off;
            return (
              <div key={ci} style={{ width: PAGE_W, height: '100%', overflow: 'hidden', flex: 'none', WebkitMaskImage: MASK, maskImage: MASK }}>
                <div style={{ transform: `translateY(${y}px)` }}>
                  {[...col, ...col].map((di, k) => (
                    <Page key={k} design={DESIGNS[di]} width={PAGE_W} height={PAGE_H} radius={10} shadow={false} style={{ marginBottom: GAP }} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ position: 'absolute', left: 0, top: 0, width: 1150, height: '100%', background: `linear-gradient(90deg, ${C.bg} 60%, transparent 100%)` }} />
      <div style={{ position: 'absolute', left: 120, top: 250, width: 900 }}>
        <Marker index="01" title={COPY.scratch.title} />
        <div style={{ marginTop: 30 }}>
          <Body at={22}>{COPY.scratch.lines[0]}</Body>
          <Body at={44}>{COPY.scratch.lines[1]}</Body>
        </div>
        <div style={{ display: 'flex', gap: 18, marginTop: 44 }}>
          {COPY.scratch.chips.map((c, i) => (
            <Chip key={c} at={90 + i * BEAT}>
              {c}
            </Chip>
          ))}
        </div>
      </div>
    </Stage>
  );
};
