import { useEffect, useRef } from 'react';
import { CompanyContent, EditorialScene, EditorialClosing, SceneLeaves } from './EditorialScene';
import { gsap } from 'gsap';
import { useMotion, revealOnScroll } from './motion';
import { BusinessOverview } from './BusinessOverview';
import { isCosmetics, corporateOrigin } from './site';
import { Link } from './router';
import { Heading, Crumbs } from './Shared';
import type { Business } from './domain';
import { useGateway, useResource } from './GatewayContext';
import { CorporateButton, CorporateHeading, CorporateArticleList, ArticleState } from './CorporateUI';

export function CityPhoto({ className = '' }: { className?: string }) {
  return <img className={className} src="/images/koriyama.webp"
    srcSet="/images/koriyama-small.webp 900w, /images/koriyama.webp 1800w" sizes="(max-width: 767px) 100vw, 75vw"
    alt="ビッグアイから望む福島県郡山市の街並み（2015年撮影）" width="1800" height="1200" fetchPriority="high" />;
}
export function PhotoCredit() {
  return <p className="photo-credit">郡山市中心市街地（2015年5月撮影）／写真：<a href="https://commons.wikimedia.org/wiki/File:%E9%83%A1%E5%B1%B1%E5%B8%82%E4%B8%AD%E5%BF%83%E5%B8%82%E8%A1%97%E5%9C%B0.JPG">藍原あおい・Wikimedia Commons</a> / <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.ja">CC BY-SA 4.0</a>（サイズ・形式変更）</p>;
}
const details = {
  cosmetics: {
    name: '化粧品事業', subtitle: '毎日のお手入れを、心地よく。',
    text: '日々のスキンケアを通して、暮らしに心地よい時間を。商品との出会いから、ご購入後のお問い合わせまで、わかりやすいご案内を大切にしています。',
    service: '商品のご紹介・オンライン販売', shipping: 'メーカー・外部発送先からお届け',
    contact: '商品のお取り扱い・事業に関するご相談',
  },
  agriculture: {
    name: '農作物事業', subtitle: '旬のおいしさを、食卓へ。',
    text: '季節とともに移り変わる、畑からの便り。農作物の販売を通して、つくる人と食べる人をつなぐ接点を育んでいきます。',
    service: '季節の農作物のご紹介・オンライン販売', shipping: 'IdeaNovaからお届け',
    contact: '農作物のお取り扱い・事業に関するご相談',
  },
};
const businesses: Business[] = ['cosmetics', 'agriculture'];

function CorporateHero() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!ref.current || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = gsap.context(() => {
      gsap.fromTo('.corporate-hero-ribbon', { opacity: 0 }, { opacity: 1, duration: .55, clearProps: 'opacity' });
    }, ref);
    return () => ctx.revert();
  }, []);
  return <section className="corporate-hero" ref={ref} aria-labelledby="corporate-hero-title">
    <div className="corporate-hero-inner">
      <div className="corporate-hero-copy">
        <p className="corporate-location"><span aria-hidden="true" />福島県郡山市 / IdeaNova</p>
        <h1 id="corporate-hero-title">郡山から、<br />暮らしのそばへ。</h1>
        <p className="corporate-hero-description">福島県郡山市を拠点に、<br className="desktop-only" />化粧品と農作物をお届けするIdeaNovaです。</p>
        <CorporateButton href="/business">事業紹介</CorporateButton>
      </div>
      <div className="corporate-hero-ribbon">
        <div className="ribbon-city"><CityPhoto /></div>
        <div className="ribbon-support">
          <img src="/images/cosmetics.webp" alt="化粧品のイメージ（サンプル）" width="1536" height="1024" />
          <img src="/images/agriculture.webp" alt="農作物のイメージ（サンプル）" width="1536" height="1024" />
        </div>
      </div>
    </div>
  </section>;
}

function BusinessCards() {
  return <div className="corporate-business-grid">{businesses.map((business, index) => {
    const d = details[business];
    return <article className="corporate-business-card" key={business}>
      <img src={`/images/${business}.webp`} alt={`${d.name}のイメージ（サンプル）`} loading="lazy" width="1536" height="1024" />
      <div className="corporate-business-copy">
        <div className="corporate-business-title"><span aria-hidden="true">0{index + 1}</span><h3>{d.name}</h3></div>
        <p>{d.subtitle}</p>
        <CorporateButton href={`/business/${business}`} secondary>{d.name}について</CorporateButton>
      </div>
    </article>;
  })}</div>;
}

