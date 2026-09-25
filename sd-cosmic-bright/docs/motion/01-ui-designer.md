# 01 UI Designer — モーション設計書
## 株式会社SD コーポレートサイト（宇宙デザイン・明るさ調整版）

- 役割: UI Designer（設計のみ。実装コードは書かない）
- 入力: BRIEF.md / index.html / cosmic.css / main.ts / スクリーンショット（desktop 8枚 + mobile）
- 一言で: **「静かな観測所」。天体は自分から騒がない。動くのは光点・線・深度だけで、主役の文章と惑星は据わったまま。**

---

## 0. 現状の所見（設計の前提）

静止画として世界観はすでに完成している。足りないのは「時間」だけなので、追加するのは少数の動きに絞る。

| # | 所見 | 設計への影響 |
|---|---|---|
| 1 | `appear` は JS が後から `.is-visible` を付ける方式で、初期状態を隠していない。そのため初回描画→クラス付与の間に hero の label / lead / CTA が **1 → .5 → 1 と一瞬瞬く**（opacity .5 始まりはその緩和策と思われる） | 基盤（L0）で「初期状態を先に確定させる」方式に置き換える。h1 と惑星画像は対象外のまま |
| 2 | 軌道モチーフ（`.brand-orbit b`、`.contact-orbits i:first-child:after`）が **光点なのに静止している** | 最小の追加で最大の「宇宙らしさ」が出る箇所。Must の中心 |
| 3 | `.h2` の `.line > span` マークアップが用意されているが未活用 | 行単位のマスク出現に使える（h1 は LCP なので使わない） |
| 4 | `orbit-breathe` など常時アニメが画面外でも再生される | 可視時のみ再生に統一（ScrollTrigger onToggle） |
| 5 | `.step:after` の斜め線が「星座」になっているが、出現時に線が結ばれる演出がない | Process の Must |
| 6 | モバイルメニュー `.menu.is-open` の遷移 CSS が存在しない（header.ts は 450ms 待っている） | Whimsy に引き継ぐ（F 参照） |
| 7 | 背景画像 starfield.webp の右上に静止した流星の筋がすでに描かれている | 動く流れ星を足すなら「同じ角度・同じ帯域」に限定すれば違和感が出ない |

---

## A. モーション原則と共通トークン

### 原則（5項目）

1. **観測者の静けさ** — 動きは「観測される天体」のように、ゆっくり・一定・予測可能。ユーザーの操作（スクロール・hover）に比例するか、長周期で淡々と繰り返すかのどちらかで、突然の自発的な動きは流れ星 1 種類に限る。主役は文章。動きは視線の端で起きる。
2. **一度きりの出現、永続は微小** — 出現（fade / 結線 / 定着）は各要素 1 回だけ。永続的に動いてよいのは面積の小さい光（軌道の光点・星の瞬き・流れ星）のみ。常時動く要素の合計面積は画面の 0.2% 以下。
3. **移動より「点灯」と「結線」** — 位置を大きく動かさない（非マスク 24px 以内）。変化は主に光（opacity）と線の伸長（scaleX / stroke）で表す。バウンス・オーバーシュートは使わない。
4. **精密な機構** — イージングは 3 種のみ（出現 = expo-out、周回とスクロール連動 = linear、往復 = sine-inout）。速度・間隔・移動量はトークン化し、全セクションで同じ値を使う。乱数を使うのは流れ星の間隔と位置だけ。
5. **情報の重さに反比例** — 会社概要・本文段落など「信頼情報」ほど動きを減らす（会社概要は透明度のみ、移動ゼロ）。CTA まわりは視線誘導に必要な最小限。LCP / CLS / reduced-motion は演出の制約ではなく前提条件。

### 共通トークン案（CSS カスタムプロパティ名は実装者が調整可）

