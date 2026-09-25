# 04 Performance Benchmarker レポート（モーション実装の前後比較）

- 対象: 変更後 `sd-cosmic-bright/source/dist/`（index-D8Ca_zlD.js / index-CGf_HMG7.css）
- 基準: 変更前 `scratchpad/SD-cosmic-bright/source/dist/`（index-Bg641cdw.js / index-CQP2uBZh.css）
- ソースは変更していない（計測・分析のみ）。計測スクリプト・生データは `scratchpad/audit-perf/`、Lighthouse JSON は `scratchpad/perf/`。
- 環境の注意: Chromium 141 headless。**GPU なし（`gpu_compositing: disabled_software`、SwiftShader）** のため、合成レイヤーの絶対コストは実機より大きく出る（`audit-perf/gpu-info.txt`）。フレーム計測は前後の相対比較として読むこと。Google Fonts は取得不可（前後同条件、LCP の render delay に含まれる）。

## 1. 総合判定: **条件付き合格**

- **合格の根拠**: LCP は前後で変化なし（mobile 4.22 → 4.21 s、desktop 0.81 → 0.85 s、いずれも ±10% 内）。LCP 要素は前後同一（mobile `.hero__art > img`、desktop は前後とも h1 のテキスト行）。CLS は Lighthouse・スクロール込み実測ともに **0.000**。scrollHeight は読み込み直後〜全アニメ完了後まで不変。追加リクエストなし。転送量 +2.9 kB gz。
- **条件（修正が必要）**: U1 背景パララックスで `.universe > img`（CSS `filter` 付き、viewport の 124% の大きさ）を毎フレーム transform で動かすため、スクロール中のフレームが大きく落ちる。desktop（CPU 1x）で平均 17.6 → 49.9 ms/フレーム、20 ms 超のフレーム 4.7% → 92%、50 ms 超 0 → 135 フレーム。mobile（CPU 4x）は 17.0 → 19.7 ms、20 ms 超 2% → 17%。変種テストで **原因は img 層の `filter`**（filter を外すだけで 49.9 → 25.8 ms、img を止めると 22.2 ms）と特定。指摘 #1 の対応（filter を画像に焼き込む／星の層だけ動かす）で解消する見込み。
- 次点（推奨）: mobile の TBT +39 ms（+14%、揺れ幅超）と星 44 個化による main-thread 増分（指摘 #2, #3）、about/contact の `is-active` 初期状態バグ（指摘 #4）。

## 2. 変更前後の比較表

### 2.1 Lighthouse 13.5（simulate throttling、各 2 回の中央値。個別値は §A）

| 指標 | mobile 前 | mobile 後 | 差 | desktop 前 | desktop 後 | 差 |
|---|---|---|---|---|---|---|
| Performance スコア | 74.5 (74/75) | 72 (72/72) | −2.5 | 99.5 (100/99) | 98.5 (99/98) | −1 |
| FCP | 2,377 ms | 2,547 ms | +170 (+7.1%) | 560 ms | 630 ms | +70 (+12.4%)※ |
| **LCP** | 4,217 ms | 4,213 ms | −4 (−0.1%) | 809 ms | 846 ms | +37 (+4.6%) |
| **CLS** | 0 | 0 | 0 | 0 | 0 | 0 |
| TBT | 286 ms | 325 ms | **+39 (+13.7%)** | 34 ms (0/67) | 70 ms (53/86) | +36 |
| Speed Index | 4,477 ms | 4,704 ms | +227 (+5.1%) | 747 ms | 782 ms | +35 (+4.8%) |
| LCP 要素（4 回とも同一） | `main#main > section#hero > div.hero__art > img` | 同左 | 不変 | `h1#hero-title > span.line`（"動き出す。"） | 同左 | 不変 |
| LCP 内訳 TTFB / load delay / load / render delay | 15 / 25 / 75 / 2,148 ms | 9 / 20 / 38 / 2,253 ms | render +105 (+4.9%) | 9 / – / – / 705 ms | 9 / – / – / 656 ms | render −49 |
| main-thread 合計 | 2,196 ms | 2,574 ms | +378 (+17%) | 559 ms | 557 ms | ±0 |
| JS 実行（bootup-time） | 245 ms | 409 ms | +164 (+67%) | 50 ms | 74 ms | +24 |
| 最長タスク（gsap chunk、モジュール評価） | 331 / 327 ms | 377 / 372 ms | +45 ms | 68–106 ms | 103–120 ms | +15 |

