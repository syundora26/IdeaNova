import { useEffect, useState } from 'react';
import { Link, safeCosmeticsNext } from './router';
import { legacyCosmeticsCart } from './httpGateway';
import { useGateway, useAction, useResource, ErrorBox, Loading } from './GatewayContext';
import { cosmeticsOrigin, corporateOrigin } from './site';
import { yen } from './domain';
import { Heading } from './Shared';

export function LegacyCartNotice({ destination = cosmeticsOrigin + '/cart' }: { destination?: string }) {
  const [lines] = useState(legacyCosmeticsCart);
  const { gateway } = useGateway();
  const action = useAction();
  if (!lines.length) return null;
  const next = safeCosmeticsNext(new URL(destination).pathname + new URL(destination).search);
  return <aside className="notice migration-notice" aria-label="化粧品カートの引き継ぎ"><p className="kicker">以前の化粧品カートが残っています</p><h2>新しいショップへ、お買い物を引き継ぐ。</h2><p>{lines.reduce((n, l) => n + l.quantity, 0)}点の商品が保存されています。現在の販売状態・在庫・価格を新サイトで確認できます。農作物のカートは変わりません。</p><p className="caption">引き継ぎ案内は10分間有効です。元のカート情報は残します。</p><ErrorBox error={action.error}/><button className="button" disabled={action.busy} onClick={() => action.run(() => gateway.issueMigration(lines), result => { window.location.assign(cosmeticsOrigin + '/cart/transfer?id=' + encodeURIComponent(result.id) + '&next=' + encodeURIComponent(next)); })}>{action.busy ? '案内を用意しています…' : '化粧品カートを引き継ぐ'} →</button></aside>;
}

export function CosmeticsDeparture({ destination }: { destination: string }) {
  const [hasCart] = useState(() => legacyCosmeticsCart().length > 0);
  useEffect(() => { if (!hasCart) window.location.replace(destination); }, [destination, hasCart]);
  return <div className="container page narrow"><Heading title="化粧品ショップは独立サイトへ移りました。" lead="商品・お買い物・会員画面は、新しい化粧品オンラインショップでご利用ください。"/><LegacyCartNotice destination={destination}/><a className="button secondary" href={destination}>引き継がずに新しいショップへ →</a></div>;
}

export function MigrationPage({ id, next }: { id: string; next: string | null }) {
  const { gateway } = useGateway();
  const r = useResource(() => gateway.inspectMigration(id), [id]);
  const action = useAction();
  const [done, setDone] = useState(false);
  return <div className="container page narrow"><Heading title="化粧品カートの引き継ぎ" lead="現在の価格と数量をご確認ください。内容を確認してから、このショップのカートへ引き継ぎます。"/>{r.loading ? <Loading /> : r.error ? <><ErrorBox error={r.error} retry={r.retry}/><a href={corporateOrigin + '/shop'} className="button secondary">企業サイトで案内を作り直す →</a></> : r.data && <>{done || r.data.applied ? <div className="success-panel"><h2>カートを引き継ぎました。</h2><p>同じ案内を再度開いても、数量は重複して加算されません。</p><Link className="button" href={safeCosmeticsNext(next)}>お買い物を続ける →</Link><Link className="text-link" href="/cart">カートを確認する →</Link></div> : <><p className="caption">有効期限：{new Date(r.data.expiresAt).toLocaleTimeString('ja-JP')} / すべて税込・仮設定</p><div className="migration-items">{r.data.items.map(item => <article key={item.productId}><h2>{item.name}</h2><dl className="information"><div><dt>現在の単価</dt><dd>{yen(item.unitPrice)}</dd></div><div><dt>旧カート / 新カート</dt><dd>{item.requested}点 / {item.existing}点</dd></div><div><dt>引き継ぎ後</dt><dd><strong>{item.quantity}点</strong></dd></div></dl><p>{item.notice}</p></article>)}</div><p>価格は移行時点の価格です。旧サイトの価格では注文しません。同じ商品が新カートにある場合、数量の多い方を採用します。</p><ErrorBox error={action.error} retry={action.error ? r.retry : undefined}/><button className="button full" disabled={action.busy} onClick={() => action.run(() => gateway.applyMigration(id, r.data!.items), () => setDone(true))}>{action.busy ? '引き継いでいます…' : 'この内容でカートを引き継ぐ'} →</button><Link className="text-link" href="/cart">引き継がずにカートを見る →</Link></>}</>}</div>;
}
