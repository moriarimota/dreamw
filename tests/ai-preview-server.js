// Isolated UI fixture. No real model, keys, player saves, or upstream requests.
'use strict';
const {createServer}=require('../server/ai-server.js');
const c={base:'https://api.deepseek.com',apiKey:'fixture-only',token:'preview-only-token-1234567890',model:'模拟测试 · 无模型费用',origins:['http://127.0.0.1:18766'],limit:80,usageFile:null,petOutbox:require('node:path').join(__dirname,'test-data/ai-pet-outbox.json')};
createServer(c,{fetchImpl:async()=>new Response(JSON.stringify({choices:[{finish_reason:'stop',message:{content:JSON.stringify({reply:'【模拟验证】我正在读《苔藓邮差的旅行簿》，这一页的蜗牛把信慢慢送到了窗边。要不要一起接着读？',suggestion:'read'})}}]}),{status:200})}).listen(18768,'127.0.0.1',()=>console.log('AI UI test fixture ready on 18768'));
