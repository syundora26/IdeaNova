// 120 BPM at 30 fps: one beat = 15 frames, one bar = 60 frames.
// The soundtrack (scripts/make-music.mjs) is arranged on the same grid.
export const FPS = 30;
export const BEAT = 15;
export const BAR = 60;
export const DURATION = 1800;

export const SCENES = {
  coldOpen: [0, 120],
  montage: [120, 360],
  stack: [360, 480],
  scratch: [480, 720],
  seo: [720, 960],
  quality: [960, 1200],
  threeD: [1200, 1380],
  wall: [1380, 1560],
  cta: [1560, 1680],
  end: [1680, 1800],
} as const;

export type SceneKey = keyof typeof SCENES;

export const SECTION_LABELS: Record<SceneKey, string> = {
  coldOpen: 'INTRO',
  montage: '45 DESIGNS',
  stack: 'STACK',
  scratch: '01 FULL SCRATCH',
  seo: '02 SEO',
  quality: '03 CODE QUALITY',
  threeD: '04 3D',
  wall: 'SHOWCASE',
  cta: 'CONTACT',
  end: '',
};

// Hard cuts that land on a crash/impact in the music.
export const FLASHES = [120, 480, 720, 1200, 1380, 1560, 1680];

export const sceneAt = (frame: number): SceneKey => {
  for (const key of Object.keys(SCENES) as SceneKey[]) {
    const [from, to] = SCENES[key];
    if (frame >= from && frame < to) return key;
  }
  return 'end';
};
