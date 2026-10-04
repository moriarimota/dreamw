/* Terrain is visual only. Roads, entrances and collision remain in village.js. */
(function(root){'use strict';
 function paint(sc,V){
  const W=V.WIDTH,H=V.HEIGHT,tex=sc.textures.createCanvas('ground',W,H),c=tex.context;
  const atlas=sc.textures.get('terrain').getSourceImage(),tiles=[];
  for(let i=0;i<4;i++){const tile=document.createElement('canvas');tile.width=tile.height=256;const t=tile.getContext('2d',{willReadFrequently:true});t.drawImage(atlas,(i%2)*atlas.width/2,Math.floor(i/2)*atlas.height/2,atlas.width/2,atlas.height/2,0,0,256,256);tiles.push(t.getImageData(0,0,256,256).data);}
  const segments=V.paths.flatMap(road=>road.slice(1).map((b,i)=>({a:road[i],b,dx:b[0]-road[i][0],dy:b[1]-road[i][1]})));
  function roadDistance(x,y){let best=1e6;for(const s of segments){const t=Math.max(0,Math.min(1,((x-s.a[0])*s.dx+(y-s.a[1])*s.dy)/(s.dx*s.dx+s.dy*s.dy)));best=Math.min(best,Math.hypot(x-s.a[0]-s.dx*t,y-s.a[1]-s.dy*t));}return best;}
  // Render at the same fine pixel scale as the props. A distance field merges
  // junctions into one worn surface, with a broken turf edge instead of bands.
  const small=document.createElement('canvas');small.width=W/2;small.height=H/2;const cx=small.getContext('2d'),im=cx.createImageData(W/2,H/2),dst=im.data;
  const plazas=[[480,510,102,54],[1040,530,111,55],[1710,521,97,48],[785,585,69,38]];
  const leftBank=y=>1288+6*(1+Math.sin(y*.014))+Math.sin(y*.11)*2,rightBank=y=>1397-5*(1+Math.sin(y*.011+2))+Math.sin(y*.08)*2;
  for(let sy=0;sy<H/2;sy++)for(let sx=0;sx<W/2;sx++){
   const x=sx*2,y=sy*2,edge=Math.sin(x*.14+y*.07)*2.2+Math.sin(y*.24-x*.08)*1.8;
   const dist=roadDistance(x,y),wear=Math.max(0,Math.min(1,(40+edge-dist)/11));
   let stone=0;for(const [px,py,rx,ry]of plazas)stone=Math.max(stone,Math.max(0,Math.min(1,(1-Math.hypot((x-px)/rx,(y-py)/ry))*6)));
   const river=x>=leftBank(y)&&x<=rightBank(y);
   const bank=Math.max(0,1-Math.min(Math.abs(x-leftBank(y)),Math.abs(x-rightBank(y)))/(7+edge));
   const ti=((((sy*2)%256)*256)+((sx*2)%256))*4,di=(sy*W/2+sx)*4;
   const ground=tiles[0],dirt=tiles[1],paving=tiles[2],water=tiles[3];
   const shade=.96+Math.sin(x*.009+y*.006)*.025+Math.sin(y*.015-x*.005)*.025;
   for(let k=0;k<3;k++){
    // Quiet the grass contrast so the character and architecture stay readable.
    const grass=ground[ti+k]*.56+[83,104,57][k]*.44;
    let value=grass*(1-wear)+dirt[ti+k]*[.91,.97,1.04][k]*wear;
    value=value*(1-stone)+paving[ti+k]*stone;
    if(bank)value=value*(1-bank*.6)+paving[ti+k]*.78*bank*.6;
    if(river)value=water[ti+k]*.85;
    dst[di+k]=value*shade;
   }dst[di+3]=255;
  }
  cx.putImageData(im,0,0);c.imageSmoothingEnabled=false;c.drawImage(small,0,0,W,H);
  let seed=671219;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  // Soft contact shadows settle buildings and trees into the meadow.
  for(const p of V.PROPS){const rx=p.frame<3?p.w*.46:p.frame===5?70:p.frame===7?20:p.w*.29,ry=p.frame<3?25:12;const g=c.createRadialGradient(p.x,p.y-3,2,p.x,p.y-3,rx);g.addColorStop(0,'#26331d55');g.addColorStop(1,'#26331d00');c.save();c.translate(p.x,p.y-3);c.scale(1,ry/rx);c.translate(-p.x,-p.y+3);c.fillStyle=g;c.fillRect(p.x-rx,p.y-3-rx,rx*2,rx*2);c.restore();}
  // River stones and reeds stay within the existing bank footprint.
  for(let y=265;y<1320;y+=12+rand()*22){if(y>609&&y<739)continue;for(const x of[leftBank(y)-3,rightBank(y)+3]){const j=rand()*7;if(rand()>.35){c.fillStyle=rand()>.5?'#9c9b81':'#7f886c';c.beginPath();c.ellipse(x+j-3,y,2+rand()*4,2+rand()*2,0,0,7);c.fill();}if(rand()>.55){c.strokeStyle='#5a7442';c.lineWidth=2;c.beginPath();c.moveTo(x,y);c.lineTo(x-3,y-12-j);c.moveTo(x+4,y);c.lineTo(x+7,y-9-j);c.stroke();}}}
  function wood(x,y,w,h,horizontal){c.fillStyle='#423e2c66';c.fillRect(x+4,y+5,w,h);c.fillStyle='#614a30';c.fillRect(x,y,w,h);for(let z=2;z<(horizontal?h:w)-2;z+=12){c.fillStyle=z%24?'#9d7d51':'#ad8b5d';c.fillRect(x+(horizontal?2:z),y+(horizontal?z:2),horizontal?w-4:10,horizontal?10:h-4);c.fillStyle='#c0a077';c.fillRect(x+(horizontal?3:z),y+(horizontal?z:4),horizontal?w-6:2,horizontal?1:h-8);}}
  wood(1258,632,164,82,false);for(const y of[627,713]){c.fillStyle='#664b2f';c.fillRect(1255,y,172,6);c.fillStyle='#b89562';c.fillRect(1255,y,172,2);}for(const x of[1260,1406])for(const y of[624,710]){c.fillStyle='#58432d';c.fillRect(x,y,10,16);c.fillStyle='#c4a774';c.fillRect(x,y,10,3);}
  wood(1165,952,120,115,true);
  for(const p of V.PLOTS){c.fillStyle='#544531';c.fillRect(p.x,p.y,p.w,p.h);for(let y=p.y+5;y<p.y+p.h;y+=10){c.fillStyle='#8a6948';c.fillRect(p.x+2,y,p.w-4,5);c.fillStyle='#ac8558';c.fillRect(p.x+3,y,p.w-6,1);}for(let i=0;i<24;i++){c.fillStyle=i%2?'#ae9465':'#776142';c.fillRect(p.x+rand()*p.w,p.y+rand()*p.h,2,2);}}
  c.fillStyle='#675639';c.beginPath();c.ellipse(1770,1070,94,51,0,0,7);c.fill();for(let a=0;a<6.28;a+=.17){c.fillStyle=Math.sin(a*8)>0?'#b1a080':'#8f9270';c.beginPath();c.ellipse(1770+Math.cos(a)*96,1070+Math.sin(a)*53,7,4,0,0,7);c.fill();}
  c.fillStyle='#7e806b';c.fillRect(725,695,11,31);c.fillStyle='#b5b99f';c.beginPath();c.ellipse(730,693,23,11,0,0,7);c.fill();c.fillStyle='#6b999a';c.beginPath();c.ellipse(730,691,18,7,0,0,7);c.fill();
  // A few small groups of wildflowers, with clear paths between them.
  for(const [px,py]of[[270,670],[600,760],[845,780],[960,880],[1555,998],[1840,765],[420,1080]])for(let i=0;i<30;i++){const x=px+(rand()-.5)*95,y=py+(rand()-.5)*52;if(!V.walkable('village',x,y)||roadDistance(x,y)<52)continue;c.fillStyle='#526c3d';c.fillRect(x,y,2,6);c.fillStyle=i%4?'#e1d8ac':'#b3a3b5';c.fillRect(x-1,y-2,4,3);}
  const shade=c.createLinearGradient(0,0,0,315);shade.addColorStop(0,'#233d32cc');shade.addColorStop(1,'#233d3200');c.fillStyle=shade;c.fillRect(0,0,W,315);tex.refresh();
 }
 function paintForest(sc,V){
  const W=1536,H=1152,tex=sc.textures.createCanvas('forest-ground',W,H),c=tex.context,atlas=sc.textures.get('terrain').getSourceImage(),tiny=document.createElement('canvas');tiny.width=768;tiny.height=576;const t=tiny.getContext('2d');t.imageSmoothingEnabled=false;
  const tiles=[];for(let i=0;i<4;i++){const cv=document.createElement('canvas');cv.width=cv.height=256;const q=cv.getContext('2d');q.drawImage(atlas,(i%2)*atlas.width/2,Math.floor(i/2)*atlas.height/2,atlas.width/2,atlas.height/2,0,0,256,256);tiles.push(q.getImageData(0,0,256,256).data);}
  const roads=[[[768,1152],[768,930],[662,725],[520,645],[425,515]],[[662,725],[790,620],[820,440],[1090,320],[1190,345]],[[520,645],[355,780],[310,940]],[[768,930],[610,940]],[[768,930],[1020,940],[1220,970]],[[820,440],[840,315]],[[820,440],[670,400],[570,310]],[[662,725],[795,770]]],segments=roads.flatMap(r=>r.slice(1).map((p,i)=>[r[i][0]/2,r[i][1]/2,p[0]/2,p[1]/2]));
  const image=t.createImageData(768,576);for(let y=0;y<576;y++)for(let x=0;x<768;x++){let distance=1e6;for(const[a,b,dx,dy]of segments){const vx=dx-a,vy=dy-b,f=Math.max(0,Math.min(1,((x-a)*vx+(y-b)*vy)/(vx*vx+vy*vy)));distance=Math.min(distance,Math.hypot(x-a-vx*f,y-b-vy*f));}const edge=Math.sin(x*.33+y*.12)+Math.sin(y*.42-x*.17),wear=Math.max(0,Math.min(1,(18+edge-distance)/6)),water=Math.hypot((x-540)/118,(y-325)/89),bank=Math.max(0,1-Math.abs(water-1)/.045),i=((y*2%256)*256+(x*2%256))*4,j=(y*768+x)*4;for(let k=0;k<3;k++){const grass=tiles[0][i+k]*.53+[77,100,55][k]*.47;let v=grass*(1-wear)+tiles[1][i+k]*[.9,.96,1.03][k]*wear;if(water<1)v=tiles[3][i+k]*.8;if(bank)v=v*(1-bank*.7)+tiles[2][i+k]*.75*bank*.7;image.data[j+k]=v;}image.data[j+3]=255;}t.putImageData(image,0,0);
  let seed=54891;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};t.lineWidth=1;
  for(let i=0;i<95;i++){const a=rand()*6.28,x=540+Math.cos(a)*121,y=325+Math.sin(a)*92;t.fillStyle=i%3?'#748368':'#aca589';t.fillRect(x,y,2+rand()*2,1+rand()*2);if(i%4===0){t.strokeStyle='#48643a';t.beginPath();t.moveTo(x,y);t.lineTo(x-2,y-7);t.moveTo(x+2,y);t.lineTo(x+4,y-5);t.stroke();}}
  t.strokeStyle='#c6dcbe66';for(let i=0;i<24;i++){const x=465+rand()*150,y=285+rand()*80;t.beginPath();t.moveTo(x,y);t.lineTo(x+4+rand()*5,y);t.stroke();}for(const[x,y]of[[495,305],[570,363],[605,298]]){t.fillStyle='#889d70';t.beginPath();t.ellipse(x,y,6,3,0,.3,6);t.fill();t.fillStyle='#dbc4aa';t.fillRect(x-1,y-2,2,2);}
  // Each stall has a shaded wooden counter and its own stock silhouette.
  for(const [i,id]of ['cafe','bakery','library','apiary','orchard','teahouse','fishstudy'].entries()){const p=V.SPOTS[id],x=p.x/2,y=p.y/2;t.fillStyle='#35442a44';t.beginPath();t.ellipse(x+2,y-5,29,8,0,0,7);t.fill();t.fillStyle='#4b3b29';t.fillRect(x-22,y-31,44,20);t.fillStyle='#957248';t.fillRect(x-21,y-28,42,17);for(let z=-19;z<21;z+=7){t.fillStyle='#af8d5c';t.fillRect(x+z,y-26,5,14);t.fillStyle='#715333';t.fillRect(x+z+1,y-18,3,1);}t.fillStyle='#574530';t.fillRect(x-22,y-33,44,4);t.fillRect(x-20,y-13,3,10);t.fillRect(x+17,y-13,3,10);t.fillStyle='#c3a375';t.fillRect(x-22,y-34,44,2);t.fillStyle='#755836';t.fillRect(x-23,y-57,2,47);t.fillRect(x+21,y-57,2,47);const fabric=['#819887','#b08561','#707f83','#b6a36a','#a16e58','#8c9b76','#7e9d9d'][i];for(let z=0;z<6;z++){t.fillStyle=z%2?'#cfbf99':fabric;t.fillRect(x-25+z*8,y-58,8,12);t.fillRect(x-25+z*8,y-46,8,3-z%2);}t.fillStyle='#5c4d3355';t.fillRect(x-25,y-46,48,2);for(let z=0;z<3;z++){const q=x-15+z*13;if(id==='library'){for(let n=0;n<3;n++){t.fillStyle=['#688a78','#aa8061','#a79b71'][(z+n)%3];t.fillRect(q,y-39-n*3,9,2);}}else if(id==='cafe'||id==='teahouse'){t.fillStyle='#dfcc9f';t.fillRect(q,y-39,5,5);t.strokeStyle='#dfcc9f';t.strokeRect(q+5,y-38,2,3);t.fillStyle='#604632';t.fillRect(q+1,y-40,3,1);}else if(id==='orchard'){for(let n=0;n<3;n++){t.fillStyle=n%2?'#aa684f':'#b49f65';t.fillRect(q+n*3,y-38-n%2*3,4,4);}}else if(id==='bakery'){t.fillStyle='#d0a466';t.beginPath();t.ellipse(q+3,y-37,5,3,0,0,7);t.fill();t.fillStyle='#f0cc89';t.fillRect(q+1,y-39,1,2);t.fillRect(q+4,y-39,1,2);}else{t.fillStyle=id==='apiary'?'#c29b4f':'#7d9b9b';t.fillRect(q,y-40,7,6);t.fillStyle='#dcc69b';t.fillRect(q,y-41,7,2);t.fillRect(q+2,y-38,3,2);}}}
  // Small places to stop: a blanket, herb patch and a ring of stepping stones.
  t.fillStyle='#85564a';t.fillRect(310,337,42,26);t.fillStyle='#d9b98b';for(let x=313;x<350;x+=6)t.fillRect(x,339,2,22);for(let y=341;y<363;y+=6)t.fillRect(312,y,37,2);t.fillStyle='#b48a54';t.fillRect(345,334,9,9);
  for(let i=0;i<95;i++){const x=145+rand()*55,y=375+rand()*46;t.fillStyle=i%3?'#426b43':'#7d9460';t.fillRect(x,y,2,4);if(i%5===0){t.fillStyle='#d7c795';t.fillRect(x-1,y-1,3,2);}}
  for(let i=0;i<900;i++){const x=rand()*768,y=110+rand()*456;if(Math.hypot((x-540)/133,(y-325)/100)<1)continue;t.fillStyle=i%7?'#76845044':'#d8cba144';t.fillRect(x,y,1+rand()*2,1);}
  c.imageSmoothingEnabled=false;c.drawImage(tiny,0,0,W,H);for(const p of V.FOREST_PROPS){const g=c.createRadialGradient(p.x,p.y,1,p.x,p.y,p.w*.48);g.addColorStop(0,'#1e332660');g.addColorStop(1,'#1e332600');c.save();c.translate(p.x,p.y);c.scale(1,.18);c.translate(-p.x,-p.y);c.fillStyle=g;c.fillRect(p.x-p.w/2,p.y-p.w/2,p.w,p.w);c.restore();}const shade=c.createLinearGradient(0,0,0,300);shade.addColorStop(0,'#233d32dd');shade.addColorStop(1,'#233d3200');c.fillStyle=shade;c.fillRect(0,0,W,300);tex.refresh();
 }
 root.WitchTerrain={paint,paintForest};
})(globalThis);
