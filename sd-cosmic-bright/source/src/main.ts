import './styles/index.css';
import { createSmoothScroll } from './scroll/smooth';
import { setupHeader } from './ui/header';
import { setupIndicator } from './ui/indicator';
import { setupMotion } from './motion';

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
/** set by the inline <head> gate when motion is allowed; every "hidden until revealed" style hangs off it */
const motion = document.documentElement.classList.contains('motion');
// tells CSS the reveal script is running: the no-JS failsafe (show everything after 4s) only applies without it
if ('IntersectionObserver' in window) document.documentElement.classList.add('motion-ready');
const smooth = createSmoothScroll(!reduced);
const header = setupHeader(smooth);
const indicator = setupIndicator(smooth);
const sections = Array.from(document.querySelectorAll<HTMLElement>('section[data-section]'));
const progress = document.getElementById('progress');
let scheduled = false;
function updateScroll() {
  scheduled = false;
  let active = sections[0];
  for (const section of sections) {
    if (section.getBoundingClientRect().top < window.innerHeight * .48) active = section;
  }
  if (active) { header.setActive(active.id); indicator.setActive(active.id); }
  const total = document.documentElement.scrollHeight - window.innerHeight;
  if (progress) progress.style.transform = `scaleX(${total > 0 ? window.scrollY / total : 0})`;
}
window.addEventListener('scroll', () => {
  if (!scheduled) { scheduled = true; requestAnimationFrame(updateScroll); }
}, { passive: true });
updateScroll();
if (!reduced && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  }, { threshold: .08 });
  // stagger by order among reveal siblings of the same parent (55ms, max 6 steps);
  // Process steps run in sequence (120ms); the hero intro sets its own timing via data-delay
  const order = new Map<HTMLElement, number>();
  document.querySelectorAll<HTMLElement>('[data-reveal], .card, .step').forEach((el) => {
    const parent = el.parentElement!;
    const n = order.get(parent) ?? 0;
    order.set(parent, n + 1);
    const delay = el.dataset.delay ?? String(el.classList.contains('step') ? n * 120 : Math.min(n, 6) * 55);
    el.style.setProperty('--delay', `${delay}ms`);
    observer.observe(el);
  });
}
const twinkles = document.querySelector('.twinkles');
if (twinkles) {
  // the twinkle layer is 160% tall when it parallaxes (U1), so keep the same density
  for (let i = 0; i < (motion ? 44 : 28); i++) {
    const star = document.createElement('i');
    star.style.cssText = `left:${(i * 37.7 + 9) % 100}%;top:${(i * 23.1 + 12) % 100}%;--twinkle-delay:${-(i % 7)}s;--twinkle-duration:${3 + (i % 5)}s`;
    twinkles.appendChild(star);
  }
}
const hero = document.querySelector<HTMLElement>('.hero__art');
if (hero && !reduced && matchMedia('(pointer:fine)').matches) {
  const heroSection = document.getElementById('hero')!;
  heroSection.addEventListener('pointermove', event => {
    const x = (event.clientX / window.innerWidth - .5) * 9;
    const y = (event.clientY / window.innerHeight - .5) * 7;
    hero.style.translate = `${x}px ${y}px`;
  });
  heroSection.addEventListener('pointerleave', () => { hero.style.translate = '0px 0px'; });
}
setupMotion();
window.addEventListener('load', () => {
  if (location.hash && location.hash !== '#top' && document.getElementById(location.hash.slice(1))) {
    smooth.scrollTo(location.hash, { immediate: true });
    header.keepVisible(2000);
  }
  updateScroll();
});
