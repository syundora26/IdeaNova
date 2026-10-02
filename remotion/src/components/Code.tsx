import React from 'react';
import { C, F } from '../theme';

const TOKEN = /("[^"]*"|'[^']*'|\/\/.*$|\b(?:import|export|const|type|await|return|class|function|from|default|public|true|false|new)\b|[{}()[\];,<>:=$]|\s+|[^\s"'{}()[\];,<>:=$]+)/g;
const KEYWORD = /^(import|export|const|type|await|return|class|function|from|default|public|true|false|new)$/;

const colorOf = (tok: string) => {
  if (/^["']/.test(tok)) return C.cyan;
  if (KEYWORD.test(tok)) return C.lime;
  if (/^[{}()[\];,<>:=$]$/.test(tok) || tok.startsWith('//')) return C.muted;
  return C.fg;
};

export const Code: React.FC<{ lines: string[]; repeat?: number; size?: number; style?: React.CSSProperties }> = ({ lines, repeat = 1, size = 26, style }) => {
  const all: string[] = [];
  for (let r = 0; r < repeat; r++) all.push(...lines);
  return (
    <div style={{ fontFamily: F.mono, fontSize: size, lineHeight: 1.7, whiteSpace: 'pre', ...style }}>
      {all.map((line, i) => (
        <div key={i}>
          {(line.match(TOKEN) ?? [line]).map((tok, j) => (
            <span key={j} style={{ color: colorOf(tok) }}>
              {tok}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
};
