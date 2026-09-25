# 03 Frontend Developer 実装レポート（モーション実装）

- 作業ディレクトリ: `sd-cosmic-bright/source/`（git commit / push はしていない。`dist/` は build 生成物で .gitignore 対象）
- スコープ: 01 の Must + Should、02 の Whimsy 5 案、追加要望 U1。Could は未実装。文言・構造は変更なし（属性追加のみ）。
- 旧モジュール（`src/three/*`, `scroll/reveal.ts`, `scroll/sections.ts`, `ui/cursor.ts`, `ui/effects.ts`, 旧 CSS 4 ファイル）は未変更・未 import。

## 1. 変更ファイルと行数

| ファイル | 変更 | 行数 |
|---|---|---|
| `src/motion/index.ts` | 新規: `html.motion` ゲート、各 setup 呼び出し、`fonts.ready` / `load` 後の `ScrollTrigger.refresh()` | 19 |
| `src/motion/parallax.ts` | 新規: U1 / H2 / B2 / F1（scrub, ease none, invalidateOnRefresh） | 40 |
| `src/motion/orbit.ts` | 新規: A1 / K1 光点周回（`i:first-child` の子、ResizeObserver、onToggle で pause/play、`is-active`） | 41 |
| `src/motion/decor.ts` | 新規: P1 `--seq`、W1 `--len`、H3 焦点、B3 流れ星 | 48 |
| `src/main.ts` | `motion-ready` 付与、同じ親内の順番 × 55ms stagger（`.step` は × 120ms、`data-delay` 優先）、星 44 個（motion 時）、`setupMotion()` | +17 / −3 |
| `src/ui/header.ts` | `requestAnimationFrame` → `void menu.offsetWidth` 強制リフロー（Whimsy 2） | +2 / −1 |
| `index.html` | `<head>` にインライン script 1 行（CSS `<link>` より前）、hero 4 要素に `data-delay`、`.scroll-hint` に `data-reveal="fade" data-delay="600"`、`.brand-orbit` / `.contact-orbits` に `data-reveal="fade"` | +8 / −7（属性追加のみ） |
| `src/styles/motion.css` | 新規（cosmic.css と同じ圧縮スタイル）。112 規則 / 49 行（うちコメント 18 行） | 49 |
| `src/styles/cosmic.css` | 既存 11 行を置換（`--bx` 8 か所、`.btn` / `.link-arrow` / `.nav__list a:after` 分割 / `.menu-btn__bar` / `.indicator` transition / `.work:hover svg` 撤去 / `.contact__mail` / `.footer__nav a` / `appear` from opacity 0 + `--rise`） | 11 / 11（純増 0） |
| `src/styles/index.css` | `@import './motion.css'` を cosmic.css の後に追加 | +1 |

新規 TS 合計 148 行（上限 300）。CSS 追加は motion.css 49 行（規則数 112）+ cosmic.css の置換 11 行。
ビルド後サイズ: CSS 25.15 → 33.47 kB（gz 6.77 → 8.47）、index.js 24.59 → 27.85 kB（gz 7.49 → 8.60）、gsap チャンク不変。

## 2. 設計 ID ごとの実装状況

