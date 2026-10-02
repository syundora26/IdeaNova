import React from 'react';
import { useCurrentFrame } from 'remotion';
import { ease, expoOut, lin, pop } from '../anim';
import { Stage } from '../components/Stage';
import { Body, Marker } from '../components/Text';
import { COPY } from '../copy';
import { C, F } from '../theme';

const NODES = 6;
const ARC_LEN = 260;

export const Quality: React.FC = () => {
  const f = useCurrentFrame();
  const arc = ease(f, 206, 232, 0, 1, expoOut);
  const xLast = 40 + 596;
  const xPrev = 40 + (4 * 596) / 5;
  return (
    <Stage glow={{ x: 1400, y: 540, opacity: 0.1, size: 1200 }}>
      <div style={{ position: 'absolute', left: 120, top: 200, width: 900 }}>
        <Marker index="03" title={COPY.quality.title} />
        <div style={{ marginTop: 26 }}>
          <Body at={18} size={40}>
            {COPY.quality.line1}
          </Body>
        </div>
        <div style={{ marginTop: 40 }}>
          <Body at={95} size={50} weight={900}>
            {COPY.quality.line2a}
          </Body>
          <Body at={108} size={50} weight={900} gap={0}>
            <span style={{ color: C.lime }}>{COPY.quality.line2b}</span>
          </Body>
        </div>
        <div style={{ marginTop: 36 }}>
          <Body at={150} size={40}>
            {COPY.quality.line3}
          </Body>
        </div>
      </div>

      <div style={{ position: 'absolute', left: 1060, top: 150, width: 740, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 24, padding: 32, boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
            <span key={c} style={{ width: 12, height: 12, borderRadius: 6, background: c }} />
          ))}
        </div>
        {COPY.quality.checks.map(([label, cmd], i) => {
          const at = 30 + i * 22;
          const s = pop(f, at, 220, 14);
          const typedN = Math.floor(lin(f, at - 14, at, 0, cmd.length));
          return (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '14px 0', borderTop: i ? `1px solid ${C.border}` : undefined }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  background: C.lime,
                  transform: `scale(${s})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#000',
                  fontWeight: 900,
                  fontSize: 24,
                  flex: 'none',
                }}
              >
                ✓
              </div>
              <div style={{ fontSize: 30, fontWeight: 900, width: 200 }}>{label}</div>
              <div style={{ fontFamily: F.mono, fontSize: 22, color: C.muted }}>
                <span style={{ color: C.lime }}>$ </span>
                {cmd.slice(0, typedN)}
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          position: 'absolute',
          left: 1060,
          top: 600,
          width: 740,
          height: 300,
          background: C.panel,
          border: `1px solid ${C.border}`,
          borderRadius: 24,
          padding: 32,
          boxSizing: 'border-box',
          opacity: lin(f, 145, 155),
        }}
      >
        <div style={{ fontFamily: F.mono, fontSize: 20, color: C.muted, letterSpacing: '0.15em' }}>GIT HISTORY</div>
        <svg width={676} height={160} style={{ marginTop: 20 }}>
          <line x1={40} y1={80} x2={636} y2={80} stroke={C.border} strokeWidth={4} />
          {Array.from({ length: NODES }).map((_, i) => {
            const s = pop(f, 155 + i * 7, 260, 14);
            const x = 40 + (i * 596) / (NODES - 1);
            const bad = i === NODES - 1 && f >= 200;
            return (
              <g key={i} transform={`translate(${x} 80)`}>
                <circle r={16 * s} fill={bad ? C.red : C.lime} />
                <text y={52} textAnchor="middle" fill={bad ? C.red : C.muted} fontFamily={F.mono} fontSize={16}>
                  {bad ? 'bug' : `v${i + 1}`}
                </text>
              </g>
            );
          })}
          <path
            d={`M ${xLast} 60 Q ${(xPrev + xLast) / 2} -30 ${xPrev} 60`}
            fill="none"
            stroke={C.lime}
            strokeWidth={5}
            strokeLinecap="round"
            strokeDasharray={ARC_LEN}
            strokeDashoffset={ARC_LEN * (1 - arc)}
          />
          <polygon points={`${xPrev - 12},${48} ${xPrev + 12},${48} ${xPrev},${66}`} fill={C.lime} opacity={arc > 0.9 ? 1 : 0} />
        </svg>
        <div style={{ position: 'absolute', right: 32, bottom: 28, fontSize: 26, fontWeight: 900, color: C.lime, opacity: ease(f, 215, 228) }}>{COPY.quality.revert}</div>
      </div>
    </Stage>
  );
};
