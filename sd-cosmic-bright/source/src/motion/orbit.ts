import { gsap, ScrollTrigger } from '../scroll/smooth';

/**
 * A1 / K1: a light dot circling the border ellipse of the first orbit `<i>` at constant angular speed.
 * The dot is a child of the orbit element, so it inherits the orbit's tilt and only needs
 * translate(rx*cos, ry*sin) in local coordinates. Paused while the section is off screen.
 */
function orbit(host: HTMLElement, dot: HTMLElement, duration: number, phase: number, dim: boolean): void {
  const track = host.querySelector<HTMLElement>('i');
  const section = host.closest('section');
  if (!track || !section) return;
  track.appendChild(dot);
  let rx = 0;
  let ry = 0;
  const measure = () => { rx = track.clientWidth / 2; ry = track.clientHeight / 2; };
  const state = { t: 0 };
  const render = () => {
    const a = (state.t + phase) * Math.PI * 2;
    dot.style.transform = `translate(${(rx * Math.cos(a)).toFixed(2)}px, ${(ry * Math.sin(a)).toFixed(2)}px)`;
    // far side (upper half of the tilted orbit) reads dimmer: .55 at the back, 1 in front
    if (dim) dot.style.opacity = (0.775 + 0.225 * Math.sin(a)).toFixed(3);
  };
  measure();
  render();
  new ResizeObserver(() => { measure(); render(); }).observe(track);
  const tween = gsap.to(state, { t: 1, duration, ease: 'none', repeat: -1, paused: true, onUpdate: render });
  const toggle = (active: boolean) => {
    if (active) tween.play(); else tween.pause();
    host.classList.toggle('is-active', active); // CSS loops (orbit-breathe) follow the same visibility
  };
  // isActive is not reliable at creation or inside onRefresh; derive the state from the refreshed geometry instead
  const inRange = (self: ScrollTrigger) => self.end > 0 && self.scroll() >= self.start && self.scroll() <= self.end;
  const trigger = ScrollTrigger.create({ trigger: section, start: 'top bottom', end: 'bottom top', onToggle: (self) => toggle(self.isActive), onRefresh: (self) => toggle(inRange(self)) });
  toggle(inRange(trigger));
}

export function setupOrbits(): void {
  const about = document.querySelector<HTMLElement>('.brand-orbit');
  const aboutDot = about?.querySelector<HTMLElement>('b');
  if (about && aboutDot) orbit(about, aboutDot, 22, 0, true);
  const contact = document.querySelector<HTMLElement>('.contact-orbits');
  if (contact) orbit(contact, document.createElement('b'), 36, 0.61, false);
}
