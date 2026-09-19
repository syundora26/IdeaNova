from pathlib import Path
import zipfile, hashlib, json
root=Path.cwd()
out=root.parent/'IdeaNova_Contact_Contour_2026-09-12.zip'
exclude={'node_modules','.npm-cache','dist','.git','.codex','.agents'}
qa_names={'results.json','build-smoke.json','build.log','independence.json','assets.json','business-preservation.json','reference-layout.json','mobile-type.json','contrast.json','final-home-a11y.json','final-home-a11y.json','component-props.json','unit-results.json','1440-home.png','390-home.png','1440-first-view.png','390-first-view.png'}
files=[]
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
    for p in root.rglob('*'):
        if not p.is_file(): continue
        rel=p.relative_to(root)
        if any(part in exclude for part in rel.parts): continue
        if rel.parts[0]=='qa':
            if not (len(rel.parts)>2 and rel.parts[1] in {'lower-finish','contact-contour'}): continue
            is_comparison=len(rel.parts)>3 and ((rel.parts[2] in {'before','after'} and p.name.endswith(('-home.png','-fv.png','-long-content.png'))) or (rel.parts[2]=='comparison' and p.suffix in {'.png','.html'}))
            if rel.parts[2]=='source-before' or 'draft' in p.name or p.name in {'failure.png','ground-check.png'}: continue
            if p.suffix not in {'.json','.png','.html'} and p.name!='build.log': continue
        if p.suffix in {'.zip','.sha256','.log'} and not (rel.parts[0]=='qa' and p.name=='build.log'): continue
        if p.name in {'.env','.DS_Store'}: continue
        z.write(p,'ideanova/'+rel.as_posix())
        files.append(rel.as_posix())
with zipfile.ZipFile(out) as z:
    assert z.testzip() is None
    assert 'ideanova/public/images/reference-design.png' not in z.namelist()
    assert 'ideanova/docs/reference/provided-design.png' in z.namelist()
    assert 'ideanova/docs/reference/botanical-design.jpg' in z.namelist()
    assert 'ideanova/public/images/reference-products.png' in z.namelist()
    assert 'ideanova/public/images/reference-leaves.png' in z.namelist()
    assert 'ideanova/qa/lower-finish/comparison/index.html' in z.namelist()
    assert 'ideanova/docs/REFERENCE_FINISH.md' in z.namelist()
    assert 'ideanova/public/images/reference-flower-finish.png' in z.namelist()
    assert 'ideanova/public/images/reference-botanical-edge.png' in z.namelist()
    assert 'ideanova/docs/REFERENCE_FINISH_ASSETS.md' in z.namelist()
    assert 'ideanova/docs/REFERENCE_FINISH_VALIDATION.md' in z.namelist()
    assert 'ideanova/docs/SEAM_REPAIR.md' in z.namelist()
    assert 'ideanova/qa/lower-finish/lower-results.json' in z.namelist()
    assert 'ideanova/public/images/reference-natural-underlay.png' in z.namelist()
    assert 'ideanova/public/images/reference-stone-repair.png' in z.namelist()
    assert 'ideanova/docs/LOWER_FINISH.md' in z.namelist()
    assert 'ideanova/public/images/reference-values-still-life.png' in z.namelist()
    assert 'ideanova/public/images/reference-footer-sprig.png' in z.namelist()
    assert 'ideanova/docs/CONTACT_CONTOUR.md' in z.namelist()
    assert 'ideanova/qa/contact-contour/comparison.png' in z.namelist()
    assert 'ideanova/qa/contact-contour/verification.json' in z.namelist()
    assert 'ideanova/src/CorporateMedia.tsx' in z.namelist()
    assert 'ideanova/src/ReferenceHome.tsx' in z.namelist()
h=hashlib.sha256(out.read_bytes()).hexdigest()
out.with_suffix('.sha256').write_text(h+'  '+out.name+'\n')
print(json.dumps({'zip':str(out),'files':len(files),'MiB':round(out.stat().st_size/1024**2,2),'sha256':h}))
