import React from 'react';
import { useCurrentFrame } from 'remotion';
import { ease, lin, pop } from '../anim';
import { Code } from '../components/Code';
import { Stage } from '../components/Stage';
import { CODE_LINES, COPY } from '../copy';
import { C } from '../theme';

export const ColdOpen: React.FC = () => {
  const f = useCurrentFrame();
  const chars = Math.floor(lin(f, 6, 42, 0, COPY.open1.length));
  const cursorOn = f % 14 < 7;
  const slam = pop(f, 60, 220, 16);
  const shakeAmp = f >= 90 ? lin(f, 90, 120, 1, 9) : 0;
  const shake = Math.sin(f * 2.1) * shakeAmp;
  const bar = ease(f, 74, 96);
  const codeOp = ease(f, 60, 70, 0, 0.3);
  return (
    <Stage>
      {f >= 60 && (
        <Code
          lines={CODE_LINES}
          repeat={4}
          size={26}
          style={{ position: 'absolute', left: 140, top: 300, width: 1640, opacity: codeOp, transform: `translateY(${-(f - 60) * 12}px)` }}
        />
      )}
      {f < 60 && (
        <div style={{ position: 'absolute', left: 160, top: 470, fontSize: 96, fontWeight: 900, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center' }}>
          <span>{COPY.open1.slice(0, chars)}</span>
          <span style={{ display: 'inline-block', width: 10, height: 92, background: C.lime, marginLeft: 10, opacity: cursorOn ? 1 : 0 }} />
        </div>
      )}
      {f >= 60 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: `translate(${shake}px, ${shake * 0.6}px)`,
          }}
        >
          <div style={{ transform: `scale(${1.6 - 0.6 * slam})`, opacity: lin(f, 60, 64) }}>
            <div style={{ fontSize: 128, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.1, textShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>{COPY.open2}</div>
            <div style={{ height: 14, width: `${bar * 100}%`, background: C.lime, marginTop: 18 }} />
          </div>
        </div>
      )}
    </Stage>
  );
};
