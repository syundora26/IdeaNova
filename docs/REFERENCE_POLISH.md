# IdeaNova 参考画像のずれ修正版 — 2026-09-12

基準は `docs/reference/botanical-design.jpg`（提供されたIMG_7664.jpg）。新しいデザイン案には変更していません。

## プレビューと比較

- 企業・農作物：http://127.0.0.1:5177/
- 化粧品：http://127.0.0.1:5179/
- [参考・修正前・修正後と被写体の目印](../qa/reference-polish/comparison/review.html)
- [6セクションの大きな比較](../qa/reference-polish/comparison/index.html)
- [PC 1920px](../qa/reference-polish/after/1920x1080-home.png) / [PC 1024px](../qa/reference-polish/after/1024x900-home.png)
- [スマートフォン390px](../qa/reference-polish/after/390x844-home.png) / [320px](../qa/reference-polish/after/320x740-home.png)

## 修正内容

- 企業トップだけ `--unit: .09765625vw` とし、1024pxの座標を全幅へ均一に拡大。1440pxで高さだけが止まる不整合を修正しました。画面高への引き伸ばしはありません。
- 会社紹介の写真領域と価値観の配置を全幅に統一。本文の読み幅制限は文章側に残しました。
- 事業写真を一つのSVG座標系で描画。切り抜きと白線は `businessCurves` の同じ曲線を使用します。接続部分の逆向きの曲線は数値を再記入せず計算して作ります。
- 花びらの曲線が画像上端を超えて平らに切れる問題を解消。農作物の下側も画像範囲を超えないよう修正しました。
- 石台の下部に独立した写真補完素材を追加。既存商品の下端をなじませ、中央の深緑の三角形と直線的な途切れを除きました。商品容器は既存の透過素材を保持しています。
- 女性の写真は縦横同率で4%縮小し位置を調整。商品の目印・見出し・会社紹介の位置は1024pxで比較しています。
- 「本文へ移動」は通常隠し、キーボードのフォーカス時だけ表示。Enterで本文へフォーカスし、案内を再び隠します。

## 部品と変更箇所

| ファイル・部品 | 調整対象 |
|---|---|
| `src/ReferenceHome.tsx` | 独立したUIの配置と記事データの受け渡し |
| `CorporateMedia.tsx` / `CorporatePhoto` | 画像URL、表示位置、比率、切り抜き、説明 |
| `CorporateMedia.tsx` / `HeroPhotographs` | 女性・商品・石台補完・生成りの曲線を別々に配置 |
| `CorporateMedia.tsx` / `BusinessPhotographs` | 花と収穫の画像URL・表示位置、共通の切り抜きと境界線 |
| `CorporateMedia.tsx` / `businessCurves` | 花の上端、事業同士の接続、収穫の上端・下端の座標 |
| `CorporateUI.tsx`（継続） | 見出し・説明・操作・記事・ロゴ・価値観 |
| `src/reference.css` | 企業に限定した幅別の配置、色、書体、フォーカス |

写真・文言・ボタンは個別のUIです。提供画像をページ背景として表示したり、画面上の編集機能を追加したりしていません。商品・会員・カート・注文・記事・ショップ移動の接続は既存のままです。

## 素材一覧

既存6点は [REFERENCE_ASSETS.md](REFERENCE_ASSETS.md) に記録。今回追加した1点は以下です。

- `public/images/reference-stone-extension.png`：石台の下部の補完用。1536×1024px、PNG、生成イメージ。
- 生成元：既存の `reference-products.png` の岩の色・質感・光を参照。商品画像自体は変更していません。
- 使用ツール：内蔵imagegen。生成ID：`exec-1556fb87-e320-4540-9ba0-98e6b3a64f64`。
- 透過拡張を試した2点は背景にチェッカー模様が残ったため不採用。サイト・納品ZIPでは使用しません。
- 全7素材の寸法・ハッシュ：[assets.json](../qa/reference-polish/assets.json)。

### 採用素材の生成プロンプト

```text
Generate ONE photographic MATERIAL INSERT for the supplied product photograph: a close-up of the exact same warm gray, rough, porous granite pedestal rock, with a little natural moss and a few green leaves at the left/right edges. Entire rectangular landscape canvas must be filled with naturally continuous stone surface, especially center and bottom. This image will extend the existing pedestal below its cut edge. Match original rock texture, afternoon warm sunlight from upper left, and scale of small granite pores. No containers, no bottles, no jars, no flowers, no text, no checkerboard, no transparency, no slab underside, no visible outer boundaries of the stone. Full-bleed macro photograph of stone and subtle edge foliage, not a website and not a new scene. Preserve the reference stone's natural neutral warm grey hue.
```

街並みは引き続き「街並みはイメージです」と表記。正式な会社情報・商品・条件の確認中表示も残しています。

## 検証

詳細は [REFERENCE_POLISH_VALIDATION.md](REFERENCE_POLISH_VALIDATION.md)。旧REFERENCE_MATCH版の記録は履歴であり、この修正版の合否には流用していません。
