# 02 Whimsy Injector — マイクロインタラクション提案
## 株式会社SD コーポレートサイト（宇宙デザイン・明るさ調整版）

- 役割: Whimsy Injector（設計のみ。実装コードは書かない。各案に CSS プロパティ／擬似要素／クラス名／JS の要否の見当までを書く）
- 入力: BRIEF.md / 01-ui-designer.md（A 原則とトークン・D やらないこと・F 引き継ぎ）/ index.html / cosmic.css / header.ts / スクリーンショット（desktop hero・service・contact・footer、mobile hero）
- 一言: **「触れたところだけ、機構が応える」。彗星・星図・観測点・軌道・リング — メタファーは 1 案に 1 つ。動くのは矢印と光と線だけで、文字・ボタンの輪郭・レイアウトは据わったまま。**
- 担当範囲: F 節の列挙要素のみ。出現アニメ・パララックス・常時ループ・`html.motion` / `.is-visible` には **触れない**。

---

## 0. 現状の所見（Whimsy 担当範囲に限る）

| # | 所見 | 対応 |
|---|---|---|
| 1 | `.menu.is-open` の遷移 CSS が存在しない。さらに header.ts の `openMenu` は `hidden=false` → `requestAnimationFrame` → `.is-open` 付与の順だが、rAF コールバックはそのフレームのスタイル再計算より **前** に走るため、両方の変更が同じ再計算でまとめて評価され、CSS に transition を足しても開くときのフェードが **走らない可能性が高い**（`hidden` 解除直後に強制リフローが無い） | 案2。CSS に加えて TS 1 行（`void menu.offsetWidth`）を推奨 |
| 2 | `.menu-btn__bar` の開閉は `top`（18/27px → 22px）が遷移なしでジャンプし、そのあと rotate だけが .3s で回る。二段階に見える | 案2 で `translate` + `rotate` に置き換え（`top` は固定） |
| 3 | `.link-arrow:hover` は `gap` 29→36px で矢印が **7px** 動く。レイアウト系プロパティであり、F の「矢印 4px 以内」も超える | 案1 で `gap` 遷移を外し、矢印の `translate: 4px` に置き換え |
| 4 | `.nav__list a[aria-current]:after` の◇は aria-current の付け外しで **瞬時に出現・消滅** する（content の生成／破棄なので transition が効かない） | 案3。全リンクに常時描画し opacity でクロスフェード |
| 5 | 「点灯」の速度がばらばら: `.indicator button:after` は `transition:all .4s`、`.nav__list a` は .25s、`.contact__mail` の下線・`.footer__nav a` の色・`.menu__list a` は遷移なしで即時 | 案3・案5で `--t-ui`（.3s）に統一 |
| 6 | `.card` / `.work` の hover は非インタラクティブな `li` に付いており `(hover:hover)` で守られていない。タッチ端末では一度タップした要素の hover 状態が残ることがある | 案4。新規 hover 規則はすべて `@media (hover:hover)` 内へ |
| 7 | `.btn:after` / `.link-arrow:after` は 8px の回転ボックス（チェブロン）。両要素の `:before` は未使用で `.btn` は `position:relative` 済み | 案1。追加マークアップなしで「尾」を描ける |

---

## 1. 共通ルール（全案に適用）

### トークン（UI Designer A 節と共有。未定義なら `:root` に 1 行追加）

| トークン | 値 | 用途 |
|---|---|---|
| `--t-ui` | .3s | hover in / focus / 状態変化。既存の .25s / .4s / .6s はここに寄せる |
| hover out | ≤ .5s | 尾・軌道の戻りだけ .5s（残光）。それ以外は `--t-ui` |
| 押下 | .12s | `:active` に入るとき。離すと `--t-ui` で戻る |
| `--ease-out` | cubic-bezier(.16,1,.3,1) | すべての遷移。bounce / back / elastic は使わない |
| 光 | `var(--cyan)` #9adfff / glow `#7dd5ff` `#9fe9ff` | 点灯色。新色は足さない |
| 移動量 | hover ≤ 3px、矢印 ≤ 4px、押下 `scale(.98)`、回転 ≤ 24°、拡大 ≤ 1.06 | F の上限内 |

