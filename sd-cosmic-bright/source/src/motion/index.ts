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
  // ScrollTrigger refreshes itself on window load; web fonts can land later and move things, so re-measure once more then
  document.fonts.ready.then(() => ScrollTrigger.refresh());
}