| ID | 状況 | 実装内容 / 逸脱と理由 |
|---|---|---|
| L0 | 実装 | `<head>` の 1 行 script が reduced でなければ `html.motion`。`html.motion :is([data-reveal],.card,.step):not(.is-visible){opacity:0}`。`appear` の from を opacity 0 に。フェイルセーフは `html.motion:not(.motion-ready) …{animation:failsafe 0s 4s forwards}`（01a §1 のとおり JS が来なかった場合のみ）。stagger は同じ親の中での順番 × 55ms（上限 6 段）。**逸脱（軽微）**: `motion-ready` は `IntersectionObserver` がある場合にだけ付ける（IO の無い環境で `.is-visible` が付かず内容が消えたままになるのを避け、4s フェイルセーフに落とすため） |
| H1 | 実装 | `data-delay` 0/80/160/240 → `--delay`。`.scroll-hint` は `data-reveal="fade"`（opacity のみ）+600ms。hero イントロだけ設計書 A の値（.8s / 12px）を `html.motion .hero__inner .is-visible{--rise:12px;animation-duration:.8s}` で適用。h1・`.hero__art img` は非対象 |
| H2 | 実装 | `.hero__art img` に `yPercent: 14`（≤767: 10）、`#hero` top top → bottom top、scrub |
| H3 | 実装 | 起動時に `gsap.set(img,{scale:1.03})`、`img.decode()` 解決後（失敗時も）`scale:1` を 2.4s `expo.out`（GSAP に cubic-bezier が無いため `--ease-out` の近似）。H2 と同じ要素の transform は GSAP が合成。opacity は触らない |
| A1 | 実装 | 既存 `b` を `i:first-child` 内へ移動し `translate(rx·cosθ, ry·sinθ)`（rx/ry = clientWidth/2, clientHeight/2、ResizeObserver で再計測）。22s linear、奥側（上半分）で opacity .55 → 手前 1。ScrollTrigger onToggle で pause/play、`orbit-breathe` は `.is-active` で `animation-play-state` 切替。**注記**: 01a §5 のとおり `i:first-child` の子にしたため、リングの `orbit-breathe`（.55〜1）を光点も継承する（奥側で合成最小 ≈ .3）。装飾要素・低頻度なので許容と判断、要レビュー |
| A2 | 実装 | `[data-reveal=lines]` は親の appear を無効化し `.line{overflow:hidden}` + `span{display:inline-block}`（`html.motion` 配下で常時。`.is-visible` 時に display が変わってずれないため）、`rise-line` .9s、2 行目 +90ms。`.rule` は scaleX 0→1（origin left、1.2s、+.25s）。`.keywords li` は 70ms stagger。いずれも親の兄弟 stagger `--delay` を加算。`.h2 .line` の高さは motion / reduced で同一（77.02px）を確認 |
| S1 | 実装 | `--tilt` を nth-child ごとに定義（−30/30/−15/40deg）。`settle` keyframes: `rotate(calc(var(--tilt) - 40deg)) scale(.85)` + opacity 0 → `rotate(var(--tilt))`、1.2s、+.1s。`.card:after` ◇は +.6s で fade .4s |
| P1/P2 | 実装 | TS が `--seq`。`.step:after` は `rotate(var(--rot)) scaleX(0→1)` .5s、`.step__index:after` は opacity .25→1 .5s、遅延 `calc(var(--seq)*var(--seq-gap))`（.34s）。`--rot` は −14/14deg、≤1023 で ∓21deg。≤767 は `scaleY` + `transform-origin:top`、`--seq-gap:0`、節点 .4s。本文 `--delay` は n × 120ms |
| W1 | 実装 | TS が `--len`（`Math.ceil(getTotalLength())`）。**逸脱（実装方式）**: ブリーフの「`:not(.is-visible)` に dasharray/dashoffset、`.is-visible` で 0 へ（transition）」ではなく、`.work.is-visible svg :is(path,ellipse){stroke-dasharray:var(--len);animation:draw-path 1.2s .3s both}`（keyframes: `stroke-dashoffset: var(--len) → 0`）にした。理由: transition 方式だと JS が `--len` を設定した瞬間に dashoffset が 0→len へ逆向きに遷移し始め、その最中に `.is-visible` が付くと途中から描画される。数値（線 1.2s +.3s、点 .4s +.1s）は同じ。表示前は親 `.work` の opacity 0 で隠れている |
| C1 | 実装 | `tr[data-reveal=row]` の appear を無効化し `th, td` を opacity のみ .7s、td は +55ms。行同士は親内 stagger（55ms）で逐次点灯 |
| B2 | 実装 | `.section-num` を px で `y: 40 → −40`（≤767: ±20）、trigger = 親 section、top bottom → bottom top、scrub |
| F1 | 実装 | `.footer__big` を `y: 60 → 0`（≤767: 30）、footer top bottom → bottom bottom、scrub |
| B3 | 実装 | `.universe` 内に `<i class="meteor">` 1 つ（90×1px、`rotate(-30deg)`、頭側が明るいグラデーション）。`translateX(-220px)` 1.1s、opacity 0→.7→0（`--ease-inout`）。初回は load + 5〜15s、以後 14〜24s 乱数。位置 上 3〜18% / 横 60〜96%。`visibilitychange` で停止・再開。`z-index:1`（`.universe:after` の色被せより上、twinkles と同層） |
| U1 | 実装 | `html.motion .universe>img{height:124%}`、`.twinkles{height:160%}`、`y: () => -(layer.clientHeight - universe.clientHeight)`、`trigger: document.body, start:'top top', end:'max'`、scrub、invalidateOnRefresh。星は motion 時 44 個（reduced 28 個・100%）。保険で `html.motion .universe{overflow:hidden}`。検証: 1440×900 で最下部到達時 img −216px（=24vh）、twinkles −540px（=60vh） |
| K1 | 実装 | `html.motion` 時のみ `<b>` を `i:first-child` に追加、36s linear、減光なし、開始位相は既存 `:after` の位置（left 25% / top 8px ≒ 0.61 周）。`html.motion .contact-orbits i:first-child:after{display:none}` |
| Whimsy 1 | 実装 | `--bx` 8 か所を置換。`:before` で 14×1px の尾（`right:calc(var(--bx)+4px)` / link-arrow は 4px、opacity 0→.75、scale .3→1、origin 右）。矢印 `translate:4px`。浮上は `transform:translateY(-3px)` から `translate` 個別プロパティ（`--on × --mv × -3px`）へ移し、glow は `rgba(...,calc(var(--on)*.2))` で `--on` 駆動（`.btn--signal` は既存の静的 glow + 追加）。押下 `translate -1px` + `scale .98` + `0 0 12px #9fe9ff66` .12s。`.link-arrow` の `gap` 遷移を撤去（hover 中も 29px 固定を確認）、`position:relative` 追加。reduced は `--mv:0` で頭・浮上・縮小ゼロ、尾は全長で opacity のみ |
| Whimsy 2 | 実装 | `.menu` opacity 0→1（開 .4s / 閉 .3s）、`li` opacity + translate 8px×`--mv`、.35s、遅延 60ms + n×55ms（`--i` は nth-child）、閉は .2s 遅延 0。`.menu__foot` +.4s。バーは `top` 固定で `translate:0 ±4.5px` + `rotate:±45deg`。header.ts は強制リフロー。検証: クリック直後 opacity 0 → 120ms で .83 → 1s で 1、閉 100ms で .21、450ms 後 `hidden` |
| Whimsy 3 | 実装 | `.nav__list a:after` を全リンクに常時描画（`opacity:calc(var(--on)*.8)`、`scale:.5→1`、輪郭のみ）、`[aria-current]` で塗り + glow、.3s クロスフェード。`box-sizing:border-box` で 4px の見た目を維持（reduced スクリーンショット差分 0）。indicator は `transition:all` を個別指定に、hover で cyan + glow、押下 `scale(.8)` .12s、ラベル .3s |
| Whimsy 4 | 実装 | `.card:hover .card__index:after` / `.step:hover .step__index:before` に `rotate:24deg×--mv`（in .9s / out .5s）+ border-color、`.card:hover:after` cyan + glow、`.work:hover svg` は `scale(1.06) rotate(-2deg)`（in .9s / out .5s、`--mv` 適用）。すべて `@media(hover:hover)` 内 |
| Whimsy 5 | 実装 | `.header>.wordmark:after` に `rotate:6deg×--mv` .5s + border/glow、`.footer__top` `translate:0 -3px` + cyan、`.contact__mail` / `.footer__mail` / `.footer__nav a` / `.menu__list a .menu__jp` / `.scroll-hint__label` を `--t-ui` で cyan に。focus-visible は hover と同じ状態 |
| 共通 | 実装 | `:root{--t-ui:.3s;--t-reveal:.9s;--t-draw:1.2s;--ease-out;--ease-inout;--mv:1}`、`@media(prefers-reduced-motion:reduce){:root{--mv:0}}`。hover / focus の方針: 移動・回転・尾・glow を伴う状態は `--on:1` を `@media(hover:hover)` 内の `:hover` と、外側の `:focus-visible` で立てる。色だけの「点灯」は `:is(:hover,:focus-visible)` をメディアクエリ外に置いた（色・opacity のみでタッチ残留の害がなく、reduced の規約「色 / opacity のみ」とも整合）。非インタラクティブ `li`（案4）は全規則を `(hover:hover)` 内 |
| B1 / H4 / H5 / A3 / K2 / B4 | 未実装 | Could（指示どおり）。ヘッダーの既存 transition（.4s）も B1 の「維持」に従い変更していない |

