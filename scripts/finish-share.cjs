const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve('dist/share');
for(const site of ['', 'cosmetics']) {
 const folder=path.join(root,site);if(!fs.existsSync(path.join(folder,'index.html')))throw new Error('Missing share build');
 fs.writeFileSync(path.join(folder,'.nojekyll'),'');
}
console.log('共有用distを作成しました: dist/share');