| トークン | 値 | 用途 |
|---|---|---|
| `--t-ui` | .3s | hover・状態変化（Whimsy と共有。既存の .25 / .4s をここに寄せる） |
| `--t-reveal` | .9s | 出現（既存 `appear` を踏襲） |
| `--t-draw` | 1.2s | 線の伸長、stroke 描画、軌道の定着 |
| `--t-focus` | 2.4s | hero の焦点合わせ（1 回のみ） |
| `--t-orbit-s` / `--t-orbit-l` | 22s / 36s | 光点の周回（About の小軌道 / Contact の大軌道。大きい＝遠い＝遅い） |
| `--t-breathe` | 6s | 既存 orbit-breathe（変更なし） |
| twinkle | 3〜7s | 既存（変更なし） |
| 流れ星 | 移動 1.1s、発生間隔 14〜24s（乱数） | B3 |
| `--ease-out` | cubic-bezier(.16,1,.3,1) | 出現・定着（既存値） |
| `--ease-inout` | cubic-bezier(.45,0,.55,1) | 往復・漂い・流れ星の明滅 |
| linear / `ease: 'none'` | — | 周回・スクロール連動 |
| `--stagger` | 55ms | 同じ親をもつ兄弟要素（既存値）。上限 6 段（330ms） |
| `--stagger-seq` | 120ms | 順序に意味がある列（Process の本文） |
| `--seq-gap` | .34s | 星座結線の節点間隔（モバイルは 0） |
| `--rise` | 18px | 出現の移動量（既存）。hero イントロのみ 12px |
| `--rise-line` | .4em | 見出し行（マスク付き。52px 見出しで約 21px） |
| 移動量の上限 | 非マスク 24px / マスク 1em / パララックス: section-num ±40px（mobile ±20px）、hero 画像 14%（mobile 10%）、footer 60px | |
| スケール範囲 | .96〜1.04（hover は Whimsy 側で 1.08 まで許容） | |
| 不透明度の床 | LCP 要素は常に 1 / 常時光点 .55〜1 / 流れ星ピーク .7 / 出現前の非 LCP 要素は 0 | |
| 頻度の上限 | 自発イベント（流れ星）は同時 1 つ・14s 以上の間隔・読み込み後 5s は発生させない | |
| 振付の長さ | 1 セクション内の出現振付は合計 2.0s 以内、hero イントロは 0.9s 以内で完了 | |
| 点滅 | すべて 1Hz 未満（3 回/秒未満の制約に対して十分な余裕） | |

---

## B. サイト共通に入れる動き

| ID | 要素 | 動き（メタファー） | トリガー | 強さ・duration | reduced-motion時 | 優先度 | 信頼感を損なわない理由 |
|---|---|---|---|---|---|---|---|
| L0 | 出現システムの基盤（`[data-reveal]`, `.card`, `.step`） | 既存 `appear` を **活かす**が、初期状態を `html.motion` 配下で先に確定する。stagger は「同じ親の中での順番 × 55ms」に変更（現在はページ全体の通し番号）。`appear` の始点を opacity .5 → 0 に | `<head>` の 1 行インライン script が reduced でなければ `html.motion` を付与 → 初回描画時点で非 LCP 要素は隠れている → 既存 IO が `.is-visible` を付与 | 既存どおり .9s / 18px / `--ease-out`。CSS だけのフェイルセーフ（4s 後に強制表示）を併設 | `html.motion` が付かないので全要素が最初から表示。既存の `animation:none` 一括指定も維持 | **Must** | 現状の瞬きを消し、「静かに現れる」を成立させる土台。動きの量は増やさない |
| B1 | ヘッダー / 進捗バー / 右端インジケーター | **維持**。既存の show/hide・scaleX・active 発光はそのまま。transition 時間を `--t-ui` に揃えるだけ。読み込み時にヘッダーとインジケーターが opacity 0→1（.6s）で「点灯」 | 起動時（H1 と同時） | opacity のみ .6s | 最初から表示 | 点灯は **Could**、維持は現状維持 | 常に見えている UI は動かさないのが信頼感の基本。hover 等は Whimsy へ |
| B2 | `.section-num`（各セクション右上の巨大番号）、`.footer__big` | **深度パララックス**: セクションが画面を通過する間に +40px → −40px（footer は +60 → 0）。メタファー: 遠景の「星表番号」はゆっくり動く | ScrollTrigger scrub（trigger = 親セクション、start top bottom / end bottom top） | ±40px desktop / ±20px mobile、`ease: 'none'`、`scrub: true` | なし（transform を付けない） | **Should** | 極めて薄いアウトライン文字が視差で「奥にある」と分かるだけ。本文の位置は 1px も動かない |
| B3 | `.universe` 内に JS で追加する 1 要素 `.meteor` | **流れ星**: 1px × 90px の細い光の筋が右上から左下へ 220px 滑る。角度・帯域は背景画像の静止した流星と同じ（約 −30°、画面上部 3〜18%、横 60〜96%） | 読み込み 5s 後から、14〜24s の乱数間隔。`document.hidden` 中は停止 | translate のみ 1.1s、opacity 0→.7→0（`--ease-inout`）、同時に 1 本まで | 発生させない（要素も作らない） | **Should**（迷ったら落とす候補 #1） | 頻度が低く細く、テキスト帯域を避ける。背景に元からある流星と同じ表情なので「装置が増えた」感がない |
| B4 | `.twinkles`（JS 生成の星 28 個の層） | **星空の深度**: スクロール量 × 0.03 だけ上にずれる（背景画像の星との間に視差）。層を 30% 高くして端切れを防ぐ | scroll（既存の rAF ループに 1 行） | 最大 ±120px（ページ全長で） | なし | **Could** | 動きとして意識されない程度。効果が薄ければ最初に削る |
| — | 背景画像 starfield.webp、twinkle 自体 | **変更なし**（既存 twinkle は面積が小さく 1Hz 未満で原則に合致） | — | — | — | — | — |

