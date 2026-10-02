import manifest from '../public/designs/manifest.json';
import { JP_LABELS } from './copy';

export type Design = {
  id: string;
  file: string;
  width: number;
  height: number;
  label: string;
  dominant: string;
};

export const DESIGNS: Design[] = manifest as Design[];

export const tagOf = (d: Design) => d.label.toUpperCase();
export const jpOf = (d: Design) => JP_LABELS[d.label] ?? d.label;
export const numberOf = (d: Design) => d.id.slice(0, 2);
