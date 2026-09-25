import './styles/index.css';
import { createSmoothScroll } from './scroll/smooth';
import { setupHeader } from './ui/header';
import { setupIndicator } from './ui/indicator';

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
  document.querySelectorAll<HTMLElement>('[data-reveal], .card, .step').forEach((el, i) => {
    el.style.setProperty('--delay', `${(i % 3) * 55}ms`);
    observer.observe(el);
  });
}
const twinkles = document.querySelector('.twinkles');
if (twinkles) {
  for (let i = 0; i < 28; i++) {
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
window.addEventListener('load', () => {
  if (location.hash && location.hash !== '#top' && document.getElementById(location.hash.slice(1))) {
    smooth.scrollTo(location.hash, { immediate: true });
    header.keepVisible(2000);
  }
  updateScroll();
});
