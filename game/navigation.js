(function(root){
  'use strict';
  const W=941,H=1672,STEP=18;
  // Foot positions, inset from furniture: the sprite itself is taller than its footprint.
  const FLOOR=[[390,550],[640,550],[685,615],[685,840],[720,930],[700,1060],[580,1090],[330,1080],[270,1030],[270,950],[295,900],[280,790],[340,740],[340,660],[380,630]];
  function makeMap(FLOOR){
  function inside(x,y){let c=false;for(let i=0,j=FLOOR.length-1;i<FLOOR.length;j=i++){const a=FLOOR[i],b=FLOOR[j];if(((a[1]>y)!==(b[1]>y))&&(x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]))c=!c;}return c;}
  const cells=[],byKey=new Map();
  for(let y=0;y<H;y+=STEP)for(let x=0;x<W;x+=STEP){if(inside(x,y)){const p={x,y,key:x+','+y};cells.push(p);byKey.set(p.key,p);}}
  function nearest(x,y){let best=null,dist=Infinity;for(const p of cells){const d=(p.x-x)**2+(p.y-y)**2;if(d<dist){dist=d;best=p;}}return best;}
  function clear(a,b){const n=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/4);for(let i=0;i<=n;i++){const t=n?i/n:0;if(!inside(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t))return false;}return true;}
  function findPath(from,to){
    const start=nearest(from.x,from.y),end=nearest(to.x,to.y);if(!start||!end)return[];
    const open=[start],prev=new Map(),g=new Map([[start.key,0]]),closed=new Set();
    while(open.length){open.sort((a,b)=>(g.get(a.key)+Math.hypot(a.x-end.x,a.y-end.y))-(g.get(b.key)+Math.hypot(b.x-end.x,b.y-end.y)));const p=open.shift();if(p.key===end.key){const route=[p];let key=p.key;while(prev.has(key)){const last=prev.get(key);route.unshift(last);key=last.key;}const result=route.map(({x,y})=>({x,y}));if(inside(from.x,from.y)&&clear(from,result[0]))result.unshift({x:from.x,y:from.y});return result;}
      closed.add(p.key);
      for(const[dx,dy]of[[STEP,0],[-STEP,0],[0,STEP],[0,-STEP],[STEP,STEP],[STEP,-STEP],[-STEP,STEP],[-STEP,-STEP]]){const q=byKey.get((p.x+dx)+','+(p.y+dy));if(!q||closed.has(q.key)||!clear(p,q))continue;const score=g.get(p.key)+Math.hypot(dx,dy);if(score<(g.get(q.key)??Infinity)){prev.set(q.key,p);g.set(q.key,score);if(!open.includes(q))open.push(q);}}
    }return[];
  }
  return {W,H,FLOOR,cells,inside,nearest,clear,findPath};
  }
  root.WitchNavigation={...makeMap(FLOOR),makeMap};
})(globalThis);