### 状態は変数 1 つに集約する（hover / focus-visible / タッチ / reduced を一か所で扱う）

- 各対象要素で **`--on`**（0/1）を「反応中」の印にする。`@media (hover:hover){ .btn:hover{--on:1} }` と、メディアクエリの外で `.btn:focus-visible{--on:1}`。
  見た目は `--on` から計算する: `translate: calc(var(--on,0) * var(--mv,1) * 4px) 0`、`opacity: calc(var(--on,0) * .75)` など。カスタムプロパティ自体は補間されないが、依存する `translate` / `opacity` の計算値が変わるので、それらに宣言した transition がそのまま走る。
- **`--mv`**（motion multiplier）を移動・回転・拡縮にだけ掛ける。`@media (prefers-reduced-motion:reduce){ :root{--mv:0} }` の 1 行で、reduced 時は **色と opacity の変化だけ** が残る（F の規約どおり）。既存の `transition:none !important` 一括指定はそのまま活かす。
- この方式なら hover と focus-visible の規則を二重に書かずに済み、CSS 行数も抑えられる。使わない場合は `:is(:hover,:focus-visible)` で並記し、hover 部分だけ `@media (hover:hover)` で囲う（行数は約 1.5 倍）。

### キーボードとタッチ

- **focus-visible は hover と同じ状態 + 既存のフォーカスリング**（`outline:2px solid var(--cyan); outline-offset:7px`。角丸に追従する）。つまりキーボードには hover 以上の手がかりが出る。リングは触らない。
- hover 専用の見た目（浮上・尾・軌道の回転・リングの傾き）は **すべて `@media (hover:hover)` 内**。`:focus-visible` と `:active` は外に置く。タッチ端末では `:active`（押下 → 光の収束）が唯一の反応になり、それで十分に「押せた」と分かる。
- 非インタラクティブ要素（`.card` `.work` `.step` の `li`）は focus を持たないので focus 規則は不要。hover 規則は `(hover:hover)` で守る。

### 触らないもの

- `.keywords li`（非インタラクティブ、hover 不要）、`.company-table tr`（信頼情報。原則 5 により hover も付けない）、`.label:before` の◇（非インタラクティブ）。
- `.is-visible` / `html.motion` / `[data-reveal]`、`appear` keyframes、ScrollTrigger の対象要素（`.section-num` `.footer__big` `.hero__art img`）。
- フォーカスリングの色・太さ・offset。文言。マークアップ（案2の `--i` も CSS の `nth-child` で済ませる）。

---

## 2. 提案一覧

