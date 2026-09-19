import type { CSSProperties, ReactNode } from 'react';
import { Link, useRoute } from './router';
import { CorporatePhoto, corporateImages, type CorporatePhotoProps } from './CorporateMedia';
import { ErrorBox } from './GatewayContext';
import { Plant, Flask, UsersThree, Globe } from '@phosphor-icons/react';

/** Independent editorial elements; their parent section only controls placement. */
export function EditorialHeading({ id, eyebrow, children, level = 2, dot = false, size, gap, className = '' }: {
  id?: string; eyebrow?: string; children: ReactNode; level?: 1 | 2 | 3;
  dot?: boolean; size?: CSSProperties['fontSize']; gap?: CSSProperties['gap']; className?: string;
}) {
  const Title = level === 1 ? 'h1' : level === 3 ? 'h3' : 'h2';
  return <div className={`corporate-editorial-heading ${className}`} style={{ gap }}>
    {eyebrow && <p className="ref-eyebrow">{eyebrow}</p>}
    <Title id={id} style={{ fontSize: size }}>{children}{dot && <span className="ref-dot">。</span>}</Title>
  </div>;
}

export function CorporateDescription({ children, className = '', width, lineHeight, spacing }: {
  children: ReactNode; className?: string; width?: CSSProperties['maxWidth'];
  lineHeight?: CSSProperties['lineHeight']; spacing?: CSSProperties['marginBlockStart'];
}) {
  return <p className={`corporate-description ${className}`} style={{ maxWidth: width, lineHeight, marginBlockStart: spacing }}>{children}</p>;
}

export function CorporateAction({ href, children, variant = 'button', tone = 'green', external = false }: {
  href: string; children: ReactNode; variant?: 'button' | 'text' | 'outline'; tone?: 'green' | 'red'; external?: boolean;
}) {
  return <Link href={href} className={`corporate-action ${variant === 'text' ? 'ref-text-link' : 'ref-pill'}${tone === 'red' ? ' ref-pill-red' : ''}${variant === 'outline' ? ' ref-pill-outline' : ''}`}>
    <span className="corporate-action-label">{children}</span><span className={`corporate-arrow${external ? ' is-external' : ''}`} aria-hidden="true">{external ? '↗' : '→'}</span>
  </Link>;
}

export function CorporateCategory({ href, label, photo }: { href: string; label: string; photo: CorporatePhotoProps }) {
  return <Link href={href} className="corporate-category"><CorporatePhoto {...photo} /><span>{label}</span><span className="corporate-arrow" aria-hidden="true">→</span></Link>;
}

export function BusinessLabel({ number, children }: { number: string; children: ReactNode }) {
  return <div className="corporate-business-label"><p className="ref-business-number">{number}</p><p className="ref-business-label">{children}<span aria-hidden="true" /></p></div>;
}

export function CorporateNewsRow({ article, kind = 'news' }: { article: ArticleSummary; kind?: 'news' | 'journal' }) {
  return <Link href={`/${kind}/${article.id}`} className="ref-news-row">
    <time className="ref-article-meta" dateTime={article.date.replaceAll('.', '-')}>{article.date}</time>
    <span className="ref-news-title">{article.title}</span>
    <span className="ref-news-badge">{kind === 'journal' ? 'コラム' : article.category}</span>
  </Link>;
}

export function EditorialEmphasis({ children }: { children: ReactNode }) {
  return <span className="corporate-emphasis">{children}</span>;
}

export function CorporateBrand() {
  return <Link href="/" className="corporate-brand" aria-label="IdeaNova 企業サイト">
    <img className="corporate-logo" src="/images/ideanova-logo.webp" alt="IdeaNova ideas for a new tomorrow" width={786} height={527} decoding="async" />
  </Link>;
}

const valueIcons = { nature: Plant, science: Flask, people: UsersThree, future: Globe };
export function CorporateValue({ number, title, icon }: { number: string; title: string; icon: keyof typeof valueIcons }) {
  const Icon = valueIcons[icon];
  return <li className="corporate-value"><Icon weight="thin" aria-hidden="true" /><div><span>{number}</span><h3>{title}</h3></div></li>;
}

export function CorporateColumnCard({ article, photo }: { article: ArticleSummary; photo: CorporatePhotoProps }) {
  return <Link href={`/journal/${article.id}`} className="ref-column-card"><CorporatePhoto {...photo} />
    <span className="ref-article-meta">記事イメージ</span><h3>{article.title}<span className="corporate-arrow" aria-hidden="true">›</span></h3>
  </Link>;
}

export function CorporateNavItem({ href, children, className = '' }: { href: string; children: ReactNode; className?: string }) {
  const path = useRoute().split('?')[0];
  const current = path === href || (href !== '/' && path.startsWith(href + '/'));
  return <Link href={href} className={`corporate-nav-item ${className}`} aria-current={current ? 'page' : undefined}>{children}</Link>;
}

export function CorporateButton({ href, children, secondary = false }: {
  href: string; children: ReactNode; secondary?: boolean;
}) {
  return <Link href={href} className={`button corporate-button${secondary ? ' secondary' : ''}`}>
    {children}<span aria-hidden="true">→</span>
  </Link>;
}

export function CorporateHeading({ title, lead, page = false }: {
  title: string; lead?: string; page?: boolean;
}) {
  return <div className={page ? 'heading corporate-page-title' : 'corporate-section-heading'}>
    {page ? <h1>{title}</h1> : <h2>{title}</h2>}
    {lead && <p>{lead}</p>}
  </div>;
}

export function ArticleState({ loading, error, empty, retry, children }: {
  loading: boolean; error?: unknown; empty: boolean; retry: () => void; children: ReactNode;
}) {
  if (loading) return <div className="corporate-article-state" role="status">
    <span className="article-skeleton" aria-hidden="true" />記事を読み込んでいます…
  </div>;
  if (error) return <ErrorBox error={error} retry={retry} />;
  if (empty) return <p className="corporate-article-state">現在、掲載中の記事はありません。</p>;
  return <>{children}</>;
}

type ArticleSummary = { id: string; date: string; category: string; title: string; image: string };

export function CorporateArticleList({ articles, kind, cards = false, headingLevel = 3 }: {
  articles: ArticleSummary[]; kind: 'news' | 'journal'; cards?: boolean; headingLevel?: 2 | 3;
}) {
  const Title = headingLevel === 2 ? 'h2' : 'h3';
  return <div className={cards ? 'corporate-article-cards' : 'corporate-article-list'}>
    {articles.map(article => <Link className="corporate-article" key={article.id} href={`/${kind}/${article.id}`}>
      {cards && <img src={article.image === 'cosmetics' ? corporateImages.products : article.image === 'agriculture' ? corporateImages.basket : `/images/${article.image === 'hero' ? 'koriyama' : article.image}.webp`}
        alt="" loading="lazy" width="1536" height="1024" />}
      <div className="corporate-article-meta"><time dateTime={article.date.replaceAll('.', '-')}>{article.date}</time><span>{article.category}</span></div>
      <Title>{article.title}</Title><span className="corporate-read-label">記事を読む <span aria-hidden="true">→</span></span>
    </Link>)}
  </div>;
}
