> 前版の履歴です。現行版は [REFERENCE_POLISH.md](REFERENCE_POLISH.md) と [REFERENCE_POLISH_VALIDATION.md](REFERENCE_POLISH_VALIDATION.md) を参照。

# IMG_7664.jpgに合わせた企業トップ — 2026-09-12

対象は企業トップ・企業共通ヘッダー・フッター。比較基準は `docs/reference/botanical-design.jpg`（提供されたIMG_7664.jpg、1024×1536）のみです。企業サイト http://127.0.0.1:5177/ 、化粧品サイト http://127.0.0.1:5179/ 。本番公開は行っていません。

## 配置

画面高に合わせる指定を撤去し、1024px基準の座標を画面幅に合わせて拡大します。1000px以下では文章→写真、化粧品→農作物の順に組み替えます。見出し・文章・ボタンは文書の流れに置き、文字量が増えると高さが伸びます。写真と曲線・装飾は専用の領域内で重ねます。

- FV：大きな「美」、朱色の「未来」、2行の主見出し、中央揃えの説明。左の生成りの曲線・深緑の帯、右の女性、手前の商品と花・岩を個別配置。
- 2事業：花びらと収穫写真をSVGの曲線で接続。化粧品と農作物の既存リンクを維持。
- 会社紹介：参考風景から再構成したイメージ写真。「街並みはイメージです」と表示。実写の郡山写真のクレジットはこの素材に付けません。他ページの実写と出典はそのままです。
- 価値観：4個の独立したアイコン・番号・見出し。
- お知らせ：公開データのニュース・コラムを日付順で最新3件。架空の日付・記事は使用しません。
- フッター：葉のブランド、既存ナビ・法務リンク、右端まで広がる非対称の朱色のお問い合わせ領域。未設定SNSは追加していません。

## 調整する部品

| 部品／ファイル | 調整対象 |
|---|---|
| `EditorialHeading`, `EditorialEmphasis` / CorporateUI.tsx | 見出し・小見出し・強調色・大きさ・間隔 |
| `CorporateDescription` / CorporateUI.tsx | 文章・幅・行間 |
| `CorporateAction` / CorporateUI.tsx | ボタン文言・リンク先・色・枠線・矢印・フォーカス |
| `CorporateBrand`, `CorporateNavItem` / CorporateUI.tsx | ロゴ文字・ナビゲーションと現在地 |
| `CorporateValue`, `CorporateNewsRow`, `ArticleState` / CorporateUI.tsx | 価値観・日付付き記事・読込／空／失敗／再試行 |
| `CorporatePhoto` / CorporateMedia.tsx | src・代替テキスト・比率・位置・切り抜く曲線 |
| `HeroPhotographs` / CorporateMedia.tsx | 女性・商品・生成りと緑の曲線 |
| `LeafMark`, `BotanicalDecoration` / CorporateMedia.tsx | ロゴのSVG形状・独立した植物素材 |
| `ReferenceHome.tsx` | 順序・文章・部品へのデータ受け渡し |
| `reference.css` | 企業側だけの配置とレスポンシブ指定 |

見出し・説明・写真・操作を個別に変更する実部品テストを用意しています。画面を編集する機能は追加していません。提供画像をページの背景・スプライトとして表示していません。

## 素材・書体

`public/images/reference-{woman,products,flower,harvest,city,leaves}.png` の6点。生成ツールの編集機能で提供画像を参照し、不要な文字やUIを除き、隠れた部分を補完しました。商品と植物は実際のアルファチャンネルを持つ透過PNGです。補完写真であるため、人物の輪郭・花や野菜の細部・商品下の岩は元画像との画素一致ではありません。

書体はNoto Serif JP、補助的な既存Noto Sans JP、筆記体はMrs Saint Delafield。筆記体は手書きそのもののトレースではなく近似です。[Fontsource](https://fontsource.org/fonts/mrs-saint-delafield)からローカルに同梱し、OFLライセンスを `licenses/MrsSaintDelafield-OFL.txt` に保存しています。外部フォントへの実行時接続はありません。

生成の元画像・プロンプトと出力名は [REFERENCE_ASSETS.md](REFERENCE_ASSETS.md)、検証・差分は [REFERENCE_MATCH_VALIDATION.md](REFERENCE_MATCH_VALIDATION.md) を参照してください。

## 継続する機能

ShopGateway・公開API・認証・カート・注文・保存方式には変更がありません。化粧品は同じタブで独立サイトへ、農作物は企業側ショップへ移動します。会社情報・商品情報の確認中表記、デモ認証・決済・送信、本番接続設計は維持します。
