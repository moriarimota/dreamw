/* 梦乡：空间、路程、居民与关系。纯规则，可在离线时沿同一时间线推进。 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.WitchVillage=api;})(globalThis,function(){
 'use strict';
 const WIDTH=2048,HEIGHT=1440,SPEED=126,CELL=32;
 const point=(area,x,y)=>({area,x,y});
 const HOME=point('village',480,528),DOOR=point('inside',512,660);
 const SPOTS={
  home:{...HOME,name:'回到小屋',action:'enter'},exit:{...DOOR,name:'推门出发',action:'exit'},
  books:{...point('inside',310,295),name:'窗边的书',action:'books'},stove:{...point('inside',730,310),name:'炉边厨房',action:'stove'},
  desk:{...point('inside',745,475),name:'梦种工作桌',action:'desk'},bed:{...point('inside',350,470),name:'柔软的坐垫',action:'bed'},
  games:{...point('inside',515,445),name:'一起玩会儿',action:'games'},display:{...point('inside',790,580),name:'收藏架',action:'display'},
  herbs:{...point('village',560,700),name:'小院香草',action:'herbs'},berries:{...point('village',320,705),name:'浆果丛',action:'berries'},
  bench:{...point('village',785,590),name:'树下长椅',action:'bench'},birds:{...point('village',735,730),name:'小鸟饮水盆',action:'birds'},
  farm:{...point('village',1510,845),name:'河畔小田',action:'farm'},shop:{...point('village',1040,545),name:'阿栗的杂货铺',action:'shop'},
  fishing:{...point('village',1220,1000),name:'河边钓台',action:'fishing'},neighbor:{...point('village',1710,535),name:'苔米的家',action:'neighbor'},
  dream:{...point('village',1690,1060),name:'梦种花圃',action:'dream'},bridge:{...point('village',1350,670),name:'过桥去走走',action:null}
 };
 const PROPS=[
  {id:'cottage',frame:0,x:480,y:508,w:292,h:385,block:[356,320,250,175]},
  {id:'shop',frame:1,x:1040,y:525,w:290,h:370,block:[918,342,240,173]},
  {id:'neighbor',frame:2,x:1710,y:515,w:275,h:345,block:[1595,336,230,166]},
  {id:'bench',frame:5,x:785,y:573,w:145,h:110,block:[725,545,120,28]},
  {id:'oak1',frame:3,x:200,y:520,w:255,h:310,block:[184,497,30,30]},
  {id:'oak2',frame:3,x:810,y:365,w:235,h:300,block:[795,340,32,35]},
  {id:'oak3',frame:3,x:1730,y:900,w:250,h:310,block:[1716,877,28,30]},
  {id:'willow1',frame:4,x:1240,y:870,w:210,h:290,block:[1226,842,28,36]},
  {id:'willow2',frame:4,x:1450,y:455,w:196,h:285,block:[1436,427,26,34]},
  {id:'oak4',frame:3,x:340,y:1200,w:245,h:300,block:[325,1175,30,30]},
  {id:'oak5',frame:3,x:1880,y:1190,w:250,h:310,block:[1865,1165,30,30]},
  {id:'oak6',frame:3,x:870,y:1270,w:260,h:330,block:[855,1245,30,30]},
  {id:'bush1',frame:6,x:315,y:730,w:125,h:95,block:[275,710,80,25]},
  {id:'bush2',frame:6,x:560,y:720,w:120,h:80,block:[520,708,80,22]},
  {id:'bush3',frame:6,x:940,y:1075,w:115,h:85,block:[900,1060,80,22]},
  {id:'lamp1',frame:7,x:610,y:533,w:65,h:146,block:[602,521,16,14]},
  {id:'lamp2',frame:7,x:1155,y:568,w:65,h:146,block:[1147,556,16,14]},
  {id:'lamp3',frame:7,x:1445,y:736,w:65,h:146,block:[1437,724,16,14]},
  {id:'lamp4',frame:7,x:1665,y:1050,w:60,h:136,block:[1657,1038,16,14]}
 ];
 const INSIDE_BLOCKS=[[175,150,230,108],[647,160,185,116],[680,360,175,79],[220,345,178,66],[736,490,106,60],[440,338,146,70]];
 const PLOTS=Array.from({length:6},(_,i)=>({x:1480+(i%3)*82,y:714+Math.floor(i/3)*77,w:68,h:58}));
 const paths=[[[480,525],[480,620],[1050,670],[1350,670],[1730,670],[1730,535]],[[1040,530],[1040,670],[1040,995],[1240,1000]],[[480,620],[445,875],[850,995],[1040,995]],[[1480,670],[1495,860],[1675,1000],[1710,1070]],[[785,595],[780,650]]];
 const dist=(a,b)=>a.area!==b.area?100:Math.hypot(a.x-b.x,a.y-b.y);
 function walkable(area,x,y){
  if(!Number.isFinite(x)||!Number.isFinite(y))return false;
  if(area==='inside')return x>=164&&x<=860&&y>=276&&y<=670&&!INSIDE_BLOCKS.some(([a,b,w,h])=>x>a-8&&x<a+w+8&&y>b-5&&y<b+h+8);
  if(area!=='village'||x<96||x>1952||y<240||y>1310)return false;
  if(x>1285&&x<1400&&!(y>=632&&y<=714))return false;
  if(PROPS.some(p=>{const[a,b,w,h]=p.block;return x>a-8&&x<a+w+8&&y>b-5&&y<b+h+8;}))return false;
  return true;
 }
 function nearest(p){if(walkable(p.area,p.x,p.y))return point(p.area,p.x,p.y);let best=null,bd=Infinity;const w=p.area==='inside'?1024:WIDTH,h=p.area==='inside'?768:HEIGHT;for(let y=288;y<h;y+=CELL)for(let x=160;x<w;x+=CELL)if(walkable(p.area,x,y)){const d=(x-p.x)**2+(y-p.y)**2;if(d<bd){best=point(p.area,x,y);bd=d;}}return best||{...HOME};}
 function lineClear(a,b){if(a.area!==b.area)return false;const steps=Math.ceil(dist(a,b)/6);for(let i=0;i<=steps;i++){const t=steps?i/steps:0;if(!walkable(a.area,a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t))return false;}return true;}
 const cache=new Map();
 function localRoute(a,b){
  a=nearest(a);b=nearest(b);if(lineClear(a,b))return[a,b];
  const gridPoint=p=>{let best=null,bd=Infinity;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const q=point(p.area,Math.round(p.x/CELL)*CELL+dx*CELL,Math.round(p.y/CELL)*CELL+dy*CELL);if(walkable(q.area,q.x,q.y)&&lineClear(p,q)&&dist(p,q)<bd){bd=dist(p,q);best=q;}}return best;};
  const start=gridPoint(a),end=gridPoint(b);if(!start||!end)throw Error('这条小路暂时走不通');
  const key=p=>p.x+','+p.y,ek=key(end),sk=key(start),open=[start],cost=new Map([[sk,0]]),from=new Map(),done=new Set();let found=false;
  while(open.length){let index=0;for(let i=1;i<open.length;i++)if(cost.get(key(open[i]))+dist(open[i],end)<cost.get(key(open[index]))+dist(open[index],end))index=i;const cur=open.splice(index,1)[0],ck=key(cur);if(done.has(ck))continue;done.add(ck);if(ck===ek){found=true;break;}for(const[dx,dy]of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const q=point(a.area,cur.x+dx*CELL,cur.y+dy*CELL),qk=key(q);if(done.has(qk)||!walkable(q.area,q.x,q.y)||!lineClear(cur,q))continue;const n=cost.get(ck)+Math.hypot(dx,dy)*CELL;if(n<(cost.get(qk)??Infinity)){cost.set(qk,n);from.set(qk,cur);open.push(q);}}}
  if(!found)throw Error('这条小路暂时走不通');let q=end,route=[b,end];while(key(q)!==sk){q=from.get(key(q));route.push(q);}route.push(a);route.reverse();const smooth=[route[0]];let i=0;while(i<route.length-1){let j=route.length-1;while(j>i+1&&!lineClear(route[i],route[j]))j--;smooth.push(route[j]);i=j;}return smooth;
 }
 function route(a,b){if(a.area===b.area)return localRoute(a,b);return a.area==='inside'?[...localRoute(a,DOOR),HOME,...localRoute(HOME,b).slice(1)]:[...localRoute(a,HOME),DOOR,...localRoute(DOOR,b).slice(1)];}
 function distance(points){let n=0;for(let i=1;i<points.length;i++)n+=dist(points[i-1],points[i]);return n;}
 function interpolate(j,at){const points=j.points,total=distance(points),fraction=Math.max(0,Math.min(1,(at-j.startedAt)/Math.max(1,j.endsAt-j.startedAt)));let t=fraction;
  // Short easing only at departure and arrival; most of a journey keeps a steady stride.
  const edge=Math.min(.12,300/Math.max(1,j.endsAt-j.startedAt));if(t<edge)t=t*t/(2*edge);else if(t>1-edge)t=1-(1-t)*(1-t)/(2*edge);else t=(t-edge/2)/(1-edge); // normalized below with a continuous piecewise curve
  const u=fraction,e=edge;t=u<e?u*u/(2*e*(1-e)):u>1-e?1-(1-u)**2/(2*e*(1-e)):(u-e/2)/(1-e);
  let d=total*t;for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],len=dist(a,b);if(d<=len){if(a.area!==b.area)return{...(d<len*.5?a:b),moving:fraction<1,dx:0,dy:a.area==='inside'?-1:1};const f=len?d/len:1;return{area:a.area,x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f,moving:fraction>0&&fraction<1,dx:b.x-a.x,dy:b.y-a.y};}d-=len;}return{...points.at(-1),moving:false,dx:0,dy:1};}
 function destination(a){if(a.destination)return nearest(a.destination);const id={bed:'books',fire:'stove',desk:'desk',rug:'bed',window:'books',shelf:'display',gardenPath:a.material==='berries'?'berries':'herbs',gardenBench:'bench',riverFarm:'farm',riverJetty:'fishing',riverShop:'shop'}[a.place]||'bed';return nearest(SPOTS[id]);}
 function fresh(a){return{version:1,location:destination(a),journey:null,contacts:{moss:{met:false,talks:0,borrowed:false,returned:false,readBefore:0,seen:[]},chestnut:{met:false,talks:0,borrowed:false,returned:false,readBefore:0,seen:[]}},sound:false,zoom:1};}
 function position(s,at){const v=s.village;return v.journey?interpolate(v.journey,at):{...v.location,moving:false,dx:0,dy:1};}
 function settle(s,at){if(!s.village)return;const p=position(s,at);s.village.location=point(p.area,p.x,p.y);if(s.village.journey&&at>=s.village.journey.endsAt)s.village.journey=null;}
 function begin(s,a,at){if(!s.village)return 0;settle(s,at);s.village.journey=null;if(a.kind==='game')return 0;const target=destination(a),points=route(s.village.location,target),length=distance(points);if(length<2)return 0;const ms=Math.ceil(length/SPEED*1000)+400;s.village.journey={points,startedAt:at,endsAt:at+ms,purpose:a.id};return ms;}
 function clean(v,a){if(!v)return fresh(a);if(v.version!==1)throw Error('地图存档版本不正确');const finite=(n,min,max)=>{if(!Number.isFinite(n)||n<min||n>max)throw Error('地图数值不正确');return n;};const cp=p=>{if(!p||!['inside','village'].includes(p.area))throw Error('地图地点不正确');const q=point(p.area,finite(p.x,0,p.area==='inside'?1024:WIDTH),finite(p.y,0,p.area==='inside'?768:HEIGHT));if(!walkable(q.area,q.x,q.y))throw Error('人物位置不在可行走区域');return q;};const out=fresh(a);out.location=cp(v.location);out.zoom=[.65,1,1.3].includes(v.zoom)?v.zoom:1;out.sound=v.sound===true;
  for(const id of ['moss','chestnut']){const c=v.contacts?.[id];if(!c)continue;if(!Array.isArray(c.seen)||c.seen.length>120||c.seen.some(x=>typeof x!=='string'||!/^creation-\d+$/.test(x)))throw Error('居民记忆不正确');out.contacts[id]={met:c.met===true,talks:Math.floor(finite(c.talks,0,1000000)),borrowed:c.borrowed===true,returned:c.returned===true,readBefore:finite(c.readBefore,0,1000000),seen:[...new Set(c.seen)]};}
  if(v.journey){const j=v.journey;if(!Array.isArray(j.points)||j.points.length<2||j.points.length>160)throw Error('路程格式不正确');const points=j.points.map(cp);for(let i=1;i<points.length;i++){const x=points[i-1],y=points[i];if(x.area!==y.area){if(!(dist(x,x.area==='inside'?DOOR:HOME)<1&&dist(y,y.area==='inside'?DOOR:HOME)<1))throw Error('路程不能穿过墙壁');}else if(!lineClear(x,y))throw Error('路程不能穿过障碍');}const startedAt=finite(j.startedAt,0,8640000000000000),endsAt=finite(j.endsAt,startedAt+1,startedAt+120000);if(typeof j.purpose!=='string'||j.purpose.length>40)throw Error('路程目标不正确');out.journey={points,startedAt,endsAt,purpose:j.purpose};}return out;
 }
 const NPCS={moss:{name:'苔米',form:'sprout',body:'#82956b',accent:'#ead7ad',intro:'住在桥那头，爱记下叶子的变化。'},chestnut:{name:'阿栗',form:'fox',body:'#b88159',accent:'#ecd9b3',intro:'照看杂货铺，偶尔带着点心去河边歇脚。'}};
 function npc(s,id,at,weatherAt,hourAt){
  const period=180000,offset=id==='moss'?0:75000,slot=Math.floor((at+offset)/period),start=slot*period-offset;
  function stop(k){const time=k*period-offset,h=hourAt(s,time),wet=weatherAt(s,time)==='小雨',cycle=((k%4)+4)%4;if(id==='moss'){if(h<7||h>=21||wet)return{p:SPOTS.neighbor,task:wet?'在门廊整理叶片':'在家里休息',reason:wet?'下雨了，今天先在屋檐下整理植物札记。':'夜深了，明天再去看花。'};if(s.discoveries.some(d=>d.createdAt<=time)&&cycle===2)return{p:SPOTS.dream,task:'看梦种花圃',reason:'花圃里长出了你们照料的植物，想来看看它的叶子。'};return[{p:SPOTS.neighbor,task:'整理植物札记',reason:'想把观察记下来。'},{p:SPOTS.farm,task:'看看河畔的幼苗',reason:'记过的叶形，想和田里的幼苗比一比。'},{p:SPOTS.bench,task:'在树下读几页',reason:'散步之后，在长椅边翻翻札记。'},{p:SPOTS.shop,task:'找阿栗聊种子',reason:'想打听下一季的种子。'}][cycle];}if(h<7||h>=22||wet)return{p:SPOTS.shop,task:wet?'把货筐收进屋檐':'收拾杂货铺',reason:wet?'雨会打湿种子袋，先把货筐收好。':'把货架整理好，再歇一会儿。'};return[{p:SPOTS.shop,task:'整理种子和渔具',reason:'店里的种子袋需要分好。'},{p:SPOTS.shop,task:'在店前晒晒太阳',reason:'刚整理完，站在门口看看路过的人。'},{p:SPOTS.fishing,task:'去河边透透气',reason:'带着点心，去水边歇一会儿。'},{p:SPOTS.bench,task:'坐在树下歇脚',reason:'回店前想听一阵鸟叫。'}][cycle];}
  const prev=stop(slot-1),next=stop(slot),key=id+':'+slot+':'+prev.p.name+':'+next.p.name;let points=cache.get(key);if(!points){points=route(prev.p,next.p);cache.set(key,points);if(cache.size>30)cache.delete(cache.keys().next().value);}const ms=Math.max(1,distance(points)/72*1000+400),pos=interpolate({points,startedAt:start,endsAt:start+ms},at);return{...NPCS[id],id,...pos,task:pos.moving?'正要'+next.task:next.task,reason:next.reason};
 }
 return{WIDTH,HEIGHT,SPEED,CELL,HOME,DOOR,SPOTS,PROPS,PLOTS,paths,NPCS,point,dist,walkable,nearest,lineClear,localRoute,route,distance,interpolate,destination,fresh,position,settle,begin,clean,npc};
});
