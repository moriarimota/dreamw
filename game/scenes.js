(function(root){
 'use strict';
 const courtyard=root.WitchNavigation.makeMap([[330,490],[610,495],[720,540],[700,650],[640,720],[680,950],[720,1010],[650,1100],[610,1210],[365,1260],[345,1130],[255,1050],[320,900],[310,610]]);
 const riverbank=root.WitchNavigation.makeMap([[300,440],[700,380],[710,490],[590,605],[570,845],[660,1070],[620,1260],[430,1270],[400,1080],[470,850],[470,625],[280,535]]);
 const scenes={riverbank:{name:'河畔',image:'assets/riverbank-v1.png',nav:riverbank,entry:{x:510,y:1160},spots:[['farm','六块小田',29,47],['shop','河畔小店',28,24],['fishing','木栈桥',71,25],['home','回小屋',53,71]]},cottage:{name:'小屋',image:'assets/cottage-empty-v1.png',nav:root.WitchNavigation,entry:{x:480,y:1040},spots:[['books','书架',74,37],['stove','炉边',27,57],['desk','工作桌',71,48],['bed','软软的床',30,38],['display','收藏架',83,54],['door','小屋的门',53,70]]},courtyard:{name:'小院',image:'assets/courtyard-v1.png',nav:courtyard,entry:{x:380,y:540},spots:[['herbs','香草圃',20,43],['berries','浆果丛',83,46],['bench','树下长椅',70,25],['birds','鸟饮水盆',88,59],['home','回小屋',35,23],['river','去河畔',54,70]]}};
 function paintWeather(ctx,s,scene,now,reduced){
   const h=s.world.hour,night=h>=19||h<6,weather=s.world.weather;
   ctx.save();ctx.beginPath();ctx.rect(0,100,941,1220);ctx.clip();
   if(night){ctx.fillStyle=s.home.lamp?'#17304426':'#11213951';ctx.fillRect(0,100,941,1220);}
   else if(h>=17){ctx.fillStyle='#d2974310';ctx.fillRect(0,100,941,1220);}
   if(weather==='小雨'&&!reduced){ctx.strokeStyle='#d0e1cf55';ctx.lineWidth=1.5;const ox=scene!=='cottage'?0:395,oy=scene!=='cottage'?120:330,w=scene!=='cottage'?941:160,ht=scene!=='cottage'?1160:200;
    for(let i=0;i<(scene!=='cottage'?45:9);i++){const x=ox+(i*67.1%w),y=oy+(now*.11+i*83)%ht;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-5,y+19);ctx.stroke();}}
   if(scene!=='cottage'&&night&&weather!=='小雨'){ctx.fillStyle='#ffdf86';for(let i=0;i<10;i++){ctx.globalAlpha=reduced?.65:.3+.4*Math.sin(now*.001+i)**2;ctx.fillRect(280+(i*77)%430,560+(i*139)%520,3,3);}}
   ctx.restore();
 }
 root.WitchScenes={scenes,paintWeather};
})(globalThis);