---

## C. セクション別設計

表の列: 要素 / 動き（メタファー） / トリガー / 強さ・duration / reduced-motion時 / 優先度 / 信頼感を損なわない理由。
各セクション末尾に「既存との関係（活かす／置き換える）」を明記。

### C-1. hero（#hero）

| ID | 要素 | 動き（メタファー） | トリガー | 強さ・duration | reduced-motion時 | 優先度 | 信頼感を損なわない理由 |
|---|---|---|---|---|---|---|---|
| H1 | `.hero__label` → `.hero__en` → `.hero__lead` → `.hero__cta` → `.scroll-hint`（**h1 と惑星画像は対象外**） | **静かなイントロ**: 既存 appear を順番に。メタファー: 観測機器が順に点灯し、星（h1）と惑星は最初からそこにある | 初回描画直後（IO は即発火）。フォント・画像を待たない | opacity 0→1、translateY 12px→0、.8s、遅延 0 / 80 / 160 / 240ms（`data-delay` 属性で指定）。scroll-hint は opacity のみ、600ms 遅延 | 全て最初から表示 | **Must** | 主役（見出し・惑星）は動かず周辺だけが整う。「落ち着いて待っている」第一印象 |
| H2 | `.hero__art img` | **惑星の深度**: スクロールに連動して惑星がコンテンツより遅れて上がる（実効 0.86 倍速）。メタファー: 遠い天体ほどゆっくり動く | ScrollTrigger scrub（#hero top top → bottom top） | yPercent 0 → +14（desktop ≒120px）/ +10（mobile）、`ease: 'none'`、`scrub: true` | なし | **Must** | スクロール量にのみ比例し自発的には動かない。「機構がスクロールに正確に追従する」感覚 |
| H3 | `.hero__art img` | **焦点が合う**: scale 1.03 → 1 を 1 回。メタファー: 望遠鏡のピントが静かに合う | 画像 load 後（`img.complete` なら即） | 2.4s、`--ease-out`。H2 と同じ GSAP ターゲットなので競合しない | なし | **Should**（迷ったら落とす候補 #2） | 3% のスケールは意識下。動いた事実より「静止した」印象だけが残る |
| H4 | `.hero__title .line:last-child`（「動き出す。」のグラデーション文字） | **光の通過**: background-size 200% にして position 100% → 0 を 1 回。メタファー: 光が文字を通り過ぎる | H1 完了後（1.2s 遅延） | 1.6s 以上、`--ease-inout`、1 回のみ | なし | **Could** | 文字は常に描画済み（LCP に影響なし）。1.6s 未満にすると「テカリ」に見えるので厳守 |
| H5 | `.hero__art`（ラッパー） | **微小な漂い**: translate(0,0) → (−6px, 4px) の往復。メタファー: 惑星の自転ではなく、観測者側の呼吸 | hero 可視時のみ（ScrollTrigger onToggle）、`(pointer:fine)` のみ | 24s alternate、`--ease-inout` | なし | **Could** | ポインタ追従（`translate` プロパティ）・スクロール連動（img の transform）と別プロパティ／別要素なので競合しない。大きな層を常時動かすため mobile では無効 |

既存との関係: ポインタ追従パララックス（`translate`）・scroll-hint の線・h1 のグラデーションは **活かす**。hero の `[data-reveal]` は L0 の基盤に乗せ、遅延だけを `data-delay` で上書き（置き換えではなく調整）。h1 の `.line > span` には **何もしない**（LCP）。

