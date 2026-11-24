'use strict';
const http=require('node:http'),crypto=require('node:crypto'),fs=require('node:fs'),path=require('node:path');
const {SYSTEM,fail,validatePayload,modelReply}=require('./ai-core.js');
function configFromEnv(env=process.env){
 const base=new URL(env.DREAMW_AI_BASE||'https://api.deepseek.com');
 if(base.protocol!=='https:'||base.username||base.password||base.search||base.hash)throw Error('模型接口必须使用不含凭据的 HTTPS 地址。');
 const token=env.DREAMW_ACCESS_TOKEN||'',apiKey=env.DEEPSEEK_API_KEY||env.DREAMW_AI_KEY||'';
 if(token.length<24||!apiKey)throw Error('请先运行 tools/start-ai.ps1 配置模型密钥和访问口令。');
 return{base:base.href.replace(/\/+$/,''),apiKey,token,model:env.DREAMW_AI_MODEL||'deepseek-flash',port:Number(env.PORT||18768),host:env.DREAMW_HOST||'127.0.0.1',
 origins:(env.DREAMW_ALLOWED_ORIGINS||'http://127.0.0.1:18766,http://127.0.0.1:18765,http://localhost:18766,https://moriarimota.github.io').split(',').map(s=>s.trim()).filter(Boolean),
 limit:Math.min(1000,Math.max(1,Number(env.DREAMW_DAILY_LIMIT)||80)),usageFile:env.DREAMW_USAGE_FILE||path.join(__dirname,'../user-data/ai-usage.json'),petOutbox:env.DREAMW_PET_OUTBOX||null};
}
function readPayload(req){return new Promise((resolve,reject)=>{let body='',size=0;req.setEncoding('utf8');req.on('data',chunk=>{size+=Buffer.byteLength(chunk);if(size>30000){reject(fail(413,'这次交谈材料太长。'));req.resume();return;}body+=chunk;});req.on('end',()=>{try{resolve(JSON.parse(body));}catch{reject(fail(400,'交谈格式不正确。'));}});req.on('error',reject);});}
function createServer(config,{fetchImpl=fetch,now=Date.now,timeoutMs=40000}={}){
 const c=config,cache=new Map();let active=0,usage={day:'',count:0};
 if(c.usageFile&&fs.existsSync(c.usageFile)){usage=JSON.parse(fs.readFileSync(c.usageFile,'utf8'));if(typeof usage.day!=='string'||!Number.isSafeInteger(usage.count)||usage.count<0)throw Error('AI用量记录无法读取，请检查备份。');}
 const quota=()=>{const day=new Date(now()).toISOString().slice(0,10);if(usage.day!==day)usage={day,count:0};return Math.max(0,c.limit-usage.count);};
 function reserve(){if(!quota())throw fail(429,'今天的 AI 次数已用完，基础生活可以继续。');usage.count++;if(c.usageFile){fs.mkdirSync(path.dirname(c.usageFile),{recursive:true});const tmp=c.usageFile+'.tmp';fs.writeFileSync(tmp,JSON.stringify(usage));fs.renameSync(tmp,c.usageFile);}}
 const server=http.createServer(async(req,res)=>{
  const origin=req.headers.origin;res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Vary','Origin');
  const send=(status,data)=>{res.writeHead(status);res.end(JSON.stringify(data));};
  if(origin&&!c.origins.includes(origin))return send(403,{error:'这个游戏地址尚未允许连接。'});
  if(origin)res.setHeader('Access-Control-Allow-Origin',origin);
  res.setHeader('Access-Control-Allow-Headers','Authorization, Content-Type');res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');
  if(req.method==='OPTIONS'){res.writeHead(204);res.end();return;}
  const given=Buffer.from(req.headers.authorization||''),expected=Buffer.from('Bearer '+c.token);
  if(given.length!==expected.length||!crypto.timingSafeEqual(given,expected))return send(401,{error:'访问口令不正确，请检查 AI 连接设置。'});
  try{
   if(req.url==='/health'&&req.method==='GET')return send(200,{service:'dreamw-ai',model:c.model,remaining:quota(),pet:!!c.petOutbox});
   if(req.url==='/pet'&&req.method==='POST'){
    if(!c.petOutbox)throw fail(503,'这个助手还没有接上本机铛铛。请使用电脑上的启动AI助手。');
    const p=await readPayload(req);
    if(!p||typeof p.requestId!=='string'||!/^[a-zA-Z0-9-]{16,80}$/.test(p.requestId)||typeof p.text!=='string'||!p.text.trim()||p.text.length>300)throw fail(400,'便笺格式不正确。');
    let notes=fs.existsSync(c.petOutbox)?JSON.parse(fs.readFileSync(c.petOutbox,'utf8')).notes:[];
    if(!Array.isArray(notes))throw Error('Invalid outbox');
    const prior=notes.find(n=>n.id===p.requestId);if(prior&&prior.text!==p.text)throw fail(409,'这张便笺编号已被使用。');
    if(!prior){notes=notes.filter(n=>n.at>now()-86400000).slice(-19);notes.push({id:p.requestId,at:now(),text:p.text,source:'dreamw-life'});fs.mkdirSync(path.dirname(c.petOutbox),{recursive:true});const tmp=c.petOutbox+'.tmp';fs.writeFileSync(tmp,JSON.stringify({version:1,notes}));fs.renameSync(tmp,c.petOutbox);}
    return send(200,{queued:true,requestId:p.requestId});
   }
   if(req.url!=='/chat'||req.method!=='POST')throw fail(404,'没有这个入口。');
   if(!String(req.headers['content-type']).startsWith('application/json'))throw fail(415,'请使用JSON发送交谈。');
   const p=validatePayload(await readPayload(req)),fingerprint=crypto.createHash('sha256').update(JSON.stringify(p)).digest('hex'),prior=cache.get(p.requestId);
   if(prior){if(prior.fingerprint!==fingerprint)throw fail(409,'这次请求编号已被使用，请重新发送。');return send(200,await prior.promise);}
   if(active>=2)throw fail(429,'她还在回应上一段交谈，请稍等。');reserve();active++;
   const promise=modelReply(c,p,{fetchImpl,timeoutMs});cache.set(p.requestId,{fingerprint,promise});if(cache.size>100)cache.delete(cache.keys().next().value);
   try{return send(200,await promise);}finally{active--;}
  }catch(e){send(e.status||500,{error:e.status?e.message:'AI助手暂时无法处理请求，请检查本机服务。'});}
 });
 server.requestTimeout=15000;server.headersTimeout=10000;return server;
}
if(require.main===module){try{const c=configFromEnv();createServer(c).listen(c.port,c.host,()=>console.log('梦乡 AI 助手已启动：http://'+c.host+':'+c.port+' · '+c.model+'（不记录聊天正文）'));}catch{console.error('AI助手未启动。请先运行 tools/start-ai.ps1 完成本机配置。');process.exitCode=1;}}
module.exports={createServer,configFromEnv,validatePayload,SYSTEM};
