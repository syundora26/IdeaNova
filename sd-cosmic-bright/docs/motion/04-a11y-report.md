# 04 Accessibility Auditor — モーション実装の監査レポート

- 監査対象: `sd-cosmic-bright/source/dist/`（port 4185）、基準: `scratchpad/SD-cosmic-bright/source/dist/`（port 4186）
- 手段: Playwright（Chromium）で実測。axe-core 4.13.0。すべて本レポート用に独立に再計測（実装者の diff / probe 結果は流用していない）
- 証拠一式: `scratchpad/audit-a11y/`（スクリプト `*.mjs`、ログ `*.log`、JSON、スクリーンショット）
- ソースは変更していない

## 総合判定: **条件付き合格**

reduced-motion の静止一致（18 枚 0.000%）、`html.motion` ゲート、追加装飾の `aria-hidden` 配下、点滅頻度、フォーカス順・リング、モバイルメニューの aria / inert / トラップ / Escape、axe の新規 violation ゼロ、コントラスト（全て 7.4:1 以上）はいずれも実測で確認できた。
合格の条件は **#1（Medium）**: motion モードで、まだ出現していないセクションの CTA（service の「相談する」、contact の「メールで相談する」）へ Tab で到達した瞬間、要素とフォーカスリングが約 0.4 秒間 opacity 0 のまま（完全表示まで約 0.9 秒）になる。TS 数行で解消できるので、公開前に修正することを推奨する。他は Low（任意対応）。

## 指摘一覧

