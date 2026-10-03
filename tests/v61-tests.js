'use strict';
const assert=require('node:assert/strict'),V=require('../game/village.js'),L=require('../game/life.js');
const at=Date.UTC(2026,8,30,3);let passed=0;
function test(name,fn){fn();passed++;console.log('PASS',name)}
test('持续按方向不会反复起步而停滞',()=>{const s=L.create(at);s.village.location={area:'village',x:500,y:900};s.village.journey=null;let p=V.position(s,at);for(let i=0;i<10;i++){const t=at+i*110;p=V.position(s,t);L.walkTo(s,V.steer(p,1,0),t)}const end=V.position(s,at+1100);assert.ok(end.x-500>110,`实际只前进${end.x-500}`);assert.ok(end.x-500<240);assert.ok(V.walkable(end.area,end.x,end.y));});
test('斜向碰墙会沿可用方向滑动',()=>{const p={area:'inside',x:850,y:620},q=V.steer(p,1,-1);assert.ok(V.lineClear(p,q));assert.ok(q.y<p.y-30);assert.ok(q.x<=860);});
test('缓存路径由调用者独立拥有，不污染后续行走',()=>{const a=V.SPOTS.shop,b=V.SPOTS.farm,one=V.route(a,b),expected=JSON.stringify(one);one[1].x=-900;assert.equal(JSON.stringify(V.route(a,b)),expected);});
test('旧版本路程时间与坐标在新版中连续，完成后合法入档',()=>{const s=L.create(at);L.walkTo(s,'farm',at);s.village.journey.endsAt+=4000;s.activity.startedAt+=4000;s.activity.endsAt+=4000;const t=at+1500,old=JSON.parse(JSON.stringify(s)),loaded=L.validate(old,t);assert.deepEqual(V.position(loaded,t),V.position(s,t));L.advance(loaded,loaded.village.journey.endsAt);L.validate(loaded,loaded.lastAdvancedAt);});
console.log(`${passed}/${passed} v61 tests passed`);
