import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command, mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env };
  const cosmetics = mode.includes('cosmetics') ? true : mode.includes('corporate') ? false : env.VITE_SITE === 'cosmetics';
  const previewBuild = mode.startsWith('preview-');
  const urls = { corporate: env.VITE_CORPORATE_ORIGIN || 'http://127.0.0.1:5177', cosmetics: env.VITE_COSMETICS_ORIGIN || 'http://127.0.0.1:5179' };
  if (command === 'build' && !previewBuild) {
    for (const [key, value] of Object.entries(urls)) {
      const parsed = new URL(value);
      if (!env[`VITE_${key.toUpperCase()}_ORIGIN`] || parsed.protocol !== 'https:' || /localhost|^[0-9.]+$|^\[|\.(invalid|example|test|local)$|example\.(com|org|net)$/.test(parsed.hostname) || parsed.pathname !== '/' || parsed.search || parsed.hash || parsed.username || parsed.password) throw new Error(`正式な VITE_${key.toUpperCase()}_ORIGIN が必要です。ローカル確認は build:preview を使用してください。`);
    }
    if (new URL(urls.corporate).hostname === new URL(urls.cosmetics).hostname) throw new Error('企業サイトと化粧品サイトは異なるオリジンを設定してください。');
  }
  const site = cosmetics ? 'cosmetics' : 'corporate';
  const proxy = { '/demo-api': { target: 'http://127.0.0.1:5180', changeOrigin: false, rewrite: (path: string) => path.replace(/^\/demo-api/, ''), headers: { 'x-ideanova-site': site } } };
  return { plugins: [react()], define: { 'import.meta.env.VITE_SITE': JSON.stringify(site), 'import.meta.env.VITE_CORPORATE_ORIGIN': JSON.stringify(urls.corporate), 'import.meta.env.VITE_COSMETICS_ORIGIN': JSON.stringify(urls.cosmetics), 'import.meta.env.VITE_DEMO': JSON.stringify(command === 'serve' || previewBuild ? 'true' : 'false') }, server: { host: '127.0.0.1', port: cosmetics ? 5179 : 5177, strictPort: true, proxy }, preview: { host: '127.0.0.1', port: cosmetics ? 5179 : 5177, strictPort: true, proxy }, build: { target: 'es2022', outDir: 'dist/' + site } };
});