### C-2. about（#about）

| ID | 要素 | 動き（メタファー） | トリガー | 強さ・duration | reduced-motion時 | 優先度 | 信頼感を損なわない理由 |
|---|---|---|---|---|---|---|---|
| A1 | `.brand-orbit b`（光点。JS で 1 本目の軌道 `i` の中へ移動） | **軌道上の光点の周回**: 楕円軌道の上を一定角速度で周回。奥側（上半分）を通るとき opacity .55、手前で 1。メタファー: 傾いた円軌道をまわる衛星（角速度一定を楕円に投影すると物理的に正しい見え方になる） | 常時。ただしセクション可視時のみ再生（ScrollTrigger onToggle で tween を pause / play、同時に `orbit-breathe` も `animation-play-state` で停止） | 周期 22s linear、光点 7px（既存サイズ）、glow は静的。位置は毎フレーム `translate(rx·cosθ, ry·sinθ)` を JS で計算（rx, ry は軌道要素の実寸から。resize で再計測） | JS が `html.motion` なしでは光点を移動させないため、既存の静止位置（top 72px / right 41px）にそのまま表示＝現行と同じ見た目 | **Must** | 動く面積は 7px 相当。周期が長く一定なので視線を奪わず、「機構が正確に動いている」証拠になる |
| A2 | `.h2[data-reveal=lines]` の `.line > span`、`.rule[data-reveal=rule]`、`.keywords li` | **見出し行が据わる / 光の線が引かれる / キーワードが順に灯る**: 行は `.line` を overflow:hidden にして .4em 下から（90ms 間隔）、rule は scaleX 0→1（origin left）、keywords は li ごとに appear | `.is-visible`（既存 IO） | 行 .9s / rule 1.2s（+.25s）/ keywords 70ms stagger、すべて `--ease-out`。`lines` と `keywords` は親ブロックの appear を無効化して子だけ動かす（二重に動かさない） | 最初から完成状態 | **Should** | 行の移動は .4em 以下でマスク付きなので文字が重ならない。線は「引かれる」だけで位置は不変。他セクションの h2・rule にも同じ規則が適用されるので一貫する |
| A3 | `.brand-orbit i`（3 本の軌道） | **軌道の展開**: 出現時に 3 本とも rotate(−28°) から各自の角度（−28° / 30° / 90°）へ開き、opacity 0→1。メタファー: 観測装置のリングが開く | `.brand-orbit.is-visible`（`data-reveal="orbit"` を付与） | 1.4s、`--ease-out`、1 回。完了後は既存の `orbit-breathe` へ | 静止（各自の角度） | **Could** | 位置は動かず角度だけ。1 回きりで、その後は A1 の光点だけが動く |

既存との関係: `orbit-breathe`（明滅）は **活かす**（可視時のみ再生に変更）。静止していた光点 `b` は A1 で **置き換える**（同じ要素を動かす）。本文 3 段落の appear は L0 のまま。

### C-3. service（#service）

| ID | 要素 | 動き（メタファー） | トリガー | 強さ・duration | reduced-motion時 | 優先度 | 信頼感を損なわない理由 |
|---|---|---|---|---|---|---|---|
| S1 | `.card__index:after`（数字を囲む楕円）、`.card:after`（右上の◇） | **軌道の定着**: 楕円が「各自の角度 −40°、scale .85、opacity 0」から所定の角度へ収まる。◇は +600ms で点灯（opacity 0→1）。メタファー: 軌道が確定する | `.card.is-visible`（既存 IO）。カード本体の appear より 100ms 遅れ | 1.2s、`--ease-out`。角度は nth-child ごとに `--tilt` を持たせ、keyframes で `rotate(calc(var(--tilt) - 40deg))` → `rotate(var(--tilt))` | 静止（所定角度・◇表示） | **Should** | 動くのは数字の周りの小さな装飾のみ。本文カードは既存 appear のままなので読み手のリズムを変えない |
| S2 | `.card`（4 枚） | **維持**: 既存 appear。L0 により同じ親の中で 0 / 55 / 110 / 165ms の順になる | 既存 IO | 既存 | 表示 | **Must**（L0 に含む） | 変更なし |

既存との関係: `.card` の appear と hover（border-color）は **活かす**。◇や楕円の hover 挙動は Whimsy へ（F 参照）。`.section--service:before` の大きな楕円は pseudo 要素のため GSAP 対象外、**動かさない**。