※ desktop FCP は基準 2 回が 510 / 610 ms とばらつき ±50 ms。後 623 / 636 ms は基準 2 回目とほぼ同じで、揺れの範囲。
- 補足: mobile FCP +170 ms のうち大半は render-blocking CSS の増分（transfer 25.3 → 33.7 kB、Lighthouse の推定待ち時間 463 → 604 ms）。計測サーバー（python http.server）は gzip なしなので実配信（gzip +1.7 kB ≒ 1.6 Mbps で約 10 ms）ではここまで出ない。
- desktop の LCP 要素は **変更前から img ではなく h1 の行**（全画面を覆う画像は Chrome の LCP 候補から除外される仕様）。`baseline-summary.txt` の「mobile & desktop: img」は desktop については不正確だった。前後で同一なので判定には影響しない。

### 2.2 CLS 実測（Playwright、motion モード、読み込み → 3 s → 500 px ずつ最下部 → 最上部）

| | desktop 1440×900 前 | 後 | mobile 390×844@2x 前 | 後 |
|---|---|---|---|---|
| layout-shift 合計（hadRecentInput 除外／全件） | 0.000 / 0.000（0 件） | 0.000 / 0.000（0 件） | 0.000 / 0.000（0 件） | 0.000 / 0.000（0 件） |
| scrollHeight 読み込み直後 / 3 s / 全アニメ完了後 | 6236 / 6236 / 6236 | 6236 / 6236 / 6236 | 8122 / 8122 / 8122 | 8122 / 8122 / 8122 |
| 未 reveal 要素（最下部到達後） | – | 0 | – | 0 |

### 2.3 LCP 候補の推移（Playwright PerformanceObserver、スクロール前）

| | desktop 前 | desktop 後 | mobile 前 | mobile 後 |
|---|---|---|---|---|
| 候補（element / size / renderTime） | `h1#hero-title > span.line` 131,880 px² @680 ms（1 件） | `section#hero > div.container.hero` 131,880 px² @748 ms（1 件） | `div.hero__art > img` 319,800 px² @552 ms（1 件） | `div.hero__art > img` 319,800 px² @412 ms（1 件） |
| h1 の computed（load 時） | opacity 1 / visible / span inline | 同左、`data-reveal` なし、inline style なし | 同左 | 同左 |
| hero img の computed（load 時） | opacity 1 / visible / transform none | opacity 1 / visible、inline は GSAP の `transform` のみ | opacity .84（既存 CSS） | opacity .84、inline は transform のみ |

desktop の後で候補要素名が `span.line` → 祖先の `div.container.hero` に変わっているが、面積 131,880 px² が完全一致（同じ "動き出す。" 行の塗り面積）で、Lighthouse は 4 回とも `span.line` を報告。テキスト集約の帰属先が変わっただけで、LCP の内容・時刻に遅延はない。hero テキストの `p`（data-reveal）は opacity 0 → 1 のフェードだが h1 より小さく LCP に関与しない。

### 2.4 スクロール中のフレーム統計（Playwright + CDP、rAF ごとに `scrollBy(0,12)`、2 回の中央値、生値は §D）

