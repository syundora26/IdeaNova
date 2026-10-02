import React from 'react';
import { useCurrentFrame } from 'remotion';
import { pop } from '../anim';
import { Stage } from '../components/Stage';
import { Reveal } from '../components/Text';
import { COPY } from '../copy';
import { C, F } from '../theme';

const BUBBLE = 'rgba(255,255,255,0.1)';

export const Cta: React.FC = () => {
  const f = useCurrentFrame();
  const sent = pop(f, 34, 200, 16);
  const typing = f >= 44 && f < 62;
  return (
    <Stage glow={{ x: 600, y: 540, opacity: 0.1, size: 1300 }}>
      <div style={{ position: 'absolute', left: 120, top: 300, width: 980 }}>
        <Reveal at={4}>
          <div style={{ fontSize: 70, fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.3 }}>{COPY.cta.line1}</div>
        </Reveal>
        <Reveal at={22} style={{ marginTop: 30 }}>
          <div style={{ fontSize: 42, fontWeight: 700, lineHeight: 1.5 }}>
            <span style={{ color: C.lime }}>{COPY.cta.line2a}</span>
            <br />
            {COPY.cta.line2b}
          </div>
        </Reveal>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 1180,
          top: 200,
          width: 620,
          height: 680,
          background: C.panel,
          border: `1px solid ${C.border}`,
          borderRadius: 32,
          padding: 30,
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingBottom: 18, borderBottom: `1px solid ${C.border}` }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              background: C.lime,
              color: '#000',
              fontFamily: F.latin,
              fontWeight: 800,
              fontSize: 18,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            SD
          </div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{COPY.company}</div>
          <div style={{ marginLeft: 'auto', fontFamily: F.mono, fontSize: 16, color: C.muted, letterSpacing: '0.15em' }}>DM</div>
        </div>
        <div
          style={{
            alignSelf: 'flex-end',
            background: C.lime,
            color: '#000',
            fontSize: 30,
            fontWeight: 900,
            padding: '14px 28px',
            borderRadius: '24px 24px 6px 24px',
            transform: `scale(${sent})`,
            transformOrigin: 'bottom right',
            opacity: sent,
          }}
        >
          {COPY.cta.send}
        </div>
        {typing && (
          <div style={{ alignSelf: 'flex-start', background: BUBBLE, padding: '16px 22px', borderRadius: '24px 24px 24px 6px', display: 'flex', gap: 8 }}>
            {[0, 1, 2].map((k) => (
              <span key={k} style={{ width: 10, height: 10, borderRadius: 5, background: C.muted, opacity: 0.4 + 0.6 * Math.abs(Math.sin((f + k * 4) / 4)) }} />
            ))}
          </div>
        )}
        {COPY.cta.replies.map((r, i) => {
          const s = pop(f, 62 + i * 14, 200, 16);
          return (
            <div
              key={r}
              style={{
                alignSelf: 'flex-start',
                background: BUBBLE,
                padding: '16px 24px',
                borderRadius: '24px 24px 24px 6px',
                width: 420,
                transform: `scale(${s})`,
                transformOrigin: 'bottom left',
                opacity: s,
              }}
            >
              <div style={{ fontSize: 26, fontWeight: 900 }}>{r}</div>
              <div style={{ marginTop: 10, height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.18)', width: `${70 + i * 10}%` }} />
              <div style={{ marginTop: 8, height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.12)', width: `${45 + i * 12}%` }} />
            </div>
          );
        })}
      </div>
    </Stage>
  );
};
