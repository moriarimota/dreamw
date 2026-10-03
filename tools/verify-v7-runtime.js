const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..'),game=path.join(root,'game'),ctx={self:{}};let count=0;
for(const name of fs.readdirSync(game).filter(n=>n.endsWith('.js'))){new vm.Script(fs.readFileSync(path.join(game,name),'utf8'),{filename:name});count++;}
const fixture=fs.readFileSync(path.join(root,'tests/v7-ui.html'),'utf8');for(const[,body]of fixture.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))if(body.trim())new vm.Script(body,{filename:'v7-ui.html'});
vm.runInNewContext(fs.readFileSync(path.join(game,'offline-manifest.js'),'utf8'),ctx);const files=ctx.self.WITCH_OFFLINE.files;
const html=fs.readFileSync(path.join(game,'index.html'),'utf8');for(const[,file]of html.matchAll(/(?:src|href)="([^"#]+)"/g))assert(files.includes(file),'离线清单遗漏 '+file);
assert(files.every(f=>fs.existsSync(path.join(game,f.split('?')[0]))));const indices=['pocket-games.js','games.js','life.js','pocket-ui.js','postcards.js','offline.js','app.js'].map(f=>html.indexOf('src="'+f));assert(indices.every((p,i)=>p>=0&&(!i||p>indices[i-1])),'依赖顺序');
const css=fs.readdirSync(game).filter(f=>f.endsWith('.css')).map(f=>fs.readFileSync(path.join(game,f),'utf8')).join('\n');assert(!/url\(['"]?https?:/.test(css),'离线样式依赖外站');
const workflows=fs.readFileSync(path.join(root,'.github/workflows/pages.yml'),'utf8'),pack=fs.readFileSync(path.join(root,'tools/package.ps1'),'utf8');for(const file of files){const f=file.split('?')[0];assert(workflows.includes('game/'+f),'Pages 清单遗漏 '+f);assert(pack.includes("'game/"+f+"'"),'桌面清单遗漏 '+f);}
console.log(count+' JavaScript files + browser fixture parsed; '+files.length+' offline assets, dependency order and release whitelists verified');
const worldOrder=['terrain.js','village-view.js','life.js'];assert(worldOrder.every((f,i)=>html.includes('src="'+f)&&(!i||html.indexOf('src="'+f)>html.indexOf('src="'+worldOrder[i-1]))),'地图依赖顺序');
