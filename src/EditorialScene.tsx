import { useId, useRef, type ReactNode } from 'react';
import { useMotion, gsap, ease, maskReveal, revealOnScroll, drift } from './motion';
import { Crumbs } from './Shared';
import { corporateImages, responsiveSet } from './CorporateMedia';

export function SceneLeaves({ className = '' }: { className?: string }) {
  return <img className={`scene-leaves ${className}`} src={corporateImages.botanical} srcSet={responsiveSet(corporateImages.botanical)} sizes="240px" width={1024} height={1536} alt="" aria-hidden="true" loading="lazy" decoding="async" />;
}

export function EditorialScene({ kind }: { kind: 'company' | 'news' | 'journal' }) {
  const id = useId();
  const ref = useRef<HTMLElement>(null);
  const company = kind === 'company';
  useMotion(ref, ({ desktop }) => {
    gsap.timeline({ defaults: { ease: ease.calm } })
      .from('.scene-photo > img', { scale: 1.08, duration: 2.4, ease: ease.soft }, 0)
      .from('.scene-copy > *', { y: desktop ? 20 : 14, opacity: .01, filter: 'blur(6px)', duration: 1.2, stagger: .12, clearProps: 'filter' }, .15)
      .from('.scene-photo-copy > span', { opacity: 0, x: -28, duration: 1.8, ease: ease.settle }, .7)
      .from('.scene-photo-copy p', { opacity: .01, y: 14, duration: 1.2 }, .95);
    drift(':scope > .scene-leaves', ref.current!, 10, 1.6);
  }, [kind]);
  const title = company ? '会社案内' : kind === 'news' ? 'お知らせ' : '暮らしのコラム';
  const heading: ReactNode = company ? <>会社<span>案内</span></> : kind === 'news' ? <>お<span>知らせ</span></> : <>暮らしの<span>コラム</span></>;
  return <section ref={ref} className={`editorial-scene scene-${kind}`} aria-labelledby={`scene-title-${kind}`}>
    <svg className="scene-defs" aria-hidden="true"><defs><clipPath id={id} clipPathUnits="objectBoundingBox"><path d={company ? 'M.40 0 H1 V.84 C.84 .97 .66 .93 .46 .86 C.22 .78 -.08 .58 .02 .30 C.08 .14 .24 .05 .40 0Z' : 'M1 0 V.86 C.72 1 .47 .72 0 .86 C.25 .73 .20 .07 1 0Z'} /></clipPath></defs></svg>
    <div className="scene-photo" style={{ clipPath: `url(#${id})` }}>
      <img src={company ? corporateImages.scenery : corporateImages.heroBackground} srcSet={responsiveSet(company ? corporateImages.scenery : corporateImages.heroBackground)} sizes="(max-width: 1000px) 100vw, 66vw" width={1536} height={1024} alt={company ? '山々と街並みのイメージ' : ''} fetchPriority="high" />
      <div className="scene-photo-copy"><span aria-hidden="true">{company ? 'About us' : kind === 'news' ? 'News' : 'Column'}</span><p>{company ? <>このまちから、<br />美しい未来を、<br />ともに。</> : kind === 'news' ? <>ひとつひとつの<br />できごとが<br />明るい未来につながる。</> : <>日々の暮らしに、<br />やさしい発見を<br />ひとつずつ。</>}</p></div>
    </div>
    <div className="scene-copy">
      <Crumbs items={[{ label: title }]} />
      <p className="scene-eyebrow">{company ? 'ABOUT US' : kind === 'news' ? 'NEWS' : 'COLUMN'}</p>
      <h1 id={`scene-title-${kind}`}>{heading}</h1>
      <p className="scene-lead">{company ? '郡山から、暮らしのそばへ。' : kind === 'news' ? 'IdeaNovaからのお知らせをお届けします。' : '暮らしの中で見つけた、小さな気づきや季節の便り。'}</p>
      {company && <p className="scene-description">自然の恵みと先端の力で、<br />人の美しさと、心地よい暮らしを支えていく。<br />それが、私たちIdeaNovaの想いです。</p>}
    </div>
    <SceneLeaves />
  </section>;
}

