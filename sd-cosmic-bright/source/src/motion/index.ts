import { ScrollTrigger } from '../scroll/smooth';
import { setupParallax } from './parallax';
import { setupOrbits } from './orbit';
import { setupDecor } from './decor';
import { setupHero } from './hero';
import { setupPlanet } from './planet';
import { setupAmbient } from './ambient';

/**
 * Motion entry point. Everything here is skipped unless the inline <head> gate added `html.motion`
 * (i.e. the user does not prefer reduced motion), so reduced-motion keeps the current static page.
 */
export function setupMotion(): void {
  if (!document.documentElement.classList.contains('motion')) return;
  setupHero(); // adds the hero star / ring layers before the parallax picks up the art's children
  setupPlanet(); // rotating planet shader over the painted disc (inserted once its textures load)
  setupParallax();
  setupOrbits();
  setupDecor();
  setupAmbient();
  // ScrollTrigger refreshes itself on window load; web fonts can land later and move things, so re-measure once more then
  document.fonts.ready.then(() => ScrollTrigger.refresh());
}