| # | 案（メタファー） | 対象 | 状態 | 動きと数値 | reduced-motion 時 | hover:hover | 実装 | 優先度 |
|---|---|---|---|---|---|---|---|---|
| 1 | **彗星の矢印** — 矢印が 4px 進み、後ろに薄い尾を引く。押すと光が核に収束する | `.btn`（`--signal` / `--outline` / `--lg`）、`.link-arrow` | hover / focus-visible / active | 矢印 `:after` `translate:4px 0`（.3s）。尾 `:before` 14×1px の `transparent→currentColor` グラデーション、opacity 0→.75、幅 .3→1（原点右）、in .3s / out .5s。ボタン浮上 −3px と glow は既存維持。押下 `translateY(-1px) scale(.98)` + `box-shadow 0 0 12px #9fe9ff66`（35px → 12px に絞る）.12s。`.link-arrow` の `gap` 遷移は撤去 | 尾は opacity だけで全長のまま点灯。矢印・ボタンは動かない。glow の変化は残す | hover は要。focus / active は外 | CSS のみ。`:before` 新設、`translate` / `scale` 個別プロパティ、`--bx`（横 padding 変数）8 か所を置換。`.link-arrow{position:relative}` | **Must** |
| 2 | **星図が開く** — 夜空（オーバーレイ）が浮かび、星名（項目）が上から順に灯る。ハンバーガーは 2 本の線が交差して ✕ | `.menu` `.menu__list li` `.menu__foot` `.menu-btn__bar` | open / close（`.is-open`） | オーバーレイ opacity 0→1 .4s / 閉 .3s。項目 opacity 0→1・`translate:0 8px→0` .35s、遅延 60ms + n×55ms（6 項目、最終 ≈ .7s で完了）。閉は遅延 0・.2s。foot は遅延 .4s。バーは `top` 固定で `translate:0 ±4.5px` + `rotate:±45deg` .3s | 全部 opacity のみ・即時（`--mv:0` で translate ゼロ）。`hidden` の切替タイミングは既存 450ms のまま | 不要（状態駆動）。バーの hover 色だけ hover:hover | CSS + **TS 1 行**（`requestAnimationFrame(() => menu.classList.add('is-open'))` → `void menu.offsetWidth; menu.classList.add('is-open')`）。`--i` は `.menu__list li:nth-child(n){--i:n-1}` | **Must** |
| 3 | **観測点の点灯** — 星図の上で、候補の星に薄く印が付き、いま観測中の星が灯る | `.nav__list a:after`（◇）、`.indicator button:after`（◇）、`.indicator span` | hover / focus-visible / aria-current 切替 / active | nav ◇ を全リンクに常時描画（opacity 0・`scale:.5`・輪郭のみ）。hover / focus → opacity .8・scale 1（輪郭◇）。`[aria-current]` → 塗り + `0 0 12px #9fe9ff`（既存の見た目）。切替は .3s のクロスフェード。indicator: hover で `border-color:var(--cyan)` + `0 0 8px #7dd5ff80`、押下 `scale(.8)` .12s、`transition:all` を個別指定に | opacity / 色のみ（scale は遷移なし即時） | hover は要。nav の focus-visible は外。indicator は `tabindex=-1` なので hover / active のみ | CSS のみ。`.nav__list a:after` の規則を書き換え、`[aria-current]` を後置 | **Should** |
| 4 | **触れている間だけ軌道が回る** — 楕円軌道と点線リングが +24° まわり、離すと元の傾きに戻る。節点◇が灯る | `.card:hover .card__index:after`、`.card:hover:after`、`.step:hover .step__index:before`、`.work:hover svg` | hover のみ | `rotate:24deg`（個別プロパティ。既存 `transform:rotate(tilt)` に合成）in .9s / out .5s、`border-color` を `#9adfffb3` へ。`.card:after` ◇ → `background:var(--cyan)` + `0 0 10px #9fe9ff` .3s。`.work svg` は既存 `scale(1.08) rotate(-3deg) .6s` → `scale(1.06) rotate(-2deg)` in .9s / out .5s | 色のみ。rotate / scale はゼロ（`--mv:0`） | **必須**（`li` に hover。タッチで残留させない） | CSS のみ。S1（軌道の定着）が `transform` keyframes を使うのに対し、こちらは `rotate` 個別プロパティなので競合しない | **Should** |
| 5 | **リングの応答と点灯の統一** — ロゴのリングが光を受けてわずかに傾く。すべてのリンクが同じ速度で cyan に点灯する | `.header>.wordmark:after`、`.footer__top`、`.contact__mail` `.footer__mail` `.footer__nav a` `.menu__list a` `.scroll-hint__label` | hover / focus-visible | リング `rotate:6deg`（−28° → −22°）+ `border-color:#9adfffcc` + `0 0 14px #9fe9ff40` .5s。`.footer__top` `translate:0 -3px` + cyan .3s。他は `transition: color, border-color var(--t-ui)` を付けて cyan へ | 色のみ | hover は要。focus-visible は外 | CSS のみ | **Should**（点灯の統一だけなら Must 相当に安い） |

---

## 3. 各案の補足

### 案1 彗星の矢印（Must）

