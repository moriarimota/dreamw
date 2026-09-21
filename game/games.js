(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.WitchGames=api;})(globalThis,function(){
 'use strict';
 const clone=x=>JSON.parse(JSON.stringify(x));
 function rng(seed){let a=seed>>>0;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
 function shuffle(items,random){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
 function int(x,min,max){if(!Number.isInteger(x)||x<min||x>max)throw Error('小游戏数值不正确');return x;}
 function array(a,length,min,max){if(!Array.isArray(a)||a.length!==length)throw Error('小游戏棋盘不完整');return a.map(v=>int(v,min,max));}
 function meta(s,kind){if(!s||s.kind!==kind||typeof s.id!=='string'||!new RegExp('^'+kind+'-[0-9]{1,16}$').test(s.id))throw Error('小游戏记录不正确');return{kind,id:s.id,celebrated:s.celebrated===true};}
 function allowed(board,index,value){const r=Math.floor(index/9),c=index%9;for(let n=0;n<9;n++){if(board[r*9+n]===value||board[n*9+c]===value||board[(Math.floor(r/3)*3+Math.floor(n/3))*9+Math.floor(c/3)*3+n%3]===value)return false;}return true;}
 function solve(givens,limit=2){const board=[...givens],solutions=[];for(let i=0;i<81;i++){const v=board[i];if(v){board[i]=0;if(!allowed(board,i,v))return solutions;board[i]=v;}}
  function walk(){if(solutions.length>=limit)return;let best=-1,choices=[];for(let i=0;i<81;i++)if(!board[i]){const c=[];for(let v=1;v<=9;v++)if(allowed(board,i,v))c.push(v);if(!c.length)return;if(best<0||c.length<choices.length){best=i;choices=c;if(c.length===1)break;}}if(best<0){solutions.push([...board]);return;}for(const v of choices){board[best]=v;walk();if(solutions.length>=limit)break;}board[best]=0;}
  walk();return solutions;
 }
 function sudoku(seed=Date.now(),difficulty='easy'){
  if(!['easy','standard'].includes(difficulty))throw Error('未知的数独难度');const random=rng(seed),triples=()=>shuffle([0,1,2],random).flatMap(g=>shuffle([0,1,2],random).map(n=>g*3+n));const rows=triples(),cols=triples(),digits=shuffle([1,2,3,4,5,6,7,8,9],random);const solution=rows.flatMap(r=>cols.map(c=>digits[(r*3+Math.floor(r/3)+c)%9]));const givens=[...solution];let count=81,target=difficulty==='easy'?43:34;
  for(const i of shuffle(Array.from({length:81},(_,i)=>i),random)){if(count<=target)break;const old=givens[i];givens[i]=0;if(solve(givens,2).length===1)count--;else givens[i]=old;}
  return{kind:'sudoku',id:'sudoku-'+seed,difficulty,givens,values:[...givens],notes:Array(81).fill(0),hints:0,celebrated:false};
 }
 function cleanSudoku(s){const m=meta(s,'sudoku'),givens=array(s.givens,81,0,9),values=array(s.values,81,0,9),notes=array(s.notes,81,0,511);if(givens.filter(Boolean).length<17||solve(givens,2).length!==1)throw Error('数独题目需要唯一答案');if(givens.some((v,i)=>v&&values[i]!==v))throw Error('数独题面不能被改动');return{...m,difficulty:['easy','standard'].includes(s.difficulty)?s.difficulty:'easy',givens,values,notes,hints:int(s.hints,0,81)};}
 function enterSudoku(s,index,value,note=false){int(index,0,80);int(value,0,9);if(s.givens[index]||isSudokuDone(s))return false;if(note&&value){if(s.values[index])return false;s.notes[index]^=1<<(value-1);}else{s.values[index]=value;s.notes[index]=0;}return true;}
 function conflicts(s){const result=[];s.values.forEach((v,i)=>{if(!v)return;const board=[...s.values];board[i]=0;if(!allowed(board,i,v))result.push(i);});return result;}
 function isSudokuDone(s){return s.values.every(Boolean)&&conflicts(s).length===0;}
 function hintSudoku(s,index){const answer=solve(s.givens,1)[0];if(!answer||isSudokuDone(s))return null;let i=Number.isInteger(index)&&!s.givens[index]&&s.values[index]!==answer[index]?index:s.values.findIndex((v,j)=>v!==answer[j]&&!s.givens[j]);if(i<0)return null;s.values[i]=answer[i];s.notes[i]=0;s.hints=Math.min(81,s.hints+1);return{index:i,value:answer[i],text:'这一格是 '+answer[i]+'。再看看同一行、同一列和这一小宫，还缺哪些数字。'};}
 function puzzle(seed=Date.now(),size=3,image='cottage'){if(![3,4].includes(size)||!['cottage','courtyard'].includes(image))throw Error('拼图选项不正确');const count=size*size,tiles=shuffle(Array.from({length:count},(_,i)=>i),rng(seed));if(tiles.every((v,i)=>v===i))[tiles[0],tiles[1]]=[tiles[1],tiles[0]];return{kind:'puzzle',id:'puzzle-'+seed,size,image,tiles,moves:0,celebrated:false};}
 function cleanPuzzle(s){const m=meta(s,'puzzle'),size=int(s.size,3,4),tiles=array(s.tiles,size*size,0,size*size-1);if(new Set(tiles).size!==tiles.length||!['cottage','courtyard'].includes(s.image))throw Error('拼图碎片不完整');return{...m,size,image:s.image,tiles,moves:int(s.moves,0,1000000)};}
 function swapPuzzle(s,a,b){int(a,0,s.tiles.length-1);int(b,0,s.tiles.length-1);if(a===b||isPuzzleDone(s))return false;[s.tiles[a],s.tiles[b]]=[s.tiles[b],s.tiles[a]];s.moves++;return true;}
 const isPuzzleDone=s=>s.tiles.every((v,i)=>v===i);
 function pairs(seed=Date.now()){return{kind:'pairs',id:'pairs-'+seed,deck:shuffle([0,0,1,1,2,2,3,3,4,4,5,5],rng(seed)),matched:[],open:[],moves:0,celebrated:false};}
 function cleanPairs(s){const m=meta(s,'pairs'),deck=array(s.deck,12,0,5);if(Array.from({length:6},(_,v)=>deck.filter(n=>n===v).length).some(n=>n!==2))throw Error('翻牌图案不完整');if(!Array.isArray(s.matched)||!Array.isArray(s.open)||s.open.length>2)throw Error('翻牌记录不正确');const matched=s.matched.map(v=>int(v,0,11)),open=s.open.map(v=>int(v,0,11));if(new Set([...matched,...open]).size!==matched.length+open.length||matched.length%2)throw Error('翻牌位置重复');for(let v=0;v<6;v++){const n=matched.filter(i=>deck[i]===v).length;if(n!==0&&n!==2)throw Error('配对记录不完整');}return{...m,deck,matched,open,moves:int(s.moves,0,1000000)};}
 function flipPair(s,index){int(index,0,11);if(s.open.length===2||s.open.includes(index)||s.matched.includes(index))return false;s.open.push(index);if(s.open.length===2)s.moves++;return true;}
 function resolvePair(s){if(s.open.length!==2)return false;const[a,b]=s.open,match=s.deck[a]===s.deck[b];if(match)s.matched.push(a,b);s.open=[];return match;}
 const isPairsDone=s=>s.matched.length===12;
 function cleanBox(value){const x=value||{};return{sudoku:x.sudoku?cleanSudoku(x.sudoku):null,puzzle:x.puzzle?cleanPuzzle(x.puzzle):null,pairs:x.pairs?cleanPairs(x.pairs):null};}
 return{rng,shuffle,clone,solve,sudoku,cleanSudoku,enterSudoku,conflicts,isSudokuDone,hintSudoku,puzzle,cleanPuzzle,swapPuzzle,isPuzzleDone,pairs,cleanPairs,flipPair,resolvePair,isPairsDone,cleanBox};
});
