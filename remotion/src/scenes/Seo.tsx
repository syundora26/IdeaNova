import React from 'react';
import { useCurrentFrame } from 'remotion';
import { ease, expoOut, lin, pop } from '../anim';
import { Stage } from '../components/Stage';
import { Body, Marker } from '../components/Text';
import { COPY } from '../copy';
import { C, F } from '../theme';

const JSONLD = ['{', '  "@context": "https://schema.org",', '  "@type": "Organization",', '  "name": "株式会社SD",', '  "knowsAbout": ["TypeScript", "React", "Laravel"]', '}'].join('\n');
const METRICS = ['LCP', 'CLS', 'INP'];

export const Seo: React.FC = () => {
  const f = useCurrentFrame();
  const score = ease(f, 12, 72, 0, 100, expoOut);
  const r = 108;
  const circ = 2 * Math.PI * r;
  const typed = JSONLD.slice(0, Math.floor(lin(f, 60, 130, 0, JSONLD.length)));
  const serp = pop(f, 125, 160, 16);
  return (
    <Stage glow={{ x: 1400, y: 500, opacity: 0.1, color: C.cyan, size: 1200 }}>
      <div style={{ position: 'absolute', left: 120, top: 250, width: 880 }}>
        <Marker index="02" title={COPY.seo.title} />
        <div style={{ marginTop: 30 }}>
          <Body at={22} size={40}>
            {COPY.seo.lines[0][0]}
            <br />
            {COPY.seo.lines[0][1]}
          </Body>
          <Body at={46} size={40}>
            {COPY.seo.lines[1][0]}
            <br />
            {COPY.seo.lines[1][1]}
          </Body>
        </div>
      </div>
      <div style={{ position: 'absolute', left: 1060, top: 150, width: 740, height: 780, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 24, padding: 36, boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
          <svg width={260} height={260}>
            <circle cx={130} cy={130} r={r} stroke={C.border} strokeWidth={14} fill="none" />
            <circle
              cx={130}
              cy={130}
              r={r}
              stroke={C.lime}
              strokeWidth={14}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={circ * (1 - score / 100)}
              transform="rotate(-90 130 130)"
            />
            <text x={130} y={156} textAnchor="middle" fill={C.fg} fontFamily={F.latin} fontWeight={800} fontSize={76}>
              {Math.round(score)}
            </text>
          </svg>
          <div>
            <div style={{ fontSize: 34, fontWeight: 900 }}>{COPY.seo.speed}</div>
            {METRICS.map((m, i) => {
              const p = ease(f, 30 + i * 10, 70 + i * 10);
              return (
                <div key={m} style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 12, fontFamily: F.mono, fontSize: 22, color: C.muted }}>
                  <span style={{ width: 50 }}>{m}</span>
                  <div style={{ width: 300, height: 8, background: C.border, borderRadius: 4 }}>
                    <div style={{ width: `${p * 100}%`, height: 8, background: C.lime, borderRadius: 4 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ marginTop: 28, fontFamily: F.mono, fontSize: 22, lineHeight: 1.6, whiteSpace: 'pre', color: C.cyan, height: 220, opacity: lin(f, 58, 64) }}>
          {typed}
          <span style={{ opacity: f % 12 < 6 ? 1 : 0 }}>▍</span>
        </div>
        <div style={{ marginTop: 10, background: '#fff', color: '#1a1a1a', borderRadius: 14, padding: '18px 22px', transform: `translateY(${(1 - serp) * 40}px)`, opacity: serp }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 18, color: '#4d5156' }}>
            <span
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                background: C.lime,
                color: '#000',
                fontFamily: F.latin,
                fontWeight: 800,
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              SD
            </span>
            {COPY.seo.serpCrumb}
          </div>
          <div style={{ fontSize: 26, color: '#1a0dab', fontWeight: 700, marginTop: 6 }}>{COPY.seo.serpTitle}</div>
          <div style={{ fontSize: 18, color: '#4d5156', marginTop: 6, lineHeight: 1.5 }}>{COPY.seo.serpDesc}</div>
        </div>
      </div>
    </Stage>
  );
};
