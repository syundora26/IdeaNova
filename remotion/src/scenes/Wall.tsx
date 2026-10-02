import React from 'react';
import { Img, staticFile, useCurrentFrame } from 'remotion';
import { beatPulse, ease, expoOut, lin, pingpong, pop } from '../anim';
import { Stage } from '../components/Stage';
import { COPY } from '../copy';
import { DESIGNS } from '../designs';
import { C, H, W } from '../theme';
import { BEAT } from '../timeline';

const COLS = 9;
const ROWS = 5;
const TW = W / COLS;
const TH = H / ROWS;

export const Wall: React.FC = () => {
  const f = useCurrentFrame();
  const zoom = ease(f, 0, 70, 3.4, 1, expoOut);
  const beatIdx = Math.floor(f / BEAT);
  const pulse = beatPulse(f);
  const band = lin(f, 62, 80);
  const t1 = pop(f, 72, 200, 16);
  const t2 = pop(f, 96, 200, 16);
  return (
    <Stage grid={false} vignette={false}>
      <div style={{ position: 'absolute', inset: 0, transform: `scale(${zoom})`, transformOrigin: '50% 50%' }}>
        {DESIGNS.map((d, i) => {
          const col = i % COLS;
          const row = Math.floor(i / COLS);
          const lit = (i * 31 + beatIdx * 17) % 45 < 7 ? pulse : 0;
          const w = TW - 4;
          const maxScroll = (d.height / d.width) * w - (TH - 4);
          return (
            <div key={d.id} style={{ position: 'absolute', left: col * TW + 2, top: row * TH + 2, width: w, height: TH - 4, overflow: 'hidden', background: '#fff', borderRadius: 6 }}>
              <Img src={staticFile(d.file)} style={{ width: w, display: 'block', transform: `translateY(${-pingpong(f * 0.8 + i * 23, maxScroll)}px)` }} />
              <div style={{ position: 'absolute', inset: 0, background: '#000', opacity: 0.5 * (1 - lit) }} />
            </div>
          );
        })}
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 330, height: 420, background: 'rgba(10,11,15,0.82)', opacity: band }} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 380, textAlign: 'center' }}>
        <div style={{ fontSize: 108, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.2, opacity: t1, transform: `translateY(${(1 - t1) * 50}px)` }}>{COPY.wall[0]}</div>
        <div style={{ fontSize: 108, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.2, color: C.lime, opacity: t2, transform: `translateY(${(1 - t2) * 50}px)` }}>{COPY.wall[1]}</div>
      </div>
    </Stage>
  );
};
