const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const checks = [];
const cleanEnv = { ...process.env };
delete cleanEnv.VITE_CORPORATE_ORIGIN; delete cleanEnv.VITE_COSMETICS_ORIGIN;
for (const [name, env] of [
  ['正式URL未設定', {}],
  ['localhostの仮URL', { VITE_CORPORATE_ORIGIN: 'http://127.0.0.1:5177', VITE_COSMETICS_ORIGIN: 'http://127.0.0.1:5179' }],
  ['HTTPSでも予約テストドメイン', { VITE_CORPORATE_ORIGIN: 'https://corporate.test', VITE_COSMETICS_ORIGIN: 'https://cosmetics.test' }],
  ['同じホストの別ポート', { VITE_CORPORATE_ORIGIN: 'https://same-domain.co.jp:443', VITE_COSMETICS_ORIGIN: 'https://same-domain.co.jp:8443' }],
  ['URLに認証情報', { VITE_CORPORATE_ORIGIN: 'https://user:password@corporate.co.jp', VITE_COSMETICS_ORIGIN: 'https://cosmetics.co.jp' }],
]) {
  const r = spawnSync(process.execPath, ['node_modules/vite/bin/vite.js', 'build', '--mode', 'corporate'], { env: { ...cleanEnv, ...env }, encoding: 'utf8', windowsHide: true });
  assert.notEqual(r.status, 0, name); assert.match(r.stderr + r.stdout, /正式な|異なるオリジン/);
  checks.push({ name, blocked: true });
}
for (const site of ['corporate', 'cosmetics']) {
  const r = spawnSync(process.execPath, ['node_modules/vite/bin/vite.js', 'build', '--mode', 'preview-' + site], { env: cleanEnv, encoding: 'utf8', windowsHide: true });
  fs.writeFileSync(`qa/separation/build-${site}.log`, r.stdout + r.stderr);
  assert.equal(r.status, 0, site + ' preview build'); assert(fs.existsSync(`dist/${site}/index.html`));
  checks.push({ name: site + '独立プレビュービルド', pass: true });
}
fs.writeFileSync('qa/separation/build-results.json', JSON.stringify({ checks }, null, 2));
console.log(JSON.stringify({ passed: checks.length }));