**対象**: `.btn`（hero「相談する」`--signal`、header「相談する」`--outline`、contact「メールで相談する」`--signal --lg`）と `.link-arrow`（hero「実績を見る」、service「相談する」）。

**動きの内容**
- 頭（既存の `:after` チェブロン）: `translate: 4px 0`。`transform:rotate(45deg)` は触らず、個別プロパティ `translate` を重ねる（reduced では `--mv:0` でゼロになる）。
- 尾（未使用の `:before` を新設）: 幅 14px × 高さ 1px、`background:linear-gradient(90deg, transparent, currentColor)`。垂直中央（`top:calc(50% - .5px)`）、右端を矢印ボックスの中心に合わせる（`.btn` は `right:calc(var(--bx) + 4px)`、`.link-arrow` は `right:4px`。矢印は 8px 幅で右端に座るため）。基底 `opacity:0; scale:.3 1; transform-origin:100% 50%` → 反応中 `opacity:.75; scale:1 1; translate:4px 0`。チェブロンの開いた側から軸が伸びるので「→」に近い形になり、左端がフェードするので彗星の尾に見える。
- 数値: in .3s `--ease-out`。out は尾だけ .5s（頭より遅れて消える＝残光）、頭とボタンは .3s。
- ボタン本体: 既存の hover（`translateY(-3px)` + `0 0 35px #9fbbff33`）は維持し、transition を `--t-ui` に揃える。
- 押下（`:active`）: `transform:translateY(-1px) scale(.98)`、`box-shadow:0 0 12px #9fe9ff66`（hover の半径 35px を 12px に絞り、密度を上げる＝光が核に収束）、`transition-duration:.12s`。離すと .3s で hover 状態へ戻る。`.link-arrow:active` は `opacity:.75` のみ。
- `.link-arrow`: `gap` 29→36px の hover 遷移を撤去し（下線の長さも固定になる）、矢印の translate 4px と色 cyan で置き換える。

**reduced-motion**: 尾は opacity のみで点灯（`scale` は遷移なしのため全長で即時表示＝静的な「→」）、頭・ボタンは動かない、押下の縮小なし。glow の変化（box-shadow の一発遷移）は残す。

**focus-visible**: hover と同じ状態（矢印 + 尾 + 浮上）に既存のリングが加わる。**hover:hover**: hover 規則は内、focus-visible / active は外。タッチでは押下の収束だけが出る。

**実装方針（CSS のみ）**
- `.btn{--bx:28px; padding:14px var(--bx)}` とし、横 padding を持つ 8 か所を `--bx` に置換（追加行ではなく置換）: `.btn--outline` 23px、`.btn--lg` 36px、≤1150 `.header__cta` 18px、≤767 `.header__cta` 18px・`.hero__cta .btn` 22px・`.btn--lg` 28px、≤370 `.hero__cta .btn` 19px。
- `.btn:after, .link-arrow:after { transition: translate var(--t-ui) var(--ease-out) }`。`.link-arrow { position:relative }`。
- 工数を絞る場合は `.link-arrow` と `.btn--signal`（hero・contact の 2 か所、`--bx` 3 か所）に限定し、`.btn--outline`（header）は矢印移動のみにしてもよい。

**信頼感を損なわない理由**: 動くのは元からある 8px の矢印だけで、ボタンの輪郭・文字・レイアウトは 1px も変わらない。尾は既存の gap（27〜38px）の中に収まり、色は `currentColor`（テキストと同じコントラスト）。押下は「収束」なので派手にならず、むしろ機構が正確に応答した印象になる。

### 案2 星図が開く（Must — UI Designer 指摘 #6 への対応）

**対象**: `.menu`（オーバーレイ）、`.menu__list li`（6 項目）、`.menu__foot`、`.menu-btn__bar`（2 本）。