| # | 重要度 | 箇所 | 現象と証拠 | 推奨修正 | WCAG |
|---|---|---|---|---|---|
| 1 | **Medium** | `src/main.ts` の reveal（IntersectionObserver）と `[data-reveal]` 内のフォーカス可能要素（`.service__cta .link-arrow`、`.contact__cta .btn` / `.contact__mail`） | motion・1440×900 で Tab を進めると、画面外の CTA へフォーカスが移った時点で親 `[data-reveal]` は `opacity:0`。IO で `.is-visible` は +4〜61ms で付くが、`--delay` 165ms + `appear` .9s のため **有効 opacity ≥.5 まで +392〜519ms、≥.99 まで +873〜952ms**（4 試行: `kbd/c-keyboard.log` 行 13・14、`kbd/c2-hammer.log`）。その間フォーカスリングも要素と一緒に不可視（`kbd/contact-focus-0ms-trial1.png`: contact 全体が空、`kbd/contact-focus-settled-trial1.png`: 表示後）。読み込み直後の Tab 連打でも同じ（DCL 後 877〜1128ms で contact ボタンに到達 → 同じ待ち時間）。hero CTA は読み込み ~600ms 後の到達時点で opacity .92 なので問題なし | `main.ts` の IO ブロック内に focusin で即時表示を追加（3〜6 行）:<br>`document.addEventListener('focusin', (e) => {`<br>`  const host = (e.target as HTMLElement).closest<HTMLElement>('[data-reveal]:not(.is-visible), .card:not(.is-visible), .step:not(.is-visible)');`<br>`  if (!host) return;`<br>`  host.style.setProperty('--delay', '0ms');`<br>`  host.style.animationDuration = '.3s'; // フォーカス時だけ短縮`<br>`  host.classList.add('is-visible'); observer.unobserve(host);`<br>`});`<br>これで ≥.5 到達は約 80ms。CSS のみ（`:focus-within{opacity:1}`）は、フォーカスが離れた瞬間に `appear` が 0 から走り直して点滅するため不可 | 2.4.7 Focus Visible、2.4.11 Focus Not Obscured（AA） |
| 2 | Low | `src/styles/cosmic.css` `.nav__list a:after` | reduced-motion で hover / focus-visible 時に ◇ の `scale` が `.5 → 1`（2px → 4px）へ変わる（`a-reduced.log` "MOVEMENT under reduced"、`reduced/nav-marker-reduce-{idle,focus,hover}.png`）。`transition:none` なので瞬時の状態変化であり「動き」ではないが、Whimsy §1「reduced では color / opacity の変化のみ」に反する唯一の箇所。他の hover / focus 対象 13 種は移動・回転・拡縮ゼロを確認 | `scale:calc(.5 + var(--on,0)*.5)` → `scale:calc(1 - (1 - var(--on,0))*var(--mv,1)*.5)`（reduced では常に 1、opacity だけで点灯。`[aria-current]:after{scale:1}` はそのまま） | 2.3.3（AAA、設計規約） |
| 3 | Low | `src/motion/orbit.ts` `toggle(trigger.isActive)` | 読み込み直後（readyState interactive、DCL 前）に `.brand-orbit` と `.contact-orbits` の両方へ `is-active` が付くが、光点 tween は進んでいない（top で 4 秒間 transform 不変）。クラスと tween が不整合で、about の `orbit-breathe` が画面外で `running`（390×844 では about 上端が fold の 6px 下）。ScrollTrigger が実際に toggle するまで stale（about は初回通過で解消、contact は contact に入るまで stale）。`b2-orbit-sync.log`、`b4-orbit-trace2.log`。装飾のみ・コスト小だが、受け入れ基準「常時アニメが画面外で停止」の about ring だけ初期状態で外れる | `ScrollTrigger.create({ …, onToggle: s => toggle(s.isActive), onRefresh: s => toggle(s.isActive) })` を追加（`fonts.ready` / `load` の `refresh()` 後に同期される）。初期の `toggle(trigger.isActive)` は残してよい | 2.2.2（付随）/ 性能 |
| 4 | Low | `src/ui/header.ts` `closeMenu`（450ms 後の `hidden`） | Escape でメニューを閉じた直後 60ms に Tab → フェードアウト中のメニューリンク（有効 opacity .09）にフォーカスが入り、450ms 後の `hidden` でフォーカスが `body` に落ちる（`menu/d-menu.log` "Tab 60ms after Escape"）。450ms 待ちは基準にもあった既存構造だが、基準ではその間メニューが完全表示だったのに対し、今回は不可視の要素にフォーカスが入る | `closeMenu` 冒頭に `menu.inert = true;`、`openMenu` の `menu.hidden = false;` 直後に `menu.inert = false;`（2 行）。または CSS `.menu{visibility:hidden;transition:opacity .3s,visibility 0s .3s}.menu.is-open{visibility:visible;transition-delay:0s}` | 2.4.3 Focus Order、2.4.7 |
| 5 | Low（所見） | 常時アニメ全般（twinkle 44 個、光点周回 22s / 36s、`orbit-breathe` 6s、流れ星、scroll-hint 2.6s） | 5 秒を超えて自動再生され本文と並行して表示されるが、ページ内に「一時停止・停止・非表示」の手段はない。OS の prefers-reduced-motion で全停止（達成方法 C39）。対象はすべて装飾（`aria-hidden`）で、面積は星 ≤21px²、光点 6〜7px、流れ星 90×1px、リングは 1px 線。twinkle / scroll-hint / breathe は変更前から存在し、今回の追加は光点 2 個と流れ星 1 本 | 現状で許容可（後述）。厳密に 2.2.2 を満たすなら、Could 枠でフッターに「動きを止める」トグル（`html.motion` を外す + `ScrollTrigger.getAll().forEach(t => t.disable())`）を検討 | 2.2.2 Pause, Stop, Hide |

## 検証項目ごとの結果

### A. prefers-reduced-motion — 合格（#2 のみ Low）

