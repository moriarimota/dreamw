(function(root){
 'use strict';const A=root.WitchArcade,clone=v=>JSON.parse(JSON.stringify(v));
 const el=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
 const btn=(text,fn,cls='soft-button')=>{const e=el('button',text,cls);e.type='button';e.addEventListener('click',fn);return e;};
 function mount(host,{saved,...options}){
  const link=saved.kind==='link',s=link?A.cleanLink(saved):A.cleanMatch(saved),config=link?A.linkConfig(s.level):A.matchConfig(s.level);let active=true,selected=-1,hinted=[],timer=null,busy=false;
  const body=el('div',undefined,'mini-game arcade-game'),progress=el('p','','game-progress'),message=el('p','','game-message'),board=el('div',undefined,'arcade-board '+(link?'link-board':'match-board')),wrap=el('div',undefined,'arcade-wrap'),tools=el('div',undefined,'game-toolbar'),outcome=el('div',undefined,'arcade-outcome');message.setAttribute('role','status');board.setAttribute('role','group');board.setAttribute('aria-label',link?'连连看棋盘':'消消乐棋盘');board.style.setProperty('--cols',link?s.cols:7);wrap.append(board);
  const intro=link?'「相同图案之间，能用不超过两次转弯的线连上，就能收走；可以从棋盘外绕过去。石头不能穿过。」':'「先点一颗，再点相邻的一颗交换。横着或竖着凑齐三个就能消除，落下来的小物还会继续连消。」';
  body.append(el('p',intro,'thought'),progress,wrap,message,outcome,tools);host.replaceChildren(body);
  const done=()=>link?A.isLinkDone(s):A.isMatchDone(s),save=()=>options.onChange?.(clone(s));
  function confirm(text,action){body.querySelector('.game-confirm')?.remove();const q=el('div',undefined,'game-confirm');q.append(el('p',text),btn('确定',()=>{q.remove();action();}),btn('继续这局',()=>q.remove()));tools.after(q);}
  function flash(path,duration=650){wrap.querySelector('.link-route')?.remove();if(!path)return;const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg'),line=document.createElementNS(ns,'polyline');svg.setAttribute('class','link-route');const box=wrap.getBoundingClientRect(),first=board.children[0].getBoundingClientRect(),second=board.children[1].getBoundingClientRect(),row=board.children[s.cols].getBoundingClientRect();svg.setAttribute('viewBox',`0 0 ${box.width} ${box.height}`);svg.setAttribute('aria-hidden','true');line.setAttribute('points',path.map(p=>`${p.x===0?4:p.x===s.cols+1?box.width-4:first.left-box.left+first.width/2+(p.x-1)*(second.left-first.left)},${p.y===0?4:p.y===s.rows+1?box.height-4:first.top-box.top+first.height/2+(p.y-1)*(row.top-first.top)}`).join(' '));svg.append(line);wrap.append(svg);clearTimeout(timer);timer=setTimeout(()=>svg.remove(),duration);}
  function finish(){if(done()&&!s.celebrated){s.celebrated=true;options.onFinish?.(s.kind,clone(s));save();}}
  function choose(i){if(!active||busy||done()||(!link&&!s.movesLeft)||s.board[i]<=0)return;
   if(selected===i){selected=-1;hinted=[];render();return;}if(selected<0){selected=i;hinted=[];render();return;}
   if(link){const path=A.removeLink(s,selected,i);if(path){selected=-1;hinted=[];let mixed=false;if(!done()&&!A.linkHint(s)){A.shuffleLink(s);s.helps--;mixed=true;}save();render();flash(path);message.textContent=mixed?'「这份摆法没有路了，已经帮你重新摆好；图案都还在。」':'「这两个碰面啦。」';}else{selected=i;render();message.textContent='这条路还连不上，试试从边缘绕过去。';}}
   else{const previous=selected,result=A.swapMatch(s,selected,i);selected=-1;hinted=[];if(!result.valid){selected=i;render();message.textContent='要交换相邻的两颗，并且凑成三个才行。这次没有扣步数。';return;}
    save();busy=true;const first=result.waves[0];render(first.board,new Set(first.removed));message.textContent='「'+(result.chain>1?'连消 '+result.chain+' 次！':'消掉啦！')+(result.bonus?'四颗或更多连在一起，多送 '+result.bonus+' 步。':'')+'」'+(result.shuffled?'没有可交换的组合，已经重新摆好。':'');timer=setTimeout(()=>{if(!active)return;busy=false;render();},matchMedia('(prefers-reduced-motion: reduce)').matches?0:260);
   }
  }
  const hint=btn('小罗给点提示',()=>{if(busy||done())return;const h=link?A.linkHint(s):A.matchHint(s);if(!h){message.textContent='换个摆法再看看吧。';return;}s.helps++;hinted=[h.a,h.b];selected=-1;save();render();if(link)flash(h.path,3500);message.textContent=link?'「看看这两个，我把路线画给你。」':'「试试交换亮起来的这两个。」';board.children[h.a].scrollIntoView({block:'center',behavior:'instant'});});
  const shuffle=btn('换个摆法',()=>{if(busy||done())return;link?A.shuffleLink(s):A.shuffleMatch(s);selected=-1;hinted=[];save();render();message.textContent='「重新摆好了，慢慢来。」';});
  tools.append(hint,shuffle,btn('重玩这一关',()=>confirm('重新开始第 '+s.level+' 关？这一关的当前棋盘会收起，关卡册里的成绩会保留。',()=>options.onLevel?.(s.level))),btn('关卡册',()=>options.onBook?.()),btn('先收好',()=>options.onExit?.()));
  function render(display=s.board,removed=new Set()){
   if(!active)return;const win=done(),lose=!link&&!win&&s.movesLeft===0;
   progress.textContent=link?`第 ${s.level} / ${A.LINK_LEVELS} 关 · ${config.chapter} · 剩 ${s.board.filter(v=>v>0).length/2} 对`:`第 ${s.level} / ${A.MATCH_LEVELS} 关 · ${s.score} / ${config.target} 分 · 剩 ${s.movesLeft} 步`+(config.collect?` · ${A.NAMES[config.collect.symbol-1]} ${s.collected[config.collect.symbol-1]} / ${config.collect.count}`:'');
   board.replaceChildren();display.forEach((v,i)=>{const b=btn(v<0?'◆':'',()=>choose(i),'arcade-tile');if(v>0)b.append(WitchTokens.icon(v-1));b.dataset.index=i;b.dataset.symbol=v;b.classList.toggle('empty',v===0);b.classList.toggle('stone',v<0);b.classList.toggle('chosen',selected===i);b.classList.toggle('hinted',hinted.includes(i));b.classList.toggle('popping',removed.has(i));b.disabled=v<=0||busy||win||lose;b.setAttribute('aria-label',`第 ${Math.floor(i/(link?s.cols:7))+1} 行第 ${i%(link?s.cols:7)+1} 列，${v>0?A.NAMES[v-1]:v<0?'石头':'空位'}`);b.setAttribute('aria-pressed',String(selected===i));board.append(b);});
   hint.disabled=shuffle.disabled=busy||win||lose;outcome.replaceChildren();if(!busy&&(win||lose)){outcome.append(el('p',win?(link?'「都牵上线了！这一页盖上星星印章。」':'「装满一小篮甜甜的好运，过关啦！」'):'「这次步数用完了，没关系。换个开局再试试，或歇一会儿都可以。」'));if(win){finish();const max=link?A.LINK_LEVELS:A.MATCH_LEVELS;if(s.level<max)outcome.append(btn('下一关',()=>options.onLevel?.(s.level+1),'primary'));else outcome.append(el('p','这本关卡册已经走完了，也可以回去重玩喜欢的一页。'));}else outcome.append(btn('再试一次',()=>options.onLevel?.(s.level),'primary'));}
  }
  if(link&&!done()&&!A.linkHint(s)){A.shuffleLink(s);s.helps--;save();}render();return{getState:()=>clone(s),destroy(){active=false;clearTimeout(timer);host.replaceChildren();}};
 }
 root.WitchArcadeUI={mount};
})(globalThis);
