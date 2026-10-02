import React from 'react';
import { Composition } from 'remotion';
import { Showreel } from './src/Showreel';
import { DURATION, FPS } from './src/timeline';
import { H, W } from './src/theme';

export const Root: React.FC = () => (
  <Composition id="SDShowreel" component={Showreel} durationInFrames={DURATION} fps={FPS} width={W} height={H} />
);
