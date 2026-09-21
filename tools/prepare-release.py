"""Build explicit public source/web lists. Never includes player data."""
from pathlib import Path
import json, sys, zipfile

ROOT = Path(__file__).resolve().parent.parent
GAME = ['index.html','style.css','app.js','navigation.js','life.js','storage.js','gomoku.js','sw.js','icon.svg','manifest.webmanifest','.nojekyll']
ASSETS = ['cottage-empty-v1.png','witch-walk-v1.png','dream-props-v1.png']
TEXT = ['README.md','AGENTS.md','.gitignore','启动说明.md','.github/workflows/pages.yml']
TEXT += ['game/'+f for f in GAME]
TEXT += ['desktop/'+f for f in ['Launcher.cs','build.ps1','smoke.ps1','README.md']]
TEXT += ['tools/'+f for f in ['package.ps1','prepare-release.py']]
TEXT += ['tests/'+f for f in ['life-tests.js','life-tests.html','storage-tests.js','gomoku-tests.html','ui-smoke.html','serve-tests.py']]
TEXT += [p.relative_to(ROOT).as_posix() for p in sorted((ROOT/'docs').rglob('*.md'))]

def safe(relative):
    p = (ROOT/relative).resolve()
    if not p.is_relative_to(ROOT) or not p.is_file() or p.is_symlink():
        raise ValueError('Unsafe or missing package input: '+relative)
    if any(part in ('user-data','archive','releases','fixtures') for part in p.relative_to(ROOT).parts):
        raise ValueError('Private package input: '+relative)
    return p

if '--tree' in sys.argv:
    # stdout is consumed by the GitHub connector orchestration, not pasted into a shell.
    print(json.dumps([{'path':f,'mode':'100644','type':'blob','content':safe(f).read_text(encoding='utf-8-sig')} for f in TEXT],ensure_ascii=True))
else:
    release=ROOT/'releases'; release.mkdir(exist_ok=True)
    web=[('game/'+f,f) for f in GAME]+[('game/assets/'+f,'assets/'+f) for f in ASSETS]
    source=[(f,'WitchLife/'+f) for f in TEXT]+[('game/assets/'+f,'WitchLife/game/assets/'+f) for f in ASSETS]
    version=sys.argv[1] if len(sys.argv)>1 else 'demo-v2'
    if not version.replace('-','').replace('.','').isalnum(): raise ValueError('Invalid version')
    for label,entries in [('web',web),('source',source)]:
        target=release/('WitchLife-'+version+'-'+label+'.zip')
        with zipfile.ZipFile(target,'x',zipfile.ZIP_DEFLATED) as z:
            for source_path,name in entries:z.write(safe(source_path),name)
        print(str(target)+' : '+str(len(entries))+' files; no player data')
