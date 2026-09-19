import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
const source = (name: string) => fileURLToPath(new URL('./src/share/' + name, import.meta.url));
export default defineConfig(({ mode }) => {
  const cosmetics = mode === 'share-cosmetics';
  if (!['share-corporate', 'share-cosmetics'].includes(mode)) throw new Error('共有用のビルドモードを指定してください。');
  return {
    base: './',
    plugins: [{
      name: 'portable-design-preview', enforce: 'pre',
      transform(code, id) {
        const path = id.replaceAll('\\', '/');
        if (!path.includes('/src/') || !/\.[jt]sx?$/.test(path)) return;
        let next = code.replaceAll('/images/', './images/');
        if (path.endsWith('/src/App.tsx')) next = next.replace("window.history.replaceState({}, '', normalized)", "window.history.replaceState({}, '', '#' + normalized)");
        if (path.endsWith('/src/MemberPages.tsx')) next = next.replace('ローカル共通サービスへ送信し、照合用の値を保持します。', '公開確認版では入力内容を送信・保存しません。').replace('確認用アカウント：demo@example.invalid<br />パスワード：demo-password', '公開確認版ではログイン・会員登録はできません。');
        return next === code ? null : { code: next, map: null };
      },
      transformIndexHtml(html) {
        return html.replace('</head>', '<meta name="referrer" content="no-referrer"/><meta http-equiv="Content-Security-Policy" content="connect-src &#39;none&#39;; form-action &#39;none&#39;; object-src &#39;none&#39;; base-uri &#39;self&#39;"/></head>');
      },
    }, react()],
    resolve: { alias: [
      { find: './router', replacement: source('router.tsx') },
      { find: './site', replacement: source('site.ts') },
      { find: './httpGateway', replacement: source('gateway.ts') },
      { find: './MemberPages', replacement: source('Forms.tsx') },
      { find: './AdminPages', replacement: source('AdminPages.tsx') },
      { find: './InquiryPage', replacement: source('Forms.tsx') },
    ] },
    define: { 'import.meta.env.VITE_SITE': JSON.stringify(cosmetics ? 'cosmetics' : 'corporate'), 'import.meta.env.VITE_DEMO': JSON.stringify('false') },
    build: { target: 'es2022', outDir: cosmetics ? 'dist/share/cosmetics' : 'dist/share', emptyOutDir: true },
  };
});
