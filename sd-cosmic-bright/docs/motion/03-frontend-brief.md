# 03 Frontend Developer 実装ブリーフ（承認済み設計 + 追加要望）

## 承認状況
- 01-ui-designer.md の **Must + Should** と 02-whimsy-injector.md の **5 案すべて** を実装する。Could は実装しない。
- 01a-tech-review.md の注意点（フェイルセーフの `motion-ready` ゲート、LCP、`.is-visible` と GSAP の競合回避、擬似要素は CSS keyframes）を守る。
- **追加要望（ユーザー）: 「背景の宇宙をスクロールに合わせて動かしてほしい」** → 下記 U1 を Must として追加。

## U1 背景の宇宙の深度パララックス（Must・ユーザー要望）
- 対象: `.universe > img`（starfield.webp）と `.universe .twinkles`（JS 生成の星の層）。`.universe` 自体（fixed）と `.universe:after`（色のグラデーション）は動かさない。
- 動き: ページ全体のスクロール進捗（0 → max）に比例して、**画像層は上へ 24vh 相当、星の層は上へ 60vh 相当** 移動する（遠い層ほど遅い＝深度）。`ease:'none'`、`scrub:true`。
- 隙間を出さないため、`html.motion` 配下でのみ層を縦に大きくする: `html.motion .universe>img{height:124%}`、`html.motion .universe .twinkles{height:160%}`（`.universe` は `inset:0` の fixed なので % は viewport 基準。vh 単位はモバイルのアドレスバーで揺れるので使わない）。
- 移動量は px で正確に: `y: () => -(img.clientHeight - universe.clientHeight)`、twinkles も同様。`invalidateOnRefresh:true`。ScrollTrigger は `trigger: document.body, start: 'top top', end: 'max'`（または `end: () => ScrollTrigger.maxScroll(window)`）。
- 星の数: 層が 1.6 倍になるので、`html.motion` のときだけ 28 → 44 個生成（密度維持）。reduced-motion では 28 個・100% 高さのまま（現行と同一）。
- 既存の `.hero__art img` のパララックス（H2: コンテンツより 14% 遅れる）と組み合わせると、奥から「星空（最も遅い）→ 星の層 → 惑星 → 本文」の深度順になる。
- reduced-motion: 何もしない（層の高さも 100%）。
- 注意: object-fit:cover の画像を 124% にすると表示倍率が約 1.24 倍になる。これは許容（設計上の判断済み）。それ以上は拡大しない。

## 作業場所と成果物
- **作業ディレクトリ（git 管理下・ここを編集する）**: `sd-cosmic-bright/source/`（`npm ci` 済み。`npm run build` = `tsc --noEmit && vite build`）
- 参照用の元データ（編集しない）: `（元データ source/）`
- **git commit はしない**（オーケストレーターがレビュー後にコミットする）。
- 実装後、レポートを `（作業用一時ファイル）` に書く（変更ファイル一覧と行数、設計 ID ごとの実装状況／逸脱と理由、検証結果、既知の制約）。

## ファイル構成の指針
- 新規 TS は `src/motion/` に 3〜4 ファイル（例: `index.ts` 入口とヘルパー（motion 判定・可視時再生・fonts.ready 後 refresh）、`parallax.ts`（U1・H2・B2・F1）、`orbit.ts`（A1・K1 の光点周回）、`decor.ts`（P1 の `--seq` 付与・W1 の path 長計測・B3 流れ星・H3 焦点））。合計 **300 行以内**。
- 新規 CSS は `src/styles/motion.css`（`index.css` で `cosmic.css` の後に `@import`）。Whimsy 案のうち既存規則の書き換え（`--bx` 置換、`.link-arrow` の gap 撤去、`.nav__list a:after` の分割、`.menu-btn__bar`、`.work:hover svg`、transition の `--t-ui` 統一）は `cosmic.css` 側を直接編集してよい。新規追加は motion.css に。合計追加 **200 行程度**（cosmic.css と同じ圧縮スタイルで数える）。
- `index.html`: `<head>` 先頭付近に 1 行のインライン script（`<script>try{if(!matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.classList.add('motion')}catch(e){}</script>`。CSS の `<link>` より前に置く）。hero 4 要素に `data-delay`、`.scroll-hint` / `.brand-orbit` / `.contact-orbits` に `data-reveal`。文言・構造は変えない。
- `src/main.ts`: 先頭で `document.documentElement.classList.add('motion-ready')`、IO の stagger を「同じ親の中での順番 × 55ms」に、星の数を motion で 44 個、`setupMotion()` の呼び出し。既存のスクロール処理・ヘッダー・インジケーター・hero ポインタ追従は維持。
- `src/ui/header.ts`: `requestAnimationFrame(() => menu.classList.add('is-open'))` → `void menu.offsetWidth; menu.classList.add('is-open');`（Whimsy 案2）。
- 未使用の旧モジュール（`src/three/*`, `src/scroll/reveal.ts`, `src/scroll/sections.ts`, `src/ui/cursor.ts`, `src/ui/effects.ts`, `styles/{tokens,base,components,sections}.css`）は **触らない・importしない**（削除もしない）。