## 3. 検証結果

1. **build**: `npm run build`（`tsc --noEmit` strict / noUnusedLocals / noUnusedParameters + `vite build`）通過。
2. **静止一致（reduced-motion）**: `capture.mjs`（port 4181）→ `diff.mjs` で現行 shots/ と比較。desktop / mobile の full + 8 セクション、計 18 枚すべて **0.000%（0 px）**。
3. **動作（motion, Playwright, reducedMotion no-preference, 1440×900 / 390×844）**:
   - `html.motion` あり、`motion-ready` あり。
   - 1s ごとに 600px スクロールして最下部まで → `[data-reveal]:not(.is-visible), .card:not(.is-visible), .step:not(.is-visible)` = **0**（desktop / mobile とも）。
   - console エラー: サイト由来 **0**。環境由来 1 件（`fonts.googleapis.com` の CSS が sandbox プロキシの CA で `ERR_CERT_AUTHORITY_INVALID`。ベースライン撮影時も同条件で、フォントはフォールバック）。GSAP の warning もなし。
   - `--delay`: hero 0/80/160/240、scroll-hint 600、cards 0/55/110/165、steps 0/120/240/360/480ms。`--seq` 0〜4、`--len` 7 要素すべて設定。星 44 個、層の高さ img 1116 / twinkles 1440（viewport 900）。
   - 最下部での transform: `.universe>img` −216px、`.twinkles` −540px、`.footer__big` 0。`.brand-orbit` は画面外で `is-active` 解除（tween pause）、`.contact-orbits` は可視で再生。
   - hover プローブ（motion）: 矢印 4px / 尾 .75・scale 1 / 浮上 −3px / glow α.2 → 離すと全て 0。link-arrow の gap は 29px のまま。nav ◇ idle 0・.5 → hover .8・1 → current 1・塗り 4px。リング 6deg。card 24deg + ◇ cyan。step 線は描画中 `scaleX` 0.24 → 完了で `rotate(∓14deg)`。work は dash 512 → 0、hover で 1.06/−2°。about: `.line` overflow hidden、span inline-block、rule scaleX 1、光点が 1s 間で移動、奥側 opacity .84、breathe running。
   - hover プローブ（reduced）: 矢印 0 / 浮上 0 / リング 0deg / card 0deg / svg transform none / span は inline / 線は完成状態 / 光点は静止。尾は全長で opacity .75（静的な →）。
   - **scrollHeight 一致**: desktop 6236 / mobile 8122 が motion・reduced で同一（レイアウト不変）。
   - **フェイルセーフ**: モジュール JS をブロック（`html.motion` だけ付く状態）→ 1s 時点で 49/49 が opacity 0、4.6s 後に 0 件（h1 / hero img は常に 1）。
