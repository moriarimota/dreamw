/* v5 rule variants. The original boards remain loadable as legacy mode. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory;root.WitchArcadePlus=factory;})(globalThis,function(B){
 'use strict';const MODES={legacy:'旧版轻松',normal:'普通',hard:'困难',expert:'挑战'},FLOWS={still:'静止棋盘',in:'向中心收拢',out:'向四角散开',down:'向下落',cycle:'四向轮转'},MATCH_MODES={classic:'经典',garden:'融霜花园',tide:'潮汐魔法'};
 const clone=x=>JSON.parse(JSON.stringify(x));
 function num(v,min,max){if(!Number.isInteger(v)||v<min||v>max)throw Error('棋盘数值不正确');return v;}
 function pick(v,options){if(!Object.hasOwn(options,v))throw Error('未知棋盘模式');return v;}
 function rand(s){let x=s.rng>>>0;x^=x<<13;x^=x>>>17;x^=x<<5;s.rng=x>>>0||1;return s.rng/4294967296;}
 function shuffle(a,s){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(rand(s)*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
 function linkPath(s,a,b){const w=s.cols,h=s.rows;if(!Number.isInteger(a)||!Number.isInteger(b)||a<0||b<0||a>=w*h||b>=w*h||a===b||s.board[a]<=0||s.board[a]!==s.board[b])return null;const p={x:a%w+1,y:Math.floor(a/w)+1},q={x:b%w+1,y:Math.floor(b/w)+1};
  const empty=t=>t.x===0||t.x===w+1||t.y===0||t.y===h+1||s.board[(t.y-1)*w+t.x-1]===0,same=(u,v)=>u.x===v.x&&u.y===v.y;
  function clear(u,v){if(u.x!==v.x&&u.y!==v.y)return false;const dx=Math.sign(v.x-u.x),dy=Math.sign(v.y-u.y);let x=u.x+dx,y=u.y+dy;while(x!==v.x||y!==v.y){if(!empty({x,y}))return false;x+=dx;y+=dy;}return true;}
  function route(points){const arr=points.filter((v,i)=>!i||!same(v,points[i-1]));if(arr.slice(1,-1).some(t=>!empty(t)))return null;for(let i=1;i<arr.length;i++)if(!clear(arr[i-1],arr[i]))return null;return arr;}
  if(clear(p,q))return[p,q];for(const k of [{x:p.x,y:q.y},{x:q.x,y:p.y}]){const r=route([p,k,q]);if(r)return r;}for(let x=0;x<=w+1;x++){const r=route([p,{x,y:p.y},{x,y:q.y},q]);if(r)return r;}for(let y=0;y<=h+1;y++){const r=route([p,{x:p.x,y},{x:q.x,y},q]);if(r)return r;}return null;
 }
 function linkHint(s){for(let a=0;a<s.board.length;a++)if(s.board[a]>0)for(let b=a+1;b<s.board.length;b++)if(s.board[a]===s.board[b]){const path=linkPath(s,a,b);if(path)return{a,b,path};}return null;}
 function linkConfig(level,mode='legacy',flow='still'){
  pick(mode,MODES);pick(flow,FLOWS);if(mode==='legacy')return{...B.linkConfig(level),helpLimit:Infinity,mode,flow};num(level,1,36);
  const cols=mode==='normal'?6:8,rows=mode==='normal'?8:mode==='hard'?10:12,types=mode==='normal'?8+Math.floor((level-1)/12):12,mask=Array(cols*rows).fill(1),pattern=(level-1)%6;
  if(pattern===1||pattern===4)for(const [r,c]of [[2,2],[rows-3,cols-3]])mask[r*cols+c]=-1;
  if(pattern===2||pattern===5)for(const [r,c]of [[2,2],[2,cols-3],[rows-3,2],[rows-3,cols-3]])mask[r*cols+c]=-1;
  if(pattern===3){mask[0]=mask[cols-1]=mask[(rows-1)*cols]=mask[rows*cols-1]=0;}
  return{cols,rows,types,mask,chapter:['苔石小径','雨雾花圃','星灯邮局','流动书房','潮汐回廊','月下迷阵'][Math.floor((level-1)/6)],layout:FLOWS[flow],mode,flow,helpLimit:mode==='normal'?Infinity:mode==='hard'?6:3};
 }
 function slide(s){const cfg=linkConfig(s.level,s.mode,s.flow);let f=s.flow;if(f==='cycle')f=['left','down','right','up'][(s.moves-1+4)%4];if(f==='still')return;
  function pack(indices,towardEnd){let segment=[];function flush(){const vals=segment.map(i=>s.board[i]).filter(v=>v>0),zeros=Array(segment.length-vals.length).fill(0),next=towardEnd?zeros.concat(vals):vals.concat(zeros);segment.forEach((i,j)=>s.board[i]=next[j]);segment=[];}for(const i of indices){if(cfg.mask[i]<=0)flush();else segment.push(i);}flush();}
  if(['left','right'].includes(f)){for(let y=0;y<s.rows;y++)pack(Array.from({length:s.cols},(_,x)=>y*s.cols+x),f==='right');}
  if(['up','down'].includes(f)){for(let x=0;x<s.cols;x++)pack(Array.from({length:s.rows},(_,y)=>y*s.cols+x),f==='down');}
  if(['in','out'].includes(f)){for(let y=0;y<s.rows;y++){pack(Array.from({length:s.cols/2},(_,x)=>y*s.cols+x),f==='in');pack(Array.from({length:s.cols/2},(_,x)=>y*s.cols+x+s.cols/2),f==='out');}for(let x=0;x<s.cols;x++){pack(Array.from({length:s.rows/2},(_,y)=>y*s.cols+x),f==='in');pack(Array.from({length:s.rows/2},(_,y)=>(y+s.rows/2)*s.cols+x),f==='out');}}
 }
 function removeLink(s,a,b){const path=linkPath(s,a,b);if(!path)return null;s.board[a]=s.board[b]=0;s.moves++;slide(s);return path;}
 function greedilySolvable(s){const copy=clone(s);for(let n=0;n<80&&!B.isLinkDone(copy);n++){const h=linkHint(copy);if(!h)return false;removeLink(copy,h.a,h.b);}return B.isLinkDone(copy);}
 function generateLink(s,remaining){const c=linkConfig(s.level,s.mode,s.flow),slots=c.mask.flatMap((v,i)=>v===1?[i]:[]),pairs=remaining||Array.from({length:slots.length/2},(_,i)=>i%c.types+1);let best=null,bestAdjacent=Infinity;
  for(let attempt=0;attempt<36;attempt++){const symbols=shuffle(pairs.flatMap(v=>[v,v]),s),positions=shuffle(slots,s),board=c.mask.map(v=>v<0?-1:0);symbols.forEach((v,i)=>board[positions[i]]=v);const candidate={...s,board};if(!linkHint(candidate)||!greedilySolvable(candidate))continue;let adjacent=0;board.forEach((v,i)=>{if(v>0){if(i%s.cols<s.cols-1&&v===board[i+1])adjacent++;if(v===board[i+s.cols])adjacent++;}});if(adjacent<bestAdjacent){best=board;bestAdjacent=adjacent;}if(adjacent<=(s.mode==='expert'?3:s.mode==='hard'?5:8))break;}
  if(best)return best;
  // A fully removable fallback in row order; later player choices still change the route.
  const result=c.mask.map(v=>v<0?-1:0);let n=0;for(const v of pairs){result[slots[n++]]=v;result[slots[n++]]=v;}return result;
 }
 function link(seed=Date.now(),level=1,mode='legacy',flow='still'){const c=linkConfig(level,mode,flow);if(mode==='legacy')return{...B.link(seed,level),mode,flow:'still'};const s={kind:'link',id:'link-'+seed,level,mode,flow,rng:(seed>>>0)||1,cols:c.cols,rows:c.rows,board:[],moves:0,helps:0,celebrated:false};s.board=generateLink(s);return s;}
 const canHelp=s=>s.helps<linkConfig(s.level,s.mode||'legacy',s.flow||'still').helpLimit;
 function shuffleLink(s,automatic=false){if(B.isLinkDone(s)||!canHelp(s))return false;if((s.mode||'legacy')==='legacy'){const ok=B.shuffleLink(s);if(automatic)s.helps--;return ok;}const counts={};s.board.forEach(v=>{if(v>0)counts[v]=(counts[v]||0)+1;});const pairs=Object.entries(counts).flatMap(([v,n])=>Array(n/2).fill(Number(v)));s.board=generateLink(s,pairs);s.helps++;return true;}
 function cleanLink(s){const mode=pick(s.mode||'legacy',MODES),flow=pick(s.flow||'still',FLOWS);if(mode==='legacy')return{...B.cleanLink(s),mode,flow:'still'};
  const cfg=linkConfig(s.level,mode,flow);if(s.kind!=='link'||!/^link-\d{1,16}$/.test(s.id)||s.cols!==cfg.cols||s.rows!==cfg.rows||s.board?.length!==cfg.mask.length)throw Error('连连看棋盘不完整');const board=s.board.map((v,i)=>{num(v,-1,cfg.types);if((cfg.mask[i]===-1)!==(v===-1)||cfg.mask[i]===0&&v!==0)throw Error('地形不一致');return v;}),counts={};board.forEach(v=>{if(v>0)counts[v]=(counts[v]||0)+1;});const moves=num(s.moves,0,60);if(Object.values(counts).some(n=>n%2)||2*moves+board.filter(v=>v>0).length!==cfg.mask.filter(v=>v>0).length)throw Error('配对数量不一致');return{kind:'link',id:s.id,level:s.level,mode,flow,cols:s.cols,rows:s.rows,board,moves,helps:num(s.helps,0,1000000),rng:num(s.rng,1,4294967295),celebrated:s.celebrated===true};
 }
 function matchConfig(level,mode='classic'){pick(mode,MATCH_MODES);const c=B.matchConfig(level);return{...c,mode,target:mode==='classic'?c.target:c.target+250,moves:mode==='classic'?c.moves:c.moves+5,collect:mode==='classic'?c.collect:null};}
 function match3(seed=Date.now(),level=1,mode='classic'){const s=B.match3(seed,level),c=matchConfig(level,mode);s.mode=mode;s.movesLeft=c.moves;s.specials=Array(49).fill(0);s.frost=Array(49).fill(0);if(mode==='garden')for(let y=1;y<6;y+=2)for(let x=1;x<6;x+=2)s.frost[y*7+x]=level>=10?2:1;s.gravity='down';return s;}
 function isMatchDone(s){const c=matchConfig(s.level,s.mode||'classic');return s.score>=c.target&&(!c.collect||s.collected[c.collect.symbol-1]>=c.collect.count)&&!(s.frost||[]).some(Boolean);}
 function matchHint(s){if(s.specials)for(let i=0;i<49;i++)if(s.specials[i]===3){return{a:i,b:i%7<6?i+1:i-1};}return B.matchHint(s);}
 function fresh(s){const temp=B.match3(s.rng,s.level);s.rng=temp.rng;s.board=temp.board;s.specials=Array(49).fill(0);}
 function swapMatch(s,a,b){num(a,0,48);num(b,0,48);if(Math.abs(a%7-b%7)+Math.abs(Math.floor(a/7)-Math.floor(b/7))!==1||s.movesLeft<=0||isMatchDone(s))return{valid:false};s.specials=s.specials||Array(49).fill(0);s.frost=s.frost||Array(49).fill(0);const before=clone(s),special=s.specials[a]===3?a:s.specials[b]===3?b:-1;
  [s.board[a],s.board[b]]=[s.board[b],s.board[a]];[s.specials[a],s.specials[b]]=[s.specials[b],s.specials[a]];let hit=B.matches(s.board);if(special>=0){const color=before.board[special===a?b:a];hit={indices:s.board.flatMap((v,i)=>v===color||i===a||i===b?[i]:[]),longest:0};}
  if(!hit.indices.length){Object.assign(s,before);return{valid:false};}s.movesLeft--;s.turns++;const waves=[],cfg=matchConfig(s.level,s.mode||'classic');let chain=0,bonus=0,created=0;
  while(hit.indices.length){chain++;const set=new Set(hit.indices),visited=new Set();let make=-1,type=0;
   if(chain===1&&special<0&&hit.longest>=4&&(s.mode||'classic')!=='classic'){make=hit.indices.includes(b)?b:a;type=hit.longest>=5?3:(hit.indices.filter(i=>Math.floor(i/7)===Math.floor(make/7)).length>=4?1:2);if(s.specials[make])make=-1;}
   for(const i of set){if(visited.has(i))continue;visited.add(i);const power=s.specials[i];if(power===1)for(let x=0;x<7;x++)set.add(Math.floor(i/7)*7+x);if(power===2)for(let y=0;y<7;y++)set.add(y*7+i%7);if(power===3)s.board.forEach((v,j)=>{if(v===s.board[i])set.add(j);});}
   if(make>=0){set.delete(make);s.specials[make]=type;created=type;}
   waves.push({board:[...s.board],removed:[...set]});bonus=Math.max(bonus,hit.longest>=5?2:hit.longest===4?1:0);for(const i of set){if(s.frost[i]>0)s.frost[i]--;s.collected[s.board[i]-1]++;s.board[i]=0;s.specials[i]=0;}s.score+=set.size*10*Math.min(chain,5);
   const up=s.mode==='tide'&&s.turns%2===0;s.gravity=up?'up':'down';for(let x=0;x<7;x++){const order=Array.from({length:7},(_,y)=>(up?y:6-y)*7+x),items=order.filter(i=>s.board[i]).map(i=>[s.board[i],s.specials[i]]);while(items.length<7)items.push([1+Math.floor(rand(s)*cfg.colors),0]);order.forEach((i,j)=>{s.board[i]=items[j][0];s.specials[i]=items[j][1];});}
   if(chain>=50){fresh(s);break;}hit=B.matches(s.board);
  }s.movesLeft+=bonus;let shuffled=false;if(!isMatchDone(s)&&s.movesLeft>0&&!matchHint(s)){fresh(s);shuffled=true;}return{valid:true,waves,chain,bonus,created,shuffled};
 }
 function shuffleMatch(s){if(isMatchDone(s)||s.movesLeft<=0)return false;fresh(s);s.helps++;return true;}
 function cleanMatch(s){const mode=pick(s.mode||'classic',MATCH_MODES),cfg=matchConfig(s.level,mode);const base=B.cleanMatch({...s,movesLeft:Math.min(s.movesLeft,B.matchConfig(s.level).moves+s.turns)});const arr=(v,max)=>(v===undefined?Array(49).fill(0):v.length===49?v.map(n=>num(n,0,max)):(()=>{throw Error('魔法棋盘数据不完整');})());base.movesLeft=num(s.movesLeft,0,cfg.moves+s.turns);return{...base,mode,specials:arr(s.specials,3),frost:arr(s.frost,2),gravity:s.gravity==='up'?'up':'down'};}
 function cleanProgress(value){const out=B.cleanProgress(value);out.linkVariants={};out.matchVariants={};for(const[k,v]of Object.entries(value?.linkVariants||{})){const split=k.split('-');if(split.length!==2||split[0]==='legacy')throw Error('连连看成绩类型不正确');pick(split[0],MODES);pick(split[1],FLOWS);if(v.length!==36)throw Error('关卡册长度不正确');out.linkVariants[k]=v.map(n=>num(n,0,3));}for(const[k,v]of Object.entries(value?.matchVariants||{})){pick(k,MATCH_MODES);if(v.length!==20)throw Error('关卡册长度不正确');out.matchVariants[k]=v.map(n=>num(n,0,1000000000));}return out;}
 return{...B,MODES,FLOWS,MATCH_MODES,linkPath,linkHint,linkConfig,link,cleanLink,removeLink,shuffleLink,slide,canHelp,greedilySolvable,matchConfig,match3,isMatchDone,matchHint,swapMatch,shuffleMatch,cleanMatch,cleanProgress};
});
