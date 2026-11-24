/* 梦乡：空间、路程、居民与关系。纯规则，可在离线时沿同一时间线推进。 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.WitchVillage=api;})(globalThis,function(){
 'use strict';
 const WIDTH=2048,HEIGHT=1440,SPEED=190,CELL=16;
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

 const FOREST_GATE=point('village',270,290),FOREST_ENTRY=point('forest',768,1040);
 const FOREST_PROPS=[{id:'workshop',frame:2,x:425,y:490,w:260,h:330,block:[325,336,200,145]},
 {id:'forestOak',frame:3,x:620,y:470,w:230,h:290,block:[608,448,25,28]},
 {id:'forestWillow',frame:4,x:1270,y:790,w:230,h:325,block:[1256,765,27,29]},
 {id:'forestBench',frame:5,x:1090,y:291,w:145,h:110,block:[1030,266,120,24]}];
 Object.assign(SPOTS,{forestGate:{...FOREST_GATE,name:'通往林间',action:'forestGate'},forestExit:{...FOREST_ENTRY,name:'回到街区',action:'forestExit'},
 pond:{...point('forest',795,620),name:'萤光池塘',action:'pond'},workshop:{...point('forest',425,515),name:'林间手作棚',action:'workshop'},
 forestHerbs:{...point('forest',355,780),name:'蕨叶采集地',action:'forestHerbs'},lookout:{...point('forest',1090,320),name:'树梢观景处',action:'lookout'},
 camp:{...point('forest',660,720),name:'野餐营地',action:'camp'}});
 Object.assign(SPOTS,{cafe:{...point('forest',1220,970),name:'豆灯咖啡摊',action:'cafe'},bakery:{...point('forest',610,940),name:'麦芽面包车',action:'bakery'},library:{...point('forest',570,310),name:'墨羽流动书架',action:'library'},apiary:{...point('forest',1190,345),name:'蜜柚蜂蜡工坊',action:'apiary'},orchard:{...point('forest',310,940),name:'桃枝果园',action:'orchard'},teahouse:{...point('forest',840,315),name:'云盏茶席',action:'teahouse'},fishstudy:{...point('forest',795,770),name:'汀汀水边观察站',action:'fishstudy'}});
 const INSIDE_BLOCKS=[[175,150,230,108],[647,160,185,116],[680,360,175,79],[220,345,178,66],[736,490,106,60],[440,338,146,70]];
 const PLOTS=Array.from({length:12},(_,i)=>({x:1480+(i%3)*82,y:714+Math.floor(i/3)*77,w:68,h:58}));
 const paths=[[[480,525],[480,620],[1050,670],[1350,670],[1730,670],[1730,535]],[[1040,530],[1040,670],[1040,995],[1240,1000]],[[480,620],[445,875],[850,995],[1040,995]],[[1480,670],[1495,860],[1675,1000],[1710,1070]],[[785,595],[780,650]]];
 const dist=(a,b)=>a.area!==b.area?100:Math.hypot(a.x-b.x,a.y-b.y);
 function walkable(area,x,y){
  if(!Number.isFinite(x)||!Number.isFinite(y))return false;
  if(area==='inside')return x>=164&&x<=860&&y>=276&&y<=670&&!INSIDE_BLOCKS.some(([a,b,w,h])=>x>a-8&&x<a+w+8&&y>b-5&&y<b+h+8);
  if(area==='forest'){if(x<100||x>1436||y<190||y>1070)return false;if(((x-1080)/235)**2+((y-650)/176)**2<1)return false;return !FOREST_PROPS.some(p=>{const[a,b,w,h]=p.block;return x>a-8&&x<a+w+8&&y>b-5&&y<b+h+8;});}
  if(area!=='village'||x<96||x>1952||y<240||y>1310)return false;
  if(x>1285&&x<1400&&!(y>=632&&y<=714))return false;
  if(PROPS.some(p=>{const[a,b,w,h]=p.block;return x>a-8&&x<a+w+8&&y>b-5&&y<b+h+8;}))return false;
  return true;
 }
 function nearest(p){if(walkable(p.area,p.x,p.y))return point(p.area,p.x,p.y);let best=null,bd=Infinity;const w=p.area==='inside'?1024:WIDTH,h=p.area==='inside'?768:HEIGHT;for(let y=288;y<h;y+=CELL)for(let x=160;x<w;x+=CELL)if(walkable(p.area,x,y)){const d=(x-p.x)**2+(y-p.y)**2;if(d<bd){best=point(p.area,x,y);bd=d;}}return best||{...HOME};}
 function lineClear(a,b){if(a.area!==b.area)return false;const steps=Math.ceil(dist(a,b)/6);for(let i=0;i<=steps;i++){const t=steps?i/steps:0;if(!walkable(a.area,a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t))return false;}return true;}
 const cache=new Map(),routeCache=new Map();
 function localRoute(a,b){
  a=nearest(a);b=nearest(b);if(lineClear(a,b))return[a,b];
  const memo=[a.area,a.x,a.y,b.x,b.y].join(':');if(routeCache.has(memo))return routeCache.get(memo).map(p=>({...p}));
  const gridPoint=p=>{let best=null,bd=Infinity;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const q=point(p.area,Math.round(p.x/CELL)*CELL+dx*CELL,Math.round(p.y/CELL)*CELL+dy*CELL);if(walkable(q.area,q.x,q.y)&&lineClear(p,q)&&dist(p,q)<bd){bd=dist(p,q);best=q;}}return best;};
  const start=gridPoint(a),end=gridPoint(b);if(!start||!end)throw Error('这条小路暂时走不通');
  const key=p=>p.x+','+p.y,ek=key(end),sk=key(start),heap=[],cost=new Map([[sk,0]]),from=new Map(),done=new Set();let found=false;
  function push(p,g){const node={p,g,f:g+dist(p,end)};heap.push(node);let i=heap.length-1;while(i>0){const parent=(i-1)>>1;if(heap[parent].f<=node.f)break;heap[i]=heap[parent];i=parent;}heap[i]=node;}
  function pop(){const top=heap[0],last=heap.pop();if(heap.length){let i=0;while(i*2+1<heap.length){let child=i*2+1;if(child+1<heap.length&&heap[child+1].f<heap[child].f)child++;if(last.f<=heap[child].f)break;heap[i]=heap[child];i=child;}heap[i]=last;}return top;}
  push(start,0);
  while(heap.length){const entry=pop(),cur=entry.p,ck=key(cur);if(done.has(ck)||entry.g!==cost.get(ck))continue;done.add(ck);if(ck===ek){found=true;break;}for(const[dx,dy]of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const q=point(a.area,cur.x+dx*CELL,cur.y+dy*CELL),qk=key(q);if(done.has(qk)||!walkable(q.area,q.x,q.y)||!lineClear(cur,q))continue;const n=entry.g+Math.hypot(dx,dy)*CELL;if(n<(cost.get(qk)??Infinity)){cost.set(qk,n);from.set(qk,cur);push(q,n);}}}
  if(!found)throw Error('这条小路暂时走不通');let q=end,route=[b,end];while(key(q)!==sk){q=from.get(key(q));route.push(q);}route.push(a);route.reverse();const smooth=[route[0]];let i=0;while(i<route.length-1){let j=route.length-1;while(j>i+1&&!lineClear(route[i],route[j]))j--;smooth.push(route[j]);i=j;}routeCache.set(memo,smooth.map(p=>({...p})));if(routeCache.size>256)routeCache.delete(routeCache.keys().next().value);return smooth;
 }
 function route(a,b){if(a.area===b.area)return localRoute(a,b);if(a.area==='inside')return [...localRoute(a,DOOR),HOME,...route(HOME,b).slice(1)];if(b.area==='inside')return [...route(a,HOME),DOOR,...localRoute(DOOR,b).slice(1)];return a.area==='village'?[...localRoute(a,FOREST_GATE),FOREST_ENTRY,...localRoute(FOREST_ENTRY,b).slice(1)]:[...localRoute(a,FOREST_ENTRY),FOREST_GATE,...localRoute(FOREST_GATE,b).slice(1)];}
 function distance(points){let n=0;for(let i=1;i<points.length;i++)n+=dist(points[i-1],points[i]);return n;}
 function interpolate(j,at){const points=j.points,total=distance(points),fraction=Math.max(0,Math.min(1,(at-j.startedAt)/Math.max(1,j.endsAt-j.startedAt)));let t=fraction;
  if(fraction>=1)return{...points.at(-1),moving:false,dx:0,dy:1};
  // Short easing only at departure and arrival; most of a journey keeps a steady stride.
  const e=Math.min(.06,70/Math.max(1,j.endsAt-j.startedAt)),u=fraction;t=u<e?u*u/(2*e*(1-e)):u>1-e?1-(1-u)**2/(2*e*(1-e)):(u-e/2)/(1-e);
  let d=total*t;for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],len=dist(a,b);if(d<=len){if(a.area!==b.area)return{...(d<len*.5?a:b),moving:fraction<1,dx:0,dy:a.area==='inside'?-1:1};const f=len?d/len:1;return{area:a.area,x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f,moving:fraction>0&&fraction<1,dx:b.x-a.x,dy:b.y-a.y};}d-=len;}return{...points.at(-1),moving:false,dx:0,dy:1};}
 function destination(a){if(a.destination)return nearest(a.destination);const id={bed:'books',fire:'stove',desk:'desk',rug:'bed',window:'books',shelf:'display',gardenPath:a.material==='berries'?'berries':'herbs',gardenBench:'bench',riverFarm:'farm',riverJetty:'fishing',riverShop:'shop',forestForage:'forestHerbs',forestStudio:'workshop',forestView:'lookout',forestCamp:'camp',forestPond:'pond',riverNeighbor:'neighbor',villageCafe:'cafe',villageBakery:'bakery',villageLibrary:'library',forestApiary:'apiary',forestOrchard:'orchard',forestTea:'teahouse'}[a.place]||'bed';return nearest(SPOTS[id]);}
 function fresh(a){return{version:2,location:destination(a),journey:null,contacts:Object.fromEntries(Object.keys(NPCS).map(id=>[id,{met:false,talks:0,borrowed:false,returned:false,readBefore:0,seen:[]} ])),sound:false,zoom:1};}
 function position(s,at){const v=s.village;return v.journey?interpolate(v.journey,at):{...v.location,moving:false,dx:0,dy:1};}
 function settle(s,at){if(!s.village)return;const p=position(s,at);s.village.location=point(p.area,p.x,p.y);if(s.village.journey&&at>=s.village.journey.endsAt)s.village.journey=null;}
 function begin(s,a,at){if(!s.village)return 0;settle(s,at);s.village.journey=null;if(a.kind==='game')return 0;const target=destination(a),points=route(s.village.location,target),length=distance(points);if(length<2)return 0;const ms=Math.ceil(length/SPEED*1000)+80;s.village.journey={points,startedAt:at,endsAt:at+ms,purpose:a.id};return ms;}
 function clean(v,a){if(!v)return fresh(a);if(![1,2].includes(v.version))throw Error('地图存档版本不正确');const finite=(n,min,max)=>{if(!Number.isFinite(n)||n<min||n>max)throw Error('地图数值不正确');return n;};const cp=p=>{if(!p||!['inside','village','forest'].includes(p.area))throw Error('地图地点不正确');const q=point(p.area,finite(p.x,0,p.area==='inside'?1024:WIDTH),finite(p.y,0,p.area==='inside'?768:HEIGHT));if(!walkable(q.area,q.x,q.y))throw Error('人物位置不在可行走区域');return q;};const out=fresh(a);out.location=cp(v.location);out.zoom=[.65,1,1.3].includes(v.zoom)?v.zoom:1;out.sound=v.sound===true;
  for(const id of Object.keys(NPCS)){const c=v.contacts?.[id];if(!c)continue;if(!Array.isArray(c.seen)||c.seen.length>120||c.seen.some(x=>typeof x!=='string'||!/^creation-\d+$/.test(x)))throw Error('居民记忆不正确');out.contacts[id]={met:c.met===true,talks:Math.floor(finite(c.talks,0,1000000)),borrowed:c.borrowed===true,returned:c.returned===true,readBefore:finite(c.readBefore,0,1000000),seen:[...new Set(c.seen)]};}
  if(v.journey){const j=v.journey;if(!Array.isArray(j.points)||j.points.length<2||j.points.length>160)throw Error('路程格式不正确');const points=j.points.map(cp);for(let i=1;i<points.length;i++){const x=points[i-1],y=points[i];if(x.area!==y.area){if(![[DOOR,HOME],[HOME,DOOR],[FOREST_GATE,FOREST_ENTRY],[FOREST_ENTRY,FOREST_GATE]].some(([a,b])=>x.area===a.area&&y.area===b.area&&dist(x,a)<1&&dist(y,b)<1))throw Error('路程不能穿过墙壁');}else if(!lineClear(x,y))throw Error('路程不能穿过障碍');}const startedAt=finite(j.startedAt,0,8640000000000000),endsAt=finite(j.endsAt,startedAt+1,startedAt+120000);if(typeof j.purpose!=='string'||j.purpose.length>40)throw Error('路程目标不正确');out.journey={points,startedAt,endsAt,purpose:j.purpose};}return out;
 }

 function steer(p,dx,dy,length=90){
  const norm=Math.hypot(dx,dy)||1;dx/=norm;dy/=norm;
  function ray(x,y){let q=p;for(let d=4;d<=length;d+=4){const n=point(p.area,p.x+x*d,p.y+y*d);if(!lineClear(p,n))break;q=n;}return q;}
  const full=ray(dx,dy);if(dist(p,full)>12||!dx||!dy)return full;
  const x=ray(dx,0),y=ray(0,dy);return dist(p,x)>dist(p,y)?x:y;
 }
 const NPCS={moss:{name:'苔米',form:'sprout',body:'#82956b',accent:'#ead7ad',intro:'住在桥那头，爱记下叶子的变化。'},chestnut:{name:'阿栗',form:'fox',body:'#b88159',accent:'#ecd9b3',intro:'照看杂货铺，偶尔带着点心去河边歇脚。'}};

 Object.assign(NPCS,{reed:{name:'灯蒲',form:'fox',body:'#7796a1',accent:'#dfcca2',intro:'河边的钓友，喜欢记录水面变化，也愿意和你聊鱼。'},fern:{name:'蕨婆',form:'sprout',body:'#739878',accent:'#e5c59a',intro:'住在林间的草药师，白天采叶子，雨天回棚里压花。'},ember:{name:'灰团',form:'moth',body:'#9c8399',accent:'#edcba2',intro:'经营林间手作棚，会烤面包，也帮邻居修理小物件。'}});
 Object.assign(NPCS,{bean:{name:'豆灯',form:'fox',body:'#a38868',accent:'#e5cba4',home:'cafe',job:'磨豆与手冲',intro:'在林地入口煮咖啡，喜欢收集旅行地图。'},wheat:{name:'麦芽',form:'sprout',body:'#c4a571',accent:'#f1dcb4',home:'bakery',job:'揉面和烤餐包',intro:'推着面包车出门，总多留一只小餐包。'},ink:{name:'墨羽',form:'moth',body:'#74808e',accent:'#e2d7b8',home:'library',job:'给书包封皮',intro:'照看流动书架，知道许多书是怎么来到这里的。'},honey:{name:'蜜柚',form:'moth',body:'#c1a258',accent:'#efe2af',home:'apiary',job:'给蜂蜜罐贴标签',intro:'经营蜂蜡工坊，休息时会去看不产蜜的小花。'},peach:{name:'桃枝',form:'fox',body:'#c69082',accent:'#ecdbb6',home:'orchard',job:'整理果篮',intro:'照料矮生果树，愿意和你交换收成的做法。'},cloud:{name:'云盏',form:'sprout',body:'#93a798',accent:'#e5dac2',home:'teahouse',job:'温壶与晾茶',intro:'摆一方茶席，客人可以安静坐很久。'},tide:{name:'汀汀',form:'sprout',body:'#7ba9ab',accent:'#e0d7a2',home:'fishstudy',job:'画鱼鳍的纹路',intro:'在水边记录鱼群，也会收集大家的观察。'}});
 // Individual daytime routines use the saved clock. A visit observes a life already in progress.
 const ROUTINES={
  moss:[['neighbor','给植物札记补上日期','昨天夹好的叶片已经干了，先把叶脉描下来。','book'],['farm','比较田边的叶形','想弄清香草的新叶和老叶哪里不同。','water'],['bench','读一页植物观察','刚才见过的叶形，书里也许有一张图。','book'],['shop','和阿栗商量下一季的种子','想留一小块地种些还没认识的植物。','basket']],
  chestnut:[['shop','把种子袋摆上木架','小萝卜和香草要分开放，来买的人才好找。','basket'],['shop','记下要补的货','数一数袋子，再把缺少的东西记在纸上。','book'],['fishing','带着点心到河边歇脚','店里的事先告一段落，想听一会儿水声。','cup'],['shop','收好剩下的种子袋','把怕潮的纸袋搬进去，明早就能从容开门。','basket']],
  reed:[['fishing','在钓台边看水纹','早上的水面很安静，浮漂的变化格外清楚。','tool'],['pond','对照两处水域的笔记','池塘里的鱼和河里习惯不同，想再比一比。','book'],['fishstudy','和汀汀核对鱼鳍画稿','有一条鱼的背鳍记不清，来借张图看看。','book'],['camp','把鱼线慢慢理顺','明天用的鱼线收好了，今晚可以安心歇着。','tool']],
  fern:[['forestHerbs','挑几片适合压花的叶子','露水散后叶片容易保存，先采一点就够。','basket'],['workshop','把叶片夹进吸水纸','每片叶子都要铺开，才不会皱在一起。','book'],['farm','观察地里的幼苗','想看看同一阵雨后，哪种苗先伸展开叶子。','water'],['teahouse','和云盏分辨草叶气味','带来一点晒干的叶子，听听朋友怎么形容它。','cup']],
  ember:[['workshop','给小木盒磨平边角','边角摸起来还扎手，得多磨一会儿。','tool'],['shop','挑一枚合适的小铰链','盒盖要开合顺手，尺寸不能将就。','tool'],['workshop','试着合上修好的盒盖','想让盖子轻轻落下，不惊动里面的小东西。','tool'],['camp','带着工具袋歇一会儿','今天的木屑扫干净了，剩下的留给明天。','cup']],
  bean:[['cafe','磨好第一壶咖啡的豆子','趁林子还安静，先听听磨豆机慢慢响。','cup'],['cafe','试一试今天的水温','同一包豆子也有不同味道，想找到合适的一杯。','cup'],['lookout','在旅行地图上画一条小路','刚听到一处有风的山坡，先把路线记下来。','book'],['cafe','洗净最后一只滤杯','滤杯晾好以后，就能慢慢喝自己的那杯了。','cup']],
  wheat:[['bakery','把醒好的面团分成小份','今天想让每只餐包都烤得鼓鼓的。','basket'],['camp','带一篮餐包去营地','给朋友多留了一只，趁还暖着送过去。','basket'],['bakery','整理下一次烘焙的配方','想记住这次面团摸起来的感觉。','book'],['teahouse','用最后一只餐包换杯茶','烤炉歇下了，想坐着听云盏说说今天。','cup']],
  ink:[['library','修补一本书的书脊','这本书翻过很多次，线要缝得松紧合适。','book'],['library','给借回来的书换封皮','旧折角留着，那是读过它的人留下的痕迹。','book'],['bench','抄下舍不得忘的一段话','读到一封没有寄出的信，想再想一会儿。','book'],['library','把归还的小书排回架上','给还没回来的书留空位，等它们慢慢回来。','book']],
  honey:[['apiary','给蜂蜜罐贴手写标签','这次的香味淡一些，想在标签上记清楚。','basket'],['forestHerbs','看看没有蜜的小花','有些花只开一小会儿，也值得停下来看看。','water'],['apiary','试着卷一支蜂蜡小烛','烛芯要放正，点起来才会慢慢燃。','tool'],['camp','把手上的蜂蜡擦干净','今天的活做完了，想空着手坐一会儿。','cup']],
  peach:[['orchard','把果篮里的叶子挑出来','留下完整的果子，磕到的留着试做果酱。','basket'],['bakery','和麦芽讨论果馅的味道','果子酸甜不同，配方也该跟着变一点。','basket'],['orchard','给矮果树留出光照','挪开挡光的小枝，看看里面的果子。','water'],['bench','把新做法记在果园本上','想记住麦芽说的搭配，下一次试试看。','book']],
  cloud:[['teahouse','把茶具温热','先让杯子暖起来，再慢慢准备今天的茶。','cup'],['forestHerbs','辨一辨新叶的香气','想找一点清淡的味道，配下午的茶。','basket'],['teahouse','留一张安静的小茶席','来的人想说话也好，想坐一会儿也好。','cup'],['pond','带着空杯看看池塘','洗杯子前，想先听一听暮色里的水声。','cup']],
  tide:[['fishstudy','画下鱼鳍的细纹','有一条细线昨天没看清，今天想补上。','book'],['pond','记录池塘边的小动静','水面一圈一圈的纹路，和风吹的不同。','book'],['fishing','和灯蒲交换水边观察','同一条河从两岸看，会发现不同的细节。','book'],['fishstudy','整理今天的观察卡','拿不准的地方先留白，等明天再确认。','book']]
 };
 const WISHES={moss:'想把月见花从幼苗到开花的叶形画全。',chestnut:'想给每一种种子配一张清楚的小卡片。',reed:'想认清河里每一种不同的水纹。',fern:'想装订一本能认出季节的压花册。',ember:'想修好那只总是关不严的小木盒。',bean:'想沿着旅行地图走一条还没去过的小路。',wheat:'想烤出一只放凉了也好吃的餐包。',ink:'想给被翻旧的书各留下一段来历。',honey:'想把不同花季的气味记在蜂蜜标签上。',peach:'想试出适合朋友们口味的果酱。',cloud:'想找到一款适合雨天安静喝的茶。',tide:'想把画不清楚的那条鱼重新认出来。'};
 function routine(s,id,time,weatherAt,hourAt){
  const h=hourAt(s,time),rows=ROUTINES[id],n=NPCS[id],home=n.home||({moss:'neighbor',chestnut:'shop',reed:'camp',fern:'workshop',ember:'workshop'})[id];
  const phase=h<7||h>=22?-1:h<11?0:h<14?1:h<18?2:3;
  if(phase<0)return{p:SPOTS[home],task:'收起手边的东西，安静休息',reason:n.name+'把今天没做完的事留在自己的小本子上。',gesture:'rest',wish:WISHES[id]};
  let row=rows[phase];
  if(id==='moss'&&phase===2&&s.discoveries.some(d=>d.createdAt<=time))row=['dream','看看你们照料的梦种花圃','这里有已经长出的植物，想亲眼看看叶子的变化。','water'];
  if(weatherAt(s,time)==='小雨'&&['farm','fishing','pond','lookout','forestHerbs','camp','bench','dream'].includes(row[0]))return{p:SPOTS[home],task:'在屋檐下接着'+rows[0][1],reason:'雨来了，'+n.name+'先把'+({book:'纸页',water:'观察本',basket:'篮子',tool:'工具',cup:'杯子'})[row[3]]+'收进屋檐，再接着自己的事。',gesture:rows[0][3],wish:WISHES[id]};
  return{p:SPOTS[row[0]],task:row[1],reason:row[2],gesture:row[3],wish:WISHES[id]};
 }
 function npc(s,id,at,weatherAt,hourAt){
  const offset=(s.preferences.utcOffsetMinutes||0)*60000,period=3600000,start=Math.floor((at+offset)/period)*period-offset;
  const prev=routine(s,id,start-1,weatherAt,hourAt),next=routine(s,id,start,weatherAt,hourAt),key='routine:'+id+':'+prev.p.name+':'+next.p.name;
  let points=cache.get(key);if(!points){points=route(prev.p,next.p);cache.set(key,points);if(cache.size>72)cache.delete(cache.keys().next().value);}
  const ms=Math.max(1,distance(points)/72*1000+400),pos=interpolate({points,startedAt:start,endsAt:start+ms},at);
  return{...NPCS[id],id,...pos,task:pos.moving?'正要'+next.task:next.task,reason:next.reason,gesture:next.gesture,wish:next.wish};
 }

 return{FOREST_GATE,FOREST_ENTRY,FOREST_PROPS,steer,WIDTH,HEIGHT,SPEED,CELL,HOME,DOOR,SPOTS,PROPS,PLOTS,paths,NPCS,point,dist,walkable,nearest,lineClear,localRoute,route,distance,interpolate,destination,fresh,position,settle,begin,clean,npc};
});
