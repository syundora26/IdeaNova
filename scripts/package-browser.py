from pathlib import Path
import re,base64,hashlib,json,shutil
root=Path.cwd();source=root/'dist/share';out=root/'dist/browser'
(out/'assets').mkdir(parents=True,exist_ok=True);(out/'cosmetics').mkdir(exist_ok=True)
hash_name=lambda s:hashlib.sha256(s.encode()).hexdigest()[:12]
css_file=next((source/'assets').glob('*.css'));css=css_file.read_text(encoding='utf-8')
assert next((source/'cosmetics/assets').glob('*.css')).read_text(encoding='utf-8')==css
blocks=re.findall(r'@font-face\{[^}]*\}',css);assert len(blocks)>700
fonts=[]
for block in blocks:
    m=re.search(r'src:(.*?)(?=;[\w-]+:|})',block)
    assert m
    urls=re.findall(r'url\([\"\']?([^\"\')]+)[\"\']?\)',m.group(1))
    url=next(u for u in urls if '.woff2' in u or u.startswith('data:font/woff2'))
    if not url.startswith('data:'):
        f=(css_file.parent/url).resolve();assert f.is_relative_to(source.resolve())
        url='data:font/woff2;base64,'+base64.b64encode(f.read_bytes()).decode()
    fonts.append(block[:m.start()]+f'src:url({url}) format("woff2")'+block[m.end():])
chunks=[];current=''
for block in fonts:
    if len(current.encode())+len(block.encode())>12*1024**2:
        chunks.append(current);current=''
    current+=block+'\n'
if current:chunks.append(current)
imports=''
for chunk in chunks:
    name='fonts-'+hash_name(chunk)+'.css';(out/'assets'/name).write_text(chunk,encoding='utf-8');imports+=f'@import url("./{name}");\n'
css=imports+re.sub(r'@font-face\{[^}]*\}','',css)
css_name='site-'+hash_name(css)+'.css';(out/'assets'/css_name).write_text(css,encoding='utf-8')
for site in ['', 'cosmetics']:
    folder=source/site;target=out/site
    html=(folder/'index.html').read_text(encoding='utf-8')
    old_js=next((folder/'assets').glob('*.js'));js=old_js.read_text(encoding='utf-8')
    if site:js=js.replace('./images/','../images/')
    js_name=('cosmetics-' if site else 'corporate-')+hash_name(js)+'.js'
    (out/'assets'/js_name).write_text(js,encoding='utf-8')
    prefix='../assets/' if site else './assets/'
    html=html.replace('./assets/'+old_js.name,prefix+js_name).replace('./assets/'+css_file.name,prefix+css_name)
    (target/'index.html').write_text(html,encoding='utf-8');(target/'.nojekyll').write_text('')
shutil.copytree(source/'images',out/'images',dirs_exist_ok=True)
files=[p for p in out.rglob('*') if p.is_file()]
assert len(files)<=100
assert all(p.stat().st_size<=25*1024**2 for p in files)
result={'files':len(files),'largestMiB':round(max(p.stat().st_size for p in files)/1024**2,2),'fontFaces':len(fonts),'fontCssFiles':len(chunks),'woff2Bytes':'unchanged; embedded into CSS','images':'byte-identical; shared between both sites','MiB':round(sum(p.stat().st_size for p in files)/1024**2,2)}
(root/'qa/browser-upload/packaging.json').write_text(json.dumps(result,indent=2))
print(json.dumps(result))
