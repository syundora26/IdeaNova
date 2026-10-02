import React from 'react';
import { Img, staticFile } from 'remotion';
import type { Design } from '../designs';

type Props = {
  design: Design;
  width: number;
  height: number;
  scroll?: number;
  radius?: number;
  chrome?: boolean;
  shadow?: boolean;
  style?: React.CSSProperties;
};

const CHROME_H = 30;

// A tall page mockup shown through a window; `scroll` moves the page up.
export const Page: React.FC<Props> = ({ design, width, height, scroll = 0, radius = 14, chrome = false, shadow = true, style }) => {
  const imgH = (design.height / design.width) * width;
  const viewH = chrome ? height - CHROME_H : height;
  const y = Math.min(Math.max(0, imgH - viewH), Math.max(0, scroll));
  return (
    <div
      style={{
        width,
        height,
        borderRadius: radius,
        overflow: 'hidden',
        background: '#fff',
        boxShadow: shadow ? '0 30px 80px rgba(0,0,0,0.55)' : undefined,
        position: 'relative',
        flex: 'none',
        ...style,
      }}
    >
      {chrome && (
        <div style={{ height: CHROME_H, background: '#e9ebef', display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 12 }}>
          {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
            <span key={c} style={{ width: 9, height: 9, borderRadius: 5, background: c }} />
          ))}
          <span style={{ marginLeft: 10, height: 12, width: width * 0.5, borderRadius: 6, background: '#fff' }} />
        </div>
      )}
      <Img src={staticFile(design.file)} style={{ width, height: imgH, display: 'block', transform: `translateY(${-y}px)` }} />
    </div>
  );
};