### C-4. process（#process）

| ID | 要素 | 動き（メタファー） | トリガー | 強さ・duration | reduced-motion時 | 優先度 | 信頼感を損なわない理由 |
|---|---|---|---|---|---|---|---|
| P1 | `.step__index:after`（節点の光）、`.step:after`（ステップ間の斜め線） | **星座の結線**: 節点 n が灯る → 線 n が左から伸びる → 節点 n+1 が灯る…の順次。線は `scaleX(0→1)`（origin left、既存の rotate ±14° / ±21° を保持）、節点は opacity .25→1 に glow の一発点灯。メタファー: 星が結ばれて星座になる＝工程がつながって一貫する | `.step.is-visible`（既存 IO）。TS は各 step に `--seq: n` を付与するだけ | 線 .5s、節点 .5s、間隔 `--seq-gap` .34s → 5 節点で合計 ≈ 2.0s。本文の appear は `--delay: n × 120ms`（装飾より本文が先に読める） | 線・節点は最初から完成状態（`html.motion` 配下でのみ初期 scaleX(0)） | **Must** | 「工程が一つずつ確実につながる」という文章内容そのものの可視化。装飾が意味を持つので過剰に見えない |
| P2 | 同上（≤767px） | **縦の結線**: 線は `scaleY(0→1)`（origin top）。`--seq-gap` は 0 にして各 step が見えた時点で即描画（順序はスクロールが作る） | 同上 | 線 .5s、節点 .4s | 同上 | **Must**（P1 の一部） | モバイルでは待たせない。遅延を積むと「まだ描かれない線」がストレスになる |

既存との関係: `.step` の appear は **活かす**（`--delay` を順次に変更）。球体 `.step__index` 自体・点線の外輪 `:before` は動かさない（hover 時の回転は Whimsy 候補）。

### C-5. works（#works）

| ID | 要素 | 動き（メタファー） | トリガー | 強さ・duration | reduced-motion時 | 優先度 | 信頼感を損なわない理由 |
|---|---|---|---|---|---|---|---|
| W1 | `.work__thumb svg` の `path` / `ellipse`（線）と `rect` / `circle`（点） | **線画の結線**: 点（星）が先に灯り（opacity 0→1）、続いて線が stroke-dashoffset で描かれる。長さは TS で `getTotalLength()` を測り `--len` に入れる（`pathLength` 属性の対応差に依存しない）。メタファー: 設計図の星図が引かれる | `.work.is-visible`（既存 `data-reveal="card"`） | 点 .4s（+.1s）、線 1.2s（+.3s）、`--ease-out`。3 枚は 55ms stagger | 完成状態 | **Should** | サムネ内に閉じた 1 回きりの動き。「実績＝設計して引いた線」という意味づけになる |
| W2 | `.work:hover svg` | **維持**（既存 scale 1.08 / rotate −3°）。調整は Whimsy へ（推奨: rotate −2°、`--t-reveal` に統一） | hover | 既存 | 既存（transition:none） | — | — |

既存との関係: hover は **活かす**。`.work` の appear は L0 のまま。

### C-6. company（#company）

| ID | 要素 | 動き（メタファー） | トリガー | 強さ・duration | reduced-motion時 | 優先度 | 信頼感を損なわない理由 |
|---|---|---|---|---|---|---|---|
| C1 | `tr[data-reveal=row]` の `th`, `td` | **行の逐次点灯**: 透明度のみ 0→1、移動ゼロ。メタファー: 観測記録が 1 行ずつ確定する | `.is-visible`（既存 IO、tr 単位） | .7s、55ms stagger、`--ease-out`。`tr` ではなく `th, td` を動かす（tr の transform / opacity はブラウザ差があるため） | 表示 | **Should** | 事実情報は動かさない。位置移動ゼロ・透明度のみで、サイト内で **最も静かなセクション** と明示する |
| — | その他 | **意図的に何もしない**（B2 の section-num パララックスのみ共通適用）。`.section--company:after` の楕円は pseudo 要素なので動かさない | — | — | — | — | 信頼情報の周りに装飾の動きを置かない、という原則 5 の体現 |

既存との関係: 行の appear（18px 上昇）は **置き換える**（透明度のみへ）。

### C-7. contact（#contact）

