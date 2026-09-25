# 04 監査ブリーフ（Accessibility Auditor / Performance Benchmarker 共通）

## 対象
- 実装後のソース: sd-cosmic-bright/source/ （`npm run build` 済み → `source/dist/` が監査対象のビルド）
- 変更前（基準）のビルド: （元データ source/）dist/
- 設計書: design/01-ui-designer.md, 02-whimsy-injector.md, 01a-tech-review.md, 03-frontend-brief.md, 実装レポート 03-frontend-report.md
- 変更前スクリーンショット（reduced-motion・静止）: scratchpad/shots/{desktop,mobile}-*.png
- 変更前 Lighthouse: scratchpad/perf/baseline-{mobile,desktop}.json、要約 scratchpad/perf/baseline-summary.txt

## ツール
- 静的サーバー: `python3 -m http.server <port> --bind 127.0.0.1 --directory <dist>`（ポートは監査ごとに別: a11y 4185〜4186、perf 4187〜4189）
- Playwright: `import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs'`、`chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })`
- スクリーンショット一式: `node scratchpad/shots/capture.mjs <dist絶対パス> <出力dir> <port>`（reduced-motion で desktop 1440 / mobile 390 の full + セクション別）
- 画像差分: `node scratchpad/shots/diff.mjs <a.png> <b.png> [diff.png]`（同サイズ必須、mismatch % を出力）
- Lighthouse 13: `scratchpad/perf/run-lh.sh <dist絶対パス> <label> <port>` → `scratchpad/perf/<label>-{mobile,desktop}.json` と要約 1 行ずつ（perf / a11y スコア、LCP、CLS、TBT、FCP）。実行は 1 回 2〜3 分。
- axe-core は未インストール。必要なら `cd scratchpad/tools && npm i axe-core` してから Playwright で `page.addScriptTag({ path: 'scratchpad/tools/node_modules/axe-core/axe.min.js' })` → `page.evaluate(() => axe.run())`。

## 判定基準（設計書の受け入れ基準）
- reduced-motion: `html.motion` が付かない／全要素が最初から表示／スクリーンショットが変更前と一致（差分 < 0.5%。差があれば箇所と原因を特定）
- LCP 要素が `.hero__art > img` のまま。LCP・CLS が変更前から悪化しない（Lighthouse は ±10% の揺れがあるので、2 回計測して中央値で比較。CLS は 0 のまま）
- 常時アニメが画面外で停止している（about / contact の光点、orbit-breathe、流れ星）
- 点滅 3 回/秒未満、全面フラッシュなし、追加要素は aria-hidden、フォーカスリング健在、キーボードで CTA / nav / menu を操作できる、メニュー開閉で focus / inert / Escape が機能
