import { GatewayError, type GatewaySnapshot, type ShopGateway, type CartLine } from './domain';
import { siteId, siteBusiness } from './site';

const listeners = new Set<() => void>();
let snapshot: GatewaySnapshot = { revision: 0, member: null, carts: { cosmetics: [], agriculture: [] }, scenario: 'normal', adminRole: 'full', adminEntered: false };
let pending: Promise<unknown> = Promise.resolve();
const storageKey = `ideanova-${siteId}-cart-v3`;

export function legacyCosmeticsCart(): CartLine[] {
  if (siteId !== 'corporate') return [];
  try { const value = JSON.parse(localStorage.getItem('ideanova-cart-v2') || localStorage.getItem('ideanova-carts') || '{}');
    return Array.isArray(value.cosmetics) ? value.cosmetics.filter((l: CartLine) => typeof l.productId === 'string' && Number.isInteger(l.quantity) && l.quantity > 0) : [];
  } catch { return []; }
}

function receive(value: GatewaySnapshot) {
  const { revision: _oldRevision, ...old } = snapshot;
  const { revision: _newRevision, ...next } = value;
  if (JSON.stringify(old) !== JSON.stringify(next) || value.revision !== snapshot.revision) {
    // Server session revisions are monotonic. Each mutation invalidates resources once.
    snapshot = value;
    try { localStorage.setItem(storageKey, JSON.stringify(snapshot.carts[siteBusiness])); } catch { /* Cookie-held cart remains available. */ }
    listeners.forEach(fn => fn());
  }
}

export function demoRpc<T>(method: string, ...args: unknown[]): Promise<T> {
  const operation = async () => {
    let response;
    try { response = await fetch('/demo-api/rpc', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ method, args }) }); }
    catch { throw new GatewayError('NETWORK', '共通データサービスに接続できません。入力を残したまま再試行してください。', {}, true); }
    let result;
    try { result = await response.json(); } catch { throw new GatewayError('NETWORK', '共通データサービスを起動してから、再試行してください。', {}, true); }
    if (result.snapshot) receive(result.snapshot);
    if (result.error) throw new GatewayError(result.error.code, result.error.message, result.error.fields || {}, result.error.retryable);
    if (!response.ok) throw new GatewayError('NETWORK', '通信を完了できませんでした。', {}, true);
    return result.value as T;
  };
  const result = pending.then(operation, operation);
  pending = result.catch(() => undefined);
  return result;
}

const localMethods = {
  subscribe: (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; },
  getSnapshot: () => snapshot,
};
// The server owns an explicit operation allowlist and repeats business/permission checks.
export const shopGateway = new Proxy(localMethods, {
  get(target, name: string) {
    if (name in target) return target[name as keyof typeof target];
    return (...args: unknown[]) => demoRpc(name, ...args);
  },
}) as ShopGateway;

export async function initializeGateway() {
  let cart = [];
  try {
    const saved = localStorage.getItem(storageKey);
    cart = saved ? JSON.parse(saved) : siteId === 'corporate' ? JSON.parse(localStorage.getItem('ideanova-cart-v2') || localStorage.getItem('ideanova-carts') || '{}').agriculture || [] : [];
  } catch { /* Invalid saved values never become credentials. */ }
  await demoRpc('bootstrap', cart);
}
