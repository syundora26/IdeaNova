import { gsap } from '../scroll/smooth';

/**
 * Ambient life in the fixed background (on top of the scroll parallax): two soft nebula glows drifting on long loops,
 * the overlay tint breathing, and a slow sideways sway of the starfield and the twinkle layer. All transform / opacity,
 * created only when motion is allowed.
 */
export function setupAmbient(): void {
  const universe = document.querySelector<HTMLElement>('.universe');
  if (!universe) return;
  for (const n of ['nebula--1', 'nebula--2']) {
    const el = document.createElement('i');
    el.className = `nebula ${n}`;
    universe.appendChild(el);
  }
  universe.classList.add('is-ambient');
  // sideways sway in percent of the layer's own width, so it stays inside the extra width the CSS gives the layers
  const img = universe.querySelector('img');
  const twinkles = universe.querySelector('.twinkles');
  if (img) gsap.fromTo(img, { xPercent: -1.2 }, { xPercent: 1.2, duration: 70, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  if (twinkles) gsap.fromTo(twinkles, { xPercent: 1.6 }, { xPercent: -1.6, duration: 55, ease: 'sine.inOut', yoyo: true, repeat: -1 });
}
