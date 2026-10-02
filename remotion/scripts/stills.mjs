#!/usr/bin/env node
// Renders a set of frames to PNG (and a contact sheet) for visual QA.
// Usage: node remotion/scripts/stills.mjs [frame ...]
import path from 'node:path';
import fs from 'node:fs';
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';

const frames = process.argv.slice(2).map(Number).filter((n) => Number.isFinite(n));
const list = frames.length ? frames : [20, 50, 80, 110, 135, 200, 300, 370, 400, 450, 500, 600, 700, 740, 800, 900, 980, 1080, 1180, 1220, 1300, 1385, 1420, 1500, 1580, 1660, 1700, 1760];
const root = process.cwd();
const outDir = path.join(root, 'out', 'stills');
fs.mkdirSync(outDir, { recursive: true });

const serveUrl = await bundle({ entryPoint: path.join(root, 'remotion/index.ts'), publicDir: path.join(root, 'remotion/public') });
const composition = await selectComposition({ serveUrl, id: 'SDShowreel', browserExecutable: process.env.REMOTION_BROWSER_EXECUTABLE });
for (const frame of list) {
  const output = path.join(outDir, `f${String(frame).padStart(4, '0')}.png`);
  await renderStill({ composition, serveUrl, frame, output, scale: 0.5, browserExecutable: process.env.REMOTION_BROWSER_EXECUTABLE, chromiumOptions: { gl: 'angle' } });
  console.log('rendered', output);
}