**動きの内容**
- オーバーレイ: `.menu{opacity:0; transition:opacity .3s}` → `.menu.is-open{opacity:1; transition-duration:.4s}`。閉じは `.is-open` 除去 → .3s でフェード → header.ts が 450ms 後に `hidden=true`（既存のまま。CSS 側の out は必ず .45s 以下に収める）。
- 項目: `.menu__list li{opacity:0; translate:0 calc(8px * var(--mv,1)); transition:opacity .2s, translate .2s var(--ease-out)}` → `.menu.is-open li{opacity:1; translate:none; transition-duration:.35s; transition-delay:calc(60ms + var(--i,0) * 55ms)}`。`--stagger` 55ms は UI Designer と共有（上限 6 段）。最終項目は開始 335ms、完了 ≈ .7s。閉じるときは遅延 0・.2s で一斉に消える（上から順に消すと「待たされる」）。
- `.menu__foot`: opacity のみ、遅延 .4s。
- `.menu-btn__bar`: `top` は 18px / 27px のまま固定し、`[aria-expanded=true]` で 1 本目 `translate:0 4.5px; rotate:45deg`、2 本目 `translate:0 -4.5px; rotate:-45deg`、`transition:translate .3s, rotate .3s, background .3s`（`--ease-out`）。hover / focus-visible でバーを cyan に。
- `.menu__list a` の hover / focus-visible: `.menu__jp` を cyan に .3s（案5と同じ規則）。
- メタファー: オーバーレイ＝夜空が浮かび、`.menu__en`（cyan の英字＝星名）を持つ行が上から順に灯る。星図を開く所作。

**reduced-motion**: `--mv:0` で translate ゼロ、既存の `transition:none` により即時表示。`hidden` の切替タイミングは変えないので、閉じた瞬間に消える。

**focus / キーボード**: 開いた直後の focus は menu-btn のまま（既存）。項目の opacity は Tab 移動を妨げない（.35s 後に見え始めるが、即 Tab しても outline は出る）。Escape で閉じるときもフェードする。`main[inert]` の付与は既存。

**hover:hover**: 不要（状態駆動）。バーの hover 色だけ hover:hover 内。

**実装方針**
- CSS: 上記 6 規則 + `--i` を `.menu__list li:nth-child(2){--i:1}` … `:nth-child(6){--i:5}`（1 行にまとめる）。マークアップ変更なし。
- **TS 1 行（header.ts `openMenu`）**: `requestAnimationFrame(() => menu.classList.add('is-open'))` を `void menu.offsetWidth; menu.classList.add('is-open');` に置換。`hidden` 解除を確実にスタイル計算させてからクラスを足す（rAF はスタイル再計算より前に走るため、現状ではフェードがスキップされ得る）。将来的には `@starting-style` で CSS だけにできるが、今回は互換性の広い強制リフローを採る。
- `closeMenu` の 450ms `setTimeout` はそのまま（`transitionend` 待ちに変える必要はない）。

**信頼感を損なわない理由**: 現状は「突然現れて突然消える」ので、遷移を足すこと自体が落ち着きになる。移動は 8px・一方向・一度きり、全体 .7s 以内。全画面のフェードは暗い面が濃くなるだけで、D の「画面全体のフラッシュ」には当たらない。`backdrop-filter` は既存で、フェード中の 0.4s だけ再合成が走る（一発なので許容。低速端末で気になる場合は `.is-open` 完了後に blur を付ける）。

### 案3 観測点の点灯（Should）

**対象**: `.nav__list a:after`（現在地◇）、`.indicator button:after`（右端◇）と `.indicator span`（ラベル）。

**動きの内容**
- nav ◇: 現在は `[aria-current]` のときだけ生成されるので出入りが瞬時。**全リンクに常時描画**し、基底 `opacity:0; scale:.5; border:1px solid var(--cyan); background:transparent`（位置・寸法は既存 `bottom:-17px; 4px; left:calc(50% - 2px); rotate 45deg` のまま）。
  - hover / focus-visible: `opacity:.8; scale:1`（輪郭だけの◇＝「候補の星に印」）。
  - `[aria-current]`: `opacity:1; scale:1; background:var(--cyan); box-shadow:0 0 12px #9fe9ff`（既存の見た目＝「観測中の星」）。規則は hover の後に置く（同じ詳細度なので後勝ち）。
  - セクションが変わると、前の◇が .3s で消え、次の◇が .3s で灯る（クロスフェード）。`transition: opacity, scale, background-color, box-shadow` を `--t-ui` `--ease-out`。テキスト色の cyan（既存 .25s）も `--t-ui` に。