- (1) `reducedMotion:'reduce'` で `<html class>` は `motion-ready` のみ（`motion` なし）。desktop / mobile とも。`--mv` の computed 値 0。（`a-reduced.json` `early.htmlClass`）
- (2) DOMContentLoaded 時点・networkidle+600ms 時点の両方で、スクロールせずに `[data-reveal], .card, .step` 49 要素すべて opacity 1、内部子孫（`.line>span`、`th/td`、`li`、svg 図形）に opacity <1 は 0 件。`.rule` transform none、`.step:after` 線は完成状態（desktop `rotate(-14deg)` 相当）、`.card__index:after` は既存の傾き、`path` の `stroke-dasharray:none`・`--len` 未設定、`.line>span` は `inline`・`.line` overflow visible、`.universe>img` 高さ 900px（100%）、星 28 個、`.meteor` / `.contact-orbits b` は生成されず、`.brand-orbit b` は `.brand-orbit` 直下のまま、hero img に inline style なし。（`reduced/{desktop,mobile}-after-load-noscroll.png`）
- (3) `node capture.mjs <dist> audit-a11y/capture 4185` で 18 枚撮影 → `diff.mjs` で `scratchpad/shots/` と比較: **18 枚すべて 0.000%（0 px）**。scrollHeight desktop 6236 / mobile 8122 も一致。（`capture/diff-results.txt`）
- (4) hover 14 対象（desktop）・focus-visible 10 対象（desktop / mobile）で `transform / translate / rotate / scale / gap` を idle と比較: 移動系の変化は **nav ◇ の scale .5→1 のみ（#2）**。それ以外の差分は opacity（尾 0→.75）、color（cyan）、box-shadow（glow α .2 / リング）、border-color、background のみ。`.card__index:after` / `.step__index:before` の `rotate: none → 0deg`、`.work svg` の `none → matrix(1,0,0,1,0,0)` は表現上の差で視覚変化なし。

### B. 動きの安全性（motion）— 合格（#3 Low、#5 所見）

- 無限ループの棚卸し（`document.getAnimations()`、1440×900、`b-motion.json`）: `twinkle` 44 個（周期 3〜7s = 最大 0.33Hz、各 ≤21px²）、`scrollhint` 1（2.6s、既存）、`orbit-breathe` 1（6s = 0.167Hz）。その他の finite アニメは待機中 0。
- 流れ星（fake clock で 120s 進行、`b-motion.json` `meteor`）: 初回 **6.6s**（≥5s ✓）、以後 29.2 / 49.2 / 68.9 / 89.8 / 112.3s → 間隔 **19.7〜22.6s**（≥14s ✓、同時 1 本 ✓）、1 本 1.1s、90×1px、位置 top 3.7〜15.5% / left 64〜86%（帯域 3〜18% ✓、テキスト帯域外）。`document.hidden` を true にして 60s → **0 本**、false に戻して 17.8s 後に再開 ✓。（`times` 先頭の重複は MutationObserver の remove/add 2 レコードによる計測アーティファクト）
- 光点: about 22s / contact 36s の等角速度、奥側減光は about のみ（opacity .55〜1）。about 光点 × リング breathe の合成 opacity を 6s 間 24 サンプル: **.52〜.997**（理論最小 .30 は両方の谷が一致した場合のみ）。点滅と呼べる速さではない。
- WCAG 2.3.1（3 回/秒）: 追加・既存すべて **≤0.4Hz**、全面フラッシュなし、大面積の明滅なし（メニューのフェードは操作起点の一発、`.card:after` 等は一発点灯）。**満たす**。
- WCAG 2.2.2: #5 のとおり。所見: 「reduced-motion で全停止」は C39 として 2.3.3 の達成方法であり、2.2.2 に対しては OS 設定に依存する点で厳密には代替にならない。ただし (a) 対象がすべて `aria-hidden` の装飾で本文・操作を妨げない、(b) 小面積・低頻度、(c) twinkle / scroll-hint / breathe は変更前から同じ状態で今回の純増は光点 2 個と流れ星 1 本、(d) 流れ星は 1.1s の一発で「5 秒を超えて続く動き」ではない、から **今回の変更による新たな不適合とは扱わない**。改善するならトグル（任意）。
- 画面外停止: contact 到達時 about は `is-active` 解除・breathe paused・tween 停止 ✓。top に戻ると about 解除 ✓。**読み込み直後のみ #3 の不整合**（両方 `is-active`、tween は停止、about breathe は running）。

