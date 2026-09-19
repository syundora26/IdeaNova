# FV人物なし版 — 2026-09-16

## 変更
- FV人物写真を木漏れ日・葉の背景へ差し替え。商品・花・曲線・コピー・導線は維持。
- 右端の背景の明度を調整し、縦書きの白文字を維持。
- 元の人物素材は保存。企業トップの画像参照のみ変更。公開サイトへの反映は実施していない。

## 素材
- 編集元: public/images/reference-woman.png
- 採用: public/images/hero-botanical-person-free.png
- 生成方法: built-in image_gen（既存画像編集）
- プロンプト: Edit target: the attached existing website background photograph. Remove the woman completely: no face, hair, skin, clothing, silhouette, hands or people. Inpaint her entire area as a continuous beautiful sunlit botanical garden, matching the existing left-side shallow depth of field, warm ivory highlights and natural muted green palette. Keep the existing background atmosphere, camera perspective, soft upper-left sunlight, and wide 3:2 composition. On the right have a graceful soft-focus branch with olive-green leaves, with medium/dark forest green bokeh behind it suitable for white vertical text overlay. Centre should be soft unobtrusive garden bokeh, leaving room for a separately composited product layer in the lower centre. Photorealistic luxury Japanese skincare botanical backdrop, restrained and natural, not a dense jungle. Background photograph only, no products, no text, no letters, no logo, no border, no watermark. Fill the entire image opaquely. Change only the removed-person area and blend its edges seamlessly; preserve the surrounding garden's look.

## 検証
- 1920・1440・1024・768・390・320px: 写真読込成功、横はみ出しなし。
- PCとスマートフォンの写真を目視確認。FVの人物なし、商品・花・木漏れ日を確認。
- 人物写真への通信なし。
- 化粧品への同一タブ移動・戻る・農作物・問い合わせ・モバイルメニュー/Escape: 成功。
- JavaScriptエラー0。
- TypeScript、企業・化粧品プレビュービルド: 成功。
- 既存ユニットテスト53件: 成功。
- 詳細: qa/person-free/results.json、unit-tests.log、before-1440.png、after-*.png。

ローカル: http://127.0.0.1:5177/
