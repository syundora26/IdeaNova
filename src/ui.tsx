import { ArrowUpRight, ArrowRight, Minus, Plus, House } from '@phosphor-icons/react';
import { useEffect, useRef, type ReactNode } from 'react';
import { gsap } from 'gsap';
import { Link } from './router';
export const Arrow = ({ diagonal = false }: {
    diagonal?: boolean;
}) => diagonal ? <ArrowUpRight size={21} weight="light"/> : <ArrowRight size={21} weight="light"/>;
export function ButtonLink({ href, children, secondary = false }: {
    href: string;
    children: ReactNode;
    secondary?: boolean;
}) { return <Link className={`button ${secondary ? 'secondary' : ''}`} href={href}>{children}<Arrow /></Link>; }
export function Breadcrumb({ items }: {
    items: {
        label: string;
        href?: string;
    }[];
}) { return <nav className="breadcrumb" aria-label="パンくずリスト"><Link href="/" aria-label="ホーム"><House size={14}/></Link>{items.map((i, n) => <span key={n}><span className="slash">/</span>{i.href ? <Link href={i.href}>{i.label}</Link> : i.label}</span>)}</nav>; }
export function PageHeading({ en, title, description }: {
    en: string;
    title: string;
    description?: string;
}) { return <div className="page-heading"><span className="eyebrow">{en}</span><h1>{title}</h1>{description && <p>{description}</p>}</div>; }
export function Quantity({ value, max, onChange }: {
    value: number;
    max: number;
    onChange: (v: number) => void;
}) { return <div className="quantity"><button type="button" onClick={() => onChange(value - 1)} disabled={value <= 1} aria-label="数量を減らす"><Minus /></button><output aria-label="数量">{value}</output><button type="button" onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="数量を増やす"><Plus /></button></div>; }
export function Photo({ name, alt, className = '', eager = false, position }: {
    name: string;
    alt: string;
    className?: string;
    eager?: boolean;
    position?: string;
}) { return <img src={`/images/${name}.webp`} alt={alt} className={className} loading={eager ? 'eager' : 'lazy'} fetchPriority={eager ? 'high' : 'auto'} style={{ objectPosition: position }} width={1536} height={1024}/>; }
export function Reveal({ children, className = '' }: {
    children: ReactNode;
    className?: string;
}) { const ref = useRef<HTMLDivElement>(null); useEffect(() => { const el = ref.current; if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches)
    return; const ctx = gsap.context(() => { }, el); const observer = new IntersectionObserver(entries => { if (entries[0].isIntersecting) {
    ctx.add(() => gsap.fromTo(el, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: .7, ease: 'power2.out', clearProps: 'all' }));
    observer.disconnect();
} }, { threshold: .08 }); observer.observe(el); return () => { observer.disconnect(); ctx.revert(); }; }, []); return <div ref={ref} className={className}>{children}</div>; }
export function SampleNote() { return <p className="sample-note">デザイン確認用サンプル。商品名・価格・画像は正式な販売情報ではありません。</p>; }
