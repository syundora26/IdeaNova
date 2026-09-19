import { useRef } from 'react';
import { SplitText } from 'gsap/SplitText';
import { Link } from './router';
import { Crumbs } from './Shared';
import { useMotion, gsap, ScrollTrigger, drift } from './motion';

gsap.registerPlugin(SplitText);

// Scene, business photographs and sprigs are cut from the approved mockup by scripts/crop-business-assets.mjs.
// Replace public/images/business/* with the original high-resolution photographs when they arrive.
const art = (name: string) => `/images/business/${name}.webp`;

const businesses = [
  { key: 'cosmetics', no: '01', name: '化粧品事業', lead: '毎日のお手入れを、心地よく。', action: '化粧品事業について', size: [670, 400] },
  { key: 'agriculture', no: '02', name: '農作物事業', lead: '旬のおいしさを、食卓へ。', action: '農作物事業について', size: [652, 412] },
] as const;

function Arrow() {
  return <svg className="business-arrow" viewBox="0 0 24 12" fill="none" stroke="currentColor" strokeWidth="1.25" aria-hidden="true" focusable="false"><path d="M0 6 H23 M17.5 .8 L23 6 L17.5 11.2" /></svg>;
}

export function BusinessOverview() {
  const ref = useRef<HTMLDivElement>(null);
  useMotion(ref, ({ desktop }, root) => {
    const q = gsap.utils.selector(root);
    const one = (s: string) => q(s)[0] as HTMLElement | undefined;
    const shown = (el?: Element) => !!el && (el as HTMLElement).offsetParent !== null;
    const r = gsap.utils.random, k = desktop ? 1 : .7, splits: SplitText[] = [];
    // Endless loops are created paused and only run while their section is on screen.
    const gate = (trigger: Element | string, anims: gsap.core.Animation[], ready = true) => {
      let inView = false;
      const sync = () => anims.forEach(a => inView && ready ? a.resume() : a.pause());
      ScrollTrigger.create({ trigger, start: 'top bottom', end: 'bottom top', onToggle: s => { inView = s.isActive; sync(); } });
      return () => { ready = true; sync(); };
    };
    const sway = (el: Element | undefined, origin: string, deg: number, duration: number) => shown(el)
      ? [gsap.fromTo(el!, { rotation: -deg * k, transformOrigin: origin }, { rotation: deg * k, duration, ease: 'sine.inOut', yoyo: true, repeat: -1, paused: true })] : [];

    // Hero: the photograph stays opaque (LCP); a paper veil sweeps off it along the diagonal.
    const scene = one('.business-scene-art') as HTMLImageElement;
    const title = SplitText.create(q('.business-scene-copy h1'), { type: 'chars', mask: 'chars' }); splits.push(title);
    const heroLoops = gate('.business-scene', sway(one('.business-leaves-left'), '0% 60%', 2.5, 5.2), false);
    const intro = gsap.timeline({ paused: true, defaults: { ease: 'expo.out' } })
      .fromTo('.business-scene-photo', { '--veil': '0%' }, { '--veil': '140%', duration: desktop ? 2.4 : 1.8, ease: 'power2.inOut' }, 0)
      .fromTo(scene, { scale: 1.12 }, { scale: 1, duration: 3.4, transformOrigin: '70% 40%' }, 0)
      .from(title.chars, { yPercent: 110, duration: 1.2, stagger: .09 }, .3)
      .from(q('.business-scene-copy .crumbs, .business-lead'), { y: 16, opacity: .01, duration: 1.2, stagger: .35, ease: 'power3.out' }, .45)
      .from('.business-leaves-left', { x: -28, opacity: 0, duration: 2 }, .7)
      .fromTo(q('.business-note-line').filter(shown), { yPercent: 60, opacity: .01, clipPath: 'inset(-20% -5% 100% -5%)' },
        { yPercent: 0, opacity: 1, clipPath: 'inset(-20% -5% -20% -5%)', duration: 1.3, stagger: .3, ease: 'power3.out', clearProps: 'clipPath' }, 1.5)
      .call(heroLoops, [], 2.2);
    if (desktop) drift(scene, '.business-scene', 2, 1.6);
    let alive = true;
    Promise.race([Promise.all([scene?.decode().catch(() => {}), document.fonts?.ready]), new Promise(res => setTimeout(res, 900))])
      .then(() => { if (alive) intro.play(); });

    // Cards: the photograph opens from a soft oval, then the number and name rise letter by letter.
    q('.business-card').forEach((card, i) => {
      const photo = card.querySelector('.business-photo')!;
      const words = SplitText.create(card.querySelectorAll('.business-no, .business-name'), { type: 'chars', mask: 'chars' }); splits.push(words);
      const above = card.getBoundingClientRect().top < innerHeight;
      gsap.timeline({ delay: (above ? 1.2 : 0) + i * .18, defaults: { ease: 'expo.out' }, scrollTrigger: { trigger: card, start: desktop ? 'top 82%' : 'top 88%', once: true } })
        .fromTo(photo, { clipPath: 'inset(14% 10% 14% 10% round 45%)', scale: 1.06 }, { clipPath: 'inset(0% 0% 0% 0% round 0%)', scale: 1, duration: 1.9, ease: 'expo.inOut', clearProps: 'clipPath' })
        .from(words.chars, { yPercent: 110, duration: 1, stagger: .045 }, .75)
        .from(card.querySelectorAll('.business-card-copy > p, .business-more'), { y: 16, opacity: .01, duration: 1.1, stagger: .15, ease: 'power3.out' }, 1);
      if (desktop) gsap.fromTo(photo, { yPercent: 2 }, { yPercent: -2, ease: 'none', scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: 1.2 } });
    });
    const sprigs = q('.business-leaves-right-top, .business-leaves-right-bottom').filter(shown);
    gsap.from(sprigs, { x: 30, opacity: 0, duration: 1.8, stagger: .2, delay: 1.4, ease: 'power3.out' });
    gate('.business-cards', [...sway(one('.business-leaves-right-top'), '100% 0%', 2.2, 4.6), ...sway(one('.business-leaves-right-bottom'), '100% 100%', 1.6, 5.4)])();

    // Petals drifting across the page, endlessly and at random.
    const rain = one('.business-petal-rain');
    if (rain) {
      gsap.set(rain, { display: 'block' });
      const petals = q('.business-petal-rain img').slice(0, desktop ? 6 : 3);
      gate(root, petals.flatMap((p, i) => {
        const place = () => gsap.set(p, { x: r(0, rain.offsetWidth * .9) });
        place(); gsap.set(p, { scale: r(.45, .85), opacity: r(.55, .9), transformPerspective: 600 });
        const drop = gsap.fromTo(p, { y: -80, rotation: r(0, 360) }, { y: () => rain.offsetHeight + 80, rotation: '+=220', duration: r(desktop ? 16 : 20, desktop ? 24 : 28), ease: 'none', repeat: -1, paused: true, onRepeat: place });
        drop.progress(i / petals.length);
        const flutter = gsap.fromTo(p, { rotationY: -55, xPercent: -150 * k }, { rotationY: 55, xPercent: 150 * k, duration: r(2.4, 3.6), ease: 'sine.inOut', yoyo: true, repeat: -1, paused: true });
        return [drop, flutter];
      }))();
    }

    // Closing: waves settle with parallax, the white line draws itself, the large petals slide in.
    const sc = { trigger: '.business-closing', start: 'top bottom', end: 'bottom bottom', scrub: 1.2 };
    const waves = q('.business-waves path') as unknown as SVGPathElement[];
    waves.forEach((p, i) => gsap.fromTo(p, { y: [14, 8, 20][i] * k }, { y: 0, ease: 'none', scrollTrigger: sc }));
    gsap.fromTo('.business-petals', { xPercent: -8, opacity: .01 }, { xPercent: 0, opacity: 1, ease: 'none', scrollTrigger: sc });
    const line = waves[2], len = line?.getTotalLength() ?? 0;
    if (line) gsap.fromTo(line, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 2.6, ease: 'power2.inOut', scrollTrigger: { trigger: '.business-closing', start: 'top 92%', once: true } });
    const petal = one('.business-petal');
    if (petal) {
      gsap.from(petal, { y: -60, x: -30, rotation: -40, opacity: 0, duration: 3, ease: 'sine.out', scrollTrigger: { trigger: petal, start: 'top 95%', once: true } });
      gate('.business-closing', [gsap.to(petal, { y: 6, rotation: 8, duration: 3.2, ease: 'sine.inOut', yoyo: true, repeat: -1, paused: true })])();
    }
    return () => { alive = false; splits.forEach(s => s.revert()); };
  });

  return <div className="business-page" ref={ref}>
    <div className="business-petal-rain" aria-hidden="true">{Array.from({ length: 6 }, (_, i) => <img key={i} src={art('petal')} width={85} height={65} alt="" loading="lazy" decoding="async" />)}</div>
    <section className="business-scene" aria-labelledby="business-title">
      <div className="business-scene-photo" aria-hidden="true">
        <img className="business-scene-art" src={art('scene')} srcSet={`${art('scene-800')} 800w, ${art('scene')} 2012w`} sizes="(max-width: 1000px) 100vw, 74vw" width={2012} height={744} alt="" fetchPriority="high" />
      </div>
      <p className="business-scene-note">{['自然の恵みで', '人の暮らしを、', 'もっと豊かに。'].map(line => <span className="business-note-line" key={line}>{line}</span>)}</p>
      <img className="business-leaves-left" src={art('leaves-left')} width={118} height={224} alt="" aria-hidden="true" decoding="async" />
      <div className="business-scene-copy">
        <Crumbs items={[{ label: '事業紹介' }]} />
        <h1 id="business-title">事業<span>紹介</span></h1>
        <p className="business-lead">暮らしを支える、二つの事業。郡山から、身近な毎日へ。</p>
      </div>
    </section>

    <div className="business-cards">
      {businesses.map(b => <article className={`business-card is-${b.key}`} key={b.key} aria-labelledby={`business-${b.key}`}>
        <img className="business-photo" src={art(b.key)} width={b.size[0]} height={b.size[1]} alt="" aria-hidden="true" decoding="async" />
        <div className="business-card-copy">
          <h2 id={`business-${b.key}`}><span className="business-no">{b.no}</span><span className="business-name">{b.name}</span></h2>
          <p>{b.lead}</p>
          <Link href={`/business/${b.key}`} className="business-more"><span>{b.action}</span><Arrow /></Link>
        </div>
      </article>)}
      <img className="business-leaves-right-top" src={art('leaves-right-top')} width={91} height={153} alt="" aria-hidden="true" decoding="async" />
      <img className="business-leaves-right-bottom" src={art('leaves-right-bottom')} width={220} height={194} alt="" aria-hidden="true" decoding="async" />
    </div>

    <div className="business-closing" aria-hidden="true">
      <img className="business-petals" src={art('petals-large')} width={620} height={183} alt="" decoding="async" />
      <img className="business-petal" src={art('petal')} width={85} height={65} alt="" decoding="async" />
      <svg className="business-waves" viewBox="0 0 1361 140" preserveAspectRatio="none" focusable="false">
        <path d="M0 40 C260 120 520 125 800 80 S1200 5 1361 15 V140 H0Z" fill="#f3ece2" opacity=".9" />
        <path d="M0 95 C300 140 640 125 900 90 S1250 55 1361 62 V140 H0Z" fill="#ece2d5" />
        <path d="M0 70 C300 130 620 115 880 72 S1240 25 1361 35" fill="none" stroke="#fff" strokeWidth="1.5" opacity=".7" />
      </svg>
    </div>
  </div>;
}
