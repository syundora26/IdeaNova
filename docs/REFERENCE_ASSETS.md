# 参考画像から再構成した素材

全て組み込みの image_gen を使用しました。CLI・外部画像APIは利用していません。参照原本は `C:/Users/panda/Downloads/IMG_7664.jpg`、納品内の参考資料は `docs/reference/botanical-design.jpg`。参考資料は実行時配信から独立しています。

| 素材 | プロジェクト内ファイル | 採用生成出力 |
|---|---|---|
| 女性と木漏れ日 | public/images/reference-woman.png | exec-a0651f65-1b2e-44ac-b064-1c2893d1ab93.png |
| 化粧品・白い花・岩（透過） | public/images/reference-products.png | exec-94e054d5-ae8e-4cdf-bc73-ce179bec6a41.png |
| 花びらの接写 | public/images/reference-flower.png | exec-b0a0837f-ddc0-453c-b7fd-78ddc48f1c21.png |
| 野菜を持つ手 | public/images/reference-harvest.png | exec-9eff14cb-9963-4cf4-b3ef-19a1238e3365.png |
| 山と街並みのイメージ | public/images/reference-city.png | exec-5e76f213-3ce7-43a0-989d-f6565911e5fe.png |
| 植物（透過） | public/images/reference-leaves.png | exec-ccc14336-b419-443f-80c5-127dcf797de4.png |

出力の寸法・SHA-256・透過ピクセルの確認結果は `qa/reference-match/assets.json` に記録しています。生成プレビュー中に発生したチェック柄入りの植物素材は採用していません。

## 採用素材を得たプロンプト

### 女性

Edit the supplied design to recover ONLY its TOP HERO PHOTOGRAPH, as a clean full rectangular landscape photo 1536x1024. Preserve exactly the young woman's identity, upward-left tilted face, closed eyes, loose dark hair, warm sun stripes, facial scale and position from the reference. Reference hero spans x0..1024 y0..700. Keep woman's head at right, forest bokeh left. Remove ALL text, logo, UI, cream curved overlays, foreground cosmetics and flowers/stone, lower flower/vegetable sections. Inpaint these areas with the same sunlit green woodland and pale bokeh. Face should occupy right half, crown touching upper edge, chin around 40% height. This is photo extraction/restoration, not a new creative direction. No borders or text.

### 商品・花・岩

Extract and faithfully restore the central THREE COSMETIC PRODUCTS PLUS THEIR WHITE FLOWERS AND ROUGH STONE from the supplied image x270..800 y310..700. Output an isolated foreground arrangement on TRUE TRANSPARENT background, landscape 1536x1024, tightly framed. Tall ivory cylindrical lotion bottle left with metallic gold cap; short wide cream jar front-center with gold lid; ivory tube right with small gold base. Preserve exact relative sizes and positions and reference lighting. White blossoms with green leaves behind and left of bottle, rough gray stone beneath. Preserve only small leaf logo and IdeaNova on products, no other text/claims. Remove woman, green scenery, all webpage lettering, curves and button graphics. Complete hidden product/stone edges naturally; no crop cutting objects. This is extraction, not redesign. Real alpha transparency.

### 花びら

Recover only the closeup peach pink flower petal PHOTO in left business area x0..620 y500..803 of supplied image. Rectangular landscape 1536x1024 independent photograph. Preserve broad translucent pale peach petals, dewdrops, pink textured folds, softness and warm light. Petals at right and lower center, soft ivory pink negative area at left. Do not replace with a centered whole flower. Inpaint all Japanese/English text and button areas, eliminate webpage curves, woman, products, vegetables and scenery. No text or interface. Fidelity to this exact macro photograph.

### 収穫

Recover only the vegetable harvest PHOTO in right business area x500..1024 y490..835 of supplied image as a full rectangular 1536x1024 photograph. Faithfully preserve bare hands supporting a bundle of carrots with abundant leafy tops, tomato and mixed fresh greens at center-left, natural warm woodland lighting and dark green field backdrop at right. Preserve source hand pose, crop size and color; no gloves, baskets or alternate scene. Remove all lettering/buttons/white curved borders, reconstruct occluded parts. Keep rightmost 40% softly dark green out-of-focus photo for white UI text. No typography or UI.

### 山と街並み

Recover the mountain and city landscape photograph from the supplied design at x515..1024 y800..1100. Expand/inpaint to full rectangular landscape 1536x1024. Preserve same composition, mountain profile in distance, pale blue sky with scattered soft clouds, densely built Japanese town in valley, leafy dark green hill foreground. Remove Koriyama script and Japanese writing, no lettering. Remove curved mask/cream areas, reconstruct actual scenery behind them. This is a reference-based scenic illustration, not a verified geographic photo. Preserve the reference perspective/light/colors, don't substitute a different town.

### 植物の再構成と透過化

参照原本から白背景の枝を再構成した出力 `exec-ad3b5232-b9df-4d31-bab8-fdf1961fa7fd.png` を、次の2回目の編集の入力に使用しました。

Extract the pale green leafy decorative sprig from the left edge of this website reference, around the about section. Output only one delicate realistic sage leaf branch with a few white blossoms, full complete stem and all leaves visible. Portrait format. Place on a PERFECTLY PURE SOLID WHITE (#ffffff) background. NO CHECKERBOARD. NO transparency simulation. No paper texture. No text or other background objects. Keep the botanical soft faded green watercolor-photographic appearance from the reference. Small white blossoms near base. The white background will be composited with CSS; pure white required.

Remove the white background from this botanical asset. Output a PNG with genuine alpha transparency: all the white background completely transparent. Preserve the exact plant and flowers, their fine edges, full stem and pale colors. Do not add a checkerboard or any background visualization. This is only a background removal, no redesign. Transparent PNG cutout.
