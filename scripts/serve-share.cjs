const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../dist/share');
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.svg':'image/svg+xml','.woff2':'font/woff2','.woff':'font/woff'};
http.createServer((req,res)=>{
 try{const url=new URL(req.url,'http://local');let file=path.resolve(root,'.'+decodeURIComponent(url.pathname));if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(404);return res.end()};if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');if(req.method!=='GET'||!fs.existsSync(file)){res.writeHead(404);return res.end()};res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(res)}catch{res.writeHead(400);res.end()}
}).listen(5183,'127.0.0.1',()=>console.log('Design share preview: http://127.0.0.1:5183/ (static files only)'));
