# 現行トップの素材

現在の企業トップは `public/images/reference-*.png` の既存6点と、石台の接続補完 `reference-stone-extension.png` の計7点を使用します。提供IMG_7664.jpgから再構成したイメージ素材です。商品・植物は透過PNG、街並みは生成イメージとして注記。素材・プロンプト・書体の詳細は [docs/REFERENCE_ASSETS.md](docs/REFERENCE_ASSETS.md) を参照してください。今回の補完素材は [docs/REFERENCE_POLISH.md](docs/REFERENCE_POLISH.md) を参照してください。以下は旧素材と、他ページで引き続き使用する素材の履歴です。

現在の企業トップに追加した5素材は [docs/BOTANICAL_UI.md](docs/BOTANICAL_UI.md) を参照してください。以下の既存素材・出典・ライセンスも継続します。

# 現行企業UIの素材（2026-09-11）

現行トップは `public/images/ui-cosmetics.png`、`ui-tomatoes.png`、`ui-basket.png`、`ui-fruit.png`、`ui-meal.png`、`ui-towels.png` の6点を使用。各1536×1024px、imagegenで個別生成した写真イメージで、文字・ロゴ・UIを含みません。用途は [docs/INDEPENDENT_UI.md](docs/INDEPENDENT_UI.md)、サイズ・SHA256は `qa/independent-ui/assets.json` に記載しています。

街並みは以下の郡山写真を使用。参考デザインPNGは `docs/reference/provided-design.png` へ移動し、publicと両サイトのビルドから除外しました。末尾の切り抜き方式の記載は前版の履歴です。

# Image assets

## 郡山写真（今回のリデザインで追加）

- 配信ファイル：`public/images/koriyama.webp`（最大1800px）、`koriyama-small.webp`（最大900px）
- 原画像：`public/images/koriyama-original.jpg`
- 作品名：郡山市中心市街地
- 作者：藍原あおい
- 撮影日：2015年5月30日、ビッグアイ展望ロビーからの眺望
- 出典：[Wikimedia Commons](https://commons.wikimedia.org/wiki/File:%E9%83%A1%E5%B1%B1%E5%B8%82%E4%B8%AD%E5%BF%83%E5%B8%82%E8%A1%97%E5%9C%B0.JPG)
- ライセンス：[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/deed.ja)
- 加工：サイズ縮小、WebP変換。画面比率に応じた表示トリミング。加工後の写真も同じライセンスで提供します。この写真のライセンスがサイトの全ソースへ一律に及ぶという意味ではありません。
- 表示：企業トップ・会社案内・記事の仮写真。撮影年を画面に明示し、現在の景観、会社の建物、自治体等の推奨を示すものとはしません。

従来の抽象的な `hero.webp` は新企業トップには使用していません。下記の生成化粧品・農作物イメージは、事業紹介とショップのデモ素材として継続使用しています。

生成方法：組み込み `image_gen` ツール。プロジェクトへコピー後、WebP品質88で配信用に変換。元画像は生成先に保持。

## public/images/hero.webp

専用ブランドイメージ。実在商品を表すものではありません。

Prompt: Create an exquisite photorealistic editorial still-life photograph for the Japanese IdeaNova corporate website, a company spanning cosmetics and seasonal agriculture. Horizontal 3:2 crop, high resolution. An art directed sculpture arrangement on pale cool limestone: one large optically clear imperfect glass sphere and one frosted pale sage glass rounded vessel, a small roughly cut light beige stone plinth, a single delicate fresh olive branch emerging from behind the stone and crossing the upper right. Fine water caustics and soft afternoon sun casting diagonal botanical shadows on a very pale gray ivory seamless wall, restrained deep forest green leaf accents, tactile stone surface. Composition feels like a luxury Japanese design magazine photographed by a world-class still-life photographer, asymmetrical, quiet, real physical material, almost monochrome. Objects occupy center and right, visually strong circular glass form in center. No bottles with labels, no text, no logo, no people, no UI, no frame, no gradients as digital effects. This is an abstract brand mood image, not a real product photograph.

## public/images/cosmetics.webp

架空容器を用いたコスメ事業のイメージ。商品写真は正式素材に要差し替え。

Prompt: Photorealistic luxury skincare editorial still life for a refined Japanese online shop design prototype. Horizontal 3:2 composition. Three unbranded skincare vessels: tall frosted glass cylindrical toner bottle with matte ivory lid, a smaller pale sage frosted serum pump bottle, and a low white cream jar. Absolutely no text or logos anywhere. On a pale pink limestone slab with one folded off-white linen cloth. Soft botanical shadow cast diagonally from upper left, warm muted rose wall, a restrained deep burgundy curved translucent glass prop behind products. Perfect tactile art direction, beautiful real material imperfections, subdued daylight, clean premium photography, asymmetrically placed objects, plenty of breathing room. Not a mockup of a website, no UI. Fictional products for design demonstration.

## public/images/agriculture.webp

季節の農作物を表すイメージ。実際の販売品目や産地を示すものではありません。

Prompt: World-class food editorial photograph for Japanese seasonal produce webshop. Landscape 3:2 image. Rustic dark oak table with an open shallow woven basket containing beautiful Japanese autumn vegetables, delicate long carrots with fresh green tops, one small green kabocha squash, small purple sweet potatoes, shiny eggplant, and pale pears arranged loosely on folded natural flax cloth. A few drops of water on the vegetables. Moody soft natural daylight from the left, deep forest-green shadows in background, extremely tactile, organic, simple and sophisticated art direction, close focus, real irregular vegetables. No person, no text, no labels, no logos, no typography or UI. Not excessive abundance, five types of vegetables in an intentional asymmetric still-life. Design sample mood photography, not a claim of actual product.

## 前版のユーザー提供デザイン（履歴）

`public/images/reference-design.png` はユーザー提供PNG（793×1983px）の変更していないコピーです。トップではSVGの表示範囲と曲線マスクで写真部分を使用します。撮影地・正式商品を証明する素材ではありません。出典は今回ユーザーが提供したデザイン画像です。高解像度の写真素材は未提供です。

Noto Serif JPは `@fontsource/noto-serif-jp` で同梱。SIL Open Font License 1.1。ライセンスのコピーは `licenses/NotoSerifJP-OFL.txt`。