| | desktop 1440×900, CPU 1x 前 | 後 | mobile 390×844@2x, CPU 4x 前 | 後 |
|---|---|---|---|---|
| 平均フレーム時間 | 17.6 ms | **49.9 ms** | 17.0 ms | **19.7 ms** |
| 中央値 / p95 / p99 / max | 16.7 / 25.0 / 33.4 / 50 | 50 / 83.3 / 116.7 / 141.7 | 16.7 / 16.8 / 25.1 / 33.3 | 16.7 / 33.4 / 41.7 / 66.8 |
| dropped（> 20 ms = vsync 1 回以上取りこぼし） | 4.7% | **92.4%** | 2.0% | **17.1%** |
| ≥ 3 vsync（> 33.4 ms） | 0.8% | 68.7% | 0% | 1.2% |
| long frame（> 50 ms）数 | 0 | 135 | 0 | 1.5 |
| 実効 fps | 56.8 | 20.1 | 58.9 | 50.7 |
| 444 / 606 フレーム分のスクロール所要 | 7.8 s | 22.1 s | 10.3 s | 12.0 s |
| `Performance.getMetrics` 差分: LayoutCount | 41 | 15.5 | 42 | 21 |
| RecalcStyleCount | 899 | 1,569 | 1,216 | 2,075 |
| ScriptDuration | 0.18 s | 0.27 s | 1.15 s | 1.46 s |
| RecalcStyleDuration | 0.39 s | 0.49 s | 1.90 s | 2.77 s |
| TaskDuration（main-thread 稼働） | 1.53 s / 7.8 s | 2.09 s / 22.1 s | 7.9 s / 10.3 s | 10.8 s / 12.0 s |
| long-animation-frame 件数 / 合計 / script 寄与 | 1 / 59 ms / 18 ms | 163 / 10,866 ms / ≤ 16 ms | 0 | 1.5 / 97 ms / 7 ms |

desktop の長いフレームは script でも style/layout でもなく（LoAF の script 寄与 ≤ 16 ms、TaskDuration は 22 s 中 2.1 s）、レンダリング／合成側で発生している。mobile は main-thread が 4x スロットルで飽和気味（稼働率 77% → 90%）で、style 再計算（+0.87 s）と script（+0.31 s）の増分がフレーム落ちに直結している。

### 2.5 バンドル・転送量（`gzip -9`）

| ファイル | 前 raw / gz | 後 raw / gz | 差 raw / gz |
|---|---|---|---|
| index.html | 22,450 / 5,682 | 22,733 / 5,824 | +283 / +142（head のインライン script 140 B、属性追加） |
| index-*.js | 24,593 / 7,483 | 27,857 / 8,584 | +3,264 / +1,101 |
| index-*.css | 25,150 / 6,711 | 33,477 / 8,379 | +8,327 / +1,668 |
| gsap-BJZ90ViQ.js | 112,830 / 43,786 | 同一 | 0 |
| 画像・favicon・og.png | 同一 | 同一 | 0 |
| **合計（html+js+css）** | 185,023 / 63,662 | 196,897 / 66,573 | **+11,874 / +2,911（+4.6% gz）** |
| リクエスト数（Playwright、両 viewport） | 8 | 8（同一 URL 列） | 追加なし |

## 3. 指摘一覧

