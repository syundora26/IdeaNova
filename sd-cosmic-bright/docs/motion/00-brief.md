# 共通ブリーフ：株式会社SD コーポレートサイト（宇宙デザイン・明るさ調整版）に宇宙らしいアニメーションを追加する

## 目的
既存の「宇宙デザイン」の1ページサイトに、宇宙らしいモーション（星・軌道・光・浮遊感）を追加する。
**ブランドトーン：信頼感のあるコーポレート。やりすぎない。** 派手なWebGL演出や常時大きく動く要素は不要。
「静かな宇宙」「精密な機構が静かに動く」印象。読みやすさ・落ち着き最優先。

## 対象ファイル（絶対パス）
- ルート: sd-cosmic-bright/
- 編集用ソース: .../SD-cosmic-bright/source/
  - index.html （全マークアップ。7セクション + footer）
  - src/main.ts （現在のエントリ。ここだけが実際に使われているJS）
  - src/scroll/smooth.ts （Lenis + gsap + ScrollTrigger 登録済み。gsap/ScrollTrigger は既にバンドルに含まれている）
  - src/ui/header.ts, src/ui/indicator.ts （ヘッダー、右側セクションインジケーター）
  - src/styles/index.css → src/styles/cosmic.css （**実際に使われているCSSはこれだけ**。tokens/base/components/sections.css は旧版の残骸で未使用）
  - 未使用の旧モジュール: src/scroll/reveal.ts, src/scroll/sections.ts, src/three/*, src/ui/cursor.ts, src/ui/effects.ts （three.js の重い旧版。**再導入しない**。参考として読むのは可）
- 画像: public/images/starfield.webp（固定背景 1672x941, 194KB）, public/images/cosmic-hero.webp（ヒーロー 1672x941, 210KB, fetchpriority=high → LCP候補）
- スクリーンショット（現状・reduced-motionで静止撮影）: （作業用スクリーンショット）
  - desktop-full.png, desktop-{hero,about,service,process,works,company,contact,footer}.png （1440px幅）
  - mobile-full.png, mobile-{...}.png （390px幅）

## ページ構成（index.html の順）
1. `#hero` — 背景に土星風の惑星画像（.hero__art、ポインタで数pxパララックス済み）。見出し「構造が、動き出す。」2行、英文、リード、CTA（.btn--signal「相談する」、.link-arrow「実績を見る」）、左下 .scroll-hint（線が流れるCSSアニメ済み）
2. `#about` — 見出し、.rule（短い線）、.brand-orbit（3本の楕円軌道 + 「SD」 + 光点 b。orbit-breathe の明滅CSSアニメ済み）、本文3段落、.keywords（◇付きの3語）
3. `#service` — 左に見出し・リード、右に .cards（4枚。.card__index は数字の周りに楕円軌道。右上に◇の小さな点 .card:after）
4. `#process` — .steps 5個。.step__index は球体風の円（外側に点線の輪 :before、上に光点 :after）。ステップ間を斜めの線（.step:after）で結ぶ「星座」風。モバイルでは縦一列。
5. `#works` — .work 3枚。サムネは線画SVG（格子・結び目・輪）。hover で svg が scale/rotate 済み
6. `#company` — 会社概要テーブル（5行）
7. `#contact` — 中央揃え。背景に .contact-orbits（3本の大きな楕円軌道、1本目に光点 :after）。CTA .btn--signal.btn--lg
8. `footer` — 巨大な「SD」アウトライン文字 .footer__big、ナビ、TOP↑

共通: 固定背景 .universe（starfield.webp + .twinkles に JS生成の星28個・CSS twinkle アニメ済み）、固定ヘッダー（スクロールで背景化/隠れる）、上端 .progress バー（scaleX で進捗）、右端 .indicator（◇の点、アクティブで発光）、各セクション右上の巨大な番号 .section-num（アウトライン文字）

## 既に実装されているモーション（重複提案しない／活かす）
- Lenis スムーススクロール（reduced-motion 時は無効）
- IntersectionObserver による .is-visible → `appear` （opacity .5→1, translateY 18px→0, 0.9s, 3列で55ms stagger）。対象: [data-reveal], .card, .step
- 星の twinkle（CSS）、scroll-hint の線、brand-orbit の明滅、hero 画像のポインタ追従パララックス
- hover: .btn（translateY -3px + glow）、.link-arrow（gap 広がる）、.work svg（scale 1.08 rotate -3deg）、nav色、indicator ラベル表示
- reduced-motion: cosmic.css 末尾で `animation:none; transition:none` を全体に適用。main.ts でも reduced 判定あり

## 技術・品質の制約（必ず守る）
- 使ってよいもの: CSS（transform/opacity/filter/clip-path）、GSAP 3 + ScrollTrigger（バンドル済み）、Lenis（既存）。three.js / WebGL / 追加ライブラリは不可。
- パフォーマンス: transform / opacity 以外を連続アニメしない。box-shadow/filter の連続アニメは最小限（小さな要素のみ）。画面外の常時アニメは停止（IntersectionObserver or ScrollTrigger の onToggle）。will-change は乱用しない。JS生成のDOM要素は数十個まで。Canvas を使う場合は 1枚・低DPR上限・requestAnimationFrame を可視時のみ。
- LCP を悪化させない: ヒーロー画像（cosmic-hero.webp）と見出し h1 を opacity:0 で隠して待たせない（LCP要素は初回描画で可視にする。フェードするなら opacity 0.01 以上から、または画像は対象外にする）。フォント待ちで表示を止めない。
- CLS を出さない: レイアウトに影響する要素（高さ・margin・font-size）をアニメしない。追加要素は position:absolute/fixed で配置。ScrollTrigger の pin は使わない（既存レイアウトの高さを変えない）。
- アクセシビリティ: `prefers-reduced-motion: reduce` で「動き」を止め、内容は最初から全表示（opacity 1）。点滅は 3回/秒未満、大きな面積のフラッシュ禁止。装飾要素は aria-hidden。フォーカス可視性を壊さない。ポインタ追従は `(pointer:fine)` のみ。
- 実装量の目安: 追加 TS 1〜3ファイル（合計 ~300行以内）、CSS 追加 ~200行以内。マークアップ変更は最小（装飾用の空要素の追加程度）。文言は変更しない。
