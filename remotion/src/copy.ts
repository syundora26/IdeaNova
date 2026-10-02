export const COPY = {
  open1: 'テンプレ不使用。',
  open2: '全部、手書きのコード。',
  stack: ['TypeScript', 'React', 'Laravel'],
  stackLead: 'ホームページを、ゼロから組み上げます。',
  scratch: {
    title: 'フルスクラッチ',
    lines: ['必要なものだけで作るから、軽くて速い。', 'デザインに制約がない。'],
    chips: ['軽い', '速い', '制約なし'],
  },
  seo: {
    title: 'SEO',
    lines: [
      ['表示速度、構造化データ、', '検索エンジンが読みやすいページ。'],
      ['見つかるための土台を、', 'コードの段階から作ります。'],
    ],
    speed: '表示速度',
    serpTitle: '株式会社SD｜フルスクラッチのホームページ制作',
    serpCrumb: '株式会社SD › サービス',
    serpDesc: 'テンプレ不使用。TypeScript × React × Laravel で、ゼロから組み上げるホームページ制作。',
  },
  quality: {
    title: 'コード品質',
    line1: '型チェック、自動テスト、公開前のコード監査。',
    line2a: '不具合は「出してから直す」より',
    line2b: '「出さない仕組み」で。',
    line3: '万一のときも、変更履歴からすぐ戻せます。',
    checks: [
      ['型チェック', 'tsc --noEmit'],
      ['自動テスト', 'vitest run'],
      ['コード監査', 'review before release'],
    ],
    revert: '変更履歴から復元',
  },
  three: {
    title: '3Dサイト',
    lines: ['スクロールに合わせて動く立体表現。', 'スマホでも重くしない。'],
  },
  wall: ['設計から、動きまで。', '同じ手で。'],
  cta: {
    line1: 'HP制作のご相談はDMまで。',
    line2a: '「診断」と送ると、',
    line2b: 'いまのHPの改善点を3つお返しします。',
    send: '診断',
    replies: ['改善点 1', '改善点 2', '改善点 3'],
  },
  company: '株式会社SD',
};

export const CODE_LINES = [
  "import { createApp } from './app';",
  'export const Hero: FC<Props> = ({ title, image }) => (',
  '  <section className="hero">',
  '    <h1>{title}</h1>',
  '    <Picture src={image} sizes="100vw" />',
  '  </section>',
  ');',
  'type Page = { slug: string; blocks: Block[] };',
  "Route::get('/api/posts', [PostController::class, 'index']);",
  'const posts = await db.posts.findMany({ where: { published: true } });',
  'export default defineConfig({ build: { target: "es2022" } });',
  'public function index(): JsonResponse { return PostResource::collection($posts); }',
  'const app = createApp({ router, store });',
  'useScroll(({ progress }) => mesh.rotation.y = progress * Math.PI);',
];

export const ALL_TEXT =
  JSON.stringify(COPY) +
  CODE_LINES.join('') +
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÂÉÈ0123456789/×・✓→←①②③';