| ID | 要素 | 動き（メタファー） | トリガー | 強さ・duration | reduced-motion時 | 優先度 | 信頼感を損なわない理由 |
|---|---|---|---|---|---|---|---|
| K1 | `.contact-orbits i:first-child` の光点（現在の `:after` を、`html.motion` 時のみ JS 追加の `<b>` に置き換え） | **大軌道の光点の周回**: A1 と同じ計算で、周期は 36s（大きい軌道ほど遅い＝遠い）。奥側減光は不要（背景要素） | 常時。セクション可視時のみ再生（ScrollTrigger onToggle） | 36s linear、光点 6px（既存サイズ）、glow 静的 | `html.motion` なし → 既存の `:after` 静止光点がそのまま表示 | **Must** | CTA の背後（z 下）を視界の端で 6px の光がゆっくり通過するだけ。ボタンの視認性を妨げず、「まだ動いている＝営業中」の気配だけを残す |
| K2 | `.contact-orbits i`（3 本） | **軌道の定着**: opacity 0→1 + scale .96→1、外側ほど遅れて | `.contact-orbits.is-visible`（`data-reveal="orbits"` 付与） | 1.4s、120ms stagger、`--ease-out` | 静止 | **Could** | 1 回きり、位置不変。出現後は K1 の光点だけが動く |
| K3 | `.btn--signal.btn--lg`、`.contact__mail` | Whimsy 担当（F 参照） | — | — | — | — | — |

既存との関係: 3 本の大楕円は **活かす**。`:after` の静止光点は K1 で **置き換える**（reduced では既存を維持）。

### C-8. footer

| ID | 要素 | 動き（メタファー） | トリガー | 強さ・duration | reduced-motion時 | 優先度 | 信頼感を損なわない理由 |
|---|---|---|---|---|---|---|---|
| F1 | `.footer__big`（巨大アウトライン「SD」） | **浮上**: フッターが現れる間に translateY +60px → 0（B2 と同じヘルパーで `data-parallax`） | ScrollTrigger scrub（footer top bottom → bottom bottom） | 60px（mobile 30px）、`ease: 'none'` | なし | **Should** | 装飾文字のみ。ナビ・メール・著作権表示は動かない |
| F2 | `.footer__top`（TOP ↑）、`.footer__nav a` | Whimsy 担当 | — | — | — | — | — |

---

## D. やらないことリスト（このブランドで避ける動き）

- 常時回転する惑星・リング、3D チルト、WebGL / three.js / パーティクルの再導入（旧 `src/three/*`、`cursor.ts`、`effects.ts` は使わない）
- 文字単位のバラバラ出現、タイプライター、文字が飛んでくる見出し
- カスタムカーソル、カーソル追従の彗星・尾、クリック時の粒子
- 画面全体のフラッシュ、ワープ・ズームイン遷移、色相のサイクル、グラデーションの常時移動
- 大きな要素（カード・サムネ・ボタン）の常時フロート（ふわふわ）
- スクロールジャック、ScrollTrigger の pin、横スクロール切替、セクション単位のスナップ
- レイアウトに影響する hover（幅・高さ・margin・font-size の変化）、内容がずれる hover
- バウンス / elastic / back 系のイージング、24px を超える非マスク移動
- box-shadow・filter・blur の連続アニメ（点灯は一発の遷移のみ）
- 流れ星の連発・複数同時・テキスト帯域の横断、読み込み直後の発生
- 数字のカウントアップ、ローディング画面・プリローダー、「起動音」的な演出
- 音・振動、自動再生の動画
- 会社概要・本文段落に位置移動を伴う動きを入れること

---

## E. 優先度と実装量

ブリーフの上限: TS 合計 ~300 行 / CSS 追加 ~200 行（Whimsy 分を含む前提で配分）。