4. **モバイルメニュー（390px）**: `.is-open` 付与でフェード（上記）、項目の stagger、バーの ✕、Escape / 再クリックで .3s フェードアウト → 450ms 後 `hidden`。
5. **LCP 要素**: `.hero__art > img` の computed は opacity 1（mobile は既存 CSS `.hero__art img{opacity:.84}` の値で変更なし）/ visibility visible / clip-path none。inline style は GSAP の `transform` のみ。h1 は inline style なし、opacity 1 / visible / none。読み込み直後（domcontentloaded 時点）も同じ。

## 4. 監査担当に見てほしい点

**Accessibility**
- reduced-motion: `html.motion` が付かず、静止表示は現行と 18 枚とも一致。`--mv:0` で hover の移動系もゼロ、色・opacity の点灯は残る。既存の `animation:none / transition:none !important` も維持。
- キーボード: `.btn` / `.link-arrow` / nav / wordmark / `.footer__top` は `:focus-visible` で hover と同じ状態 + 既存リング。メニューは開いた直後 .06〜.4s の間 項目が opacity 0（Tab は可能でリングは出る）。
- 点滅: 追加した周期アニメは光点周回（22s / 36s）、流れ星（1.1s、≥14s 間隔、同時 1 本）のみ。既存 twinkle / orbit-breathe は不変。
- A1 の光点がリングの `orbit-breathe` を継承する点（合成最小 opacity ≈ .3、装飾・aria-hidden 内）。
- nav の ◇ は擬似要素（content 空）で全リンクに常時存在。スクリーンリーダーへの影響なし。

