from pathlib import Path
import hashlib,json,re,sys,zipfile
r=Path(__file__).resolve().parent.parent
version=sys.argv[1] if len(sys.argv)>1 else 'demo-v6.1-preview'
out=[]
for suffix in ['-web','-source','']:
 p=r/'releases'/f'WitchLife-{version}{suffix}.zip'
 with zipfile.ZipFile(p) as z:
  names=z.namelist();assert z.testzip() is None
  assert all(not set(n.lower().split('/'))&{'user-data','.git','.codex','fixtures','archive'} for n in names)
  gameprefix='' if suffix=='-web' else 'WitchLife/game/'
  if suffix=='-web':
   html=z.read('index.html').decode('utf-8-sig')
   for path in re.findall(r'(?:src|href)="([^"#]+)"',html):
    path=path.split('?')[0]
    assert path in names,path
  drift=[]
  for n in names:
   if not n.startswith(gameprefix):continue
   rel=n[len(gameprefix):];local=r/'game'/rel
   if local.is_file() and z.read(n)!=local.read_bytes():drift.append(rel)
  out.append({'file':p.name,'entries':len(names),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'runtimeDrift':drift})
report={'packages':out,'playerDataExcluded':True,'crcPassed':True,'browserValidated':False}
(r/'releases'/f'{version}-verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=True,indent=2))
if any(p['runtimeDrift'] for p in out):sys.exit(2)
