# 01a 技術レビュー（オーケストレーター → Frontend Developer への補足）

UI Designer 設計書（01-ui-designer.md）は採用。実装時に次の点を守る／直す。

## 1. L0 フェイルセーフの「再点滅」回避（必須）
設計書 G の「4s 後に強制表示」を `html.motion [data-reveal]:not(.is-visible)` に素直に付けると、
JS が正常に動いている場合でも、4s 経過後に IO が `.is-visible` を付けた瞬間 `appear` が opacity 0 から再生され **1→0→1 の点滅** が起きる。
対策: main.ts の先頭で `document.documentElement.classList.add('motion-ready')` を付け、
フェイルセーフは `html.motion:not(.motion-ready) [data-reveal]:not(.is-visible), ... .card, .step` にだけ効かせる（JS が来なかった場合のみ 4s 後に表示）。

## 2. 初期非表示の対象と LCP
- 初期 `opacity:0` は `html.motion` 配下の `[data-reveal]`, `.card`, `.step`（hero の h1・`.hero__art img` は data-reveal を持たないので対象外）。
- 計測済みの LCP 要素は mobile/desktop とも `.hero__art > img`（cosmic-hero.webp）。この img と h1 に opacity / visibility / clip を絶対に付けない。scale 1.03→1（H3）は opacity 1 のまま transform だけなので可。
- `<head>` のインライン script は 1 行・同期。`document.documentElement.classList.add('motion')` のみ。matchMedia が無い環境は motion を付けない（静止表示）。

## 3. `.is-visible`（CSS animation, fill both）と GSAP の競合
- reveal 対象（`[data-reveal]`, `.card`, `.step`, `.work`）には GSAP で transform / opacity を当てない。
- パララックス対象は `.hero__art img`, `.section-num`, `.footer__big`（いずれも reveal 対象外）に限定。

## 4. 擬似要素の結線（P1/P2, S1）
- `.step:after` は既存 `transform: rotate(±14deg / ±21deg)` を持つ。keyframes は `transform: rotate(var(--rot)) scaleX(0)` → `rotate(var(--rot)) scaleX(1)` とし、`--rot` を既存セレクタ（nth-child(even)、各ブレークポイント）で定義する。モバイルは `scaleY` + `transform-origin: top`。
- 既存の `transform-origin: left` を維持。
- `--seq` は TS で `step.style.setProperty('--seq', i)`。delay は `calc(var(--seq) * var(--seq-gap))`。

## 5. 軌道光点（A1 / K1）
- 光点を軌道要素 `i` の子として配置（about は既存 `b` を `i:first-child` の中へ移動、contact は `<b>` を追加。どちらも `html.motion` のときだけ）。
- `i` は `left/top/width/height` で配置されているので、子は `position:absolute; left:50%; top:50%; margin:-Wpx 0 0 -Wpx` に置き、`transform: translate(rx·cosθ, ry·sinθ)`。rx = i.clientWidth/2, ry = i.clientHeight/2（resize で再計測。ResizeObserver か window resize の debounce）。
- `gsap.to(state, {t:1, duration, ease:'none', repeat:-1, onUpdate})`。ScrollTrigger `onToggle` で `pause()/play()`。
- reduced-motion では JS が動かさないので、既存 CSS の静止光点（`.brand-orbit b` の top/right、`.contact-orbits i:first-child:after`）がそのまま出る。contact は `html.motion .contact-orbits i:first-child:after{display:none}` で静止光点と動く光点の二重表示を避ける。

## 6. hero 画像パララックス（H2）
- `.hero__art` はすでに `translate`（ポインタ追従、CSS transition 1.5s）を持つ。GSAP は **img** に `yPercent` を当てる（別要素）。
- mobile は `.hero__art` の高さが 820px 固定、`yPercent: 10`。
- `ScrollTrigger.refresh()` を `document.fonts.ready` と `load` の後に呼ぶ。

## 7. Lenis 連携
- 既存 `lenis.on('scroll', ScrollTrigger.update)` と `gsap.ticker` 連携を維持。scrub は `true`。
- reduced-motion では Lenis 無効（既存）。ScrollTrigger のパララックスも作らない（`html.motion` が無ければ setup を丸ごとスキップ）。

## 8. 流れ星（B3）
- `.universe` 内に 1 要素。`position:absolute`, `will-change` 不要（1.1s の一発）。
- タイマーは `setTimeout` 再帰。`visibilitychange` で `document.hidden` なら停止、復帰で再開。初回は load + 5s 以降。
- 角度は背景画像の流星に合わせて約 −30°（CSS で `rotate(-30deg)` した細長い要素を `translateX` で滑らせる）。

## 9. 検収（実装後に自分で確認してから引き渡す）
- `npm run build`（tsc --noEmit 含む）が通る。
- reduced-motion で撮ったスクリーンショットが shots/ の現行と一致（差分ゼロ or 光点位置の数px 以内）。
- `document.querySelectorAll('[data-reveal]:not(.is-visible)')` がスクロール後に 0 件。
- CLS 0、LCP 要素が `.hero__art > img` のまま。
