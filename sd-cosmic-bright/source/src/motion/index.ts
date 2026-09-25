import { ScrollTrigger } from '../scroll/smooth';
import { setupParallax } from './parallax';
import { setupOrbits } from './orbit';
import { setupDecor } from './decor';

/**
 * Motion entry point. Everything here is skipped unless the inline <head> gate added `html.motion`
 * (i.e. the user does not prefer reduced motion), so reduced-motion keeps the current static page.
 */
export function setupMotion(): void {
  if (!document.documentElement.classList.contains('motion')) return;
  setupParallax();
  setupOrbits();
  setupDecor();
  // positions shift once web fonts / images are in; re-measure the scrub ranges
  const refresh = () => ScrollTrigger.refresh();
  document.fonts.ready.then(refresh);
  window.addEventListener('load', refresh, { once: true });
}
