/* Ingredients, recipes and resident jobs. No external calls or arbitrary proposals. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.WitchKitchen=api;})(globalThis,function(){'use strict';
 const rows=[
 ['herbtea','香草热茶','饮品',{herbs:1},2,6,7,'清洗叶子，先温杯，再让叶香慢慢泡进水里。'],
 ['berrycookie','浆果小饼','烘焙',{berries:1,wheat:1},3,12,14,'面团压成小圆饼，嵌进浆果，烤到边缘微微变黄。'],
 ['radishsoup','萝卜清汤','料理',{radish:2,herbs:1},3,10,10,'萝卜切薄片，清汤小火煮透，出锅前放香草。'],
 ['salad','春日蔬菜碗','料理',{lettuce:1,carrot:1,cucumber:1},3,6,17,'洗净沥水，蔬菜切成不同形状，拌匀后装进木碗。'],
 ['peaporridge','豌豆米粥','料理',{pea:1,rice:1},3,14,16,'米粒熬开后放豌豆，沿锅底慢慢搅动。'],
 ['tomatopasta','番茄手擀面','料理',{tomato:2,wheat:1},3,18,21,'面团擀薄切条，番茄煮成浓汁，最后一起拌好。'],
 ['roastcorn','炉火烤玉米','料理',{corn:2},2,9,13,'玉米翻着面慢烤，留一点柔软的内芯。'],
 ['pumpkinsoup','南瓜浓汤','料理',{pumpkin:1,potato:1},3,15,23,'南瓜蒸软压成泥，和土豆一起煮出浓浓的汤。'],
 ['sweetbowl','烤薯小碗','料理',{sweetpotato:2},2,12,16,'红薯烤到流蜜，剥开后装进温过的小碗。'],
 ['mushroomrice','蘑菇焖饭','料理',{mushroom:2,rice:1},3,18,24,'蘑菇先炒出香气，和米饭一起盖上锅盖焖熟。'],
 ['onionbread','洋葱小餐包','烘焙',{onion:1,wheat:2},4,22,19,'洋葱切碎揉入面团，等面团长大，再烤成小餐包。'],
 ['snowpeapot','荷兰豆蔬菜煲','料理',{snowpea:1,turnip:1,carrot:1},3,14,22,'豆荚去筋，和冬蔬一起煨到清甜。'],
 ['eggplantrice','茄子盖饭','料理',{eggplant:2,rice:1},3,16,24,'茄子煎软，浇上豆香酱汁，盖在热饭上。'],
 ['spinachroll','菠菜卷','料理',{spinach:1,wheat:1},3,13,17,'揉面时加入菠菜汁，卷起薄饼，切成小段。'],
 ['potatowedges','香草土豆角','料理',{potato:2,herbs:1},3,12,17,'土豆带皮切角，拌入香草，烤到边缘酥脆。'],
 ['fishsoup','河鲜暖汤','料理',{minnow:2,ginger:1},3,16,23,'处理小鱼，用姜片去腥，慢慢煮出一锅暖汤。'],
 ['grilledcarp','香草烤鲤鱼','料理',{carp:1,herbs:1,lemon:1},3,20,30,'鱼腹放进香草，烤熟后挤一点柠檬汁。'],
 ['lotusfishrice','池塘鱼饭','料理',{crucian:1,rice:1,onion:1},3,20,28,'鱼肉剔刺，和洋葱、米饭一同焖出香气。'],
 ['soymilk','温豆浆','饮品',{soybean:2},3,14,15,'豆子泡软磨细，煮开后撇去浮沫，装进瓷壶。'],
 ['redbeansoup','红豆甜汤','甜点',{redbean:2,sugarcane:1},4,20,20,'红豆煮到绵软，添一点蔗糖，留一些完整的豆子。'],
 ['oatcup','燕麦暖饮','饮品',{oat:2},3,10,15,'燕麦小火煮开，滤出柔滑的暖饮。'],
 ['coffee','手冲咖啡','饮品',{coffee:2},2,8,23,'烘好的豆子磨碎，分几次注水，等最后一滴落进壶里。'],
 ['oatlatte','燕麦拿铁','饮品',{coffee:1,oat:1},2,10,27,'咖啡萃好，温热燕麦饮，轻轻倒进同一只杯子。'],
 ['cocoa','热可可','饮品',{cocoa:1,sugarcane:1},2,10,27,'可可慢慢化开，调入少量蔗糖，搅到没有小颗粒。'],
 ['minttea','薄荷清茶','饮品',{mint:1,tea:1},3,7,20,'先泡茶，再添薄荷，香气会一层一层浮上来。'],
 ['lemontea','柠檬红茶','饮品',{lemon:1,tea:1,sugarcane:1},3,8,28,'茶放到温热再加入柠檬片，轻轻搅匀。'],
 ['peachtea','蜜桃冷泡茶','饮品',{peach:1,tea:1},3,12,27,'桃子切片，放进冷泡好的茶里，等果香散开。'],
 ['gingertea','姜糖暖饮','饮品',{ginger:1,sugarcane:1},3,9,20,'姜片轻拍，和蔗糖一起煮出暖暖的甜辣味。'],
 ['melonjuice','西瓜冰饮','饮品',{watermelon:1,mint:1},3,6,26,'西瓜去籽压出汁，用薄荷叶添一点清凉。'],
 ['orangejuice','橘子鲜饮','饮品',{orange:2},3,5,24,'橘瓣去籽，轻压果汁，留一点细细的果肉。'],
 ['grapesoda','葡萄气泡饮','饮品',{grape:1,sugarcane:1},3,7,26,'葡萄压汁滤净，添进泉水气泡，边缘冒起细细的小珠。'],
 ['strawberryjam','草莓果酱','甜点',{strawberry:2,sugarcane:1},4,18,22,'草莓切碎，小火熬浓，装进洗净的玻璃罐。'],
 ['blueberrypie','蓝莓小派','烘焙',{blueberry:2,wheat:1},4,22,25,'派皮压薄，铺进蓝莓，边缘折出小花纹。'],
 ['applepie','苹果肉桂风味派','烘焙',{apple:2,wheat:1,sugarcane:1},4,24,27,'苹果切薄片码整齐，烤香后撒上厨房常备的香料。'],
 ['pearcompote','温梨盅','甜点',{pear:2,ginger:1},3,17,24,'梨切块装盅，和少量姜片一起蒸软。'],
 ['ricecake','月牙米糕','甜点',{rice:2,redbean:1},4,22,24,'米粉蒸熟，包入红豆馅，捏成弯弯的月牙。'],
 ['flowertea','月见花茶','饮品',{moonflower:1,tea:1},3,9,29,'只取自己田里的魔法花瓣，和茶叶放进花纹小壶。'],
 ['wintertea','冬花暖茶','饮品',{winterflower:1,ginger:1},3,10,30,'游戏里的冬花晾干，与姜片温煮，留下淡淡的花香。'],
 ['cornbread','玉米松饼','烘焙',{corn:1,wheat:1},3,14,20,'玉米压碎拌入面糊，在平底锅里烘出松软的饼。'],
 ['berryoat','浆果燕麦碗','甜点',{berries:1,oat:1},3,8,19,'燕麦煮软，舀进浆果，红色果汁染出一圈小花边。']];
 const RECIPES=Object.fromEntries(rows.map(([id,name,category,ingredients,yieldCount,minutes,sell,description])=>[id,{name,category,ingredients,yield:yieldCount,minutes,sell,description}]));
 const JOBS={moss:{name:'整理植物札记',place:'riverNeighbor',pay:10,minutes:15},chestnut:{name:'给杂货铺补货',place:'riverShop',pay:12,minutes:18},reed:{name:'修补鱼篓',place:'riverJetty',pay:11,minutes:15},fern:{name:'分类晾晒草叶',place:'forestForage',pay:12,minutes:18},ember:{name:'整理手作棚',place:'forestStudio',pay:12,minutes:15},bean:{name:'磨豆和洗咖啡杯',place:'villageCafe',pay:14,minutes:20},wheat:{name:'帮面包房揉面',place:'villageBakery',pay:14,minutes:20},ink:{name:'给借阅书包封皮',place:'villageLibrary',pay:12,minutes:18},honey:{name:'贴蜂蜜罐标签',place:'forestApiary',pay:13,minutes:18},peach:{name:'给果篮分级',place:'forestOrchard',pay:14,minutes:20},cloud:{name:'晾晒茶席',place:'forestTea',pay:12,minutes:17},tide:{name:'整理鱼类标本卡',place:'forestPond',pay:13,minutes:18}};
 const fresh=()=>({meals:Object.fromEntries(Object.keys(RECIPES).map(k=>[k,0])),cooked:Object.fromEntries(Object.keys(RECIPES).map(k=>[k,0])),eaten:0,jobDone:Object.fromEntries(Object.keys(JOBS).map(k=>[k,0])),jobAt:Object.fromEntries(Object.keys(JOBS).map(k=>[k,0]))});
 function clean(x){const o=fresh();if(!x)return o;for(const group of['meals','cooked','jobDone','jobAt'])for(const k in o[group]){const n=x[group]?.[k]??0;if(!Number.isInteger(n)||n<0||n>(group==='jobAt'?8640000000000000:1000000))throw Error('厨房或工作记录不正确');o[group][k]=n;}if(!Number.isInteger(x.eaten)||x.eaten<0||x.eaten>1000000)throw Error('用餐记录不正确');o.eaten=x.eaten;return o;}
 function stock(s,k){return ['herbs','berries'].includes(k)?s.home.pantry[k]:Object.hasOwn(s.country.fish,k)?s.country.fish[k]:s.country.bag[k]||0;}
 function available(s,id,portions=1){const d=RECIPES[id];return !!d&&Number.isInteger(portions)&&portions>=1&&portions<=5&&Object.entries(d.ingredients).every(([k,n])=>stock(s,k)>=n*portions);}
 function begin(s,a){if(!available(s,a.recipeId,a.portions))throw Error('食材还不够，先收获或去钓鱼吧。');for(const[k,n]of Object.entries(RECIPES[a.recipeId].ingredients)){const bag=['herbs','berries'].includes(k)?s.home.pantry:Object.hasOwn(s.country.fish,k)?s.country.fish:s.country.bag;bag[k]-=n*a.portions;}}
 function finish(s,a){const d=RECIPES[a.recipeId],n=d.yield*a.portions;s.kitchen.meals[a.recipeId]=Math.min(1000000,s.kitchen.meals[a.recipeId]+n);s.kitchen.cooked[a.recipeId]=Math.min(1000000,s.kitchen.cooked[a.recipeId]+n);return '她做好了 '+n+' 份'+d.name+'，收进厨房的餐篮。';}
 function action(s,kind,id,quantity=1){const d=RECIPES[id];if(!d||!Number.isInteger(quantity)||quantity<1||quantity>1000000||s.kitchen.meals[id]<quantity)throw Error('餐篮里的份数不够');if(kind==='eat'){s.kitchen.meals[id]-=quantity;s.kitchen.eaten=Math.min(1000000,s.kitchen.eaten+quantity);s.world.energy=Math.min(100,s.world.energy+12*quantity);return '你们一起尝了'+d.name+'，留一会儿饭后的闲聊。';}if(kind==='sell'){s.kitchen.meals[id]-=quantity;s.country.coins=Math.min(1000000,s.country.coins+d.sell*quantity);return '卖出 '+quantity+' 份'+d.name+'，收到 '+d.sell*quantity+' 星砂。';}throw Error('没有这个厨房操作');}
 return{RECIPES,JOBS,fresh,clean,stock,available,begin,finish,action};
});