- indicator ◇: `transition:all .4s` を `border-color, background, box-shadow, transform` の `--t-ui` に。hover: `border-color:var(--cyan); box-shadow:0 0 8px #7dd5ff80`（点灯）、ラベル `span` は既存の opacity 表示（.2s → `--t-ui`）。押下 `:active:after{transform:rotate(45deg) scale(.8)}` .12s（収束。既存の active 拡大 1.45 はそのまま）。
- メタファー: 星図の観測点。触れると候補に薄く印が付き、いま見ている星だけが灯る。

**reduced-motion**: opacity / 色のみ（scale の変化は遷移なしで即時。`--mv` を掛けて固定してもよい）。

**focus-visible**: nav は hover と同じ輪郭◇ + 既存リング。indicator は `tabindex=-1` かつ `aria-hidden` で focus 対象外 → hover / active のみ。

**hover:hover**: nav・indicator とも ≥1024px のみ表示だが、タッチ対応ノート PC・タブレット横向きがあるので hover 規則は内に置く。

**実装方針（CSS のみ）**: `.nav__list a[aria-current]:after` の既存規則を「`a:after` 基底 + `:hover/:focus-visible` + `[aria-current]`」の 3 規則に分割。JS 変更なし（`setActive` の aria-current 付け外しがそのままトリガー）。

**信頼感を損なわない理由**: ◇はサイト全体で使われている既存の記号で、新しい図形を足さない。ナビの文字も位置も動かず、変わるのは 4px の点の透明度と塗りだけ。現在地の出入りが滑らかになる分、むしろ「機構が追従している」安心感が増す。

### 案4 触れている間だけ軌道が回る（Should）

**対象**: `.card:hover .card__index:after`（数字を囲む楕円）、`.card:hover:after`（右上◇）、`.step:hover .step__index:before`（点線の外輪）、`.work:hover svg`（既存 hover の調整）。

**動きの内容**
- 楕円・点線リング: `rotate: 24deg`（個別プロパティ。`.card__index:after` の既存 `transform:rotate(-30deg / 30deg / -15deg / 40deg)` に合成され、各自の傾きから +24° 回る）。in .9s `--ease-out`、out .5s `--ease-out` で **元の傾きに戻る**。同時に `border-color` を `#9adfffb3`（楕円）/ `#9adfff80`（点線）へ .3s（点灯）。
  - `animation-play-state` で無限回転を止める方式は、離した位置で角度が **残留** して静的デザイン（意図した 4 つの傾き）が崩れる。`animation:none` で止めると離した瞬間に跳ぶ。transition の往復なら常に元の姿勢に戻るので、この方式を採る。
- `.card:after` の◇: `background:#a4bce1` → `var(--cyan)`、`box-shadow:0 0 10px #9fe9ff` .3s（節点が灯る）。既存の `border-color` 遷移は維持。
- `.work svg`: 既存 `scale(1.08) rotate(-3deg)` .6s ease → `scale(1.06) rotate(-2deg)`、in .9s / out .5s `--ease-out`（F の推奨どおり rotate を −2° に。焦点が合う速さに揃える）。
- メタファー: 触れている間だけ軌道が動き、離すと静止軌道に戻る。観測装置に手を触れた反応。

**reduced-motion**: 色のみ。`rotate` / `scale` は `--mv:0` でゼロ（`.work svg` は `transform` を使っているので `scale(calc(1 + var(--on,0)*var(--mv,1)*.06))` のように掛けるか、reduced 内で `transform:none` を明示）。

**focus-visible**: `.card` `.work` `.step` は `li` で focus を持たない → 規則不要（キーボードで失う情報もない）。

