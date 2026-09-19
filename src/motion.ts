import { useLayoutEffect, type DependencyList, type RefObject } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/** Automated browsers and `?nomotion` get the final, still composition. */
export function motionDisabled() {
  return typeof window === 'undefined' || navigator.webdriver || new URLSearchParams(location.search).has('nomotion');
}

export const ease = { soft: 'power2.out', calm: 'power3.out', settle: 'expo.out' } as const;
type Conditions = { desktop: boolean; mobile: boolean };

/**
 * Runs scoped GSAP setup only when the viewer allows motion.
 * Everything created inside is reverted on unmount, route change and breakpoint change.
 */
export function useMotion(scope: RefObject<HTMLElement | null>, setup: (conditions: Conditions, root: HTMLElement) => void | (() => void), deps: DependencyList = []) {
  useLayoutEffect(() => {
    const root = scope.current;
    if (!root || motionDisabled()) return;
    const mm = gsap.matchMedia(root);
    mm.add({
      desktop: '(min-width: 1001px) and (prefers-reduced-motion: no-preference)',
      mobile: '(max-width: 1000px) and (prefers-reduced-motion: no-preference)',
    }, context => {
      const conditions = context.conditions as Conditions;
      if (conditions.desktop || conditions.mobile) return setup(conditions, root);
    });
    // Images and web fonts change section heights after the first layout.
    const refresh = () => ScrollTrigger.refresh();
    document.fonts?.ready.then(refresh);
    window.addEventListener('load', refresh, { once: true });
    return () => { window.removeEventListener('load', refresh); mm.revert(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/** Fade-and-rise for groups of elements as they enter the viewport. */
export function revealOnScroll(targets: string | Element[], { y = 24, stagger = .12, duration = 1.1, start = 'top 86%' } = {}) {
  const items = gsap.utils.toArray<Element>(targets);
  if (!items.length) return;
  gsap.set(items, { autoAlpha: .01, y });
  ScrollTrigger.batch(items, {
    start,
    once: true,
    onEnter: batch => gsap.to(batch, { autoAlpha: 1, y: 0, duration, ease: ease.soft, stagger, overwrite: true, clearProps: 'transform,opacity,visibility' }),
  });
}

/** Opens a photograph from left to right with a soft edge (uses the --reveal custom property). */
export function maskReveal(target: string | Element, { trigger, duration = 1.8, start = 'top 78%' }: { trigger?: string | Element; duration?: number; start?: string } = {}) {
  const el = gsap.utils.toArray<HTMLElement>(target)[0];
  if (!el) return;
  el.classList.add('is-mask-reveal');
  gsap.fromTo(el, { '--reveal': '-20%' }, {
    '--reveal': '120%', duration, ease: 'power2.inOut',
    scrollTrigger: { trigger: trigger || el, start, once: true },
    onComplete: () => el.classList.remove('is-mask-reveal'),
  });
}

/** Gentle vertical drift tied to scroll position. */
export function drift(target: string | Element, trigger: string | Element, amount = 6, scrub = 1.4) {
  const items = gsap.utils.toArray<Element>(target);
  if (!items.length) return;
  gsap.fromTo(items, { yPercent: -amount }, { yPercent: amount, ease: 'none', scrollTrigger: { trigger, start: 'top bottom', end: 'bottom top', scrub } });
}

export { gsap, ScrollTrigger };