export function CorporateHome() {
  const { gateway, revision } = useGateway();
  const news = useResource(() => gateway.listArticles('news'), [revision]);
  const columns = useResource(() => gateway.listArticles('journal'), [revision]);
  return <>
    <CorporateHero />
    <section className="corporate-news-section container" aria-label="最新のお知らせ">
      <CorporateHeading title="お知らせ" />
      <ArticleState {...news} empty={!news.data?.length}>
        <CorporateArticleList articles={(news.data || []).slice(0, 1)} kind="news" />
      </ArticleState>
      <Link href="/news" className="corporate-inline-link">お知らせ一覧 <span aria-hidden="true">→</span></Link>
    </section>
    <section className="corporate-about section container">
      <CorporateHeading title="郡山で、暮らしに向き合う。" lead="私たちIdeaNovaについて" />
      <div className="corporate-about-body">
        <p>身近な暮らしに目を向けること。<br />一つひとつの出会いに、丁寧に応えること。</p>
        <p>私たちIdeaNovaは、福島県郡山市を拠点に、<br className="desktop-only" />化粧品と農作物の二つの事業に取り組んでいます。</p>
        <CorporateButton href="/company" secondary>会社案内</CorporateButton>
      </div>
      <span className="corporate-about-seal" aria-hidden="true">福島<br />郡山</span>
    </section>
    <section className="corporate-business-section section">
      <div className="container">
        <CorporateHeading title="暮らしを支える、二つの事業。" lead="毎日のお手入れから、季節の食卓まで。" />
        <BusinessCards />
      </div>
    </section>
    <section className="corporate-columns section container">
      <CorporateHeading title="暮らしのコラム" lead="日々の気づきや、季節の便りをお届けします。" />
      <ArticleState {...columns} empty={!columns.data?.length}>
        <CorporateArticleList articles={(columns.data || []).slice(0, 2)} kind="journal" cards />
      </ArticleState>
      <div className="corporate-section-action"><CorporateButton href="/journal" secondary>コラム一覧</CorporateButton></div>
    </section>
    <ShopInvitation /><CorporateContact />
  </>;
}