| # | 重要度 | 箇所 | 数値の根拠 | 推奨修正と期待効果 |
|---|---|---|---|---|
| 1 | **High** | U1: `html.motion .universe>img{height:124%}` + GSAP scrub で `.universe>img` を毎フレーム transform（`src/motion/parallax.ts` 12–20 行、`motion.css` 23 行）。この img には既存の `filter:brightness(1.16) saturate(1.04)`（cosmic.css）が付いており、transform で独立レイヤーになった結果、**フィルタが毎フレーム合成時に再適用される** | desktop 1x: 平均 17.6 → 49.9 ms、dropped 4.7% → 92%、long50 0 → 135。変種テスト（同ビルド、CSS を実行時に上書き）: `filter:none` だけで 25.8 ms / 40% / 17、img を静止（twinkles は動かす）で 22.2 ms / 24% / 10、twinkles だけ静止では 50.9 ms（効果なし）、`will-change:transform` は 46.7 ms（効果なし）。mobile 4x: 19.7 ms / 17% → img 静止で 18.1 ms / 8%。本環境はソフトウェア合成なので絶対値は過大だが、GPU でも「全画面超のレイヤー 1 枚分の filter パス + 合成」がフレームごとに増える構造は同じ | **(a) 推奨: filter を画像に焼き込む**（starfield.webp を brightness 1.16 / saturate 1.04 で再書き出しし、`.universe>img` の `filter` を削除）。見た目は不変、期待効果は本環境で 49.9 → 約 26 ms、dropped 92 → 40%。**(b) 併用推奨: 画像は動かさず星の層（`.twinkles`）だけ動かす**（img は 100% のまま tween を作らない）。期待効果 49.9 → 約 22 ms、dropped 24%、mobile 17 → 8%。1.24 倍の拡大（画像のぼけ、Lighthouse image-delivery の新規指摘 412×1021 / 1335×1166）も消える。(c) 少なくとも `max-width:767px` では U1 を無効化（mobile dropped 17 → 約 10%）。`will-change` は既に合成済みのため効果なし（計測済み）。修正後は §D のスクリプトで再計測を推奨（目標: dropped 率が基準 +5 pt 以内） |
| 2 | Medium | 星の数 28 → 44（`src/main.ts` 55 行、U1 の 160% 層の密度維持のため）。`twinkle` keyframes（opacity + scale）は Lighthouse では composited 判定だが、本環境では毎フレーム style 再計算の主因 | mobile 4x スクロール中: RecalcStyleDuration 1.90 → 2.77 s（+0.87 s / 12 s）、TaskDuration 7.9 → 10.8 s。変種 `noTwinkle`（アニメ停止）で RecalcStyle 2.4 → 1.2 s、TaskDuration 9.6 → 6.2 s。差分の大きさは星の数にほぼ比例（28→44 = ×1.57） | #1(b)/(c) を採ると星の層は 100% のままでよいので **28 個に戻す**。期待効果: mobile の main-thread 稼働 −0.9 s / 12 s（≒ フレーム予算の 7%）、dropped 率 数 pt 改善。動かす場合でも密度は 36 個程度（160% × 28 ÷ 1.24）で足りる |
| 3 | Medium | 初期化コスト: `setupMotion()` が main.ts のモジュール評価タスク内で ScrollTrigger 12 個の生成、`getTotalLength()` 7 回（SVG のレイアウト強制）、`ScrollTrigger.refresh()` 2 回（fonts.ready と load）を同期実行 | Lighthouse mobile: 最長タスク 331/327 → 377/372 ms（+45 ms）、TBT 286 → 325 ms（+13.7%、揺れ幅 ±10% を超過）、bootup-time 245 → 409 ms、main-thread +378 ms。forced-reflow insight は前後とも gsap の refresh（約 120–160 ms）を検出（既存） | `setupDecor`（getTotalLength）と B2 の 6 個・F1 の ScrollTrigger 生成を `requestIdleCallback` か `load` 後に回し、`refresh()` は `load` の 1 回にまとめる（fonts.ready は本番でも load 前後に解決するため二重）。期待効果: 初期長タスクを基準並み（≈330 ms）に戻し TBT −40 ms、bootup −100 ms 程度。LCP には影響しない（LCP は render-blocking CSS と fonts 待ちで決まっている） |
| 4 | Low | E: `src/motion/orbit.ts` 32 行 `toggle(trigger.isActive)`。ScrollTrigger は `update()` 内の `if (clipped !== prevProgress && self.enabled)` の中でしか `isActive` を代入しないため、生成時にセクションが画面外（progress 0 = 初期値）だと `isActive` は **`undefined`** のまま。`classList.toggle('is-active', undefined)` は第 2 引数なし扱いでクラスを **付与** し、`if (active)` は falsy で tween は pause | 読み込み直後〜スクロールするまで（6.8 s まで確認）、desktop / mobile とも `.brand-orbit.is-active`・`.contact-orbits.is-active` が付いたまま（セクションは画面外）。`orbit-breathe` の `animation-play-state: running`、光点 tween は静止（transform 不変）。最初の onToggle 以降は正しく切り替わる（最上部へ戻った時点では両方 inactive） | `toggle(!!trigger.isActive)`（または `toggle(trigger.isActive === true)`）。期待効果: 初期状態で `orbit-breathe`（6 s 無限ループの opacity、1 要素）が停止し、受け入れ基準「画面外で常時アニメ停止」を初期状態でも満たす。CPU 影響自体は無視できる規模 |
| 5 | Low | CSS +8.3 kB raw（gz +1.7 kB）。render-blocking の CSS が大きくなり Lighthouse mobile FCP +170 ms、Speed Index +5% | `render-blocking-insight` の CSS 待ち推定 463 → 604 ms。ただし計測サーバーは非圧縮。gzip 配信では差 1.7 kB（1.6 Mbps で約 10 ms） | 対応不要（配信側で gzip/brotli が前提）。気にするなら motion.css の hover 系（Whimsy 1–5）を `@media(hover:hover)` 内へ寄せる程度で、効果は数百 B |
| 6 | 備考（機能） | H3: `gsap.set(img,{scale:1.03})` → `decode()` 後に scale 1 へ 2.4 s | 60 ms 間隔で `.hero__art img` の computed transform を 3.5 s 追跡したが **scale が 1 以外になる瞬間がない**（427 ms: `translate(0px,0px)`、562–2859 ms: `translate3d(0,0,0)` = tween 実行中、その後 `translate(0px,0px)`）。同じ要素に先に作られた H2 の scrub tween（`invalidateOnRefresh:true`）が直後の `ScrollTrigger.refresh()`（fonts.ready）で revert され、後から set した scale が消えている可能性が高い | パフォーマンス上は問題なし（むしろ合成が 1 つ減っている）が、設計どおり動いていないので Frontend に確認を依頼。対処案: scale を H2 と同じ tween/timeline に含める、または `refresh()` 後に set する |
| 7 | 備考 | U1 により背景画像の表示倍率が 1.24 倍（desktop: 1599×900 → 1983×1116、横方向の表示範囲 90% → 73%。mobile: 表示範囲 26% → 21%）。1672 px 幅のソースを 1440 px 幅の viewport で 1.19 倍に拡大 | Lighthouse `image-delivery-insight` が変更後に starfield を 412×1021（mobile）/ 1335×1166（desktop、新規 25 KiB）として指摘 | #1(b) を採れば解消。動かすなら画像を 2000 px 幅程度で再書き出し（+転送量）か、124% ではなく 112% 程度に抑える |

