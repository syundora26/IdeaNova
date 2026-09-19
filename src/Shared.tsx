import type { ReactNode } from 'react';
import { Link } from './router';
import { siteBusiness } from './site';
import { businessNames, type Business, type CartQuote, type Order, yen } from './domain';
export function Heading({ title, lead, kicker }: {
    title: string;
    lead?: string;
    kicker?: string;
}) { return <div className="heading">{kicker && <p className="kicker">{kicker}</p>}<h1>{title}</h1>{lead && <p>{lead}</p>}</div>; }
export function Crumbs({ items }: {
    items: {
        label: string;
        href?: string;
    }[];
}) { return <nav className="crumbs" aria-label="パンくずリスト"><Link href="/">ホーム</Link>{items.map((item, i) => <span key={i}> / {item.href ? <Link href={item.href}>{item.label}</Link> : item.label}</span>)}</nav>; }
export function Empty({ title, children, href, label }: {
    title: string;
    children?: ReactNode;
    href?: string;
    label?: string;
}) { return <div className="empty"><span className="empty-mark" aria-hidden="true">◇</span><h2>{title}</h2>{children && <p>{children}</p>}{href && <Link className="button" href={href}>{label || '商品を探す'} <span>→</span></Link>}</div>; }
export function BusinessTabs({ business, path }: {
    business: Business;
    path: string;
}) { return <nav className="business-tabs" aria-label="事業別の切り替え">{([siteBusiness]).map(b => <Link key={b} href={`${path}?business=${b}`} aria-current={b === business ? 'page' : undefined}>{businessNames[b]}<span>の{path.includes('cart') ? 'カート' : '注文'}</span></Link>)}</nav>; }
export function Totals({ value }: {
    value: CartQuote | Order;
}) { return <dl className="totals"><div><dt>商品小計（税込）</dt><dd>{yen(value.subtotal)}</dd></div><div><dt>紹介割引</dt><dd>−{yen(value.discount)}</dd></div><div><dt>送料（税込・仮設定）</dt><dd>{yen('shippingFee' in value ? value.shippingFee : value.shipping)}</dd></div><div className="grand-total"><dt>お支払い合計<span>税込</span></dt><dd>{yen(value.total)}</dd></div></dl>; }
export function DemoNote() { return <p className="demo-note">デモサイトです。商品・価格・送料は仮設定です。実際の注文・決済・送信は行われません。</p>; }
export function Field({ label, children, optional = false }: {
    label: string;
    children: ReactNode;
    optional?: boolean;
}) { return <label className="field"><span>{label}<small>{optional ? '任意' : '必須'}</small></span>{children}</label>; }
export function Consent({ checked, onChange, error, text = '利用規約・個人情報の取り扱いに同意する' }: {
    checked: boolean;
    onChange: (v: boolean) => void;
    text?: string;
    error?: string;
}) { return <><label className="check"><input name="consent" aria-invalid={!!error} aria-describedby={error ? "consent-error" : undefined} type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} required/><span>{text}（<Link href="/legal/terms">利用規約</Link>・<Link href="/legal/privacy">個人情報の取り扱い</Link>／正式文言は確認中）</span></label>{error && <p className="corporate-field-error" id="consent-error">{error}</p>}</>; }
export function Steps({ current, labels = ['配送・お支払い', '注文内容の確認', '受付完了'] }: {
    current: number;
    labels?: string[];
}) { return <ol className="steps" aria-label="手続きの進行状況">{labels.map((v, i) => <li key={v} aria-current={current === i ? 'step' : undefined}><span>{i + 1}</span>{v}</li>)}</ol>; }
