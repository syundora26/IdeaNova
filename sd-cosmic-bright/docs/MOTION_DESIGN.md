# 宇宙モーション追加 — 設計案（実装前レビュー用）

対象: 株式会社SD コーポレートサイト（宇宙デザイン・明るさ調整版）`sd-cosmic-bright/`
ブランドトーン: 信頼感のあるコーポレート。やりすぎない。

| 工程 | 担当 | 成果物 |
|---|---|---|
| 1 | UI Designer | [01-ui-designer.md](motion/01-ui-designer.md) — サイト全体のモーション設計（原則・トークン・セクション別・優先度） |
| 1a | オーケストレーター | [01a-tech-review.md](motion/01a-tech-review.md) — 実装時の技術注意点（点滅回避・LCP・競合） |
| 2 | Whimsy Injector | [02-whimsy-injector.md](motion/02-whimsy-injector.md) — ボタン・アイコンのマイクロインタラクション 5 案 |
| — | 共通 | [00-brief.md](motion/00-brief.md) ブリーフ ／ [perf-baseline.txt](motion/perf-baseline.txt) 変更前の Lighthouse |
| 3 | Frontend Developer | （承認後）GSAP + ScrollTrigger + CSS で実装 |
| 4 | Accessibility Auditor / Performance Benchmarker | （実装後・並行）reduced-motion、CLS / LCP の検証 |

## コンセプト

**「静かな観測所」** — 主役（見出し・惑星・本文）は据わったまま。動くのは **光点・線・深度** の 3 種だけ。
出現は各要素 1 回きり、常時動くのは面積の小さな光（軌道の光点・星の瞬き・まれな流れ星）のみ。

共通トークン: hover `.3s` ／ 出現 `.9s` ／ 線の描画 `1.2s` ／ 周回 `22s`・`36s` ／ easing は expo-out・linear・sine-inout の 3 種 ／ 移動量は 24px 以内（見出し行はマスク付き 1em）／ stagger 55ms。

## 実装する範囲（提案）

### Must — これだけで宇宙らしさが伝わる最小セット

| ID | 場所 | 動き | トリガー | reduced-motion |
|---|---|---|---|---|
| L0 | 全体 | 出現システムの基盤。`<head>` の 1 行で `html.motion` を先付けし、初期非表示は motion 配下のみ → 現状の「読み込み時に一瞬瞬く」問題も解消 | 初回描画 | 最初から全表示 |
| H1 | hero | ラベル → 英文 → リード → CTA → SCROLL が 0/80/160/240ms で静かに点灯（**h1 と惑星画像は動かさない = LCP を守る**） | 読み込み直後 | 全表示 |
| H2 | hero | 惑星画像のスクロール深度パララックス（+14%、mobile +10%、scrub） | スクロール | なし |
| A1 / K1 | about / contact | 軌道上の光点が一定速度で周回（22s / 36s、可視時のみ再生） | 常時（可視時） | 既存の静止光点のまま |
| P1 / P2 | process | 星座の結線: 節点が灯り → 線が伸びる → 次の節点… 合計 2s。mobile は縦線で遅延ゼロ | 出現時 | 完成状態で表示 |

### Should — 各セクションに固有の表情を一つずつ

| ID | 場所 | 動き |
|---|---|---|
| B2 / F1 | 各セクション番号 / footer「SD」 | 深度パララックス ±40px（mobile ±20px）／ footer +60px |
| A2 | h2・rule・keywords（全セクション共通規則） | 見出し行がマスク付きで据わる（.4em）、線が引かれる、キーワードが順に灯る |
| S1 | service | 数字を囲む楕円が「軌道として定着」（−40° → 所定角度）、◇が点灯 |
| W1 | works | 線画 SVG の点が灯り、線が stroke で描かれる |
| C1 | company | 行が透明度のみで順に点灯（**位置移動ゼロ。最も静かなセクション**） |
| H3 | hero | 惑星の焦点が合う scale 1.03 → 1（2.4s、1 回） |
| B3 | 背景 | 流れ星: 細い光の筋が 14〜24s 間隔で 1 本、上部帯域のみ、読み込み後 5s は発生させない（**迷ったら落とす候補 #1**） |

### Could — 枠が残った場合のみ（既定では実装しない）
起動時のヘッダー点灯、星空層の視差、「動き出す。」の光の通過、惑星の微小な漂い、about 3 軌道の展開、contact 軌道の定着。

### マイクロインタラクション（Whimsy Injector、CSS 約 35 行 + TS 1 行）

| # | 案 | 対象 | 内容 |
|---|---|---|---|
| 1 | 彗星の矢印（Must） | `.btn` 全種・`.link-arrow` | hover / focus で矢印が 4px 進み、薄い尾（14×1px）を引く。押下で glow が収束（35px → 12px）。`.link-arrow` の gap 遷移（レイアウト系）は撤去 |
| 2 | 星図が開く（Must） | モバイルメニュー | **現状は開閉の遷移が無い**。オーバーレイ .4s フェード + 項目が上から 55ms 間隔で点灯。ハンバーガーの線は translate + rotate で交差 |
| 3 | 観測点の点灯 | nav の◇・右端インジケーター | 現在地◇の出入りを .3s クロスフェードに（現状は瞬時）。hover で輪郭◇、インジケーターは点灯・押下で収束 |
| 4 | 触れている間だけ軌道が回る | service の楕円・process の点線リング・works 線画 | hover 中だけ +24° 回り、離すと元の角度へ戻る。works は scale 1.06 / rotate −2° に調整 |
| 5 | リングの応答と点灯の統一 | ロゴのリング・TOP↑・各リンク | ロゴのリングが 6° 傾いて戻る。全リンクの点灯を `.3s` に統一 |

## やらないこと（抜粋）
常時回転する惑星・3D チルト・WebGL 再導入 ／ 文字バラバラ出現 ／ カスタムカーソル・マグネティック・リップル ／ 全面フラッシュ・ズーム遷移 ／ pin・スクロールジャック ／ バウンス系 easing ／ box-shadow・filter の連続アニメ ／ カウントアップ・プリローダー ／ 会社概要・本文に位置移動を伴う動き。

## 品質の前提
- **LCP**: 計測済みの LCP 要素はヒーローの惑星画像。画像と h1 には opacity / clip を一切付けない。
- **CLS**: transform / opacity のみ。追加要素は absolute / fixed。pin なし。
- **reduced-motion**: `html.motion` が付かないため静止した完成状態で表示。受け入れ基準は「reduced-motion 時のスクリーンショットが現行と一致」。
- **負荷**: 常時アニメは可視時のみ再生。追加 DOM は光点 1・流れ星 1。GSAP は既にバンドル済み（追加 JS は index.js の増分のみ）。
- 変更前の基準値: mobile perf 74 / LCP 4.2s / CLS 0、desktop perf 100 / LCP 0.8s / CLS 0。

## 実装量の見積
Must ≈ TS 100 / CSS 90、Should ≈ TS 75 / CSS 70、Whimsy ≈ TS 1 / CSS 35 → 合計 TS ≈ 180 行 / CSS ≈ 195 行。