## 4. 計測項目ごとの結果と手順

### A. Lighthouse 13.5（`scratchpad/perf/run-lh.sh`、mobile: Moto G Power 相当 412×823@1.75 simulate、desktop preset 1350×940）

手順: `perf/run-lh.sh <dist> after1 4187` → `after2 4187` → `run-lh.sh <基準 dist> baseline2 4188`（直列、13:30–13:32、各 30 s）。既存 `baseline-*.json`（12:24）と合わせ前後 2 回ずつ。抽出: `audit-perf/lh-compare.txt`（中央値表）、`audit-perf/lh-details.txt`（bootup / main-thread / long-tasks / insights）。

個別値（mobile）: perf 74 / 75 → 72 / 72、FCP 2417 / 2337 → 2555 / 2538、LCP 4226 / 4208 → 4207 / 4218、TBT 294 / 277 → 327 / 322、SI 4425 / 4528 → 4710 / 4697。LCP 内訳（TTFB / load delay / load / render delay）: 19/33/108/2069、10/17/41/2226 → 10/22/41/2245、8/17/35/2260。
個別値（desktop）: perf 100 / 99 → 99 / 98、FCP 510 / 610 → 623 / 636、LCP 814 / 804 → 843 / 849、TBT 0 / 67 → 53 / 86、SI 728 / 765 → 814 / 750。LCP 内訳: TTFB 6 / 12 → 7 / 10、render delay 724 / 685 → 720 / 591。
判定: LCP・CLS は前後差なし。悪化が ±10% を超えたのは **mobile TBT（+13.7%）** のみ（指摘 #3）。perf スコア −2.5（mobile）は FCP/SI/TBT の小幅悪化の合算で、2 回とも 72 と再現性あり。`non-composited-animations` は前後とも既存の `ol#indicator > li > button::after`（border-color / box-shadow）1 件のみで、追加アニメはすべて composited 判定。`layout-shifts` 0 件。

