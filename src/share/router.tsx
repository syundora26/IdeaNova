import { useEffect, useState, type AnchorHTMLAttributes } from 'react';
import { canonicalPath as originalCanonicalPath, siteHref as originalHref } from '../router';
export { safeNext, safeCosmeticsNext, cosmeticsPath, externalDestination } from '../router';
const privateRoute = (path: string) => /^\/(admin|preview)(?:[/?]|$)/.test(path);
export function canonicalPath(path: string) { return privateRoute(path) ? '/not-found' : originalCanonicalPath(path); }
export function siteHref(path: string) {
  const target = originalHref(path);
  return target.startsWith('/') && !target.startsWith('//') ? '#' + canonicalPath(target) : target;
}
let previous = '/';
function readRoute() {
  if (!window.location.hash) previous = '/';
  else if (window.location.hash.startsWith('#/')) previous = window.location.hash.slice(1);
  return previous;
}
export function navigate(path: string) {
  const target = siteHref(path);
  if (!target.startsWith('#/')) { window.location.assign(target); return; }
  window.history.pushState({}, '', target);
  window.dispatchEvent(new PopStateEvent('popstate'));
}
export function useRoute() {
  const [route, setRoute] = useState(readRoute);
  useEffect(() => {
    const update = () => setRoute(readRoute());
    window.addEventListener('popstate', update); window.addEventListener('hashchange', update);
    return () => { window.removeEventListener('popstate', update); window.removeEventListener('hashchange', update); };
  }, []);
  return route;
}
export function Link({ href = '/', onClick, children, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  if (privateRoute(href)) return null;
  const target = siteHref(href);
  return <a href={target} {...rest} onClick={e => {
    onClick?.(e);
    if (!e.defaultPrevented && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey && e.button === 0 && target.startsWith('#/') && rest.target !== '_blank') { e.preventDefault(); navigate(href); }
  }}>{children}</a>;
}
