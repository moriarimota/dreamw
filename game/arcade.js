/* Small deterministic puzzle engines. No DOM, storage or network. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.WitchArcade=api;})(globalThis,function(){
 'use strict';
 const LINK_LEVELS=36,MATCH_LEVELS=20;
 const SYMBOLS=['🌙','⭐','🍄','🍓','🌿','🐚','🦋','🔮','🗝','🪶','☀','♡'];
 const NAMES=['月亮','星星','蘑菇','浆果','香草','贝壳','蝴蝶','水晶','钥匙','羽毛','太阳','爱心'];
 function integer(v,min,max){if(!Number.isInteger(v)||v<min||v>max)throw Error('关卡数据不正确');return v;}
 function rand(s){let x=s.rng>>>0;x^=x<<13;x^=x>>>17;x^=x<<5;s.rng=x>>>0||1;return s.rng/4294967296;}
 function shuffle(a,s){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(rand(s)*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
 function meta(s,kind){if(!s||s.kind!==kind||!new RegExp('^'+kind+'-[0-9]{1,16}$').test(s.id))throw Error('小游戏编号不正确');return{kind,id:s.id,level:integer(s.level,1,kind==='link'?LINK_LEVELS:MATCH_LEVELS),rng:integer(s.rng,1,4294967295),celebrated:s.celebrated===true};}
 function linkConfig(level){integer(level,1,LINK_LEVELS);const chapter=Math.floor((level-1)/6),cols=chapter===0?4:6,rows=4+Math.floor(chapter/2)*2,types=Math.min(12,4+chapter+(level-1)%3),mask=Array(rows*cols).fill(1),pattern=(level-1)%6;
  if(pattern===2||pattern===5){mask[(rows/2-1)*cols+cols/2-1]=-1;mask[(rows/2)*cols+cols/2]=-1;}
  if(pattern===3){[0,cols-1,(rows-1)*cols,rows*cols-1].forEach(i=>mask[i]=0);}
  if(pattern===4&&rows>=6)for(let x=0;x<cols;x++)mask[(rows/2)*cols+x]=0;
  return{cols,rows,types,mask,chapter:['窗边初遇','香草小径','雨后蘑菇','月光邮局','星图书房','森林茶会'][chapter],layout:['整齐的桌面','花纹渐多','绕过小石头','四角留白','中间的小路','石间穿行'][pattern]};
 }
 // The outside border is walkable. Direction changes, not path length, are limited.
 function linkPath(s,a,b){const {cols,rows,board}=s;if(!Number.isInteger(a)||!Number.isInteger(b)||a===b||a<0||b<0||a>=board.length||b>=board.length||board[a]<=0||board[a]!==board[b])return null;
  const start={x:a%cols+1,y:Math.floor(a/cols)+1},end={x:b%cols+1,y:Math.floor(b/cols)+1},dirs=[[1,0],[0,1],[-1,0],[0,-1]],queue=[{...start,dir:-1,turns:0,path:[start]}],seen=new Map();
  for(let q=0;q<queue.length;q++){const p=queue[q];for(let d=0;d<4;d++){const turns=p.turns+(p.dir!==-1&&p.dir!==d?1:0);if(turns>2)continue;const x=p.x+dirs[d][0],y=p.y+dirs[d][1];if(x<0||x>cols+1||y<0||y>rows+1)continue;const target=x===end.x&&y===end.y;if(!target&&x>0&&x<=cols&&y>0&&y<=rows&&board[(y-1)*cols+x-1]!==0)continue;const path=p.path.concat({x,y});if(target)return path;const key=x+','+y+','+d;if((seen.get(key)??3)<=turns)continue;seen.set(key,turns);queue.push({x,y,dir:d,turns,path});}}return null;
 }
 function linkHint(s){for(let a=0;a<s.board.length;a++)if(s.board[a]>0)for(let b=a+1;b<s.board.length;b++)if(s.board[b]===s.board[a]){const path=linkPath(s,a,b);if(path)return{a,b,path};}return null;}
 // Solve the occupancy first, then assign equal symbols to removable pairs.
 // Thus at least one complete solution exists, including stone and empty layouts.
 function buildLink(s,values){const cfg=linkConfig(s.level);for(let attempt=0;attempt<20;attempt++){const work={...cfg,board:[...cfg.mask]},pairs=[];let left=work.board.filter(v=>v>0).length;
   while(left){const live=work.board.flatMap((v,i)=>v>0?[i]:[]);let match=null;for(let n=0;n<30&&!match;n++){const a=live[Math.floor(rand(s)*live.length)],b=live[Math.floor(rand(s)*live.length)];if(linkPath(work,a,b))match={a,b};}if(!match)match=linkHint(work);if(!match)break;pairs.push([match.a,match.b]);work.board[match.a]=work.board[match.b]=0;left-=2;}
   if(left)continue;const result=cfg.mask.map(v=>v===-1?-1:0);const symbols=values?shuffle(values,s):pairs.map(()=>1+Math.floor(rand(s)*cfg.types));symbols.forEach((v,i)=>{result[pairs[i][0]]=result[pairs[i][1]]=v;});return result;
  }throw Error('这张桌子暂时没摆好，请重新开始这一关');
 }
 function link(seed=Date.now(),level=1){const cfg=linkConfig(level),s={kind:'link',id:'link-'+seed,level,rng:(seed>>>0)||1,cols:cfg.cols,rows:cfg.rows,board:[],moves:0,helps:0,celebrated:false};s.board=buildLink(s);return s;}
 function isLinkDone(s){return s.board.every(v=>v<=0);}
 function removeLink(s,a,b){const path=linkPath(s,a,b);if(!path)return null;s.board[a]=s.board[b]=0;s.moves++;return path;}
 function shuffleLink(s){if(isLinkDone(s))return false;const count=Array(13).fill(0);s.board.forEach(v=>{if(v>0)count[v]++;});const values=[];count.forEach((n,v)=>{for(let i=0;i<n/2;i++)values.push(v);});s.board=buildLink(s,values);s.helps++;return true;}
 function cleanLink(s){const m=meta(s,'link'),cfg=linkConfig(m.level);if(s.cols!==cfg.cols||s.rows!==cfg.rows||!Array.isArray(s.board)||s.board.length!==cfg.mask.length)throw Error('连连看棋盘不完整');const board=s.board.map((v,i)=>{integer(v,-1,cfg.types);if((cfg.mask[i]===-1)!==(v===-1)||cfg.mask[i]===0&&v!==0)throw Error('连连看地形不一致');return v;});const moves=integer(s.moves,0,30),count=Array(13).fill(0);board.forEach(v=>{if(v>0)count[v]++;});if(count.some(n=>n%2)||2*moves+board.filter(v=>v>0).length!==cfg.mask.filter(v=>v>0).length)throw Error('连连看配对记录不一致');return{...m,cols:cfg.cols,rows:cfg.rows,board,moves,helps:integer(s.helps,0,1000000)};}
 function matchConfig(level){integer(level,1,MATCH_LEVELS);const target=400+level*65,colors=level<8?5:6,moves=30-Math.floor((level-1)/5),collect=level%3===0?{symbol:1+(level%colors),count:10+Math.floor(level*.65)}:null;return{size:7,colors,moves,target,collect};}
 function matches(board,size=7){const hit=new Set();let longest=0;for(let y=0;y<size;y++)for(let x=0;x<size;){const start=x,v=board[y*size+x];while(x<size&&board[y*size+x]===v)x++;if(v>0&&x-start>=3){longest=Math.max(longest,x-start);for(let j=start;j<x;j++)hit.add(y*size+j);}}for(let x=0;x<size;x++)for(let y=0;y<size;){const start=y,v=board[y*size+x];while(y<size&&board[y*size+x]===v)y++;if(v>0&&y-start>=3){longest=Math.max(longest,y-start);for(let j=start;j<y;j++)hit.add(j*size+x);}}return{indices:[...hit],longest};}
 function adjacent(a,b){return Math.abs(Math.floor(a/7)-Math.floor(b/7))+Math.abs(a%7-b%7)===1;}
 function matchHint(s){for(let a=0;a<49;a++)for(const b of [a+1,a+7])if(b<49&&adjacent(a,b)){const board=[...s.board];[board[a],board[b]]=[board[b],board[a]];if(matches(board).indices.length)return{a,b};}return null;}
 function freshMatch(s){const cfg=matchConfig(s.level);for(let tries=0;tries<100;tries++){const board=[];for(let i=0;i<49;i++){const candidates=Array.from({length:cfg.colors},(_,j)=>j+1).filter(v=>!(i%7>1&&board[i-1]===v&&board[i-2]===v)&&!(i>=14&&board[i-7]===v&&board[i-14]===v));board.push(candidates[Math.floor(rand(s)*candidates.length)]);}if(matchHint({board}))return board;}throw Error('暂时没摆好糖果，再试一次吧');}
 function match3(seed=Date.now(),level=1){const cfg=matchConfig(level),s={kind:'match3',id:'match3-'+seed,level,rng:(seed>>>0)||1,board:[],movesLeft:cfg.moves,turns:0,score:0,collected:Array(6).fill(0),helps:0,celebrated:false};s.board=freshMatch(s);return s;}
 function isMatchDone(s){const c=matchConfig(s.level);return s.score>=c.target&&(!c.collect||s.collected[c.collect.symbol-1]>=c.collect.count);}
 function swapMatch(s,a,b){integer(a,0,48);integer(b,0,48);if(!adjacent(a,b)||s.movesLeft<=0||isMatchDone(s))return{valid:false};const original=[...s.board];[s.board[a],s.board[b]]=[s.board[b],s.board[a]];let hit=matches(s.board);if(!hit.indices.length){s.board=original;return{valid:false};}const waves=[],cfg=matchConfig(s.level);s.movesLeft--;s.turns++;let chain=0,bonus=0;
  while(hit.indices.length){chain++;waves.push({board:[...s.board],removed:[...hit.indices]});bonus=Math.max(bonus,hit.longest>=5?2:hit.longest===4?1:0);for(const i of hit.indices){s.collected[s.board[i]-1]++;s.board[i]=0;}s.score+=hit.indices.length*10*Math.min(chain,5);
   for(let x=0;x<7;x++){const column=[];for(let y=6;y>=0;y--)if(s.board[y*7+x])column.push(s.board[y*7+x]);while(column.length<7)column.push(1+Math.floor(rand(s)*cfg.colors));for(let y=6;y>=0;y--)s.board[y*7+x]=column[6-y];}
   if(chain>=50){s.board=freshMatch(s);break;}hit=matches(s.board);
  }s.movesLeft+=bonus;let shuffled=false;if(!isMatchDone(s)&&s.movesLeft>0&&!matchHint(s)){s.board=freshMatch(s);shuffled=true;}return{valid:true,waves,chain,bonus,shuffled};
 }
 function shuffleMatch(s){if(isMatchDone(s)||s.movesLeft<=0)return false;s.board=freshMatch(s);s.helps++;return true;}
 function cleanMatch(s){const m=meta(s,'match3'),cfg=matchConfig(m.level);if(!Array.isArray(s.board)||s.board.length!==49||!Array.isArray(s.collected)||s.collected.length!==6)throw Error('消消乐棋盘不完整');const board=s.board.map(v=>integer(v,1,cfg.colors)),result={...m,board,movesLeft:integer(s.movesLeft,0,1000000),turns:integer(s.turns,0,1000000),score:integer(s.score,0,1000000000),collected:s.collected.map(v=>integer(v,0,10000000)),helps:integer(s.helps,0,1000000)};if(matches(board).indices.length)throw Error('消消乐还未结算完成');if(result.movesLeft>cfg.moves+result.turns)throw Error('消消乐步数不一致');if(result.collected.reduce((a,b)=>a+b,0)*10>result.score)throw Error('消除记录不一致');return result;}
 function cleanProgress(value){const s=value||{},out={link:Array(LINK_LEVELS).fill(0),match3:Array(MATCH_LEVELS).fill(0)};for(const kind of ['link','match3'])if(s[kind]!==undefined){if(!Array.isArray(s[kind])||s[kind].length!==out[kind].length)throw Error('关卡册不完整');out[kind]=s[kind].map(v=>integer(v,0,kind==='link'?3:1000000000));}return out;}
 const base={LINK_LEVELS,MATCH_LEVELS,SYMBOLS,NAMES,linkConfig,link,linkPath,linkHint,removeLink,shuffleLink,cleanLink,isLinkDone,matchConfig,match3,matches,matchHint,swapMatch,shuffleMatch,cleanMatch,isMatchDone,cleanProgress};
 const enhance=globalThis.WitchArcadePlus||(typeof require==='function'?require('./arcade-plus.js'):null);return enhance?enhance(base):base;
});
