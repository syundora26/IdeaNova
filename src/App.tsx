import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ShoppingBag, User, List, X, Storefront, ArrowLeft } from '@phosphor-icons/react';
import { useRoute, Link, canonicalPath, externalDestination } from './router';
import { isCosmetics, siteBusiness, corporateOrigin, demoEnabled } from './site';
import { CosmeticsDeparture, LegacyCartNotice, MigrationPage } from './MigrationPages';
import { GatewayProvider, useGateway } from './GatewayContext';
import { CompanyPage, CorporateBusiness, EditorialPage, LegalPage, MissingPage, PhotoCredit } from './Corporate';
import { CorporateBrand, CorporateNavItem } from './CorporateUI';
import { ReferenceHome, ReferenceFooter } from './ReferenceHome';
import { ShopHome, ProductList, ProductPage } from './ShopPages';
import { CartPage, CheckoutPage, OrderPage } from './CheckoutPages';
import { AuthPage, AccountPage } from './MemberPages';
import { InquiryPage } from './InquiryPage';
import { AdminPage, PreviewPage } from './AdminPages';
import type { Business } from './domain';
function Brand({ shop = false, corporate = false }: {
    shop?: boolean;
    corporate?: boolean;
}) { if (corporate) return <CorporateBrand />; return <Link className="brand" href={shop ? '/shop' : '/'} aria-label={shop ? 'IdeaNova オンラインショップ' : 'IdeaNova 企業サイト'}><span className="brand-symbol" aria-hidden="true"><i /><i /><i /></span><span><strong>IdeaNova</strong><small>{isCosmetics ? '化粧品オンラインショップ' : shop ? '農作物オンラインショップ' : corporate ? '福島県郡山市' : '福島・郡山から、暮らしのそばへ。'}</small></span></Link>; }
function useCorporateHeaderHeight(shop: boolean) {
    const ref = useRef<HTMLElement>(null);
    useLayoutEffect(() => {
        const header = ref.current;
        const layout = header?.closest<HTMLElement>('.corporate-layout');
        if (shop || !header || !layout) return;
        const measure = () => {
            const value = `${header.getBoundingClientRect().height}px`;
            if (layout.style.getPropertyValue('--corporate-header-height') !== value)
                layout.style.setProperty('--corporate-header-height', value);
        };
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(header);
        return () => { observer.disconnect(); layout.style.removeProperty('--corporate-header-height'); };
    }, [shop]);
    return ref;
}
function Header({ shop, path }: {
    shop: boolean;
    path: string;
}) { const headerRef = useCorporateHeaderHeight(shop); const { carts } = useGateway(); const [open, setOpen] = useState(false); const menuButton = useRef<HTMLButtonElement>(null); useEffect(() => setOpen(false), [path]); useEffect(() => { const listener = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); if (document.activeElement?.closest('#corporate-navigation')) menuButton.current?.focus(); } }; window.addEventListener('keydown', listener); return () => window.removeEventListener('keydown', listener); }, []); const count = carts[siteBusiness].reduce((s, l) => s + l.quantity, 0); const business = siteBusiness; return <header ref={headerRef} className={`site-header ${shop ? 'shop-header' : ''}`}><div className="header-inner"><Brand shop={shop} corporate={!shop}/>{shop ? <nav className="shop-nav" aria-label="ショップメニュー"><Link href="/shop"><Storefront /><span>商品を探す</span></Link><Link href="/shop/account"><User /><span>会員ページ</span></Link><Link href={`/shop/cart?business=${business}`} aria-label={`カート ${count}点`}><ShoppingBag /><span>カート</span><b>{count}</b></Link><Link className="corporate-return" href={corporateOrigin + "/"}><ArrowLeft /><span>企業サイトへ</span></Link></nav> : <><nav className="corporate-primary-nav" aria-label="企業メインメニュー">{[['/company', '会社案内'], ['/business', '事業紹介'], ['/news', 'お知らせ'], ['/journal', 'コラム'], ['/contact', 'お問い合わせ']].map(([href, label]) => <CorporateNavItem href={href} key={href}>{label}</CorporateNavItem>)}</nav>
<Link href="/shop/cosmetics" className="corporate-header-shop">化粧品サイトへ <span className="corporate-arrow is-external" aria-hidden="true">↗</span></Link>
<button ref={menuButton} className="menu-toggle" aria-label={open ? 'メニューを閉じる' : 'メニューを開く'} aria-expanded={open} aria-controls="corporate-navigation" onClick={() => setOpen(!open)}>{open ? <X aria-hidden="true" /> : <List aria-hidden="true" />}<span>{open ? '閉じる' : 'メニュー'}</span></button>
<nav id="corporate-navigation" className={`corporate-nav ${open ? 'open' : ''}`} aria-label="企業メニュー">{[['/company', '会社案内'], ['/business', '事業紹介'], ['/news', 'お知らせ'], ['/journal', 'コラム'], ['/contact', 'お問い合わせ'], ['/shop/cosmetics', '化粧品サイトへ'], ['/shop/agriculture', '農作物を購入']].map(([href, label]) => <CorporateNavItem href={href} key={href}>{label}</CorporateNavItem>)}</nav></>}</div></header>; }
function Footer({ shop }: {
    shop: boolean;
}) { if (!shop) return <ReferenceFooter />; return <footer className="site-footer"><div className="container"><div className="footer-top"><div><Brand shop={shop} corporate={!shop}/><p>暮らしを見つめ、地域とつながる。<br />福島県郡山市 / IdeaNova</p></div><nav aria-label="フッターメニュー">{(shop ? [[isCosmetics ? '/shop/cosmetics' : '/shop/agriculture', isCosmetics ? '化粧品の商品一覧' : '農作物の商品一覧'], ['/shop/contact', 'ショップへのお問い合わせ'], [corporateOrigin + '/', '企業サイトへ']] : [['/company', '会社案内'], ['/business', '事業紹介'], ['/news', 'お知らせ'], ['/journal', 'コラム'], ['/contact', '会社へのお問い合わせ'], ['/shop', 'オンラインショップ']]).map(([href, label]) => <Link key={href} href={href}>{label} →</Link>)}</nav></div><div className="footer-legal"><small>© {new Date().getFullYear()} IdeaNova</small><div><Link href="/legal/privacy">個人情報の取り扱い</Link><Link href="/legal/terms">利用規約</Link><Link href="/legal/commerce">特定商取引法に基づく表記</Link></div></div>{!shop && <PhotoCredit />}<div className="demo-footer"><span>デザイン・業務確認用デモ。商品・会社情報・条件は正式公開前に確認します。</span>{demoEnabled && <Link href="/preview">確認シナリオ</Link>}{!isCosmetics && <Link href="/admin">管理画面</Link>}</div></div></footer>; }
function Site() {
    const route = useRoute();
    const departure = externalDestination(route);
    const normalized = canonicalPath(route);
    const url = new URL(normalized, location.origin);
    const publicPath = url.pathname;
    const path = isCosmetics ? (publicPath === '/' ? '/shop/cosmetics' : publicPath.startsWith('/products/') ? '/shop/cosmetics' + publicPath : /^\/(cart|checkout|login|register|reset|recovery|account|orders|contact)(\/|$)/.test(publicPath) ? '/shop' + publicPath : publicPath) : publicPath;
    const b: Business = siteBusiness;
    const shop = isCosmetics || path.startsWith('/shop');
    const admin = !isCosmetics && (path === '/admin' || path === '/preview');
    const main = useRef<HTMLElement>(null);
    const previousRoute = useRef(route);
    useEffect(() => { if (route !== normalized)
        window.history.replaceState({}, '', normalized); window.scrollTo(0, 0); if (previousRoute.current !== route) {
        main.current?.focus({ preventScroll: true });
        previousRoute.current = route;
        const el = main.current;
        if (el && !shop && !admin && !navigator.webdriver && !new URLSearchParams(location.search).has('nomotion')) { el.classList.remove('is-entering'); void el.offsetWidth; el.classList.add('is-entering'); el.addEventListener('animationend', () => el.classList.remove('is-entering'), { once: true }); }
    } const h = main.current?.querySelector('h1')?.textContent; document.title = `${h || 'IdeaNova'} | ${isCosmetics ? 'IdeaNova 化粧品' : shop ? 'IdeaNova 農作物' : 'IdeaNova'}`; }, [route, normalized, shop]);
    useEffect(() => { const update = () => { const title = main.current?.querySelector("h1")?.textContent; if (title)
        document.title = title + " | IdeaNova"; }; const observer = new MutationObserver(update); if (main.current)
        observer.observe(main.current, { childList: true, subtree: true }); update(); return () => observer.disconnect(); }, [route]);
    let page;
    const detail = path.match(/^\/shop\/(cosmetics|agriculture)\/products\/([^/]+)$/);
    const business = path.match(/^\/business\/(cosmetics|agriculture)$/);
    const article = path.match(/^\/(news|journal)\/([^/]+)$/);
    const order = path.match(/^\/shop\/orders\/([^/]+)$/);
    if (departure)
        page = <CosmeticsDeparture destination={departure} />;
    else if (isCosmetics && path === '/shop/cart/transfer')
        page = <MigrationPage id={url.searchParams.get('id') || ''} next={url.searchParams.get('next')}/>;
    else if (isCosmetics && !path.startsWith('/shop/') && !path.startsWith('/legal/') && path !== '/preview')
        page = <MissingPage />;
    else if (path === '/')
        page = <ReferenceHome />;
    else if (path === '/company')
        page = <CompanyPage />;
    else if (path === '/business' || business)
        page = <CorporateBusiness business={business?.[1] as Business | undefined}/>;
    else if (path === '/news' || path === '/journal' || article)
        page = <EditorialPage kind={path.startsWith('/news') ? 'news' : 'journal'} id={article?.[2]}/>;
    else if (path === '/shop')
        page = <ShopHome />;
    else if (path === '/shop/cosmetics' || path === '/shop/agriculture')
        page = <ProductList key={path} business={path.split('/')[2] as Business}/>;
    else if (detail)
        page = <ProductPage key={path} business={detail[1] as Business} id={detail[2]}/>;
    else if (path === '/shop/cart')
        page = <CartPage key={b} business={b}/>;
    else if (path === '/shop/checkout')
        page = <CheckoutPage key={b} business={b}/>;
    else if (order)
        page = <OrderPage key={path} id={order[1]}/>;
    else if (path === '/shop/account')
        page = <AccountPage />;
    else if (['/shop/login', '/shop/register', '/shop/reset', '/shop/recovery'].includes(path))
        page = <AuthPage key={path} mode={path.split('/')[2] as 'login' | 'register' | 'reset' | 'recovery'} next={url.searchParams.get('next')} token={url.searchParams.get('token') || undefined}/>;
    else if (path === '/contact' || path === '/shop/contact')
        page = <InquiryPage key={path + b} business={path === '/contact' ? 'corporate' : b} orderId={url.searchParams.get('order') || ''}/>;
    else if (path.startsWith('/legal/'))
        page = <LegalPage type={path.split('/')[2]}/>;
    else if (path === '/admin' && !isCosmetics)
        page = <AdminPage />;
    else if (path === '/preview' && demoEnabled)
        page = <PreviewPage />;
    else
        page = <MissingPage />;
    return <div className={admin ? 'admin-layout' : shop ? 'shop-layout' : `corporate-layout${path === '/' ? ' corporate-home-layout' : ''}`}><a className="skip-link" href="#main-content">本文へ移動</a>{admin ? <header className="admin-header"><Brand /><nav><Link href="/admin">運営管理</Link><Link href="/preview">確認シナリオ</Link><Link href="/shop">ショップを見る →</Link></nav></header> : <Header shop={shop} path={normalized}/>}<main id="main-content" ref={main} tabIndex={-1}>{!isCosmetics && shop && !departure && <div className="container"><LegacyCartNotice /></div>}{page}</main>{!admin && <Footer shop={shop}/>}</div>;
}
export default function App() { return <GatewayProvider><Site /></GatewayProvider>; }

