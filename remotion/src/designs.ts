import manifest from '../public/designs/manifest.json';

export type Design = {
  id: string;
  no: number;
  file: string;
  width: number;
  height: number;
  industry: string;
  brand: string;
};

export const DESIGNS: Design[] = manifest as Design[];

export const tagOf = (d: Design) => d.brand;
export const jpOf = (d: Design) => d.industry;
export const numberOf = (d: Design) => String(d.no).padStart(2, '0');

// Text that must be covered by the loaded fonts.
export const DESIGN_TEXT = DESIGNS.map((d) => d.industry + d.brand).join('');
