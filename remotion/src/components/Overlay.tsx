import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { lin } from '../anim';
import { C, F } from '../theme';
import { DURATION, FLASHES, SCENES, SECTION_LABELS, sceneAt } from '../timeline';

export const Hud: React.FC = () => {
  const f = useCurrentFrame();
  if (f >= SCENES.end[0]) return null;
  const label = SECTION_LABELS[sceneAt(f)];
  return (
    <>
      <div style={{ position: 'absolute', top: 0, left: 0, height: 4, width: `${(f / DURATION) * 100}%`, background: C.lime }} />
      <div
        style={{
          position: 'absolute',
          top: 34,
          left: 72,
          fontFamily: F.mono,
          fontSize: 18,
          color: C.muted,
          letterSpacing: '0.18em',
          textShadow: '0 2px 12px rgba(0,0,0,0.9)',
          display: 'flex',
          gap: 14,
          alignItems: 'center',
        }}
      >
        <span style={{ width: 8, height: 8, background: C.lime, borderRadius: 4, display: 'inline-block' }} />
        SD SHOWREEL
      </div>
      <div style={{ position: 'absolute', top: 34, right: 72, fontFamily: F.mono, fontSize: 18, color: C.muted, letterSpacing: '0.18em', textShadow: '0 2px 12px rgba(0,0,0,0.9)' }}>{label}</div>
    </>
  );
};

export const Flash: React.FC = () => {
  const f = useCurrentFrame();
  let op = 0;
  for (const at of FLASHES) if (f >= at && f < at + 8) op = Math.max(op, lin(f, at, at + 8, 0.85, 0));
  if (op <= 0) return null;
  return <AbsoluteFill style={{ background: '#fff', opacity: op }} />;
};

export const FinalFade: React.FC = () => {
  const f = useCurrentFrame();
  const op = lin(f, DURATION - 14, DURATION - 1, 0, 1);
  if (op <= 0) return null;
  return <AbsoluteFill style={{ background: '#000', opacity: op }} />;
};
