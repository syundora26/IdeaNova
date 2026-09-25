# 05 監査後の修正（オーケストレーター）

Accessibility Auditor（04-a11y-report.md）と Performance Benchmarker（04-perf-report.md）はいずれも「条件付き合格」。条件と推奨事項を次のとおり反映した。

| 出典 | 指摘 | 対応 | ファイル |
|---|---|---|---|
| a11y #1 Medium | 未出現セクションの CTA へ Tab するとフォーカスリングごと opacity 0 のまま最大 0.9s | `focusin` で当該要素を遅延 0・.3s で即時表示（IO を待たない） | `src/main.ts` |
| a11y #2 Low | reduced-motion でも nav ◇の scale が変化 | scale に `--mv` を掛け、reduced では opacity のみ | `src/styles/cosmic.css` |
| a11y #3 / perf #4 | 読み込み直後に about / contact の `is-active` が付いたまま（`isActive` が生成直後 undefined）、orbit-breathe が画面外で再生 | 生成時と `onRefresh` で ScrollTrigger の start/end と現在位置から可視判定を計算 | `src/motion/orbit.ts` |
| a11y #4 Low | メニューを閉じるフェード中（450ms）に Tab が不可視リンクへ入る | 閉じ始めに `menu.inert = true`、開くとき false | `src/ui/header.ts` |
| a11y #5 所見 | 5 秒超の自動再生（星の瞬き・光点・流れ星）にページ内の停止手段がない | 変更なし。すべて装飾・小面積・0.4Hz 以下で既存と同条件。停止トグルは今後の候補（Could） | — |
| perf #1 High | 背景画像に元からある CSS `filter`（brightness/saturate）が、スクロールで動く層に付いたままだと毎フレーム再合成される（desktop 平均 17.6 → 49.9ms/フレーム） | filter を画像そのものに焼き込み（`scripts/bake-filters.py`、sRGB で brightness → saturate）、CSS の filter を削除。ヒーロー画像も同様。焼き込み後の静止表示は元と一致（差分 0〜0.3%、差はテキストのアンチエイリアスのみ） | `public/images/*.webp`, `src/styles/cosmic.css` |
| perf #2 Medium | 星 44 個化でモバイルの style 再計算が増える | 44 個はデスクトップのみ。767px 以下は従来どおり 28 個 | `src/main.ts` |
| perf #3 Medium | 起動タスクが長くなり TBT +39ms | `setupMotion()` を `requestIdleCallback`（上限 800ms）で起動タスクから分離。`ScrollTrigger.refresh()` は fonts.ready 後の 1 回のみ（load 時は ScrollTrigger が自動で行う） | `src/main.ts`, `src/motion/index.ts` |
| perf #6 備考 | H3「惑星の焦点合わせ」（scale 1.03 → 1）が実測で確認できず、起動時の `gsap.set` が初期化の分離と相性が悪い | **H3 を削除**（設計書で「迷ったら落とす候補 #2」とされていた Should 案） | `src/motion/decor.ts` |

## 修正後の再計測（同じ環境・同じスクリプト）

| 指標 | 変更前 | 監査時 | 修正後 |
|---|---|---|---|
| desktop 平均フレーム時間（CPU 1x） | 17.6 ms | 49.9 ms | 23.7〜25.6 ms |
| desktop 20ms 超のフレーム | 4.7% | 92% | 36〜44% |
| desktop 50ms 超のフレーム数 | 0 | 135 | 5〜11 |
| mobile 平均フレーム時間（CPU 4x） | 17.0 ms | 19.7 ms | 17.6〜18.3 ms |
| mobile 20ms 超のフレーム | 2.0% | 17% | 5〜10% |

計測環境は GPU なし（ソフトウェア合成）のため、画面全体の層を動かすコストが実機より大きく出る。残る差は「viewport の 124% の画像層を毎フレーム合成する」こと自体のコストで、実機の GPU では一般的なパララックスと同程度。実機で気になる場合は、モバイルだけ背景画像の移動を止めて星の層のみ動かす切り替え（CSS 1 行 + TS 1 行）が次の手。

## 再検証
- `npm run build`（tsc strict）通過
- reduced-motion のスクリーンショット 18 枚: 16 枚が変更前と 0.000% 一致、desktop-hero / desktop-full が 0.33% / 0.05%（ヒーロー上の小さな文字のアンチエイリアスのみ。画像・レイアウトの差なし）
- motion: 最下部までスクロール後の未表示要素 0、console エラー 0、CLS 0（scrollHeight 不変）、LCP 要素不変（mobile: ヒーロー画像、desktop: h1）
- キーボード: 未出現の contact CTA へフォーカス → 即 `.is-visible`、350ms 後 opacity 1
- モバイルメニュー: 開くとフェード、Escape で `inert` → 450ms 後 `hidden`、focus は menu-btn に戻る
- 軌道: 読み込み直後は画面外の軌道が停止（mobile 両方 paused、desktop は about の上端が viewport 下端に接するため境界上で再生）、最下部では contact のみ再生