## 実装の要点（設計書の再掲・補足）
- L0: `html.motion :is([data-reveal],.card,.step):not(.is-visible){opacity:0}`。`appear` の from を opacity 0 に。フェイルセーフは `html.motion:not(.motion-ready) :is([data-reveal],.card,.step):not(.is-visible){animation: failsafe 0s 4s forwards}` のように **JS が動かなかった場合だけ** 効かせる。
- H1: `data-delay="0|80|160|240"` を `--delay` に反映（`el.style.setProperty('--delay', el.dataset.delay + 'ms')`）。scroll-hint は opacity のみ（`data-reveal="fade"` など専用値）。
- A2: `.h2[data-reveal=lines]` は親の appear を無効化し、`.line`（overflow:hidden）内の `span` を `translateY(.4em)→0` + opacity で 90ms 間隔。`.rule[data-reveal=rule]` は scaleX 0→1（origin left、1.2s、+.25s）。`.keywords[data-reveal=keywords] li` は 70ms stagger。
- P1/P2: TS は各 `.step` に `--seq`。CSS keyframes で `.step.is-visible:after`（線）を `transform: rotate(var(--rot)) scaleX(0)→scaleX(1)`、`.step.is-visible .step__index:after`（光点）を opacity .25→1。`--rot` は既存の rotate 値（-14deg / even 14deg、≤1023: ∓21deg）を各セレクタで定義。≤767 は `scaleY` + `transform-origin: top`。遅延 `calc(var(--seq) * .34s)`（≤767 は 0）。本文の `--delay` は `n × 120ms`。
- S1: `.card.is-visible .card__index:after` を `rotate(calc(var(--tilt) - 40deg)) scale(.85)` + opacity 0 → `rotate(var(--tilt))`（1.2s、+.1s）。`--tilt` を nth-child ごとに定義（-30 / 30 / -15 / 40deg）。`.card.is-visible:after`（◇）は +.6s で opacity 0→1。
- W1: TS で `.work__thumb svg :is(path,ellipse)` の `getTotalLength()` を `--len` に。CSS: `html.motion .work:not(.is-visible) svg :is(path,ellipse){stroke-dasharray:var(--len);stroke-dashoffset:var(--len)}` → `.is-visible` で 0 へ（1.2s、+.3s）。点（rect, circle）は opacity 0→1（.4s、+.1s）。
- C1: `tr[data-reveal=row]` は本体の appear を無効化し、`th, td` を opacity のみ .7s、55ms stagger。
- B2/F1: `.section-num` は `yPercent` ではなく px で `y: 40 → -40`（≤767: ±20）、`.footer__big` は `y: 60 → 0`（≤767: 30）。`scrub:true`。
- H2: `.hero__art img` に `yPercent: 14`（≤767: 10）、trigger `#hero` top top → bottom top。H3: `img.decode?.()` / `complete` 後に `gsap.fromTo(img,{scale:1.03},{scale:1,duration:2.4,ease})`（同じ要素の transform を GSAP が合成するので競合なし）。
- A1/K1: 01a §5 のとおり。光点は `i:first-child` の子。`rx = i.clientWidth/2`, `ry = i.clientHeight/2`（ResizeObserver で更新）。about 22s、contact 36s。ScrollTrigger `onToggle` で `pause/play`、`orbit-breathe` は `is-active` クラスで `animation-play-state` 切替。contact は `html.motion .contact-orbits i:first-child:after{display:none}`。
- B3: `.universe` 内に `<i class="meteor">` 1 つ。`rotate(-30deg)` した 90×1px のグラデーション。`setTimeout` 再帰（14〜24s 乱数、初回は load+5s 以降）。`document.hidden` で停止。位置は上部 3〜18% / 横 60〜96% の乱数。1.1s で 220px 滑る + opacity 0→.7→0。
- Whimsy: 02 の §1 共通ルール（`--on` / `--mv`）と §2 の数値どおり。hover 規則は `@media (hover:hover)` 内、focus-visible / active は外。`@media (prefers-reduced-motion:reduce){:root{--mv:0}}`。
- reduced-motion: 既存の `*{animation:none!important;transition:none!important}` は維持。`html.motion` が無ければ `setupMotion()` は何もしない。

## 検証（実装者が引き渡し前に行うこと）
1. `npm run build` が通る（tsc strict, noUnusedLocals）。
2. 静止一致: `node （作業用一時ファイル） <source/dist の絶対パス> <出力dir> 4181` で reduced-motion のスクリーンショットを撮り、`node （作業用一時ファイル） <before.png> <after.png>` で現行（`（作業用一時ファイル）`, `mobile-*.png`）と比較。差分は 0.5% 未満（文字のアンチエイリアス程度）を目標。差が出た場合は原因を特定して直すか、レポートに理由を書く。
3. 動作: Playwright（`/opt/node22/lib/node_modules/playwright/index.mjs`、`executablePath:'/opt/pw-browsers/chromium'`、reducedMotion 'no-preference'）で読み込み → 1 秒ごとに 600px ずつ最下部までスクロール → `document.querySelectorAll('[data-reveal]:not(.is-visible), .card:not(.is-visible), .step:not(.is-visible)').length === 0`、console エラー 0、`html.motion` あり。要所（hero 読み込み直後 / about / process / contact）のスクリーンショットも撮っておく（監査用）。
4. モバイル幅（390px）でメニュー開閉が動く（`.is-open` 付与でフェードが走る）。
5. LCP 要素（`.hero__art > img`）と h1 に opacity / visibility / clip-path が付いていないことを DOM で確認。
