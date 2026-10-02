import { Easing, interpolate, spring } from 'remotion';
import { FPS } from './timeline';

const CLAMP = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

export const expoOut = Easing.out(Easing.exp);
export const cubicOut = Easing.out(Easing.cubic);
export const cubicInOut = Easing.inOut(Easing.cubic);

export const ease = (f: number, from: number, to: number, a = 0, b = 1, easing: (t: number) => number = cubicOut) =>
  interpolate(f, [from, to], [a, b], { ...CLAMP, easing });

export const lin = (f: number, from: number, to: number, a = 0, b = 1) => interpolate(f, [from, to], [a, b], CLAMP);

export const multi = (f: number, xs: number[], ys: number[]) => interpolate(f, xs, ys, CLAMP);

export const pop = (f: number, delay = 0, stiffness = 170, damping = 15) =>
  spring({ frame: f - delay, fps: FPS, config: { stiffness, damping, mass: 0.9 } });

export const beatPulse = (f: number, period = 15, decay = 4) => Math.exp(-((f % period) / decay));

// Bounces t between 0 and max (for endless page scrolling without jumps).
export const pingpong = (t: number, max: number) => (max <= 0 ? 0 : max - Math.abs((t % (2 * max)) - max));