| 段階 | 含む案 | ねらい | TS 目安 | CSS 目安 |
|---|---|---|---|---|
| **Must**（これだけで宇宙らしさが伝わる最小セット） | L0 基盤（motion ゲート・初期状態・グループ stagger・フェイルセーフ・可視時再生ヘルパー）、H1 静かなイントロ、H2 惑星の深度、A1 + K1 軌道光点の周回（共通ヘルパー 1 つ）、P1 + P2 星座の結線 | 「光点が軌道を回る」「星座が結ばれる」「惑星に深度がある」の 3 つで世界観が成立する | 約 100 行 | 約 90 行 |
| **Should** | B2 + F1 深度パララックス（1 ヘルパー）、A2 見出し行・rule・keywords、S1 軌道の定着、W1 線画の結線、C1 行の点灯、B3 流れ星、H3 焦点が合う | 各セクションに「一つだけ」固有の宇宙の表情を与える | 約 75 行 | 約 70 行 |
| **Could**（残枠がある場合のみ） | B1 起動時点灯、B4 星空の深度、H4 光の通過、H5 微小な漂い、A3 軌道の展開、K2 軌道の定着、reduced-motion のライブ切替 | 微細な質感。効果が薄ければ最初に削る | 約 30 行 | 約 25 行 |
| Whimsy 予約枠 | ボタン・リンク・メニュー開閉・hover 系 | F 参照 | 約 40 行 | 約 40 行 |

合計: Must + Should + Whimsy ≈ TS 215 行 / CSS 200 行。Could は枠が残った場合のみ。CSS が上限に触れる場合は Should のうち **B3 流れ星 → H3 焦点 → C1 行の点灯** の順に落とす。

---

## F. Whimsy Injector への引き継ぎ

### 対象外にした要素（Whimsy の担当）

- `.btn`（`--signal` / `--outline` / `--lg`）の hover・press・focus、矢印 `:after` の動き
- `.link-arrow`（既存 gap 拡張の調整、矢印）
- `.nav__list a` の active マーカー（◇）の移動・hover、`.wordmark` の楕円リング（ヘッダー・フッター）の hover
- `.menu-btn` の開閉、`.menu.is-open` の **開閉フェード（現在 CSS が無い。header.ts は 450ms 待つ実装）** とリストの stagger
- `.indicator button` の hover / クリック、ラベル表示、active 切替時の微小パルス
- `.card` hover（`.card:after` ◇の点灯、`.card__index:after` 楕円の hover 中の低速回転）
- `.work` hover（既存 scale / rotate の調整）
- `.keywords li`、`.company-table tr`、`.contact__mail`、`.footer__nav a`、`.footer__top`、`.scroll-hint` の hover
- フォーカスリングの見え方（壊さないこと）

### 揃えてほしいトーン・トークン

- 語彙は「点灯」と「微小な移動」。hover の移動は 3px 以内（既存 `.btn` の −3px を上限）、矢印アイコンの移動は 4px 以内、押下は scale(.98)
- duration は `--t-ui`（.3s）、hover out は .5s まで許容。イージングは `--ease-out`
- 光の色は既存の cyan `#9adfff`、glow は `#7dd5ff` / `#9fe9ff`。box-shadow は hover in/out の一発遷移のみ（連続アニメ禁止）
- 継続アニメ（楕円の回転など）は hover 中のみ再生し、離れたら止める。自発的に動くものは足さない
- reduced-motion では color / opacity の変化のみ（transform なし）
- 出現（reveal）・パララックス・常時ループ・`html.motion` / `.is-visible` の仕組みには触れない（重複禁止）。`.is-visible` は animation で transform を保持しているため、同じ要素に GSAP で transform を当てない
- 音・カーソル変更・レイアウト変化（gap・padding・font-size）は不可。既存 `.link-arrow` の gap 遷移は残してよいが、新規にレイアウト系プロパティを動かさない

---

## G. 技術メモ（ブリーフ制約との対応）

### 共通の実装方針