### C. キーボード（motion、1440×900）— 条件付き（#1）

- Tab 順（`kbd/c-keyboard.log`）: skip-link → wordmark → nav 6（About〜Contact）→ header CTA → hero「相談する」→ link-arrow「実績を見る」→ scroll-hint → service link-arrow → contact「メールで相談する」→ contact__mail → footer__mail → footer nav 6 → footer「TOP ↑」→ body。計 23 停止、期待どおり。indicator（tabindex −1、aria-hidden）はスキップ。
- フォーカスリング: 全 23 停止で `outline: solid 2px rgb(154,223,255)`、`outline-offset: 7px`、`:focus-visible` true。
- focus-visible = hover（12 対象を idle / hover / focus の 16 プロパティで比較、`kbd/focus-vs-hover.json`）: **全対象で focus と hover の差分ゼロ**。`.btn`: 浮上 −3px、glow α.2、尾 opacity .75 / scale 1 / translate 4px、矢印 4px。`.link-arrow`: cyan + 尾 + 矢印 4px。nav: cyan + ◇ .8 / scale 1。wordmark: リング 6deg + cyan 枠 + glow。`.footer__top`: −3px + cyan。`.contact__mail` / `.footer__mail` / `.footer__nav a`: cyan（`--on` なしの色点灯）。scroll-hint: 変化なし（ラベルの cyan は子要素側で計測外、E の目視で確認）。（`kbd/focus-hero-btn.png`, `focus-hero-link.png`, `focus-header-cta.png`, `focus-nav-contact.png`）
- 未表示要素へのフォーカス: #1。数値は表のとおり。付随: Tab で画面下部へ跳ぶとヘッダーが `is-hidden`（`translateY(-100%)`）になり、Shift+Tab で戻るとヘッダー内リンクにフォーカスした時点で再表示される（`kbd/c3-header-hidden.log`: 6 回 Shift+Tab 後 headerTop 0）。基準ビルドでも同一挙動 → 既存事項。

### D. モバイルメニュー（390×844）— 合格（#4 Low）

`menu/d-menu.log`、`menu/motion-open.png`、`menu/motion-early-tab.png`
- 開: クリック直後に `aria-expanded="true"`、`aria-label="メニューを閉じる"`、`main[inert]`（`main.inert === true`）、`hidden` 解除、Lenis stop。バーは `top:18px` 固定のまま `translate 0 4.5px / rotate 45deg`（レイアウト系プロパティ不動）。
- フェード（強制リフローの効果）: Enter で開いた場合 `.menu` opacity +39ms .24 → +101ms .69 → +152ms .90 → +402ms 1.0（.4s ease-out が確実に走る。スキップなし）。項目は 60ms + n×55ms の遅延で上から順に点灯: li0 +152ms .32 / +202ms .52 / +402ms .99、li5 は +701ms .92 / +1001ms 1.0。`.menu__foot` +701ms .78 → 1.0。
- 開直後 0〜400ms の Tab: +39ms で最初のリンクにフォーカス（focus-visible true）、その時点の有効 opacity 0 → +152ms .29 → +202ms .50 → +402ms .99。リングは要素と一緒に約 150〜200ms 不可視だが、直後に表示される（許容、後述）。
- フォーカストラップ: menu-btn → Tab ×6 で About〜Contact → Tab で wordmark → header CTA → menu-btn → About…（循環）。Shift+Tab は逆順で wordmark → Contact へ回り込み ✓。
- Escape: 即時に `is-open` 解除、`aria-expanded="false"`、`aria-label="メニューを開く"`、`inert` 解除、フォーカスは menu-btn（focus-visible true）。opacity +50ms .69 → +100ms .14 → +302ms 0、**+460ms で `hidden` 復帰** ✓。
- 連打（開→100ms 閉→100ms 開）: 800ms 後も `is-open` / `hidden=false` / opacity 1 / inert ✓（450ms タイマーのガードが機能）。
- リンク選択: 閉じて `hidden`、フォーカスは対象 section（既存挙動）✓。
- reduced: 開閉とも opacity 即時 1 / 0、`translate none`、`hidden` は同じく 460ms 後 ✓。
- #4: Escape → 60ms 後 Tab の焦点ロスト（Low）。