### B. CLS 実測（`audit-perf/pw-cls-lcp.mjs <dist> <label> <port>`）

手順: `reducedMotion:'no-preference'`、desktop 1440×900@1 / mobile 390×844@2（isMobile, hasTouch）。`addInitScript` で `PerformanceObserver({type:'layout-shift', buffered:true})` と LCP observer を仕込み、`load` → 3 s 待機 → `scrollBy(0,500)` を 400 ms 間隔で最下部まで → `scrollTo(0,0)` → 1.5 s → さらに 3 s（アニメ完了）。出力 `audit-perf/cls-lcp-{after,baseline}.{json,log}`。
結果: layout-shift エントリは前後・両 viewport とも **0 件**（sources なし）。scrollHeight は 3 時点で一致（§2.2）。最下部到達後の未 reveal 要素 0。

### C. LCP 要素の同一性（同スクリプト）

結果は §2.3。mobile は前後とも `.hero__art > img`（size 319,800、renderTime 552 → 412 ms、loadTime 334 → 167 ms、環境差）。desktop は前後ともテキスト行（h1）。h1 は `data-reveal` 非対象で load 時 opacity 1、`.line > span` は inline のまま（`[data-reveal=lines]` の inline-block 化は h2 のみ）。hero img の inline style は GSAP の transform のみで opacity / visibility / clip-path は不変。**opacity 0 による LCP 遅延はない。**

### D. 実行時負荷（`audit-perf/pw-frames.mjs <dist> <label> <port> [iterations] [variants] [devices]`）

手順: `load` → 2.5 s（hero イントロ完了）→ CDP `Emulation.setCPUThrottlingRate`（desktop 1、mobile 4）→ `Performance.getMetrics` → ページ内で rAF ごとに `scrollBy(0,12)` しつつ rAF タイムスタンプを収集（最下部まで desktop 444 / mobile 606 フレーム）→ `getMetrics` 差分。`long-animation-frame` observer も併走。統計は 2 回の中央値（`audit-perf/frames-{after,baseline}-v2.json`、`frames-compare.txt`）。旧版スクリプトの初回計測（`frames-after.json` / `frames-baseline.json`）も同傾向（desktop 後 47.3 / 50.1 ms、前 17.9 / 17.5 ms）。
結果は §2.4。要点: (1) desktop で 20 fps まで低下、原因は合成側（LoAF 163 件 10.9 s のうち script ≤ 16 ms、TaskDuration 2.1 s）。(2) mobile は main-thread 増（RecalcStyle +0.87 s、Script +0.31 s）で dropped 2 → 17%。(3) LayoutCount は減少（41 → 15）でレイアウトスラッシュはなし。RecalcStyleCount は 1 フレームあたり 2.0 → 3.5 回（GSAP の inline style 書き込み 12 tween 分）だが desktop では計 0.1 s の増分に留まる。

