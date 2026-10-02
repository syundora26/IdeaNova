# 株式会社SD ショーリール（Remotion）

45 枚のウェブデザインモックアップを使った、60 秒・1920×1080・30fps のモーショングラフィックス動画です。

## コマンド

```sh
npm run video:studio      # ブラウザでプレビュー（Remotion Studio）
npm run video:render      # out/sd-showreel.mp4 を書き出し
npm run video:still -- --frame=600 out/f600.png   # 任意フレームの静止画
npm run video:music       # BGM を再生成（public/audio/track.mp3）
npm run video:typecheck   # remotion/ 配下の型チェック
node remotion/scripts/stills.mjs   # 検証用の静止画をまとめて out/stills/ へ
```

初回の書き出し時に Remotion が Chrome Headless Shell を自動ダウンロードします。
既存のブラウザを使う場合は `REMOTION_BROWSER_EXECUTABLE=/path/to/headless_shell` を設定してください。

## 構成

| パス | 内容 |
|---|---|
| `src/timeline.ts` | 120 BPM＝1 拍 15 フレームのグリッドと、各シーンの開始・終了フレーム |
| `src/copy.ts` | 動画内の全文言。文言の修正はここだけで済みます |
| `src/scenes/` | 10 シーン（コールドオープン → 45 デザイン → 技術スタック → フルスクラッチ → SEO → コード品質 → 3D → ショーケース → CTA → エンドカード） |
| `src/components/` | ページモックアップ、見出しマーカー、コード、HUD、フラッシュなどの共通部品 |
| `public/designs/` | モックアップ 45 点（WebP、SMASK_45_designs 版）と `manifest.json`。番号・業種・ブランド名・寸法を持ち、モンタージュのラベルに使います |
| `public/audio/track.mp3` | `scripts/make-music.mjs` が合成した BGM。外部素材は使っていません |

## エンドカードの差し替え

`src/scenes/EndCard.tsx` は仮のワードマークです。
ロゴ画像を `public/` に置き、`<Img src={staticFile('logo.png')} />` に差し替えてください。
エンドカードは 56〜60 秒（フレーム 1680〜1800）で、56 秒ちょうどに BGM のインパクト音が入ります。

## BGM の構成

`scripts/make-music.mjs` は 2 秒 1 小節で 30 小節を組み立てます。
イントロ（0–4 秒）→ ドロップ（4–32 秒）→ ブレイク（32–36 秒）→ 再加速（36–40 秒）→ クライマックス（40–52 秒）→ 静かな CTA（52–56 秒）→ インパクト（56 秒）。
シーンの切り替えはすべて小節の頭に揃えています。