### E. 構造・支援技術 — 合格

`e-structure.json`（audited / baseline × motion / reduced × desktop / mobile の 8 条件）
- 追加装飾の祖先: `.meteor` → `div.universe[aria-hidden] > i.meteor` ✓、contact の `<b>` → `div.contact-orbits[aria-hidden] > i > b` ✓、移動した about の `<b>` → `div.brand-orbit[aria-hidden] > i > b` ✓、星 → `.universe > .twinkles > i` ✓。いずれも textContent 空。
- `.line > span` inline-block 化: h1 と h2 ×7 の `innerText` / `textContent`、about h2 の Selection 文字列、`document.body.innerText` 長（desktop 2081 / mobile 1957）が **audited-motion = baseline = audited-reduced で完全一致**。読み上げ順・選択範囲への影響なし。
- nav `:after`: 6 リンクすべて `content: ""`（空文字）、idle opacity 0 / scale .5、`[aria-current]` のみ 1。`.btn:before` / `.link-arrow:before` も `content: ""` opacity 0。支援技術に露出する文字なし。
- `.menu__list li` の opacity 0: メニューが `hidden`（display none）のとき、または閉フェード中のみ。開状態は 1、≥1024px ではメニュー自体が非表示。
- 読み込み直後・未スクロール時に「opacity 0 かつフォーカス可能子孫を含む」要素: motion では `p.service__cta` と `div.contact__cta`（= #1 の対象、スクロール / フォーカスで出現）。reduced・baseline では 0 件。

### F. axe-core 4.13.0 — 合格（新規 violation 0）

`axe/summary.json`、各条件の JSON。タグ wcag2a / 2aa / 21a / 21aa / 22aa / best-practice。audited と baseline を同条件で 8 組比較（motion / reduced × desktop / mobile、motion は未スクロール + 全スクロール後、mobile はメニュー開も）。
- **新規 violation: 0 / 新規 incomplete: 0**（全 8 組）。
- 既存（基準にも同一）: メニュー開時 `region`（`.menu__foot` がランドマーク外、moderate）1 件、`skip-link` incomplete 1 件（#main が focus 時に視覚変化しない旨の手動確認項目）。`color-contrast` incomplete は背景画像により判定不能なもの（全スクロール後 desktop 95 / mobile 83 で基準と同数。未スクロールの motion は opacity 0 の要素が判定対象外になるため 40 / 28 と少ないだけ）。

### G. コントラスト — 合格（悪化なし）