### E. 常時アニメの停止確認（`pw-cls-lcp.mjs` の idle サンプル + `audit-perf/pw-orbit-init.mjs`）

| 時点 | about セクション | `.brand-orbit.is-active` | 光点 transform 1 s 後 | `orbit-breathe` play-state | contact セクション | `.contact-orbits.is-active` | 光点 1 s 後 |
|---|---|---|---|---|---|---|---|
| 読み込み直後〜6.8 s（未スクロール） | 画面外（top 900 / 850） | **あり** | 不変（初期位置） | **running** | 画面外 | **あり** | 不変（初期位置） |
| y=2500 / 4000（両方画面外） | 画面外 | なし | 不変 | paused | 画面外 | あり※ | 不変 |
| 最下部 | 画面外 | なし | 不変 | paused | 画面内 | あり | **移動** |
| 最上部へ戻る | 画面外 | なし | 不変 | paused | 画面外 | なし | 不変 |

※ y=2500/4000 の contact `is-active` は初期状態の残り（tween は静止）。最下部で本当に active になった後、最上部に戻ると解除される。原因と修正は指摘 #4。流れ星は `.universe` 内の 1 要素で位置に依らず再生（load +5 s 以降、実測 7–8 s 後に初回）、`visibilitychange` で停止。twinkle 44 個は常時再生（既存仕様、負荷は D と指摘 #2）。最終状態の `document.getAnimations()` running は twinkle 44 + 既存 scroll-hint 線 1 のみで、`orbit-breathe` は停止している（基準ビルドでは常時 running）。

### F. バンドルと転送量（`audit-perf/bundle-sizes.txt`、`gzip -9 -c | wc -c`）

§2.5 のとおり。gsap チャンクはハッシュまで同一。Lighthouse `total-byte-weight` 591,150 → 603,024 B（非圧縮）。リクエスト列は前後とも `/`, fonts.googleapis(失敗), index.js, gsap.js, index.css, starfield.webp, cosmic-hero.webp, favicon.svg の 8 件で一致。

### G. 背景パララックス（U1）の妥当性

- 表示倍率: `object-fit:cover` で box が 100% → 124% 高になるため、desktop 1440×900 で 1599×900 → 1983×1116（1.24 倍、ソース 1672 px を 1.19 倍に拡大）、mobile で 1500×844 → 1861×1047。星が 24% 大きく・ややぼけ、横方向の見える範囲が狭まる（品質上の注意、指摘 #7）。
- 合成コスト（`pw-frames.mjs ... after-variants 4187 1 asis,noU1,noU1img,noU1tw,willchange,noTwinkle,noFilter,noHero`、CSS 上書きのみで同ビルド、1 回ずつ。`frames-after-variants.log`。旧版 2 回計測 `frames-after-variants-old.log` も同傾向）:

| 変種（実行時 CSS 上書き） | desktop 1x 平均 / dropped>20 / long50 | mobile 4x 平均 / dropped>20 / long50 |
|---|---|---|
| 変更前ビルド（参考、中央値） | 17.6 ms / 4.7% / 0 | 17.0 ms / 2.0% / 0 |
| asis（変更後そのまま） | 50.2 / 93.5% / 136 | 22.4 / 29.4% / 6（v2 中央値は 19.7 / 17.1% / 1.5） |
| noU1（img・twinkles とも 100% + transform none） | 23.3 / 28.8% / 10 | 18.3 / 9.9% / 0 |
| noU1img（img だけ静止、星は動く） | **22.2 / 24.3% / 10** | 18.1 / 8.4% / 0 |
| noU1tw（星だけ静止、img は動く） | 50.9 / 91.9% / 145 | 18.3 / 8.7% / 1 |
| willchange（両層に will-change:transform） | 46.7 / 93.2% / 120 | 18.6 / 10.7% / 1 |
| noTwinkle（twinkle keyframes 停止、44 個のまま） | 47.5 / 93.5% / 113 | 17.7 / 5.6% / 3 |
| noFilter（`.universe>img{filter:none}`、動きは維持） | **25.8 / 40.5% / 17** | 18.1 / 8.4% / 0 |
| noHero（hero img の transform 停止） | 45.3 / 92.1% / 81 | 19.0 / 13.2% / 2 |