**hover:hover**: **必須**。非インタラクティブ要素の hover なので、タッチで残留させない。

**実装方針（CSS のみ）**: `rotate` 個別プロパティ + `transition: rotate .5s var(--ease-out), border-color var(--t-ui)`、hover 側で `transition-duration:.9s`。UI Designer の S1（軌道の定着）は同じ `.card__index:after` に `transform` の keyframes を当てるが、こちらは `rotate` なので合成されるだけで競合しない。P1 は `.step__index:after`（光点）と `.step:after`（線）を使い、こちらは `:before`（点線）なので別要素。

**信頼感を損なわない理由**: 回るのは装飾の線だけで、番号・見出し・本文は動かない。必ず元の角度に戻るので、ページの静止状態はスクリーンショットと同一。回転量 24°・.9s は「気づく人が気づく」範囲。

### 案5 リングの応答と点灯の統一（Should）

**対象**: `.header>.wordmark:after`（ロゴの楕円リング）、`.footer__top`（TOP ↑）、リンク群（`.contact__mail` `.footer__mail` `.footer__nav a` `.menu__list a` `.scroll-hint__label`）。

**動きの内容**
- リング: hover / focus-visible で `rotate:6deg`（既存 `transform:rotate(-28deg)` に合成 → −22°）、`border-color:#b1cfffcc → #9adfffcc`、`box-shadow:0 0 14px #9fe9ff40, inset 0 0 10px #9fe9ff14`。in / out とも .5s `--ease-out`。「SD」の文字は動かない。メタファー: リングが光を受けてわずかに歳差し、離すと戻る。
- `.footer__top`: `translate:0 -3px` + `color:var(--cyan)` .3s（上限 3px の上昇）。
- リンク群: `transition: color var(--t-ui), border-color var(--t-ui)` を付け、hover / focus-visible で cyan に。`.contact__mail` は下線（`border-color`）が現状ぱっと出るので .3s に。`.scroll-hint` は label を cyan に（線のアニメは既存のまま）。
- `.footer` の `.wordmark--sm` はリンクではなく `span`、リングもないので何もしない。

**reduced-motion**: 色のみ（`rotate` / `translate` は `--mv:0`）。

**focus-visible**: すべて hover と同じ + 既存リング。**hover:hover**: hover は内、focus-visible は外。

**実装方針（CSS のみ）**: 4〜5 規則。リングは `.header>.wordmark:after{transition: rotate .5s var(--ease-out), border-color .5s, box-shadow .5s}`。

**信頼感を損なわない理由**: 新しい図形を描かない。全リンクの点灯速度が .3s で揃うこと自体が「精密な機構」の印象を作る。唯一の移動はロゴの装飾リングの 6°（端で約 4px）で、必ず戻る。

---

## 4. 今回はやらない案（理由付き）

| 案 | やらない理由 |
|---|---|
| マグネティックボタン（カーソルに吸い付いて追従） | pointer 追従の JS と連続 transform が必要で、F の「hover 移動 3px 以内」を超える。D の「カーソル追従」に該当。コーポレートでは「操作していないのに動く」と感じられやすい |
| クリック時のリップル／粒子 | D で明示的に禁止（クリック時の粒子）。DOM 追加と JS が要る。案1の「押下で光が収束」が同じ役割（押せた確認）を CSS だけで果たす |
| カーソル追従の彗星・カスタムカーソル | D で禁止。ネイティブカーソルの意味（リンク・テキスト）を壊し、`pointer:fine` 限定でも実装量が大きい |
| nav ◇ のスライド移動（共有マーカーが横に滑る） | 共有要素 1 個 + 位置計測（resize・フォント読込後の再計測）で TS 15〜20 行。F の「移動より点灯」に従い、案3のクロスフェードで十分 |
| ロゴのリング上を衛星が一周（`offset-path`） | path 座標がロゴの実幅（43px / 36px、letter-spacing −.09em）に依存し壊れやすい。UI Designer A1 の JS ヘルパー流用は TS 予算を超える。リングの 6° 応答（案5）で代替 |
| ボタンのシャイン（光の帯が横切る）、カードの 3D チルト、常時フロート | D の「グラデーションの常時移動」「3D チルト」「常時フロート」に該当。hover 一回でも「テカリ」に見え、信頼感を下げる |