`g-contrast.json`。計算値（デザイントークン基準）と、実描画のスクリーンショットから要素周囲 6 点を採取した背景（平均 / 最も明るい点）の両方で算出。
- cyan `#9adfff`（hover / focus の点灯色として `.contact__mail`、`.footer__nav a`、`.footer__mail`、`.menu__jp`、`.scroll-hint__label`、`.footer__top`、`.link-arrow`、nav に追加）: 対 `--bg #102149` **10.76:1**。実背景に対して desktop 8.5〜12.3:1 / mobile 8.9〜11.6:1、メニュー開の `.menu__jp` 10.41:1。いずれも 4.5:1 を大きく上回る。idle 色（`.contact__mail #becfeb` 7.6〜10:1、`.footer__top #c5d8ff` 9.1〜11.6:1 など）からの悪化もなし（最小は contact 背景の明るい部分で idle 7.4:1 → cyan 8.0:1 と向上）。
- `.btn--signal` 文字 `#081633`: グラデーション各端 `#edfaff` 16.8:1 / `#b1d3ff` 11.6:1 / `#b5b2fb` 9.1:1（変更なし）。`.btn--outline` 文字: idle 13.9:1、hover 背景 `#b4ccff18` で 11.9:1。
- フォーカスリング cyan: 対ページ背景 10.76:1、対スクロール時ヘッダー `#142b55` 9.54:1（UI 部品 3:1 ✓、offset 7px で隣接はページ背景）。
- nav ◇（cyan 輪郭 .8）7.37:1、`.nav__jp #c9d8f1` 10.91:1（変更なし）。

## 変更なしで許容できる事項

- **2.2.2 の停止手段なし（#5）**: 上記の理由で今回の変更による不適合とはしない。トグルは Could。
- **メニュー開直後の項目 opacity 0（0〜約 200ms）**: Tab は到達可能でフォーカスは正しく移り、リングは 150〜200ms 後に見える。フェードの意匠上の遅延として許容。
- **about 光点がリングの `orbit-breathe` を継承（合成 opacity 実測 .52〜.997）**: 装飾・`aria-hidden`・0.167Hz。許容。
- **nav ◇ 擬似要素を全リンクに常時描画**: `content:""` で支援技術に影響なし。
- **`.line > span` の inline-block**: 読み上げ・選択・innerText いずれも不変。
- **hero CTA の読み込み直後**: Tab 連打で到達する ~600ms 時点で opacity ≥.9。intro（240ms + .8s）は問題にならない。
- **ヘッダーの `is-hidden` とキーボード**: Tab でページ下部へ跳ぶとヘッダーが隠れるが、Shift+Tab でヘッダー内へ戻ると再表示される。基準と同一の既存挙動（今回のスコープ外）。
- **axe の既存 `region`（`.menu__foot`）/ `skip-link` incomplete**: 基準と同一。別途対応するなら `.menu__foot` を `<nav>` 内か `<footer>` に移す。
- **モバイルメニュー開時に `<footer>` が inert でない**: 視覚的にはオーバーレイの下、キーボードはトラップで到達不可。SR の仮想カーソルでは到達し得るが、基準と同一の既存構造。
- **Google Fonts 取得失敗の console エラー 1 件**: 環境要因（基準も同条件）。サイト由来の console エラー・警告は 0。

## 証拠ファイル（`scratchpad/audit-a11y/`）

- A: `a-reduced.mjs` / `a-reduced.log` / `a-reduced.json`、`capture/`（18 枚 + `diff-*.png` + `diff-results.txt`）、`reduced/*-after-load-noscroll.png`、`a2-navmarker.mjs` / `reduced/nav-marker-*.png`
- B: `b-motion.mjs` / `b-motion.json` / `b-motion.log`、`b2-orbit-sync.mjs` / `.log`、`b4-orbit-trace2.mjs` / `.log`
- C: `c-keyboard.mjs` / `kbd/c-keyboard.log` / `kbd/tab-order.json` / `kbd/focus-vs-hover.json`、`c2-hammer.mjs` / `kbd/c2-hammer.log`、`c3-header-hidden.mjs` / `kbd/c3-header-hidden.log`、`kbd/*.png`
- D: `d-menu.mjs` / `menu/d-menu.log` / `menu/d-menu.json`、`menu/*.png`
- E: `e-structure.mjs` / `e-structure.log` / `e-structure.json`
- F: `f-axe.mjs` / `axe/*.json` / `axe/summary.json` / `axe/run.log`
- G: `g-contrast.mjs` / `g-contrast.log` / `g-contrast.json`
