import { describe, it, expect, afterEach, vi } from 'vitest';
afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });
async function routes(site: 'cosmetics' | 'corporate') { vi.stubEnv('VITE_SITE', site); vi.resetModules(); return import('../src/router'); }

describe('two-site routing', () => {
  it('keeps corporate business introduction and agriculture local', async () => {
    const r = await routes('corporate');
    expect(r.siteHref('/business/cosmetics')).toBe('/business/cosmetics');
    expect(r.siteHref('/shop/agriculture/products/a01')).toBe('/shop/agriculture/products/a01');
    expect(r.siteHref('/shop/cart')).toBe('/shop/cart');
  });
  it('sends old cosmetics products, checkout and contact to fixed destination', async () => {
    const r = await routes('corporate');
    expect(r.siteHref('/products/c01')).toBe('http://127.0.0.1:5179/products/c01');
    expect(r.siteHref('/shop/cosmetics/products/c02')).toBe('http://127.0.0.1:5179/products/c02');
    expect(r.siteHref('/shop/checkout?business=cosmetics')).toBe('http://127.0.0.1:5179/checkout');
    expect(r.siteHref('/checkout')).toBe('http://127.0.0.1:5179/checkout');
    expect(r.siteHref('/shop/contact?business=cosmetics&order=ORD-1')).toBe('http://127.0.0.1:5179/contact?order=ORD-1');
  });
  it('preserves cosmetic login return and handles returnTo/redirect aliases', async () => {
    const r = await routes('corporate');
    expect(r.siteHref('/login?next=%2Fcheckout')).toBe('http://127.0.0.1:5179/login?next=%2Fcheckout');
    for (const key of ['next', 'returnTo', 'redirect']) expect(r.siteHref(`/login?${key}=%2Fcheckout%3Fbusiness%3Dcosmetics`)).toBe('http://127.0.0.1:5179/login?next=%2Fcheckout');
  });
  it('normalizes standalone routes without a shop prefix', async () => {
    const r = await routes('cosmetics');
    expect(r.canonicalPath('/shop/cosmetics')).toBe('/');
    expect(r.siteHref('/shop/cosmetics/products/c01')).toBe('/products/c01');
    expect(r.siteHref('/shop/cart?business=cosmetics')).toBe('/cart');
    expect(r.siteHref('/shop/login?next=%2Fshop%2Fcheckout%3Fbusiness%3Dcosmetics')).toBe('/login?next=%2Fcheckout');
    expect(r.siteHref('/shop/orders/ORD-1')).toBe('/orders/ORD-1');
  });
  it('allows only internal cosmetics purchase destinations', async () => {
    const r = await routes('cosmetics');
    for (const input of ['https://evil.example', '//evil.example', '/\\evil.example', '/login', '/admin', '/contact', '/shop/agriculture', '/%2f%2fevil.example']) expect(r.safeNext(input)).toBe('/account');
    expect(r.safeNext('/products/c01?next=https://evil.example')).toBe('/products/c01');
    expect(r.safeNext('/checkout?business=cosmetics')).toBe('/checkout');
  });
  it('corporate login never follows an arbitrary destination', async () => {
    const r = await routes('corporate');
    expect(r.canonicalPath('/login?next=https://evil.example')).toBe('/shop/login?next=%2Fshop%2Faccount');
    expect(r.externalDestination('/login?next=https://evil.example/checkout?business=cosmetics')).toBeNull();
  });
});
