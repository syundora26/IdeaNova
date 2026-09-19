import { useEffect, useState, type AnchorHTMLAttributes } from 'react';
import { isCosmetics, corporateOrigin, cosmeticsOrigin } from './site';

function legacyPath(path: string) {
  const u = new URL(path, 'http://local');
  if (u.pathname === '/contact' && ['cosmetics', 'agriculture'].includes(u.searchParams.get('business') || '')) u.pathname = '/shop/contact';
  else if (/^\/(cosmetics|agriculture|cart|checkout|login|register|reset|recovery|account)(\/.*)?$/.test(u.pathname)) u.pathname = '/shop' + u.pathname;
  else if (u.pathname === '/products' || u.pathname.startsWith('/products/')) u.pathname = '/shop/' + (u.searchParams.get('business') === 'agriculture' ? 'agriculture' : 'cosmetics') + u.pathname.replace(/^\/products$/, '');
  return u;
}
export function cosmeticsPath(path: string): string {
  const u = legacyPath(path);
  if (u.pathname === '/shop' || u.pathname === '/shop/cosmetics') u.pathname = '/';
  else if (u.pathname.startsWith('/shop/cosmetics/products/')) u.pathname = u.pathname.replace('/shop/cosmetics', '');
  else if (/^\/shop\/(cart|checkout|login|register|reset|recovery|account|orders|contact)(\/|$)/.test(u.pathname)) u.pathname = u.pathname.slice(5);
  u.searchParams.delete('business');
  for (const k of ['next', 'returnTo', 'redirect']) {
    const value = u.searchParams.get(k);
    if (value) { u.searchParams.delete(k); u.searchParams.set('next', safeCosmeticsNext(value)); }
  }
  return u.pathname + u.search + u.hash;
}
export function safeCosmeticsNext(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return '/account';
  try {
    const u = new URL(value, 'http://local');
    for (const k of ['next', 'returnTo', 'redirect']) u.searchParams.delete(k);
    const mapped = cosmeticsPath(u.pathname + u.search);
    return /^\/(?:$|products\/[^/]+$|cart(?:\?|$)|checkout(?:\?|$)|account(?:\?|$)|orders\/[^/]+$)/.test(mapped) ? mapped : '/account';
  } catch { return '/account'; }
}
export function canonicalPath(path: string): string {
  if (isCosmetics) return cosmeticsPath(path);
  const u = legacyPath(path);
  for (const k of ['next', 'returnTo', 'redirect']) {
    const value = u.searchParams.get(k);
    if (value) { u.searchParams.delete(k); u.searchParams.set('next', safeNext(value)); }
  }
  return u.pathname + u.search + u.hash;
}
export function safeNext(value: string | null): string {
  if (isCosmetics) return safeCosmeticsNext(value);
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return '/shop/account';
  try {
    const u = legacyPath(value);
    if (['/shop/login', '/shop/register'].includes(u.pathname)) return '/shop/account';
    for (const k of ['next', 'returnTo', 'redirect']) u.searchParams.delete(k);
    return /^\/shop\/(?:account|cart|checkout|orders|agriculture|cosmetics)(?:\/|$)/.test(u.pathname) ? u.pathname + u.search : '/shop/account';
  } catch { return '/shop/account'; }
}
export function externalDestination(path: string): string | null {
  if (!path.startsWith('/') || path.startsWith('//')) return null;
  const u = legacyPath(path);
  if (isCosmetics) {
    if (u.pathname.startsWith('/shop/agriculture') || u.searchParams.get('business') === 'agriculture') return corporateOrigin + u.pathname + u.search;
    return null;
  }
  if (/^\/(cart|checkout)(?:\?|$)/.test(path) && !u.searchParams.has('business')) return cosmeticsOrigin + cosmeticsPath(path);
  const next = u.searchParams.get('next') || u.searchParams.get('returnTo') || u.searchParams.get('redirect');
  const nextIsCosmetics = next?.startsWith('/') && !next.startsWith('//') && !next.includes('\\') && (legacyPath(next).pathname.startsWith('/shop/cosmetics') || legacyPath(next).searchParams.get('business') === 'cosmetics' || /^\/(cart|checkout)(?:\?|$)/.test(next) && !legacyPath(next).searchParams.has('business'));
  if (u.pathname.startsWith('/shop/cosmetics') || u.pathname.startsWith('/shop/') && (u.searchParams.get('business') === 'cosmetics' || nextIsCosmetics)) return cosmeticsOrigin + cosmeticsPath(path);
  return null;
}
export function siteHref(path: string) { return externalDestination(path) || (path.startsWith('/') && !path.startsWith('//') ? canonicalPath(path) : path); }
export function navigate(path: string) {
  const next = siteHref(path);
  if (!next.startsWith('/') || next.startsWith('//')) { window.location.assign(next); return; }
  if (next === window.location.pathname + window.location.search) return;
  window.history.pushState({}, '', next); window.dispatchEvent(new PopStateEvent('popstate'));
}
export function useRoute() {
  const [route, setRoute] = useState(window.location.pathname + window.location.search);
  useEffect(() => { const handler = () => setRoute(window.location.pathname + window.location.search); window.addEventListener('popstate', handler); return () => window.removeEventListener('popstate', handler); }, []);
  return route;
}
export function Link({ href = '/', onClick, children, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const target = siteHref(href);
  return <a href={target} {...rest} onClick={e => { onClick?.(e); if (!e.defaultPrevented && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey && e.button === 0 && target.startsWith('/') && !target.startsWith('//') && rest.target !== '_blank') { e.preventDefault(); navigate(target); } }}>{children}</a>;
}
