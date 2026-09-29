/* Local practice boards. Moves are replayed when importing; no network AI. */
(function(r,f){const a=f();r.WitchBoards=a;if(typeof module==='object')module.exports=a;})(globalThis,function(){
 'use strict';const copy=x=>JSON.parse(JSON.stringify(x));
 function integer(x,a,b){if(!Number.isInteger(x)||x<a||x>b)throw Error('棋局数字不正确');return x;}
 const neighbors=(i,n)=>[i%n?i-1:-1,i%n<n-1?i+1:-1,i>=n?i-n:-1,i<n*(n-1)?i+n:-1].filter(v=>v>=0);
 function group(board,i,n){const color=board[i],stones=new Set([i]),liberties=new Set(),todo=[i];if(!color)return{stones:[],liberties:[]};while(todo.length){for(const j of neighbors(todo.pop(),n)){if(!board[j])liberties.add(j);else if(board[j]===color&&!stones.has(j)){stones.add(j);todo.push(j);}}}return{stones:[...stones],liberties:[...liberties]};}
 function go(seed=Date.now(),mode='capture',opponent='partner'){if(!['capture','practice'].includes(mode))throw Error('围棋模式不正确');return{kind:'go',id:'go-'+seed,mode,opponent:opponent==='local'?'local':'partner',size:mode==='capture'?5:9,board:Array(mode==='capture'?25:81).fill(0),turn:1,moves:[],positions:[Array(mode==='capture'?25:81).fill(0).join('')],captures:[0,0],passes:0,scoring:false,dead:[],scoreAccepted:false,winner:null,celebrated:false};}
 function goTry(s,index){if(s.winner||s.scoring||s.moves.length>=400)return{error:'这盘已收好，请开始新的一盘'};if(index===-1)return{board:[...s.board],taken:0};integer(index,0,s.board.length-1);if(s.board[index])return{error:'交叉点上已经有棋子'};const b=[...s.board];b[index]=s.turn;let taken=0;for(const j of neighbors(index,s.size)){if(b[j]===3-s.turn){const g=group(b,j,s.size);if(!g.liberties.length){taken+=g.stones.length;g.stones.forEach(k=>b[k]=0);}}}if(!group(b,index,s.size).liberties.length)return{error:'这里没有气，也不能提子，不能落子'};if(s.positions.includes(b.join('')))return{error:'不能立即重复以前的局面，请在别处走一步（本练习采用全局同形禁着）'};return{board:b,taken};}
 function goMove(s,index){const r=goTry(s,index);if(r.error)return r;const side=s.turn;s.board=r.board;s.captures[side-1]+=r.taken;s.moves.push(index);s.positions.push(s.board.join(''));s.passes=index===-1?s.passes+1:0;s.turn=3-side;if(s.mode==='capture'&&r.taken)s.winner=side;else if(s.passes>=2){if(s.mode==='capture')s.winner='draw';else s.scoring=true;}if(s.moves.length===400&&!s.winner)s.scoring=true;return{ok:true,taken:r.taken};}
 function goScore(s){const b=[...s.board];s.dead.forEach(i=>b[i]=0);const score=[0,0],seen=new Set();for(let i=0;i<b.length;i++){if(b[i]){score[b[i]-1]++;continue;}if(seen.has(i))continue;const empty=[i],border=new Set(),todo=[i];seen.add(i);while(todo.length){for(const j of neighbors(todo.pop(),s.size)){if(b[j])border.add(b[j]);else if(!seen.has(j)){seen.add(j);empty.push(j);todo.push(j);}}}if(border.size===1)score[[...border][0]-1]+=empty.length;}return{black:score[0],white:score[1],winner:score[0]===score[1]?'draw':score[0]>score[1]?1:2};}
 function markDead(s,i){if(!s.scoring||s.winner||!s.board[i])return false;const g=group(s.board,i,s.size).stones,on=s.dead.includes(i);s.dead=on?s.dead.filter(j=>!g.includes(j)):[...new Set([...s.dead,...g])];return true;}
 function acceptScore(s){if(!s.scoring||s.winner)return false;s.winner=goScore(s).winner;s.scoreAccepted=true;return true;}
 function continueGo(s){if(!s.scoring||s.winner||s.moves.length>=400)return false;s.scoring=false;s.dead=[];s.passes=0;/* A continuation is recorded, making replay unambiguous. */s.moves.push(-2);return true;}
 function goAI(s){let best=-1,value=-Infinity;for(let i=0;i<s.board.length;i++){if(s.board[i])continue;const r=goTry(s,i);if(r.error)continue;const own=group(r.board,i,s.size),near=neighbors(i,s.size),touch=near.filter(j=>s.board[j]===3-s.turn).length;let v=r.taken*40+Math.min(own.liberties.length,4)*2+touch*3;
  const connected=near.filter(j=>s.board[j]===s.turn);if(connected.length&&near.every(j=>s.board[j]===s.turn))v-=30;for(const j of connected)if(group(s.board,j,s.size).liberties.length===1)v+=14;if(own.liberties.length===1)v-=25;const x=i%s.size,y=Math.floor(i/s.size);v-=.18*(Math.abs(x-(s.size-1)/2)+Math.abs(y-(s.size-1)/2));v+=((i*17+s.moves.length*7)%13)*.01;if(v>value){value=v;best=i;}}
  return value<0?-1:best;
 }
 function cleanGo(v){if(!v||v.kind!=='go'||!/^go-\d{1,16}$/.test(v.id)||!Array.isArray(v.moves)||v.moves.length>401)throw Error('围棋记录不正确');const s=go(Number(v.id.slice(3)),v.mode,v.opponent);for(const i of v.moves){integer(i,-2,s.board.length-1);if(i===-2){if(!continueGo(s))throw Error('续弈记录不正确');}else if(!goMove(s,i).ok)throw Error('围棋包含非法落子');}if(s.scoring){if(!Array.isArray(v.dead)||v.dead.length>s.board.length)throw Error('死子标记不正确');s.dead=[...new Set(v.dead.map(i=>integer(i,0,s.board.length-1)))];if(s.dead.some(i=>!s.board[i]))throw Error('不能把空位标作死子');for(const i of s.dead)if(group(s.board,i,s.size).stones.some(j=>!s.dead.includes(j)))throw Error('同一块棋需要一起标记');if(v.scoreAccepted)acceptScore(s);}s.celebrated=!!v.celebrated&&!!s.winner;return s;}
 function undoGo(s){if(!s.moves.length)return s;const moves=s.moves.slice(0,-(s.opponent==='partner'&&s.turn===1&&s.moves.length>=2?2:1));return cleanGo({...s,moves,dead:[],scoreAccepted:false,celebrated:false});}
 const NAMES={k:['将','帅'],a:['士','仕'],e:['象','相'],h:['马','马'],r:['车','车'],c:['炮','炮'],p:['卒','兵']},VALUES={k:10000,r:90,c:45,h:40,e:20,a:20,p:12};
 const sign=x=>x?x[0]==='r'?1:2:0,pc=(side,k)=>(side===1?'r':'b')+k,xy=i=>[i%9,Math.floor(i/9)],palace=(x,y,s)=>x>=3&&x<=5&&(s===1?y>=7&&y<=9:y<=2&&y>=0);
 function initialXQ(){const b=Array(90).fill(null),row=['r','h','e','a','k','a','e','h','r'];for(let x=0;x<9;x++){b[x]=pc(2,row[x]);b[81+x]=pc(1,row[x]);}for(const x of [1,7]){b[18+x]=pc(2,'c');b[63+x]=pc(1,'c');}for(const x of [0,2,4,6,8]){b[27+x]=pc(2,'p');b[54+x]=pc(1,'p');}return b;}
 function between(b,a,z){const[x,y]=xy(a),[u,v]=xy(z);if(x!==u&&y!==v)return -1;const step=x===u?(v>y?9:-9):(u>x?1:-1);let n=0;for(let i=a+step;i!==z;i+=step)if(b[i])n++;return n;}
 function pseudo(b,a,z){if(a===z||!b[a]||sign(b[a])===sign(b[z]))return false;const side=sign(b[a]),k=b[a][1],[x,y]=xy(a),[u,v]=xy(z),dx=u-x,dy=v-y,ax=Math.abs(dx),ay=Math.abs(dy);
  if(k==='k'){if(b[z]===pc(3-side,'k')&&x===u&&between(b,a,z)===0)return true;return palace(u,v,side)&&ax+ay===1;}
  if(k==='a')return palace(u,v,side)&&ax===1&&ay===1;
  if(k==='e')return ax===2&&ay===2&&(side===1?v>=5:v<=4)&&!b[(y+dy/2)*9+x+dx/2];
  if(k==='h')return(ax===2&&ay===1&&!b[y*9+x+dx/2])||(ax===1&&ay===2&&!b[(y+dy/2)*9+x]);
  if(k==='r')return between(b,a,z)===0;
  if(k==='c'){const n=between(b,a,z);return b[z]?n===1:n===0;}
  if(k==='p')return dx===0&&dy===(side===1?-1:1)||(side===1?y<=4:y>=5)&&ay===0&&ax===1;
  return false;
 }
 function check(b,side){const k=b.indexOf(pc(side,'k'));if(k<0)return true;return b.some((p,i)=>sign(p)===3-side&&pseudo(b,i,k));}
 function legalXQ(s,a,z){if(s.winner||sign(s.board[a])!==s.turn||!pseudo(s.board,a,z))return false;const b=[...s.board];b[z]=b[a];b[a]=null;return!check(b,s.turn);}
 function xqMoves(s){const moves=[];if(s.winner)return moves;for(let a=0;a<90;a++)if(sign(s.board[a])===s.turn)for(let z=0;z<90;z++)if(legalXQ(s,a,z))moves.push([a,z]);return moves;}
 function xq(seed=Date.now(),opponent='partner'){const b=initialXQ();return{kind:'xiangqi',id:'xiangqi-'+seed,opponent:opponent==='local'?'local':'partner',board:b,turn:1,moves:[],positions:[b.join(',')+':1'],winner:null,reason:'',celebrated:false};}
 function xqMove(s,a,z){integer(a,0,89);integer(z,0,89);if(!legalXQ(s,a,z))return{error:'这步不能走：检查走法、挡路和将军'};const side=s.turn;s.board[z]=s.board[a];s.board[a]=null;s.moves.push([a,z]);s.turn=3-side;const key=s.board.join(',')+':'+s.turn;s.positions.push(key);
  if(!s.board.includes(pc(s.turn,'k'))||!xqMoves(s).length){s.winner=side;s.reason=check(s.board,s.turn)?'将死':'无棋可走，困毙判负';}
  else if(s.positions.filter(k=>k===key).length>=3){s.winner='draw';s.reason='本练习采用三次同局面和棋（非正式长将长捉裁定）';}
  else if(s.moves.length>=400){s.winner='draw';s.reason='练习达到400步，收为和棋';}return{ok:true,check:check(s.board,s.turn)};
 }
 function xqAI(s){const all=xqMoves(s);let best=null,value=-Infinity;for(const m of all){const b=[...s.board],target=b[m[1]],piece=b[m[0]],side=s.turn;b[m[1]]=piece;b[m[0]]=null;let v=target?VALUES[target[1]]*10:0;const unsafe=b.some((p,i)=>sign(p)===3-side&&pseudo(b,i,m[1]));if(unsafe)v-=VALUES[piece[1]]*9;if(check(b,3-side))v+=8;if(piece[1]==='p')v+=2;v+=((m[0]*11+m[1]*7+s.moves.length)%19)*.04;if(v>value){value=v;best=m;}}return best;}
 function cleanXQ(v){if(!v||v.kind!=='xiangqi'||!/^xiangqi-\d{1,16}$/.test(v.id)||!Array.isArray(v.moves)||v.moves.length>400)throw Error('象棋记录不正确');const s=xq(Number(v.id.slice(8)),v.opponent);for(const m of v.moves){if(!Array.isArray(m)||m.length!==2||!xqMove(s,m[0],m[1]).ok)throw Error('象棋包含非法走法');}s.celebrated=!!v.celebrated&&!!s.winner;return s;}
 function undoXQ(s){return cleanXQ({...s,moves:s.moves.slice(0,-(s.opponent==='partner'&&s.turn===1&&s.moves.length>=2?2:1)),celebrated:false});}
 return{copy,group,go,goTry,goMove,goScore,markDead,acceptScore,continueGo,goAI,cleanGo,undoGo,NAMES,sign,pseudo,check,legalXQ,xqMoves,xq,xqMove,xqAI,cleanXQ,undoXQ};
});
