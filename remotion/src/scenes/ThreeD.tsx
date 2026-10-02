import React from 'react';
import { useCurrentFrame } from 'remotion';
import { pingpong, pop } from '../anim';
import { Page } from '../components/Page';
import { Stage } from '../components/Stage';
import { Body, Marker } from '../components/Text';
import { COPY } from '../copy';
import { DESIGNS } from '../designs';
import { C, F } from '../theme';

const RING = [25, 27, 29, 31, 35, 36, 40, 41];
const CARD_W = 250;
const CARD_H = 430;
const RADIUS = 560;
const PHONE = DESIGNS[32];
const PHONE_W = 270;
const PHONE_H = 560;

export const ThreeD: React.FC = () => {
  const f = useCurrentFrame();
  const rot = f * 0.9;
  const cardMax = CARD_W * 3 - CARD_H;
  const innerW = PHONE_W - 32;
  const innerH = PHONE_H - 32;
  const phoneMax = innerW * 3 - innerH;
  const badge = pop(f, 40, 220, 14);
  return (
    <Stage glow={{ x: 900, y: 460, opacity: 0.12, color: C.cyan, size: 1300 }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: 1800, height: 920, perspective: 1400, perspectiveOrigin: '900px 440px' }}>
        <div style={{ position: 'absolute', left: 900, top: 440, width: 0, height: 0, transformStyle: 'preserve-3d', transform: `rotateX(-12deg) rotateY(${rot}deg)` }}>
          {RING.map((di, i) => {
            const ang = i * 45;
            const a = (((ang + rot) % 360) + 360) % 360;
            const front = (Math.cos((a * Math.PI) / 180) + 1) / 2;
            return (
              <div
                key={di}
                style={{
                  position: 'absolute',
                  left: -CARD_W / 2,
                  top: -CARD_H / 2,
                  width: CARD_W,
                  height: CARD_H,
                  transform: `rotateY(${ang}deg) translateZ(${RADIUS}px)`,
                  backfaceVisibility: 'hidden',
                  opacity: 0.35 + 0.65 * front,
                }}
              >
                <Page design={DESIGNS[di]} width={CARD_W} height={CARD_H} scroll={pingpong(f * 3 + i * 170, cardMax)} radius={16} />
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 520, background: `linear-gradient(transparent, ${C.bg} 62%)` }} />
      <div
        style={{
          position: 'absolute',
          left: 1600,
          top: 200,
          width: PHONE_W,
          height: PHONE_H,
          borderRadius: 42,
          background: '#15171c',
          border: '6px solid #2a2d35',
          boxSizing: 'border-box',
          padding: 10,
          boxShadow: '0 40px 100px rgba(0,0,0,0.6)',
          transform: `translateY(${Math.sin(f / 18) * 8}px)`,
        }}
      >
        <div style={{ borderRadius: 28, overflow: 'hidden', width: '100%', height: '100%' }}>
          <Page design={PHONE} width={innerW} height={innerH} scroll={pingpong(f * 4, phoneMax)} radius={0} shadow={false} />
        </div>
        <div
          style={{
            position: 'absolute',
            top: -22,
            left: -40,
            background: C.lime,
            color: '#000',
            fontFamily: F.latin,
            fontWeight: 800,
            fontSize: 24,
            padding: '6px 16px',
            borderRadius: 999,
            transform: `scale(${badge})`,
          }}
        >
          60 fps
        </div>
      </div>
      <div style={{ position: 'absolute', left: 120, top: 730, width: 1400 }}>
        <Marker index="04" title={COPY.three.title} />
        <div style={{ marginTop: 10, display: 'flex', gap: 56, whiteSpace: 'nowrap' }}>
          <Body at={20} size={38} style={{ whiteSpace: 'nowrap' }}>
            {COPY.three.lines[0]}
          </Body>
          <Body at={42} size={38} style={{ whiteSpace: 'nowrap' }}>
            {COPY.three.lines[1]}
          </Body>
        </div>
      </div>
    </Stage>
  );
};
