import { gsap } from '../scroll/smooth';

const narrow = () => matchMedia('(max-width: 767px)').matches;
type Range = { trigger: Element; start: string; end: string };
const scrub = (range: Range) => ({ ...range, scrub: true, invalidateOnRefresh: true });

/** Depth parallax, all `ease: 'none'` + scrub: U1 background layers, H2 hero planet, B2 section numbers, F1 footer wordmark. */
export function setupParallax(): void {
  // U1: starfield image (+24% tall) and twinkle layer (+60% tall) drift up over the whole page.
  // The exact travel is the extra height, so the layers never leave a gap at the bottom.
  const universe = document.querySelector<HTMLElement>('.universe');
  if (universe) {
    for (const layer of universe.querySelectorAll<HTMLElement>(':scope > img, .twinkles')) {
      gsap.to(layer, {
        y: () => -(layer.clientHeight - universe.clientHeight),
        ease: 'none',
        scrollTrigger: scrub({ trigger: document.body, start: 'top top', end: 'max' }),
      });
    }
  }
  // H2: the planet lags behind the content while the hero scrolls out (14% desktop / 10% mobile).
  // The art's other children (hero star / ring layers, same size as the image) ride along so they stay on the picture.
  const hero = document.getElementById('hero');
  const art = hero?.querySelector<HTMLElement>('.hero__art');
  if (hero && art && art.children.length) {
    gsap.to(Array.from(art.children), { yPercent: () => (narrow() ? 10 : 14), ease: 'none', scrollTrigger: scrub({ trigger: hero, start: 'top top', end: 'bottom top' }) });
  }
  // B2: outline section numbers travel +40px -> -40px (mobile +/-20px) while their section passes
  for (const num of document.querySelectorAll<HTMLElement>('.section-num')) {
    const section = num.parentElement;
    if (!section) continue;
    const amount = () => (narrow() ? 20 : 40);
    gsap.fromTo(num, { y: amount }, { y: () => -amount(), ease: 'none', scrollTrigger: scrub({ trigger: section, start: 'top bottom', end: 'bottom top' }) });
  }
  // F1: the big footer "SD" rises 60px (mobile 30px) into place as the footer is revealed
  const footer = document.querySelector<HTMLElement>('.footer');
  const big = footer?.querySelector<HTMLElement>('.footer__big');
  if (footer && big) {
    gsap.fromTo(big, { y: () => (narrow() ? 30 : 60) }, { y: 0, ease: 'none', scrollTrigger: scrub({ trigger: footer, start: 'top bottom', end: 'bottom bottom' }) });
  }
}
