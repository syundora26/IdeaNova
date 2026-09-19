> 履歴資料。現行仕様は [REFERENCE_MATCH.md](REFERENCE_MATCH.md)、現行検証は [REFERENCE_MATCH_VALIDATION.md](REFERENCE_MATCH_VALIDATION.md) です。

# IdeaNova 新しい参考デザインのUI仕様

2026-09-12。対象は企業トップと企業共通ヘッダー・フッターです。参考はユーザー提供のIMG_7664.jpg。原本は `docs/reference/botanical-design.jpg` に保管し、画面からは読み込みません。

## 構成と表現

トップは「FV → 化粧品・農作物 → 会社紹介 → 4つの価値観 → お知らせ → フッター」の順です。深緑 #183D2E、生成り #F8F4ED、朱色 #A33F2E、Noto Serif JPを使用します。本文18px、1000px以下17px、補足14px以上。本文領域は最大1440pxを基準に、写真は全幅へ広げています。

- 葉のロゴは独立SVG、IdeaNovaと英文は選択可能な文字です。企業ヘッダーとフッターだけに適用します。
- FVは「美しさが、／未来をつくる。」の2行。「未来」は独立した強調部品です。女性・商品・生成りの曲線・説明・短文・スクロール案内を別々に配置します。
- ヘッダーをResizeObserverで測り、FVの最低高さを100svhから実測値を引いて設定。1000px以下は文字→写真の2段とし、写真は最低260px。長文・低い画面では内容に合わせて伸びます。
- 化粧品は花、農作物は収穫写真を背景にして曲線で接続します。説明と購入ボタンは通常のGrid配置で高さを持ち、画像の切り抜きに含めません。1000px以下は化粧品→農作物の縦配置です。
- 会社紹介には既存の郡山市街地の実写を使用。撮影年と出典を保持しています。
- 価値観は自然・科学・人・未来の4項目。アイコン、番号、文字を分離し、PC4列、1000px以下2列です。
- お知らせ・コラムを既存の2回の取得処理で読み込み、日付の新しい順に3件表示。日付・タイトル・種別を表示し、元の `/news/:id`・`/journal/:id` へ移動します。両方の取得が完了するまで読込表示、失敗時は再試行、合計0件なら空表示を出します。
- フッターは生成りを基調に、既存の企業・法務リンクと朱色の問い合わせ領域を表示します。未設定のSNS・サイトマップは追加していません。

## 部品一覧

| ファイル | 部品 | 調整する内容 |
|---|---|---|
| CorporateUI.tsx | EditorialHeading / EditorialEmphasis | 見出し階層、小見出し、改行、強調語、文字サイズ、間隔 |
| CorporateUI.tsx | CorporateDescription | 本文、幅、行間、上の余白 |
| CorporateUI.tsx | CorporateAction | 文言、リンク先、通常／枠線／文字リンク、色、矢印 |
| CorporateUI.tsx | CorporateBrand / CorporateNavItem | 葉と文字のロゴ、ナビ項目、現在地 |
| CorporateUI.tsx | CorporateValue | 価値観の番号・名称・アイコン |
| CorporateUI.tsx | CorporateNewsRow / ArticleState | 日付・タイトル・種別・元の詳細先、読込／空／失敗／再試行 |
| CorporateMedia.tsx | CorporatePhoto | 写真URL、代替テキスト、比率、表示位置、曲線、cover／contain |
| CorporateMedia.tsx | HeroPhotographs | 女性と透過商品の配置、SVGの明るい曲線 |
| CorporateMedia.tsx | LeafMark / BotanicalDecoration | 葉のロゴ、独立した透過植物装飾。装飾だけを専用領域に収める |
| ReferenceHome.tsx | ReferenceHome / ReferenceFooter | 部品の配置、既存記事の受け渡し、企業フッター |

旧トップ用のカテゴリー・コラム部品と下層ページ用部品は互換性のため保持しています。ブラウザー上に編集画面・検証スイッチは追加していません。

## 素材一覧

| 素材 | ファイル | サイズ | 使い方 |
|---|---|---:|---|
| 木漏れ日の成人女性 | public/images/botanical-woman.png | 1536×1024 | FV背景 |
| 化粧品・石・白い花 | public/images/botanical-products.png | 1536×1024 | 透過PNGとしてFVに重ねる |
| 花の接写 | public/images/botanical-flower.png | 1536×1024 | 化粧品事業の背景 |
| 野菜を抱える収穫風景 | public/images/botanical-harvest.png | 1536×1024 | 農作物事業の背景 |
| 葉と白い花の枝 | public/images/botanical-decoration.png | 1024×1536 | 透過PNGの装飾 |
| 郡山市街地の実写 | public/images/koriyama.webp | 既存 | 会社紹介。小サイズ画像・出典を継続 |

新しい5素材は2026-09-11にOpenAIの画像生成で作成。文字・ロゴ・ボタンは含めていません。透過2素材は実際のアルファチャンネルを検査しています。生成元の画像は元の保存場所にも保持し、配信用コピーをプロジェクト内に配置しました。ハッシュと詳細は `qa/botanical-ui/assets.json` に記録しています。

生成写真はイメージであり、正式商品や実際の事業活動を撮影した写真ではありません。郡山の生成風景は使用していません。未確認の製法・効能、参考画像内の架空の記事・日付・商品情報は転記していません。

## 接続と動作

化粧品へのリンクは既存ルーターと設定を経由して5179の独立サイトへ同じタブで移動します。農作物は `/shop/agriculture`。企業メニューに両方の入口があり、会社紹介・コラム・問い合わせ・法務も既存URLです。

PCにも開閉メニューを置き、1200px以下では常時表示の企業ナビを畳みます。600px以下では化粧品ヘッダーボタンをメニュー内にまとめます。Tab・Enter・Escape、メニューを閉じた際のフォーカス復帰、現在地表示を継続します。

初回の0.6秒フェード以外の連続演出はありません。動きを減らす設定では停止します。写真上の本文は明暗を調整した領域に置き、写真内の文字として焼き込んでいません。

公開API、会員・カート・注文の型、認証・保存方式は変更していません。両ショップと管理画面のデザインは継続します。本番公開・DNS設定・決済接続は対象外です。
