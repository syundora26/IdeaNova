import { gsap, ScrollTrigger } from '../scroll/smooth';
import { PLANET, RING, coverMap } from './geometry';

/**
 * Hero planet: twinkling stars around it and light particles travelling along its ring.
 * The planet is a flat photo (cosmic-hero.webp, 1672x941), so both layers are placed in *image pixels*
 * and mapped to the art box with the same maths as `object-fit: cover` + `object-position`, which keeps
 * them glued to the picture at every viewport. Nothing here touches the LCP image itself.
 */
/** ring particles: 4 bright clumps on the outer edge plus a swarm of small specks across the band (inner ones a bit faster) */
type Dot = { phase: number; s: number; period: number; size: number; alpha: number };
const DOTS: Dot[] = [0, 0.25, 0.5, 0.75].map((phase) => ({ phase, s: 1, period: 44, size: 0, alpha: 1 }));
for (let i = 0; i < 36; i++) {
  const s = 0.905 + ((i * 0.37) % 1) * 0.095;
  DOTS.push({ phase: (i * 0.618) % 1, s, period: 38 + (s - 0.905) / 0.095 * 10, size: 2 + (i % 3), alpha: 0.45 + ((i * 0.53) % 1) * 0.45 });
}
/** star positions on the dark sky of the picture (image px), clear of the planet and the ring */
const STARS: [number, number][] = [
  [120, 90], [260, 170], [420, 60], [560, 150], [700, 40], [870, 110], [1020, 50], [1130, 20], [1330, 30], [1440, 60], [1610, 120],
  [60, 300], [200, 380], [330, 300], [480, 420], [610, 330], [760, 300], [830, 250],
  [100, 520], [250, 600], [400, 540], [160, 700], [300, 760], [540, 700], [720, 760],
  [880, 820], [1050, 880], [1300, 870], [1520, 860], [1640, 620],
];

export function setupHero(): void {
  const section = document.getElementById('hero');
  const art = section?.querySelector<HTMLElement>('.hero__art');
  const img = art?.querySelector<HTMLImageElement>('img');
  if (!section || !art || !img) return;

  const stars = document.createElement('div');
  stars.className = 'hero__stars';
  const starEls = STARS.map((_, i) => {
    const s = document.createElement('i');
    s.style.cssText = `--twinkle-delay:${-(i % 7)}s;--twinkle-duration:${3 + (i % 5)}s`;
    stars.appendChild(s);
    return s;
  });
  const ring = document.createElement('div');
  ring.className = 'hero__ring';
  const dotEls = DOTS.map((d) => {
    const b = ring.appendChild(document.createElement('b'));
    if (d.size) { b.className = 'speck'; b.style.setProperty('--sz', `${d.size}px`); }
    return b;
  });
  art.append(stars, ring);

  /* image px -> art px (object-fit: cover, object-position from the computed style) */
  let scale = 1;
  let ox = 0;
  let oy = 0;
  const measure = () => {
    const W = art.clientWidth;
    const H = art.clientHeight;
    ({ scale, ox, oy } = coverMap(art, img));
    // stars: skip the ones outside the box or under the text block / scroll hint
    const frame = art.getBoundingClientRect();
    const avoid = ['.hero__inner', '.scroll-hint']
      .map((sel) => section.querySelector(sel)?.getBoundingClientRect())
      .filter((r): r is DOMRect => !!r);
    STARS.forEach(([x, y], i) => {
      const X = ox + x * scale;
      const Y = oy + y * scale;
      const vx = frame.left + X;
      const vy = frame.top + Y;
      const covered = avoid.some((r) => vx > r.left - 8 && vx < r.right + 8 && vy > r.top - 8 && vy < r.bottom + 8);
      starEls[i].hidden = covered || X < 0 || Y < 0 || X > W || Y > H;
      starEls[i].style.left = `${X.toFixed(1)}px`;
      starEls[i].style.top = `${Y.toFixed(1)}px`;
    });
    render();
  };

  /* ring particles: constant angular speed; dimmer on the far side, hidden while behind the planet */
  const cos = Math.cos(RING.tilt);
  const sin = Math.sin(RING.tilt);
  let elapsed = 0; // seconds while the hero is on screen
  function render(): void {
    dotEls.forEach((dot, i) => {
      const d = DOTS[i];
      const f = (elapsed / d.period + d.phase) * Math.PI * 2;
      const lu = RING.a * d.s * Math.cos(f);
      const lv = RING.b * d.s * Math.sin(f);
      const x = RING.cx + lu * cos - lv * sin;
      const y = RING.cy + lu * sin + lv * cos;
      const far = lv < 0;
      const behind = far && Math.hypot(x - PLANET.cx, y - PLANET.cy) < PLANET.r;
      dot.style.transform = `translate(${(ox + x * scale).toFixed(1)}px, ${(oy + y * scale).toFixed(1)}px)`;
      const op = behind ? '0' : (far ? d.alpha * 0.5 : d.alpha).toFixed(2);
      if (dot.style.opacity !== op) dot.style.opacity = op;
    });
  }

  measure();
  new ResizeObserver(measure).observe(art);
  document.fonts.ready.then(measure);

  let last = 0;
  let acc = 0;
  // 30 fps is plenty for a 40-second orbit and halves the per-frame style work of the 40 particles
  const tick = (time: number) => {
    if (last) { const dt = time - last; elapsed += dt; acc += dt; }
    last = time;
    if (acc < 1 / 30) return;
    acc = 0;
    render();
  };
  let running = false;
  const toggle = (active: boolean) => {
    if (active && !running) { last = 0; gsap.ticker.add(tick); }
    if (!active && running) gsap.ticker.remove(tick);
    running = active;
    art.classList.toggle('is-active', active); // the star twinkle keyframes follow (animation-play-state)
  };
  const inRange = (self: ScrollTrigger) => self.end > 0 && self.scroll() >= self.start && self.scroll() <= self.end;
  const trigger = ScrollTrigger.create({ trigger: section, start: 'top bottom', end: 'bottom top', onToggle: (self) => toggle(self.isActive), onRefresh: (self) => toggle(inRange(self)) });
  toggle(inRange(trigger));
}
