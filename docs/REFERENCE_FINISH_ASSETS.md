> 前版の履歴です。現行の岩肌補修・曲線・余白・検証は [SEAM_REPAIR.md](SEAM_REPAIR.md) を参照してください。

# 現行素材一覧

参考：ユーザー提供 IMG_7664.jpg。現行素材の寸法・形式・SHA-256は qa/reference-finish/assets.json。素材はすべてイメージであり、正式商品や実在の地域写真であると断定しません。

| 素材 | 現行ファイル | 処理 |
|---|---|---|
| 女性と木漏れ日 | public/images/reference-woman.png | 継続。位置・彩度を調整 |
| 商品・花・石台 | public/images/reference-products.png | 継続。実アルファ。拡大し、下端をフェード。別石台の継ぎ足しは撤去 |
| 花びらと水滴 | public/images/reference-flower-finish.png | 参考から補修した新規写真 |
| 収穫する手と野菜 | public/images/reference-harvest.png | 継続。独立写真の切り抜き |
| 山と街並み | public/images/reference-city.png | 継続。「街並みはイメージです」を保持 |
| 中央の葉 | public/images/reference-leaves.png | 継続。透過装飾 |
| 画面端の植物 | public/images/reference-botanical-edge.png | 参考から補修。白背景をmultiplyで合成 |

新しいデザイン画像をそのままページとして表示していません。文字、ボタン、ロゴ、曲線、筆記体はHTML/SVG/CSSです。

## 新規素材の生成記録

画像編集用の組み込みツールを使用。新しい情景を提案する生成ではなく、提供画像を入力にした部分補修です。

### 花びら

採用出力：exec-b91bd9f1-ae1e-47f9-ba3c-51d72002e670.png。

指示：参考の化粧品部分（x0..620,y490..803）の丸い淡い桃色の花びら、細かい水滴、光と質感を独立した1536×1024写真として復元。左に淡い余白を確保。文字・ロゴ・ボタン・曲線・商品・女性・農作物を除去。新しい花や色へ変更しない。

### 画面端の植物

採用出力：exec-bdd0a9ed-ec1c-4cd5-92fc-e873406c4fdb.png。

指示：会社紹介・価値観左端の葉を独立した1024×1536素材として復元。大きめの淡いセージ色の葉、細い枝、下部の白い花。右側を白い余白にし、文字・風景・UI・チェック柄を含めない。

### 不採用の出力

商品と石台の補修を2回試行しましたが、出力がRGBで背景にチェック柄を含んでいたため不採用。これらは公開素材・ソースZIPへ含めません。既存の透過商品素材を継続しています。reference-stone-extension.png は履歴として存在しますが現行画面では使用していません。
