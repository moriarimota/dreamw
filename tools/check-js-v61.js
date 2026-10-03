const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..');let count=0;
for(const name of fs.readdirSync(path.join(root,'game')).filter(n=>n.endsWith('.js'))){new vm.Script(fs.readFileSync(path.join(root,'game',name),'utf8'),{filename:name});count++;}
for(const name of ['v61-ui.html','gait-preview.html'])for(const[,body]of fs.readFileSync(path.join(root,'tests',name),'utf8').matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)){if(body.trim()){new vm.Script(body,{filename:name});count++;}}
console.log(count+' JavaScript sources parsed successfully');
