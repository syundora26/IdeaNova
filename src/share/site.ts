import type { Business } from '../domain';
export type SiteId = 'corporate' | 'cosmetics';
export const siteId: SiteId = import.meta.env.VITE_SITE === 'cosmetics' ? 'cosmetics' : 'corporate';
export const isCosmetics = siteId === 'cosmetics';
export const siteBusiness: Business = isCosmetics ? 'cosmetics' : 'agriculture';
// Hash URLs keep both previews portable under any GitHub Pages repository path.
const directory = new URL('./', document.baseURI);
export const corporateOrigin = new URL(isCosmetics ? '../' : './', directory).href + '#';
export const cosmeticsOrigin = new URL(isCosmetics ? './' : 'cosmetics/', directory).href + '#';
export const demoEnabled = false;