export function ShopInvitation() {
  return <section className="corporate-shopping section">
    <div className="container">
      <CorporateHeading title="お買い物のご案内" lead="お探しの商品に合わせて、それぞれのショップへお進みください。" />
      <div className="corporate-shopping-doors">
        <div><h3>季節の農作物をお探しの方</h3><p>IdeaNovaの農作物ショップでご覧いただけます。</p>
          <CorporateButton href="/shop">農作物ショップへ</CorporateButton></div>
        <div><h3>化粧品をお探しの方</h3><p>化粧品専用の別サイトへ移動します。</p>
          <CorporateButton href="/shop/cosmetics" secondary>化粧品オンラインショップへ</CorporateButton></div>
      </div>
    </div>
  </section>;
}
export function CorporateContact() {
  return <section className="corporate-contact">
    <div className="container">
      <CorporateHeading title="お気軽に、ご相談ください。" lead="会社や事業についてのご質問・ご相談を承ります。" />
      <CorporateButton href="/contact">会社へのお問い合わせ</CorporateButton>
    </div>
  </section>;
}
export function CorporateBusiness({ business }: { business?: Business }) {
  if (!business) return <BusinessOverview />;
  const d = details[business];
  return <><div className="container page">
    <Crumbs items={[{ label: '事業紹介', href: '/business' }, { label: d.name }]} />
    <CorporateHeading page title={d.name} lead={d.subtitle} />
    <div className="business-detail">
      <img src={`/images/${business}.webp`} alt={`${d.name}のイメージ（サンプル）`} width="1536" height="1024" />
      <div><h2>事業について</h2><p>{d.text}</p>
        <dl className="information">
          <div><dt>事業内容</dt><dd>{d.service}</dd></div>
          <div><dt>商品の発送</dt><dd>{d.shipping}</dd></div>
          <div><dt>ご相談内容</dt><dd>{d.contact}</dd></div>
        </dl>
        <CorporateButton href={`/shop/${business}`}>{business === 'cosmetics' ? '化粧品オンラインショップへ' : '農作物ショップへ'}</CorporateButton>
        {business === 'cosmetics' && <p className="corporate-link-note">化粧品専用の別サイトへ移動します。</p>}
      </div>
    </div>
    <p className="demo-note">商品・取扱条件は正式情報の確認後に掲載します。写真は事業のイメージです。</p>
  </div><CorporateContact /></>;
}
export function CompanyPage() { return <CompanyContent />; }
export function EditorialPage({ kind, id }: { kind: 'news' | 'journal'; id?: string }) {
  const { gateway, revision } = useGateway();
  const r = useResource(() => gateway.listArticles(kind), [kind, revision]);
  const entries = r.data || [];
  const article = id ? entries.find(a => a.id === id) : undefined;
  const title = kind === 'news' ? 'お知らせ' : '暮らしのコラム';
  const scope = useRef<HTMLDivElement>(null);
  useMotion(scope, (_, root) => {
    if (id || !root.querySelector('.corporate-article')) return;
    revealOnScroll('.editorial-content .corporate-article', { y: kind === 'journal' ? 28 : 18, stagger: .12 });
  }, [r.data, id, kind]);
  if (id && !r.loading && !r.error && !article) return <MissingPage />;
  return <div ref={scope} className={`editorial-designed editorial-${kind}${id ? ' editorial-detail' : ''}`}>
    {!id && <EditorialScene kind={kind} />}<div className="editorial-content">
    {id && <Crumbs items={[{ label: title, href: id ? `/${kind}` : undefined }, ...(article ? [{ label: article.title }] : [])]} />}
    <ArticleState {...r} empty={!entries.length}>
      {article ? <article>
        <div className="corporate-article-meta"><time>{article.date}</time><span>{article.category}</span></div>
        <CorporateHeading page title={article.title} />
        <img src={`/images/${article.image === 'hero' ? 'koriyama' : article.image}.webp`} alt="記事のイメージ" />
        <p>{article.text}</p>
        <p className="demo-note">本記事は画面確認用のサンプルです。正式な記事は公開前に確認・差し替えを行います。</p>
        <CorporateButton href={`/${kind}`} secondary>一覧へ戻る</CorporateButton>
      </article> : <CorporateArticleList articles={entries} kind={kind} headingLevel={2} cards={kind === 'journal'} />}
    </ArticleState>
    {!id && <p className="demo-note">掲載記事はサンプルです。</p>}
    </div>{!id && <><SceneLeaves className="editorial-end-leaves" /><EditorialClosing /></>}
  </div>;
}
export function LegalPage({ type }: { type: string }) {
  const title = type === 'privacy' ? '個人情報の取り扱い' : type === 'commerce' ? '特定商取引法に基づく表記' : '利用規約';
  return <div className="container page narrow"><Crumbs items={[{ label: title }]} /><Heading title={title} />
    <div className="notice"><strong>正式な法務文言は確認中です。</strong><p>このページは掲載領域のデモです。正式販売の利用条件としては使用できません。</p></div>
    {(type === 'commerce' ? ['販売事業者・所在地・責任者・連絡先', '販売価格・税・送料・その他の費用', '銀行振込・PayPayの支払時期と方法', 'お届け時期・発送主体', '返品・交換・キャンセル'] : type === 'privacy' ? ['収集する情報と利用目的', '管理方法・委託先・第三者提供', '開示・訂正・削除などの窓口'] : ['会員登録・共通アカウント', '事業別の注文と発送', 'レビュー・紹介制度', '返品・解約・免責・利用停止']).map(t => <section key={t} className="legal-section"><h2>{t}</h2><p>運用条件と法務確認の完了後、正式文言を掲載します。</p></section>)}
    <p>{isCosmetics ? '化粧品の使用上の注意・返品・交換条件は正式商品情報とあわせて確認中です。' : '農作物の不良・誤配送と、お客様都合の返品は区別してご案内します。受付条件・期限は未確定です。'}</p>
    <Link href="/shop/contact">ショップに問い合わせる →</Link>
  </div>;
}
export function MissingPage() {
  return <div className="container page"><Heading title="ページが見つかりません" lead="URLをご確認いただくか、下のリンクからお進みください。" />
    <div className="actions"><Link className="button" href={corporateOrigin + '/'}>企業サイトへ →</Link><Link className="button secondary" href="/shop">ショップへ →</Link></div>
  </div>;
}