---

## 5. 実装量の見積と落とす順

cosmic.css と同じ圧縮スタイル（1 規則 1 行）で数える。

| 案 | CSS（行） | TS（行） | 備考 |
|---|---|---|---|
| 共通（`--t-ui` `--ease-out` の確認、`--mv` の reduced 1 行） | 2 | 0 | UI Designer 側で定義済みなら 1 |
| 案1 彗星の矢印 | 9 | 0 | `--bx` 8 か所は置換（追加行なし） |
| 案2 星図が開く | 8 | 1 | header.ts の rAF → 強制リフロー |
| 案3 観測点の点灯 | 6 | 0 | 既存 `[aria-current]:after` の分割を含む |
| 案4 軌道が回る | 5 | 0 | 既存 `.work:hover svg` の書き換えを含む |
| 案5 リングと点灯の統一 | 5 | 0 | |
| **合計** | **≈ 35** | **1** | 上限 CSS 40 / TS 40 の内側 |

CSS が上限に触れる場合は **案5 のリング傾き → 案4 の `.step` 点線リング → 案3 の indicator 押下** の順に落とす。Must 2 案（案1・案2）は必ず残す。

---

## 6. 受け入れチェック

- reduced-motion で撮ったスクリーンショットが現行 shots/ と一致する（案3の nav ◇は非 current で opacity 0、案1の尾は opacity 0、メニューは `hidden` のまま → 差分ゼロ）。
- hover / focus-visible / active でレイアウト系プロパティ（gap・padding・width・top・font-size）が一切動かない（`.link-arrow` の gap 遷移撤去、`.menu-btn__bar` の `top` 固定を含む）。
- キーボードで hero CTA → link-arrow → nav → menu-btn と Tab したとき、hover と同じ点灯 + フォーカスリングが出る。
- タッチ端末（DevTools のモバイルエミュレーション）で、タップ後に浮上・尾・回転が残留しない。押下時に光の収束だけが出る。
- モバイルメニュー: 開く .4s フェード + 上から順に点灯、Escape・リンク選択・閉じるボタンで .3s フェードアウト、450ms 後に `hidden`。開くときにフェードがスキップされないこと（TS 1 行の効果）。
- 連続アニメなし: 追加した動きはすべて hover / 状態変化に対する一発の transition。`animation` は使わない。
- box-shadow / filter の変化はすべて一発遷移（glow の点灯・収束のみ）。

---

## 7. UI Designer との接続（競合しない根拠）

| 接点 | UI Designer | Whimsy | 競合 |
|---|---|---|---|
| トークン | `--t-ui` .3s、`--ease-out`、`--stagger` 55ms を A 節で定義 | 同じ名前を参照。未定義なら Whimsy 側で `:root` に補う | なし |
| `.card__index:after` | S1: `.card.is-visible` で `transform` の keyframes（軌道の定着） | 案4: `rotate` 個別プロパティの transition | 別プロパティで合成される |
| `.step__index` | P1: `:after`（光点）と `.step:after`（線）を keyframes で | 案4: `:before`（点線リング）の `rotate` | 別擬似要素 |
| `.card` `.step` `.work` | `.is-visible` の `appear`（要素本体の transform） | 擬似要素・子 svg のみ。要素本体の transform には触れない | なし |
| `.btn` `.link-arrow` `.nav` `.menu` `.indicator` `.footer__top` `.wordmark` | 対象外（F で Whimsy に委譲） | 本書の担当 | なし |
| reduced-motion | `html.motion` ゲート + 既存 `transition:none` 一括 | `--mv:0` を追加（移動系のみゼロ）。`html.motion` は参照しない | なし |
