import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile } from 'remotion';
import { FinalFade, Flash, Hud } from './components/Overlay';
import { ALL_TEXT } from './copy';
import { useFonts } from './fonts';
import { ColdOpen } from './scenes/ColdOpen';
import { Cta } from './scenes/Cta';
import { EndCard } from './scenes/EndCard';
import { Montage } from './scenes/Montage';
import { Quality } from './scenes/Quality';
import { Scratch } from './scenes/Scratch';
import { Seo } from './scenes/Seo';
import { Stack } from './scenes/Stack';
import { ThreeD } from './scenes/ThreeD';
import { Wall } from './scenes/Wall';
import { C, F } from './theme';
import { SCENES, type SceneKey } from './timeline';

const SCENE_COMPONENTS: Record<SceneKey, React.FC> = {
  coldOpen: ColdOpen,
  montage: Montage,
  stack: Stack,
  scratch: Scratch,
  seo: Seo,
  quality: Quality,
  threeD: ThreeD,
  wall: Wall,
  cta: Cta,
  end: EndCard,
};

export const Showreel: React.FC = () => {
  useFonts(ALL_TEXT);
  return (
    <AbsoluteFill style={{ background: C.bg, color: C.fg, fontFamily: F.jp, overflow: 'hidden' }}>
      <Audio src={staticFile('audio/track.mp3')} />
      {(Object.keys(SCENES) as SceneKey[]).map((key) => {
        const [from, to] = SCENES[key];
        const Scene = SCENE_COMPONENTS[key];
        return (
          <Sequence key={key} from={from} durationInFrames={to - from} name={key}>
            <Scene />
          </Sequence>
        );
      })}
      <Hud />
      <Flash />
      <FinalFade />
    </AbsoluteFill>
  );
};
