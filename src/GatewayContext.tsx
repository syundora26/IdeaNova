import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { shopGateway, initializeGateway } from './httpGateway';
import { GatewayError, type ShopGateway } from './domain';
const Context = createContext<ShopGateway>(shopGateway);
export function GatewayProvider({ children, gateway = shopGateway }: {
    children: ReactNode;
    gateway?: ShopGateway;
}) {
    const [ready, setReady] = useState(gateway !== shopGateway);
    const [error, setError] = useState<unknown>();
    const start = () => { setError(undefined); initializeGateway().then(() => setReady(true)).catch(setError); };
    useEffect(() => { if (gateway === shopGateway) start(); }, [gateway]);
    useEffect(() => { const refresh = () => { gateway.getSession().catch(() => undefined); }; window.addEventListener('focus', refresh); window.addEventListener('popstate', refresh); return () => { window.removeEventListener('focus', refresh); window.removeEventListener('popstate', refresh); }; }, [gateway]);
    return <Context.Provider value={gateway}>{ready ? children : <main className="container page"><h1>IdeaNova</h1>{error ? <ErrorBox error={error} retry={start} /> : <Loading />}</main>}</Context.Provider>;
}
export function useGateway() { const gateway = useContext(Context); const state = useSyncExternalStore(gateway.subscribe, gateway.getSnapshot); return { gateway, ...state }; }
export function useResource<T>(loader: () => Promise<T>, deps: unknown[] = []) { const [data, setData] = useState<T>(); const [error, setError] = useState<unknown>(); const [loading, setLoading] = useState(true); const [attempt, setAttempt] = useState(0); useEffect(() => { let live = true; setLoading(true); setError(undefined); loader().then(value => { if (live)
    setData(value); }).catch(e => { if (live)
    setError(e); }).finally(() => { if (live)
    setLoading(false); }); return () => { live = false; }; }, [...deps, attempt]); return { data, error, loading, retry: () => setAttempt(n => n + 1) }; }
export function useAction() { const [busy, setBusy] = useState(false); const [error, setError] = useState<unknown>(); const run = async <T,>(action: () => Promise<T>, success?: (result: T) => void) => { setBusy(true); setError(undefined); try {
    const result = await action();
    success?.(result);
    return result;
}
catch (e) {
    setError(e);
    return undefined;
}
finally {
    setBusy(false);
} }; return { busy, error, run, clear: () => setError(undefined) }; }
export const errorText = (error: unknown) => error instanceof Error ? error.message : '処理を完了できませんでした。もう一度お試しください。';
export function ErrorBox({ error, retry }: {
    error: unknown;
    retry?: () => void;
}) { if (!error)
    return null; return <div className="error-box" role="alert"><strong>{error instanceof GatewayError ? ({ VALIDATION: '入力内容の確認', UNAUTHENTICATED: 'ログインが必要です', FORBIDDEN: '操作権限の確認', NOT_FOUND: '見つかりません', CONFLICT: '内容が変わりました', NETWORK: '通信エラー', UNAVAILABLE: '現在利用できません', REFERRAL_INVALID: '紹介コードの確認', PAYMENT_PENDING: '決済結果を確認中' }[error.code]) : '処理できませんでした'}</strong><p>{errorText(error)}</p>{error instanceof GatewayError && Object.entries(error.fields).map(([k, v]) => <p key={k}>{({ name: '氏名', email: 'メールアドレス', phone: '電話番号', address: '住所', nickname: 'ニックネーム', age: '年代', postal: '郵便番号', referralCode: '紹介コード' } as Record<string, string>)[k] || k}：{v}</p>)}{retry && <button className="text-button" onClick={retry}>もう一度読み込む →</button>}</div>; }
export function Loading() { return <div className="loading" role="status"><span />読み込んでいます…</div>; }
const draftCache = new Map<string, unknown>();
/** Transient drafts survive same-tab navigation, never a disk/storage write. */
export function useDraft<T>(key: string, initial: T): [
    T,
    (value: T) => void,
    () => void
] { const [value, setValue] = useState<T>(() => draftCache.has(key) ? draftCache.get(key) as T : initial); return [value, next => { draftCache.set(key, next); setValue(next); }, () => draftCache.delete(key)]; }
export function clearDrafts() { draftCache.clear(); }
