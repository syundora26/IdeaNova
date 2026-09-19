import { useRef } from 'react';
import { useMotion, gsap, ease, drift, maskReveal, revealOnScroll } from './motion';
import { Link } from './router';
import { useGateway, useResource } from './GatewayContext';
import {
  ArticleState, EditorialHeading as Heading, EditorialEmphasis as Emphasis,
  CorporateDescription as Description, CorporateAction as Action, CorporateNewsRow,
  CorporateNavItem, CorporateBrand, CorporateValue,
} from './CorporateUI';
import { demoEnabled } from './site';
import { CorporatePhoto as Photo, HeroPhotographs, HeroProducts, BusinessPhotographs, BotanicalDecoration, LowerDecoration, FooterCurve, ContactContour, corporateImages, sceneLayout, useSceneGeometry } from './CorporateMedia';


export function ReferenceHome() {
  const ref = useRef<HTMLDivElement>(null);
  const geometry = useSceneGeometry(ref);
  const { gateway, revision } = useGateway();
  const articles = useResource(async () => {
    const [news, journal] = await Promise.all([gateway.listArticles('news'), gateway.listArticles('journal')]);
    return [...news.map(article => ({ article, kind: 'news' as const })), ...journal.map(article => ({ article, kind: 'journal' as const }))]
      .sort((a, b) => b.article.date.localeCompare(a.article.date)).slice(0, 3);
  }, [revision]);
  useMotion(ref, ({ desktop }) => {
    // Opening: photographs settle (transform only, so the LCP image is painted at once), then the copy rises.
    const intro = gsap.timeline({ defaults: { ease: ease.calm } });
    intro.from('.ref-hero-botanical img', { scale: 1.08, duration: 2.6, ease: ease.soft }, 0)
      .from('.ref-hero-wash path:first-of-type', { xPercent: desktop ? -8 : 0, yPercent: desktop ? 0 : -6, opacity: 0, duration: 1.8, ease: ease.settle }, .1)
      .from('.ref-headline-line', { y: desktop ? 22 : 14, opacity: .01, filter: 'blur(8px)', duration: 1.4, stagger: .2, clearProps: 'filter' }, .2)
      .from('.ref-initial', { scale: .86, transformOrigin: '50% 80%', duration: 1.6, ease: ease.settle }, .2)
      .from('.ref-hero-lead', { y: 14, opacity: .01, duration: 1.2 }, .75)
      .from('.ref-hero-products img', { y: desktop ? 36 : 24, scale: .97, duration: 1.8, ease: ease.settle }, .35)
      .from('.ref-scroll', { opacity: .01, y: 10, duration: 1 }, 1.1)
      .from('.ref-hero-note', { opacity: .01, y: -18, duration: 1.4 }, 1)
      .from('.ref-hero-script', { opacity: 0, x: -24, duration: 1.6, ease: ease.settle }, 1.3);

    if (desktop) drift('.ref-hero-products img', '.ref-visual-story', 3, 1.2);
    // Business photographs ease out of a slight zoom while their section scrolls in.
    gsap.utils.toArray<HTMLElement>('.ref-business-media img').forEach(img =>
      gsap.fromTo(img, { scale: 1.12 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.ref-business-duo', start: 'top bottom', end: 'bottom 60%', scrub: 1.2 } }));
    revealOnScroll('.ref-business-copy > *', { stagger: .12 });

    revealOnScroll('.ref-about-copy > *', { stagger: .14 });
    maskReveal('.ref-about-photo', { trigger: '.ref-about-figure' });
    gsap.from('.ref-about-photo img', { scale: 1.1, duration: 2.4, ease: ease.soft, scrollTrigger: { trigger: '.ref-about-figure', start: 'top 78%', once: true } });
    gsap.from('.ref-city-script', { opacity: 0, x: -30, duration: 1.8, delay: .9, ease: ease.settle, scrollTrigger: { trigger: '.ref-about-figure', start: 'top 78%', once: true } });
    gsap.from('.ref-city-note', { opacity: .01, y: 16, duration: 1.2, delay: 1.2, ease: ease.soft, scrollTrigger: { trigger: '.ref-about-figure', start: 'top 78%', once: true } });
    drift('.ref-story-leaves', '.ref-company-story', 5, 1.6);
    if (desktop) drift('.ref-about-leaves', '.ref-about', 8, 1.6);

    gsap.from('.corporate-value', { y: 18, opacity: .01, duration: 1, stagger: desktop ? .14 : .1, ease: ease.soft, scrollTrigger: { trigger: '.ref-value-list', start: 'top 86%', once: true } });
    gsap.from('.corporate-value > svg', { scale: .6, rotation: -24, opacity: 0, duration: 1.4, stagger: desktop ? .14 : .1, ease: ease.settle, scrollTrigger: { trigger: '.ref-value-list', start: 'top 86%', once: true } });
    revealOnScroll('.ref-values > .corporate-description', { y: 16 });
    gsap.from('.ref-lower-decoration-values img', { x: 60, opacity: 0, duration: 2, ease: ease.soft, scrollTrigger: { trigger: '.ref-values', start: 'top 80%', once: true } });

    revealOnScroll(['.ref-news .corporate-editorial-heading', '.ref-news > .ref-text-link'].flatMap(s => gsap.utils.toArray<Element>(s)));
  });
  // Rows arrive after the data request, so they register separately.
  useMotion(ref, ({ desktop }, root) => {
    if (!root.querySelector('.ref-news-row')) return;
    gsap.from('.ref-news-row', { x: desktop ? -18 : 0, y: desktop ? 0 : 12, opacity: .01, duration: .9, stagger: .1, ease: ease.soft, clearProps: 'transform,opacity', scrollTrigger: { trigger: '.ref-news-content', start: 'top 88%', once: true } });
  }, [articles.data]);
  return <div className="reference-home botanical-home" ref={ref} style={sceneLayout}>
    <div className="ref-visual-story">
    <HeroPhotographs geometry={geometry} />
    <section className="ref-hero" aria-labelledby="ref-hero-title">
      <div className="ref-hero-inner">
      <div className="ref-hero-copy">
        <Heading level={1} id="ref-hero-title"><span className="ref-headline-line"><span className="ref-initial">美</span>しさが、</span><span className="ref-headline-line"><Emphasis>未来</Emphasis>をつくる。</span></Heading>
        <Description className="ref-hero-lead">ひとりの毎日が、社会のあしたにつながる。<br />郡山から、暮らしに寄り添う<br /><span>IdeaNova</span></Description>
      </div>
      <div className="ref-hero-art"><HeroProducts /></div><div className="ref-hero-aside">
        <p className="ref-hero-note">自然のめぐみで、<br />人の美しさと、<br />豊かな未来を。</p>
        <span className="ref-hero-script" aria-hidden="true">beauty</span>
      </div>
        <a href="#business" className="ref-scroll"><span className="ref-scroll-label">SCROLL</span><span className="ref-scroll-line" aria-hidden="true" /><span className="ref-scroll-text">BEAUTY<br /> FOR A BRIGHTER<br /> TOMORROW</span></a>
      </div>
    </section>

    <section className="ref-business-duo" id="business" aria-label="ふたつの事業">
      <BusinessPhotographs geometry={geometry} />
      <div className="ref-business-content">
      <article className="ref-cosmetics-copy ref-business-copy" aria-labelledby="ref-cosmetics-title">
        <Heading eyebrow="COSMETICS" id="ref-cosmetics-title">肌から、<br />やさしい未来へ。</Heading>
        <Description>毎日の肌に向き合うひとときを。<br />暮らしに寄り添う化粧品を<br />お届けします。</Description>
        <Action href="/shop/cosmetics" variant="outline" external>化粧品サイトへ</Action>
      </article>
      <article className="ref-agriculture-copy ref-business-copy" aria-labelledby="ref-agriculture-title">
        <Heading eyebrow="AGRICULTURE" id="ref-agriculture-title">大地の恵みを、<br />暮らしの食卓へ。</Heading>
        <Description>季節の恵みを身近に。<br />日々の食卓を彩る農作物を、<br />自社サイトでお届けします。</Description>
        <Action href="/shop/agriculture" variant="outline">オンラインショップで購入</Action>
      </article>
      </div>
    </section>

    </div>
    <div className="ref-company-story">
    <BotanicalDecoration className="ref-story-leaves" />
    <section className="ref-about" id="about" aria-labelledby="ref-about-title">
      <BotanicalDecoration className="ref-about-leaves" />
      <div className="ref-about-copy">
        <Heading eyebrow="ABOUT US" id="ref-about-title">ひらめきで、<br />暮らしのそばに。</Heading>
        <Description>IdeaNovaは、郡山を拠点に<br />化粧品と農作物の2つの事業を通じて、<br />人々の暮らしに寄り添います。</Description>
        <Action href="/company" variant="outline">IdeaNovaについて</Action>
      </div>
      <figure className="ref-about-figure">
        <div className="ref-city-art">
          <Photo className="ref-about-photo" src={corporateImages.scenery} alt="山々と街並みのイメージ" shape="cityWave" ratio="1.7" />
          <span className="ref-city-script" aria-hidden="true">Koriyama</span>
          <p className="ref-city-note">このまちの、<br /><span>美しい未来のために。</span></p>
        </div>
        <figcaption className="ref-scenery-credit">街並みはイメージです</figcaption>
      </figure>
    </section>

    <section className="ref-values" aria-labelledby="ref-values-title">
      <LowerDecoration variant="values" />
      <h2 className="visually-hidden" id="ref-values-title">IdeaNovaが大切にすること</h2>
      <ul className="ref-value-list">
        <CorporateValue number="01" icon="nature" title="自然の恵み" />
        <CorporateValue number="02" icon="science" title="科学のちから" />
        <CorporateValue number="03" icon="people" title="人の暮らし" />
        <CorporateValue number="04" icon="future" title="よりよい未来" />
      </ul>
      <Description>美しさも、食も、すべてはつながっている。<br />IdeaNovaは、ひとつひとつの選択が未来をつくると信じています。</Description>
    </section>

    </div>
    <section className="ref-news" aria-labelledby="ref-news-title">
      <LowerDecoration variant="news" />
      <Heading eyebrow="NEWS" id="ref-news-title">お知らせ</Heading>
      <div className="ref-news-content">
        <ArticleState {...articles} empty={!articles.data?.length}>
          {articles.data?.map(({ article, kind }) => <CorporateNewsRow key={`${kind}-${article.id}`} article={article} kind={kind} />)}
        </ArticleState>
      </div>
      <Action href="/news" variant="text">お知らせ一覧</Action>
    </section>
  </div>;
}

export function ReferenceFooter() {
  return <footer className="reference-footer botanical-footer">
    <FooterCurve />
    <div className="ref-footer-main">
      <CorporateBrand />
      <div className="ref-footer-links">
        <nav aria-label="フッターメニュー">{[['/company', '会社案内'], ['/business', '事業紹介'], ['/news', 'お知らせ'], ['/journal', 'コラム'], ['/contact', 'お問い合わせ']].map(([href, label]) => <CorporateNavItem href={href} key={href}>{label}</CorporateNavItem>)}</nav>
        <nav aria-label="法務情報"><Link href="/legal/privacy">プライバシーポリシー</Link><Link href="/legal/terms">利用規約</Link><Link href="/legal/commerce">特定商取引法に基づく表記</Link></nav>
      </div>
      <Link href="/contact" className="ref-footer-contact"><ContactContour /><svg className="ref-contact-icon" viewBox="0 0 36 28" fill="none" stroke="currentColor" aria-hidden="true"><rect x="1" y="1" width="34" height="26" rx="1" /><path d="m2 3 16 12L34 3" /></svg><span>お問い合わせ<small>お気軽にご相談ください。</small></span><span className="corporate-arrow" aria-hidden="true">→</span></Link>
    </div>
    <div className="ref-footer-disclosure"><small>© IdeaNova</small>{demoEnabled && <><span>制作プレビュー：写真・商品はイメージです。正式な会社・商品情報は確認中です。</span><Link href="/preview">確認シナリオ</Link><Link href="/admin">管理画面</Link></>}</div>
  </footer>;
}
