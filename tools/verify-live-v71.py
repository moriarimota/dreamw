from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import hashlib,json,urllib.request

root=Path(__file__).resolve().parent.parent
manifest=json.loads((root/'game/offline-manifest.js').read_text(encoding='utf-8').split('=',1)[1].strip().rstrip(';'))
# .nojekyll is a Pages build-control marker, not a browser resource.
files=list(dict.fromkeys([f.split('?')[0] for f in manifest['files']]+['sw.js','offline-worker.js','vendor/phaser-LICENSE.txt']))
base='https://moriarimota.github.io/dreamw/'
def check(path):
    try:
        req=urllib.request.Request(base+path,headers={'Cache-Control':'no-cache','User-Agent':'Dreamland-Release-Verification'})
        with urllib.request.urlopen(req,timeout=45) as response:
            actual=response.read()
        expected=(root/'game'/path).read_bytes()
        if path.endswith('.png'):
            same=actual==expected
        else:
            same=actual.decode('utf-8-sig').replace('\r\n','\n')==expected.decode('utf-8-sig').replace('\r\n','\n')
        return {'file':path,'matches':same,'bytes':len(actual)}
    except Exception as error:
        return {'file':path,'matches':False,'error':str(error)}
with ThreadPoolExecutor(max_workers=4) as pool:
    results=list(pool.map(check,files))
report={'url':base,'version':manifest['version'],'checked':len(results),'differences':[r for r in results if not r['matches']],'results':results}
(root/'releases/live-v71-verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({k:v for k,v in report.items() if k!='results'},ensure_ascii=True))
if report['differences']:raise SystemExit(1)
