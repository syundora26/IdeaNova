/** Geometry of the hero picture (cosmic-hero.webp) in image pixels, shared by the hero layers and the planet shader. */
export const IMG = { w: 1672, h: 941 };
/** planet disc */
export const PLANET = { cx: 1232, cy: 432, r: 340 };
/** outer edge of the ring: least-squares ellipse fitted to the picture; `inner` = inner edge as a fraction of it */
export const RING = { cx: 1435, cy: 366, a: 758, b: 100, tilt: -20.35 * Math.PI / 180, inner: 0.9 };

export type CoverMap = { scale: number; ox: number; oy: number };

/** image px -> art px, the same maths the browser uses for `object-fit: cover` + `object-position` */
export function coverMap(art: HTMLElement, img: HTMLImageElement): CoverMap {
  const W = art.clientWidth;
  const H = art.clientHeight;
  const scale = Math.max(W / IMG.w, H / IMG.h);
  const [px = 0.5, py = 0.5] = getComputedStyle(img).objectPosition.split(' ').map((v) => parseFloat(v) / 100);
  return { scale, ox: (W - IMG.w * scale) * px, oy: (H - IMG.h * scale) * py };
}
