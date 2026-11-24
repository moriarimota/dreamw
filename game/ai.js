/* Optional conversation adapter. The life engine remains the only world authority. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.WitchAI=api;})(globalThis,function(){
 'use strict';
 const ACTIONS=Object.freeze({none:'',tea:'一起喝杯茶',read:'一起接着读',garden:'一起照料小田',rest:'一起歇一会儿'});
 function endpoint(value){
  let u;try{u=new URL(String(value).trim());}catch{throw Error('请填写完整的 AI 服务地址。');}
  const local=['127.0.0.1','localhost','[::1]'].includes(u.hostname);
  if(u.username||u.password||u.search||u.hash||!(u.protocol==='https:'||local&&u.protocol==='http:'))throw Error('服务地址需使用 HTTPS；本机地址可以使用 HTTP。');
  if(u.hostname==='api.deepseek.com'||u.hostname==='api.openai.com')throw Error('这里填写梦乡连接服务地址；模型密钥请在本机 AI 助手中设置。');
  return u.href.replace(/\/+$/,'');
 }
 function response(value){
  if(!value||typeof value.reply!=='string'||!value.reply.trim()||value.reply.length>1600)throw Error('这次没有收到完整回复，请稍后再试。');
  if(!Object.hasOwn(ACTIONS,value.suggestion))throw Error('这次回复的活动建议无法识别。');
  return{reply:value.reply.trim(),suggestion:value.suggestion};
 }
 function context(s,L,query=''){
  const v=L.currentView(s,s.lastAdvancedAt),privateActivity=!!(s.activity.fragmentId||s.activity.studyFragmentId||s.activity.plantFragmentId||s.activity.knowledgeFragmentId)||['craft','research','plant'].includes(s.activity.kind);
  const facts=s.memories.filter(m=>/^(book:|first:|country:|recipe:|neighbor:met:|neighbor:borrow$|neighbor:return$|hello)/.test(m.key)).slice(-8).map(m=>({id:m.id,at:m.at,text:m.text}));
  const tokens=Array.from(new Set((query.match(/[\p{L}\p{N}]{2,}/gu)||[]).flatMap(t=>Array.from({length:Math.max(1,t.length-1)},(_,i)=>t.slice(i,i+2)))));
  const turns=(s.conversation?.turns||[]),recent=turns.slice(-4),related=turns.slice(0,-4).map(t=>({t,score:tokens.reduce((n,w)=>n+Number((t.user+t.reply).includes(w)),0)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,2).map(x=>x.t);
  return{
   character:{name:s.preferences.name,bio:s.avatar.bio,preferences:{curiosity:s.preferences.curiosity,bookish:s.preferences.bookish,quiet:s.preferences.quiet}},
   now:{at:s.lastAdvancedAt,hour:s.world.hour,weather:s.world.weather,energy:Math.round(s.world.energy),activity:privateActivity?'正在照料一件与你们有关的小事':v.title,reason:privateActivity?'这件事与私人梦种有关，原文没有提供。':v.reason},
   reading:v.excerpt?{title:v.excerpt.book,chapter:v.excerpt.chapter,text:v.excerpt.text}:null,
   facts,neighbors:L.residents(s,s.lastAdvancedAt).filter(n=>s.village.contacts[n.id]?.met).slice(0,4).map(n=>({name:n.name,activity:n.task,reason:n.reason})),
   garden:{planted:s.country.plots.filter(p=>p.crop).length,harvests:s.country.harvests},
   conversation:[...related,...recent].map(t=>({user:t.user,reply:t.reply,at:t.at,kind:'conversation-not-world-fact'})),
   allowedSuggestions:['none',...L.decisionView(s,s.lastAdvancedAt).filter(r=>r.eligible&&Object.hasOwn(ACTIONS,r.kind)).map(r=>r.kind)],
   privacy:'没有提供梦种原文、私人收藏描述、密钥或完整存档。对话内容是双方说过的话，不等于已经发生的事件。'
  };
 }
 async function request(url,token,path,payload,signal){
  const base=endpoint(url);if(!token||token.length<16)throw Error('请先填写 AI 助手的访问口令。');
  const r=await fetch(base+path,{method:payload?'POST':'GET',headers:{Authorization:'Bearer '+token,...(payload?{'Content-Type':'application/json'}:{})},body:payload?JSON.stringify(payload):undefined,signal,credentials:'omit',redirect:'error',cache:'no-store'});
  let data;try{data=await r.json();}catch{throw Error('AI 服务没有返回可识别的内容，请检查地址。');}
  if(!r.ok)throw Error(typeof data.error==='string'?data.error.slice(0,180):'AI 服务暂时无法连接。');
  return data;
 }
 function petNote(s,L){const c=context(s,L);return(c.character.name+'的梦乡便笺：'+c.now.activity+'。'+(c.reading?'读到《'+c.reading.title+'》的“'+c.reading.chapter+'”。':'')+'这边是'+c.now.weather+'，给桌边的铛铛留个招呼。').slice(0,300);}
 return{ACTIONS,endpoint,response,context,request,petNote};
});