export function EditorialClosing() {
  return <div className="editorial-closing" aria-hidden="true"><img src={corporateImages.flower} srcSet={responsiveSet(corporateImages.flower)} sizes="(max-width: 1000px) 85vw, 52vw" width={1536} height={1024} alt="" loading="lazy" decoding="async" /><svg viewBox="0 0 1440 160" preserveAspectRatio="none"><path d="M0 65 C300 190 480 0 750 90 S1120 15 1440 70 V160 H0Z" fill="#f1eae0" opacity=".6" /><path d="M0 125 C430 190 720 45 1440 112 V160 H0Z" fill="#f1eae0" /></svg></div>;
}

export function CompanyContent() {
  const ref = useRef<HTMLDivElement>(null);
  useMotion(ref, () => {
    revealOnScroll('.company-introduction-copy > *', { stagger: .14 });
    gsap.from('.company-connect', { clipPath: 'inset(0 0 0 100%)', duration: 1.8, ease: 'power2.inOut', clearProps: 'clipPath', scrollTrigger: { trigger: '.company-introduction', start: 'top 78%', once: true } });
    revealOnScroll('.company-connect > p', { y: 16 });
    revealOnScroll(['.company-facts-copy > p', '.company-facts h2', '.company-facts dl > div'].flatMap(s => gsap.utils.toArray<Element>(s)), { stagger: .1 });
    maskReveal('.company-future');
    gsap.from('.company-future > span', { opacity: 0, x: -30, duration: 1.8, delay: .8, ease: ease.settle, scrollTrigger: { trigger: '.company-future', start: 'top 78%', once: true } });
    revealOnScroll('.company-promise > :is(h2,p)', { stagger: .16 });
    drift('.company-promise .scene-leaves', '.company-promise', 12, 1.6);
  });
  return <div className="company-scene-page" ref={ref}>
    <EditorialScene kind="company" />
    <section className="company-introduction">
      <div className="company-introduction-copy"><h2>地域に根ざし、<br />一つひとつの出会いを大切に。</h2><p>IdeaNovaが目指すのは、私たちの身近にある暮らしです。<br />化粧品と農作物を通して、人と人、地域と日々の生活をつないでいきます。</p><p>事業に関するご相談は、会社のお問い合わせ窓口から承ります。</p></div>
      <div className="company-connect"><img src={corporateImages.heroBackground} srcSet={responsiveSet(corporateImages.heroBackground)} sizes="(max-width: 1000px) 100vw, 42vw" width={1536} height={1024} alt="" loading="lazy" decoding="async" /><p>人と、<br />地域と、<br />未来をつなぐ。<small>CONNECT<br />PEOPLE,<br />COMMUNITIES,<br />AND THE FUTURE.</small></p></div>
      <SceneLeaves className="company-middle-leaves" />
    </section>
    <section className="company-facts">
      <div className="company-facts-copy"><p className="scene-eyebrow">COMPANY</p><h2>会社概要</h2><dl>
        <div><dt>名称</dt><dd>IdeaNova <small>（正式法人表記は確認中）</small></dd></div>
        <div><dt>拠点</dt><dd>福島県郡山市 <small>（住所・アクセス情報は確認中）</small></dd></div>
        <div><dt>事業内容</dt><dd>化粧品事業・農作物事業</dd></div>
        <div><dt>代表者・設立・連絡先</dt><dd>正式情報の確認後に掲載します。</dd></div>
      </dl></div>
      <figure className="company-future"><img src={corporateImages.scenery} srcSet={responsiveSet(corporateImages.scenery)} sizes="(max-width: 1000px) 100vw, 60vw" width={1536} height={1024} alt="山々と街並みのイメージ" loading="lazy" decoding="async" /><span aria-hidden="true">Future</span><figcaption>このまちの、<br />美しい未来のために。<small>街並みはイメージです</small></figcaption></figure>
    </section>
    <section className="company-promise"><SceneLeaves /><h2>自然の恵みが、暮らしの美しさをつくる。</h2><p>IdeaNovaは、これからも地域とともに歩んでいきます。</p><SceneLeaves className="promise-right" /></section>
  </div>;
}
