/* Keep the active board and its controls together at any window size. */
(function(root){'use strict';let frame=0;
 const selector='.arcade-wrap,.sudoku-board,.puzzle-board,.pairs-board,.go-grid,.xq-grid,.wg-board,.pocket-board';
 function arrange(){frame=0;const sheet=document.getElementById('sheet'),content=document.getElementById('sheet-content');if(!sheet||sheet.hidden)return;const board=content.querySelector(selector),game=board?.closest('.mini-game,.wg-game');sheet.classList.toggle('play-session',!!game);if(!game)return;
  if(!game.querySelector(':scope > .play-main')){
   const children=[...game.children],main=document.createElement('div'),side=document.createElement('aside');main.className='play-main';side.className='play-tools';
   for(const child of children){if(child.matches('.mini-toolbar,.game-toolbar,.number-pad,.wg-actions,.wg-restart,.game-confirm,.arcade-outcome,.puzzle-preview'))side.append(child);else if(child.matches('.hint,.thought,.wg-intro,.wg-hint')){const detail=document.createElement('details'),summary=document.createElement('summary');detail.className='play-help';summary.textContent='玩法';detail.append(summary,child);side.append(detail);}else main.append(child);}
   game.append(main,side);
  }
  const main=game.querySelector('.play-main'),side=game.querySelector('.play-tools'),w=sheet.clientWidth-32,h=content.clientHeight;
  const mobile=w<650;game.classList.toggle('play-narrow',mobile);
  const isXQ=!!board.querySelector('.xq-cell'),isPairs=board.classList.contains('pairs-board'),rows=isXQ?10:isPairs?4:1,cols=isXQ?9:isPairs?3:1;
  let ratio=cols/rows;if(board.classList.contains('festival-board')){ratio=board.classList.contains('f-hanoi')?1.6:board.classList.contains('f-code')?1:Number(board.style.getPropertyValue('--cols'))/Number(board.style.getPropertyValue('--rows'));}if(board.classList.contains('arcade-wrap')){const grid=board.querySelector('.arcade-board');const n=Number(grid.style.getPropertyValue('--cols'));ratio=n/Math.ceil(grid.children.length/n);}
  const messages=[...main.children].filter(x=>x!==board),extra=messages.reduce((n,e)=>n+e.getBoundingClientRect().height+8,0);
  const sideH=mobile?Math.min(196,side.getBoundingClientRect().height):0;
  const size=Math.max(140,Math.min(mobile?w:w-224,(h-extra-sideH-20)*ratio,620));
  game.style.setProperty('--board-size',Math.floor(size)+'px');board.style.width=Math.floor(size)+'px';board.style.maxWidth='100%';board.style.margin='0 auto';
 }
 // Layout must also settle while an installed app is resuming or its tab is
 // backgrounded. requestAnimationFrame may be suspended in those states.
 function schedule(){if(!frame){frame=1;queueMicrotask(arrange);}}
 function init(){const content=document.getElementById('sheet-content');new MutationObserver(schedule).observe(content,{childList:true,subtree:true});new ResizeObserver(schedule).observe(document.getElementById('sheet'));window.addEventListener('resize',schedule);schedule();}
 root.WitchPlayLayout={schedule,init};
})(globalThis);