- **ゲート**: `<head>` に 1 行のインライン script（`matchMedia('(prefers-reduced-motion: reduce)')` が false なら `document.documentElement.classList.add('motion')`）。出現前の非表示状態・線の scaleX(0)・光点の移動など「動く前提の初期状態」は **すべて `html.motion` 配下にのみ書く**。これにより reduced-motion / JS 失敗 / 印刷では現行スクリーンショットと同じ完成状態が出る。
- **フェイルセーフ**: `html.motion [data-reveal]:not(.is-visible)` に 4s 遅延の CSS アニメーションで強制表示を仕込む（JS が来なくても内容が消えない）。
- **pseudo 要素は CSS keyframes、実要素は GSAP**: `.step:after`・`.card__index:after`・`.step__index:after` は GSAP で触れないため、既存の `.is-visible` クラスをトリガーに CSS keyframes で動かす。
- **`.is-visible` の要素に GSAP の transform を当てない**: `appear` は `both` fill で transform を保持し、インラインスタイルより優先されるため競合する。パララックス対象（`.section-num`、`.footer__big`、`.hero__art img`）は reveal 対象外の要素に限定。
- **Lenis + ScrollTrigger**: 既に `lenis.on('scroll', ScrollTrigger.update)` 済み。scrub は `true`（Lenis がすでに平滑化しているため二重に遅らせない）。`document.fonts.ready` と `load` 後に `ScrollTrigger.refresh()`。
- **可視時のみ再生ヘルパー**: `ScrollTrigger.create({ trigger, start:'top bottom', end:'bottom top', onToggle })` で tween の pause / play と `is-active` クラス（CSS ループの `animation-play-state`）を切り替える。A1・K1・`orbit-breathe`・H5 が共用。
- **軌道光点の実装**: 光点を軌道要素 `i` の子にし、`gsap.to({t:0},{t:1, duration, ease:'none', repeat:-1, onUpdate})` で `translate(rx·cosθ, ry·sinθ)` を毎フレーム設定（rx, ry は `i` の実寸 / 2 − 0.5px、resize で再計測）。親 `i` の rotate を継承するので傾きの計算は不要。CSS Motion Path や `@property` に依存しない。
- **追加 DOM**: 光点 1 個（contact）、流れ星 1 個のみ。about は既存 `b` を移動。マークアップ変更は `data-delay` 属性（hero 4 か所）、`data-reveal` 属性の追加（scroll-hint・brand-orbit・contact-orbits）に限る。
- **受け入れ基準**: reduced-motion 時のスクリーンショットが現行 shots/ と一致すること（差分ゼロ）。Lighthouse で LCP 要素が変わらないこと（h1 または cosmic-hero.webp）。CLS 0。

### 案ごとの 1 行チェック

| ID | LCP（h1・hero 画像を隠さない） | CLS（レイアウト不変） | 画面外で停止 / 負荷 |
|---|---|---|---|
| L0 | h1・hero img は `data-reveal` を持たないため初期非表示の対象外。隠すのは非 LCP のみ、opacity 0 は初回描画前に確定 | opacity / transform のみ。属性追加も寸法に影響なし | 一発アニメのみ。IO は既存 1 つ |
| B1 | ヘッダーは LCP 候補でない | opacity のみ | 一発 |
| B2 / F1 | 対象は装飾文字のみ | absolute 要素の transform のみ | scrub は可視範囲でのみ更新される（ScrollTrigger の性質） |
| B3 | 背景層。LCP 無関係、読み込み後 5s まで発生しない | `position:fixed` の 1 要素、transform / opacity のみ | `document.hidden` でタイマー停止。同時 1 本、1.1s |
| B4 | 無関係 | transform のみ | 既存の scroll rAF に 1 行。層を 30% 高くするのは初期化時のみ |
| H1 | h1・img は一切触らない。lead / label / CTA は非 LCP。フォント待ちなし | translateY 12px の transform のみ | 一発、0.9s で完了 |
| H2 | 画像は常に可視。transform は描画を妨げない | overflow:hidden のラッパー内で img の transform のみ。上端の隙間はビューポート外 | hero 通過中のみ scrub |
| H3 | 画像は常に可視（scale 1.03 始まり）。load 後に開始 | transform のみ | 一発 2.4s、GSAP が H2 と合成 |
| H4 | 文字は常に描画済み。`background-position` は paint だが 1 回・1 要素 | 寸法不変 | 一発 |
| H5 | 無関係 | ラッパーの transform のみ | hero 可視時 & pointer:fine のみ再生 |
| A1 / K1 | 無関係 | 光点は absolute。軌道要素の寸法は変えない | onToggle で pause。1 フレームあたり 2 要素の transform 更新 |
| A2 | h2 は非 LCP。`.line` の overflow:hidden は描画領域のみ | `.line > span` を inline-block にしても行ボックスは同じ。hr は transform | 一発 |
| A3 | 無関係 | rotate / opacity のみ | 一発 |
| S1 | 無関係 | pseudo 要素の transform / opacity のみ | 一発 |
| P1 / P2 | 無関係 | pseudo の scale / opacity のみ。線の位置・長さの定義は既存のまま | 一発。glow の box-shadow は .5s の一発点灯のみ |
| W1 | 無関係 | stroke-dashoffset は SVG 内。寸法不変 | 一発（paint だが小さな SVG 3 枚） |
| C1 | 無関係 | opacity のみ（tr でなく th / td） | 一発 |
| K2 | 無関係 | absolute 要素の transform / opacity | 一発 |
