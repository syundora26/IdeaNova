import type { Business } from './domain';

export type SiteId = 'corporate' | 'cosmetics';
// Vite replaces these values separately for each deployable site.
export const siteId: SiteId = (import.meta.env?.VITE_SITE === 'cosmetics' ? 'cosmetics' : 'corporate');
export const isCosmetics = siteId === 'cosmetics';
export const siteBusiness: Business = isCosmetics ? 'cosmetics' : 'agriculture';
export const corporateOrigin = import.meta.env?.VITE_CORPORATE_ORIGIN || 'http://127.0.0.1:5177';
export const cosmeticsOrigin = import.meta.env?.VITE_COSMETICS_ORIGIN || 'http://127.0.0.1:5179';
export const demoEnabled = import.meta.env?.VITE_DEMO !== 'false';