**Performance**
- U1 は fixed 背景の img（viewport の 124%）と `.twinkles`（44 個、各 box-shadow + twinkle animation）を毎スクロールフレーム transform で移動。合成レイヤーのみだが、低スペック mobile での実測を推奨。星の数増加（28→44）は motion 時のみ。
- `.hero__art img` に transform（H2 yPercent + H3 scale）が付く。opacity は不変なので LCP 要素は変わらない想定だが、Lighthouse で LCP 要素が `.hero__art > img` のまま・CLS 0 であることを確認してほしい（scrollHeight は両モードで一致）。
- H3 は起動時に `gsap.set(scale:1.03)`。モジュール実行が初回描画より後になった場合、3% の一回きりのスナップが起こり得る（意図的な trade-off。LCP には影響なし）。
- ScrollTrigger 数: U1 2 + H2 1 + B2 6 + F1 1 + A1/K1 2 = 12（pin なし、scrub true）。ResizeObserver 2、`getTotalLength()` 7 回（起動時のみ）。`document.fonts.ready` と `load` で `refresh()` を各 1 回。
- 流れ星: `setTimeout` 再帰、`document.hidden` で停止。要素 1 つ、1.1s の一発。
- バンドル増分: CSS +8.3 kB（gz +1.7）、JS +3.3 kB（gz +1.1）。

## 5. スクリーンショット（監査用）

ベース: `（作業用一時ファイル）`

- reduced-motion（現行比較用、18 枚 + diff 画像）: `reduced/desktop-*.png`, `reduced/mobile-*.png`, `reduced/diff-*.png`
- motion:
  - hero 読み込み直後 / 完了: `motion/desktop-hero-0ms.png`, `motion/desktop-hero-loaded.png`, `motion/mobile-hero-0ms.png`, `motion/mobile-hero-loaded.png`
  - about / process / contact / footer: `motion/{desktop,mobile}-{about,process,contact,footer}.png`
  - process 出現直後（結線中）: `motion/process-early-no-preference.png`（比較: `process-early-reduce.png`）
  - about（光点・見出し行）: `motion/about-no-preference.png`（比較: `about-reduce.png`）
  - hover: `motion/hover-btn-{no-preference,reduce}.png`, `motion/hover-link-{no-preference,reduce}.png`, `motion/hover-card-{no-preference,reduce}.png`
  - モバイルメニュー開: `motion/mobile-menu-open.png`
  - 全長（スクロール後）: `motion/desktop-full-settled.png`, `motion/mobile-full-settled.png`
- 計測ログ: `motion/verify.json`（スクロール・LCP・メニュー）, `motion/probe.json`（hover / アニメ状態、両モード）
- スクリプト: `verify.mjs`, `probe.mjs`, `failsafe.mjs`, `hovershot.mjs`

## 6. 既知の制約・メモ

- Google Fonts は sandbox 環境では取得できないため、全スクリーンショットはフォールバックフォント（ベースラインも同条件）。実フォントでの `.line` 行高（overflow:hidden）と inline-block の見え方は本番フォントでも再確認を推奨。
- `.brand-orbit` / `.contact-orbits` の `data-reveal` は値を `fade`（opacity のみ）にした（ブリーフは値未指定。より控えめな方を選択）。
- `html.motion .universe>img{height:124%}` により背景画像の表示倍率は約 1.24 倍（ブリーフで許容済み）。
