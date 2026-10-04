/* Calendar and field guide. No clock reads: the caller supplies world time. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.WitchSeasons=api;})(globalThis,function(){
 'use strict';
 const NAMES={spring:'春',summer:'夏',autumn:'秋',winter:'冬'},ALL=Object.keys(NAMES);
 const cropRows=[
 ['radish','小萝卜',5,3,3,3,['spring','autumn'],1,'#d697a0','根茎'],
 ['herbs','香草',12,2,4,4,ALL,1,'#83ad70','香草'],
 ['berries','浆果',20,3,6,5,['summer','autumn'],1,'#b56383','果实'],
 ['moonflower','月见花',30,2,9,8,ALL,2,'#e8d393','花卉'],
 ['carrot','胡萝卜',14,3,5,4,['spring','autumn'],1,'#db9659','根茎'],
 ['lettuce','卷叶生菜',9,2,3,4,['spring'],1,'#98b774','叶菜'],
 ['pea','青豌豆',18,4,7,4,['spring'],2,'#96b472','豆类'],
 ['strawberry','草莓',28,4,12,6,['spring'],3,'#bd6670','果实'],
 ['tomato','番茄',22,4,8,5,['summer'],1,'#c77862','果实'],
 ['corn','甜玉米',35,3,10,8,['summer','autumn'],2,'#d5b861','谷物'],
 ['cucumber','黄瓜',18,3,6,5,['summer'],1,'#739b68','果实'],
 ['watermelon','小西瓜',50,2,16,15,['summer'],4,'#71966d','果实'],
 ['eggplant','紫茄子',23,3,7,6,['autumn'],2,'#9681a9','果实'],
 ['pumpkin','南瓜',45,2,14,13,['autumn'],3,'#ca975d','果实'],
 ['sweetpotato','红薯',32,3,9,7,['autumn'],2,'#b68392','根茎'],
 ['spinach','菠菜',12,3,4,4,['autumn','winter'],1,'#77a071','叶菜'],
 ['turnip','白萝卜',16,3,5,5,['winter'],1,'#e2dbc2','根茎'],
 ['onion','洋葱',21,3,7,6,['winter','spring'],2,'#d4b5a0','根茎'],
 ['snowpea','荷兰豆',27,4,10,6,['winter'],3,'#a5bc88','豆类'],
 ['winterflower','雪铃花',40,2,15,14,['winter'],4,'#d8e4db','花卉'],
 ['potato','土豆',20,4,6,5,['spring','autumn'],1,'#bfab78','根茎'],
 ['wheat','小麦',25,4,7,5,['spring','autumn'],1,'#d7ba77','谷物'],
 ['rice','稻米',35,4,9,7,['summer','autumn'],2,'#b8b574','谷物'],
 ['oat','燕麦',24,4,8,6,['spring','autumn','winter'],2,'#c0b786','谷物'],
 ['soybean','黄豆',28,4,8,6,['spring','summer'],2,'#c3b87b','豆类'],
 ['redbean','红豆',30,4,9,7,['summer','autumn'],2,'#a8706a','豆类'],
 ['coffee','魔法咖啡豆',48,3,18,12,['spring','summer','autumn'],4,'#87654e','豆类'],
 ['tea','茶叶',32,4,11,8,['spring','autumn'],3,'#7b9e68','香草'],
 ['cocoa','暖棚可可',55,3,20,14,['summer','winter'],5,'#a88465','果实'],
 ['sugarcane','甘蔗',36,4,12,8,['summer','autumn'],3,'#b5c088','谷物'],
 ['apple','矮生苹果',60,5,24,10,['autumn'],4,'#bc7767','果实'],
 ['pear','矮生蜜梨',58,5,23,10,['autumn','winter'],4,'#d1bd7b','果实'],
 ['peach','盆栽蜜桃',60,4,25,13,['summer'],4,'#dca294','果实'],
 ['orange','盆栽蜜橘',62,5,26,12,['winter'],4,'#d8a16c','果实'],
 ['lemon','矮生柠檬',48,4,20,10,['summer','winter'],3,'#d9c874','果实'],
 ['grape','小串葡萄',50,5,22,10,['summer','autumn'],4,'#a08aa7','果实'],
 ['blueberry','蓝莓',38,5,16,8,['summer'],3,'#7d8faa','果实'],
 ['mushroom','田栽蘑菇',18,3,7,6,ALL,1,'#c2a38b','菌菇'],
 ['ginger','生姜',28,3,10,8,['autumn','winter'],2,'#ccad78','根茎'],
 ['mint','薄荷',16,3,6,5,ALL,1,'#85b09b','香草']
 ];
 const CROPS=Object.fromEntries(cropRows.map(([id,name,minutes,yieldCount,seedPrice,sell,seasons,level,color,group])=>[id,{name,minutes,yield:yieldCount,seedPrice,sell,seasons,level,color,group,token:group==='花卉'?1:3}]));
 const fishRows=[
 ['minnow','溪流小银鱼',4,ALL,['river','pond'],0,24,'any',1,8,'#b7c7bd'],
 ['perch','苔纹鲈鱼',7,ALL,['river'],6,20,'any',1,6,'#88a17a'],
 ['carp','暖金鲤鱼',10,ALL,['river','pond'],0,24,'any',1,5,'#ceaa69'],
 ['rainfish','雨点鳟鱼',13,ALL,['river'],0,24,'rain',1,4,'#7bafbd'],
 ['moonfish','月尾鱼',16,ALL,['river','pond'],19,6,'any',2,3,'#b1a3c8'],
 ['dace','柳叶白条',6,['spring','summer'],['river'],6,19,'any',1,7,'#c5d6bf'],
 ['loach','泥鳅',8,['spring','autumn'],['pond'],0,24,'any',1,6,'#aa9677'],
 ['crucian','花斑鲫鱼',9,ALL,['pond'],5,21,'any',1,6,'#adbdad'],
 ['bitterling','桃花鳑鲏',13,['spring'],['pond'],7,18,'any',2,4,'#d59fba'],
 ['cherrytrout','樱鳍鳟鱼',19,['spring'],['river'],5,12,'any',3,3,'#d3a6a0'],
 ['glassfish','玻璃小鱼',12,['spring','summer'],['pond'],8,18,'dry',2,4,'#b4d7d5'],
 ['bluegill','蓝鳃太阳鱼',14,['summer'],['pond'],10,19,'dry',2,5,'#85b7c3'],
 ['catfish','夜行鲶鱼',18,['summer','autumn'],['river'],18,6,'any',2,4,'#8884a4'],
 ['eel','雷雨鳗',24,['summer'],['river'],16,6,'rain',4,2,'#918aaf'],
 ['lotusfish','莲纹鱼',22,['summer'],['pond'],6,15,'any',3,3,'#c9a7b4'],
 ['goldenbarb','金线鲃',16,['summer','autumn'],['river'],8,18,'any',2,4,'#d6b475'],
 ['salmon','枫尾鲑鱼',23,['autumn'],['river'],6,19,'any',3,4,'#cd9180'],
 ['leafcarp','落叶锦鲤',26,['autumn'],['pond'],7,19,'dry',4,2,'#d4a276'],
 ['stonefish','石纹杜父鱼',15,['autumn','winter'],['river'],0,24,'any',2,4,'#9b9b91'],
 ['mistfish','雾鳍鱼',22,['autumn'],['pond'],4,10,'any',3,3,'#afb6c8'],
 ['iceperch','冰纹鲈鱼',18,['winter'],['river'],7,19,'any',2,5,'#a1c5cf'],
 ['snowtrout','雪鳞鳟鱼',25,['winter'],['river'],5,15,'any',3,3,'#d3ddd8'],
 ['lanternfish','灯笼鱼',28,['winter'],['pond'],18,7,'any',4,2,'#d4ba83'],
 ['stargazer','星点鲟',38,['winter','spring'],['river'],20,5,'dry',5,1,'#94a7c3']
 ];
 const FISH=Object.fromEntries(fishRows.map(([id,name,price,seasons,habitats,from,to,weather,level,weight,color])=>[id,{name,price,seasons,habitats,from,to,weather,level,weight,color}]));
 function season(s,at){let month=new Date(at+(s.preferences?.utcOffsetMinutes??480)*60000).getUTCMonth();if(s.country?.hemisphere==='south')month=(month+6)%12;return ALL[Math.floor(((month+10)%12)/3)];}
 function level(xp){return Math.min(10,1+Math.floor(Math.sqrt(xp/12)));}
 function hours(d,h){return d.from===0&&d.to===24||d.from<d.to?h>=d.from&&h<d.to:h>=d.from||h<d.to;}
 function fishPool(s,at,habitat='river'){const current=season(s,at),h=s.world.hour,wet=s.world.weather==='小雨';return Object.entries(FISH).filter(([,d])=>d.seasons.includes(current)&&d.habitats.includes(habitat)&&hours(d,h)&&(d.weather==='any'||d.weather==='rain'&&wet||d.weather==='dry'&&!wet)).map(([id,d])=>({id,weight:d.weight*(d.level>level(s.country.fishingXp||0)+1?.25:1)}));}
 function fishHint(d){return d.seasons.map(x=>NAMES[x]).join(' / ')+' · '+d.habitats.map(x=>x==='river'?'河流':'林间池塘').join('、')+' · '+(d.from===0&&d.to===24?'全天':d.from+'时—'+d.to+'时')+(d.weather==='rain'?' · 雨天':d.weather==='dry'?' · 无雨':'');}
 return{CROPS,FISH,NAMES,ALL,season,level,hours,fishPool,fishHint};
});