- 判定: **現状のままでは許容できない（指摘 #1）**。コストの主因は「fixed 層 2 枚を毎フレーム transform すること」自体ではなく、`filter` 付きの img 層が独立レイヤー化して毎フレーム filter 合成されること（noU1tw と noFilter の対比）。twinkles 層の移動は desktop で無害、mobile でも数 % の差。
- 代替案と期待効果（本環境の数値。GPU 実機では絶対値は小さくなるが順序は同じ）:
  1. filter を画像に焼き込み `filter` を削除（見た目不変）: 50 → 26 ms、dropped 92 → 40%。
  2. 星の層だけ動かす（img は 100% 静止）: 50 → 22 ms、dropped 24%、mobile 17 → 8%。倍率・画質・image-delivery 指摘も解消。星は 28 個に戻せる（#2）。
  3. 1 + 2 の併用が最も安全（img 静止で filter は従来どおりペイント時 1 回）。
  4. mobile（≤767px）では U1 無効化: mobile dropped 17 → 約 10%。desktop の問題は残る。
  5. `will-change` の付与: 効果なし（既に合成レイヤー）。推奨しない。
- hero の transform（H2/H3）も同じ構造（filter 付き img を transform）だが、hero が画面内の区間だけ（全体の 17%）なので影響は限定的（noHero で 50 → 45 ms）。#1 対応後に再計測して残差を見る。

## 5. 許容できる事項

- LCP: mobile 4.22 → 4.21 s、desktop 0.81 → 0.85 s（+4.6%）。LCP 要素同一、内訳の増分は render delay +105 ms（mobile、CSS 増による render-blocking の延び、非圧縮サーバーで過大）。
- CLS 0（Lighthouse・スクロール込み実測とも）、scrollHeight 不変、layout-shift 0 件。
- desktop の Lighthouse 差（perf −1、FCP +70 ms、TBT +36 ms）は基準 2 回のばらつき（FCP 510/610、TBT 0/67）と同程度。
- 追加ネットワークリクエストなし。転送量 +2.9 kB gz（+4.6%）、gsap チャンク不変。
- スクロール中のレイアウト回数は減少（41 → 15）、強制リフローの新規発生なし（forced-reflow insight の項目は前後とも gsap の refresh 由来、既存）。
- 最初の onToggle 以降、about / contact の光点 tween と `orbit-breathe` は画面外で停止（基準では `orbit-breathe` が常時再生だったので改善）。流れ星は 1 要素・1.1 s・14 s 以上間隔で `document.hidden` 時停止。
- H3 の「3% スナップ」は実測上発生しない（scale が適用されていないため。指摘 #6 を参照）。
- 追加した CSS アニメはすべて Lighthouse の composited 判定（`non-composited-animations` は既存 1 件のみ）。

## 6. 再現ファイル一覧（`scratchpad/audit-perf/`）

- `pw-cls-lcp.mjs`（B/C/E/F）、`pw-frames.mjs`（D/G）、`pw-orbit-init.mjs`（E 初期状態）、`run-phase5.sh`（D/G/E の直列実行）
- 結果: `cls-lcp-{after,baseline}.{json,log}`、`frames-{after,baseline}-v2.json`、`frames-compare.txt`、`frames-after-variants.{json,log}`（+ `-old`）、`orbit-init.log`、`bundle-sizes.txt`、`lh-compare.{txt,json}`、`lh-details.txt`、`gpu-info.txt`
- Lighthouse JSON: `scratchpad/perf/{baseline,baseline2,after1,after2}-{mobile,desktop}.json`
