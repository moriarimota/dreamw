(function(root){
 'use strict';const A=root.WitchAI,KEY='witchlife-ai-connection-v1';let connection={url:'http://127.0.0.1:18768',token:''},busy=false;
 try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');if(saved?.url)connection.url=A.endpoint(saved.url);}catch{}
 const el=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
 const btn=(text,run,cls='soft-button')=>{const b=el('button',text,cls);b.type='button';b.onclick=run;return b;};
 function settings(host){
  const box=el('div',undefined,'ai-panel'),intro=el('div',undefined,'ai-intro');intro.append(el('small','梦乡 · AI 连接'),el('h3','让交谈接上这段生活'),el('p','接入后，她会结合正在做的事、读到的章节和你们的交谈回应。基础生活仍可离线继续。'));
  const form=el('form'),url=el('input'),token=el('input'),status=el('p','尚未检查连接。','ai-status');status.setAttribute('role','status');
  url.type='url';url.value=connection.url;url.placeholder='https://你的梦乡AI服务';token.type='password';token.value=connection.token;token.autocomplete='off';token.spellcheck=false;
  for(const[label,input]of[['AI 服务地址',url],['访问口令',token]]){const row=el('label',label);row.append(input);form.append(row);}
  const persist=()=>{connection={url:A.endpoint(url.value),token:token.value.trim()};try{localStorage.setItem(KEY,JSON.stringify({url:connection.url}));}catch{}return connection;};
  const save=btn('保存连接',()=>{try{persist();status.textContent='地址已保存。访问口令仅在本次打开期间保留。';}catch(e){status.textContent=e.message;}},'primary');
  const check=btn('检查连接',async()=>{check.disabled=true;let timer;const controller=new AbortController();try{persist();status.textContent='正在检查连接…';timer=setTimeout(()=>controller.abort(),10000);const data=await A.request(connection.url,connection.token,'/health',null,controller.signal);status.textContent='连接助手已就绪 · '+data.model+' · 今日还可发送 '+data.remaining+' 次。首次聊天将检验模型密钥。';}catch(e){status.textContent=e.name==='AbortError'?'连接超时，请确认 AI 助手正在运行。':e.message==='Failed to fetch'?'未能连接。请检查服务地址、访问口令与 AI 助手。':e.message;}finally{clearTimeout(timer);check.disabled=false;}});
  const actions=el('div',undefined,'ai-controls');actions.append(save,check);form.onsubmit=e=>e.preventDefault();form.append(actions,status);
  const instructions=el('details'),summary=el('summary','怎样连接 DeepSeek');instructions.append(summary,el('p','先在电脑运行“启动AI助手”，按提示填写 DeepSeek 密钥和模型。把助手显示的服务地址、访问口令填在这里。模型密钥留在助手中，不填写到网页。'),el('p','手机使用在线版本时，需要部署可访问的 HTTPS 连接服务。手机上的 127.0.0.1 指向手机自己。'));
  box.append(intro,form,instructions,el('p','只有你在聊天中勾选允许并点击发送，才会把预览中的材料和对话交给所连接的模型服务。','ai-note'),btn('断开连接',()=>{connection.token='';token.value='';status.textContent='已断开，本地生活照常继续。'}));host.replaceChildren(box);
 }
 function chat(host,{state,L,save,onSettings,onInvite}){
  const box=el('div',undefined,'ai-panel ai-chat'),intro=el('div',undefined,'ai-intro'),log=el('div',undefined,'ai-messages'),status=el('p','','ai-status');status.setAttribute('role','status');log.setAttribute('aria-label','你们的交谈');
  intro.append(el('small','窗边的交谈'),el('h3',state.preferences.name+'这会儿在这里'),el('p',L.currentView(state,state.lastAdvancedAt).title));
  const renderLog=()=>{log.replaceChildren();const turns=state.conversation?.turns||[];if(!turns.length)log.append(el('p','从她正在读的书，或你今天的小事聊起。对话会随这份存档保留。','ai-empty'));for(const t of turns.slice(-10)){const user=el('article',undefined,'ai-message ai-user'),reply=el('article',undefined,'ai-message');user.append(el('small','你'),el('p',t.user));reply.append(el('small',state.preferences.name),el('p',t.reply));log.append(user,reply);}};
  renderLog();const message=el('textarea');message.maxLength=600;message.rows=3;message.placeholder='今天想和她说些什么？';message.setAttribute('aria-label','想对她说的话');
  const preview=el('details'),pre=el('pre'),consent=el('input'),label=el('label',undefined,'ai-consent');preview.append(el('summary','查看本次会发送的材料'),pre);consent.type='checkbox';label.append(consent,el('span','允许把预览中的角色设定、生活记录和聊天内容发给我配置的 AI 服务。'));
  const updatePreview=()=>{pre.textContent=JSON.stringify({context:A.context(state,L,message.value),message:message.value},null,2);};message.oninput=updatePreview;updatePreview();
  const suggestion=el('div',undefined,'ai-suggestion'),send=btn('和她说',async()=>{
   if(busy)return;if(!consent.checked){status.textContent='请先查看发送材料，并勾选允许。';return;}const text=message.value.trim();if(!text){status.textContent='写下一点想说的话吧。';return;}
   if(!connection.token){status.textContent='先在“AI 连接”中设置访问口令。';return;}
   busy=true;send.disabled=true;settingsButton.disabled=true;status.textContent='正在等她回应…';suggestion.replaceChildren();const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),50000);const requestId=crypto.randomUUID();
   // Freeze the context shown to the player. Closing the sheet cancels the request.
   const observer=new MutationObserver(()=>{if(!host.isConnected||host.closest('[hidden]'))controller.abort();});observer.observe(document.getElementById('sheet'),{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});
   try{const payload={requestId,message:text,context:A.context(state,L,text)};pre.textContent=JSON.stringify(payload,null,2);const data=await A.request(connection.url,connection.token,'/chat',payload,controller.signal),answer=A.response(data);
    if(!host.isConnected||host.closest('[hidden]'))return;L.recordConversation(state,{id:requestId,at:Date.now(),user:text,...answer,model:data.model});const saved=await save();message.value='';renderLog();updatePreview();status.textContent=saved===false?'回复已收到，但保存失败。请先导出存档备份，再关闭页面。':'这段交谈已记下 · '+data.model;
    if(answer.suggestion!=='none'){suggestion.append(el('p','她的小提议'),btn(A.ACTIONS[answer.suggestion],()=>onInvite(answer.suggestion,answer.suggestion==='read'?{bookId:state.activity.bookId||'moss'}:{}),'primary'));}log.lastElementChild?.scrollIntoView({block:'nearest'});
   }catch(e){if(host.isConnected)status.textContent=e.name==='AbortError'?'这次连接已结束，写下的话还在。':e.message==='Failed to fetch'?'连接没有成功，生活和存档不受影响。可以检查 AI 助手后再试。':e.message;}
   finally{observer.disconnect();clearTimeout(timer);busy=false;send.disabled=false;settingsButton.disabled=false;}
  },'primary');
  const settingsButton=btn('AI 连接',onSettings),controls=el('div',undefined,'ai-controls');controls.append(send,settingsButton);box.append(intro,log,message,preview,label,controls,status,suggestion,el('p','聊天与实际经历分开保存；她提出的活动，由你选择加入。最近40次交谈随存档保留。','ai-note'));host.replaceChildren(box);
 }
 function pet(host,{state,L,onSettings}){
  const box=el('div',undefined,'ai-panel'),text=A.petNote(state,L),status=el('p','','ai-status'),id=crypto.randomUUID();status.setAttribute('role','status');
  box.append(el('h3','寄给桌边的铛铛'),el('p','把眼前这段生活写成一张便笺。铛铛空闲时，会在桌面气泡里读到。'),el('blockquote',text,'book-excerpt'));
  const send=btn('把这张便笺寄过去',async()=>{if(!connection.token){status.textContent='先在 AI 连接中填写本机助手的访问口令。';return;}send.disabled=true;const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);try{await A.request(connection.url,connection.token,'/pet',{requestId:id,text},controller.signal);status.textContent='已放进本机铛铛的信匣。请让新版铛铛保持运行，它空闲时会读到；便笺保留一天。';}catch(e){status.textContent=e.name==='AbortError'?'暂未确认送达，可以重试同一张便笺。':e.message;send.disabled=false;}finally{clearTimeout(timer);}},'primary');
  box.append(send,status,btn('AI 连接',onSettings),el('p','这张便笺不调用模型，也不会改变两边的金币、物品或好感。此入口需连接装有铛铛的电脑助手。','ai-note'));host.replaceChildren(box);
 }
 root.WitchAIUI={settings,chat,pet};
})(globalThis);
