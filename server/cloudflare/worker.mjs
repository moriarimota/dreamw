import Core from '../ai-core.js';
const {validatePayload,modelReply,fail}=Core;
const json=(status,data,headers={})=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}});
async function hash(value){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))].map(x=>x.toString(16).padStart(2,'0')).join('');}
async function body(req){if(Number(req.headers.get('Content-Length'))>30000)throw fail(413,'这次交谈材料太长。');const reader=req.body?.getReader();if(!reader)throw fail(400,'没有交谈内容。');let size=0,chunks=[];try{while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>30000){await reader.cancel();throw fail(413,'这次交谈材料太长。');}chunks.push(value);}const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}return JSON.parse(new TextDecoder().decode(bytes));}catch(e){if(e.status)throw e;throw fail(400,'交谈格式不正确。');}}
export default {
 async fetch(req,env){
  const origin=req.headers.get('Origin'),allowed=(env.DREAMW_ALLOWED_ORIGINS||'https://moriarimota.github.io').split(',').map(x=>x.trim());
  const headers={'Vary':'Origin','Access-Control-Allow-Headers':'Authorization, Content-Type','Access-Control-Allow-Methods':'GET, POST, OPTIONS'};
  if(origin&&!allowed.includes(origin))return json(403,{error:'这个游戏地址尚未允许连接。'});
  if(origin)headers['Access-Control-Allow-Origin']=origin;
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
  if(!env.DEEPSEEK_API_KEY||!env.DREAMW_ACCESS_TOKEN||env.DREAMW_ACCESS_TOKEN.length<24)return json(503,{error:'AI助手还未完成密钥配置。'},headers);
  const given=await hash(req.headers.get('Authorization')||''),expected=await hash('Bearer '+env.DREAMW_ACCESS_TOKEN);let mismatch=0;for(let i=0;i<given.length;i++)mismatch|=given.charCodeAt(i)^expected.charCodeAt(i);
  if(mismatch)return json(401,{error:'访问口令不正确，请检查 AI 连接设置。'},headers);
  try{const id=env.LIMITS.idFromName('private-owner-v1'),result=await env.LIMITS.get(id).fetch(req);return new Response(result.body,{status:result.status,headers:{...Object.fromEntries(result.headers),...headers}});}
  catch{return json(503,{error:'在线助手暂时无法连接，请稍后再试。'},headers);}
 }
};

// One private owner per deployment. Persist only counts, IDs and hashes; never conversations.
export class DreamwLimits {
 constructor(ctx,env){this.ctx=ctx;this.env=env;this.active=0;this.replies=new Map();}
 async fetch(req){
  try{
   const day=new Date().toISOString().slice(0,10),limit=Math.max(1,Math.min(1000,Number(this.env.DREAMW_DAILY_LIMIT)||80)),route=new URL(req.url).pathname;
   if(route==='/health'&&req.method==='GET'){const saved=await this.ctx.storage.get('budget');return json(200,{service:'dreamw-ai',model:this.env.DREAMW_AI_MODEL||'deepseek-flash',remaining:Math.max(0,limit-(saved?.day===day?saved.count:0)),pet:false});}
   if(route==='/pet')throw fail(503,'在线助手暂不转发桌宠便笺。请在电脑上连接本机 AI 助手后寄给铛铛。');
   if(route!=='/chat'||req.method!=='POST')throw fail(404,'没有这个入口。');
   if(!(req.headers.get('Content-Type')||'').startsWith('application/json'))throw fail(415,'请使用JSON发送交谈。');
   const p=validatePayload(await body(req)),fingerprint=await hash(JSON.stringify(p));
   const cached=this.replies.get(p.requestId);if(cached){if(cached.fingerprint!==fingerprint)throw fail(409,'这次请求编号已被使用。');const result=await cached.promise;return json(result.status,result.data);}
   if(this.active>=2)throw fail(429,'她还在回应上一段交谈，请稍等。');
   // Reserve synchronously in the in-memory cache before awaiting storage.
   this.active++;
   const promise=this.process(p,fingerprint,day,limit).finally(()=>this.active--);
   this.replies.set(p.requestId,{fingerprint,promise});if(this.replies.size>100)this.replies.delete(this.replies.keys().next().value);
   const result=await promise;return json(result.status,result.data);
  }catch(e){return json(e.status||500,{error:e.status?e.message:'在线助手暂时无法处理请求。'});}
 }
 async process(p,fingerprint,day,limit){
  try{
   await this.ctx.storage.transaction(async txn=>{
    const old=await txn.get('budget')||{day,count:0,ids:[]},ids=old.ids.filter(x=>Date.now()-x.at<172800000),prior=ids.find(x=>x.id===p.requestId);
    if(prior)throw fail(409,prior.hash===fingerprint?'这个请求已经处理过。为避免重复调用，请先查看游戏中已有的回复。':'这次请求编号已被使用。');
    const count=old.day===day?old.count:0;if(count>=limit)throw fail(429,'今天的 AI 次数已用完，基础生活可以继续。');
    await txn.put('budget',{day,count:count+1,ids:[...ids,{id:p.requestId,hash:fingerprint,at:Date.now()}].slice(-2000)});
   });
   const answer=await modelReply({base:'https://api.deepseek.com',apiKey:this.env.DEEPSEEK_API_KEY,model:this.env.DREAMW_AI_MODEL||'deepseek-flash'},p);
   return{status:200,data:answer};
  }catch(e){return{status:e.status||503,data:{error:e.status?e.message:'在线助手暂时无法处理请求。'}};}
 }
}
