/* Phaser owns world pixels and input; WitchLife owns every lasting fact. */
(function(root){'use strict';const V=root.WitchVillage;
 function mount(host,api){
  let scene=null,area=null,overview=false,focused=true,ready=false,pending=null,lastArea=null,lastPose='down',lastKey=0,lastStep=0,audio=null,gain=null;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,actorHeight=82;
  const state=()=>api.getState(),modal=()=>!document.getElementById('sheet').hidden;
  function sound(type){if(!state().village.sound)return;try{if(!audio){audio=new(window.AudioContext||window.webkitAudioContext)();gain=audio.createGain();gain.gain.value=.15;gain.connect(audio.destination);}if(audio.state==='suspended')audio.resume();const o=audio.createOscillator(),g=audio.createGain(),t=audio.currentTime;o.type=type==='step'?'triangle':'sine';o.frequency.setValueAtTime(type==='step'?130:610,t);o.frequency.exponentialRampToValueAtTime(type==='step'?65:390,t+.065);g.gain.setValueAtTime(type==='step'?.035:.12,t);g.gain.exponentialRampToValueAtTime(.0001,t+.1);o.connect(g);g.connect(gain);o.start(t);o.stop(t+.11);}catch{}}
  function walk(p,action){try{api.onWalk(p);pending=action||null;focused=true;sound('tap');}catch(e){api.onError(e.message);}}
  function cutAtlas(sc,key,columns,rows){
   const image=sc.textures.get(key).getSourceImage(),c=document.createElement('canvas');c.width=image.width;c.height=image.height;const cx=c.getContext('2d',{willReadFrequently:true});cx.drawImage(image,0,0);const data=cx.getImageData(0,0,c.width,c.height).data,frames=[];
   for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
    const x0=Math.floor(col*c.width/columns)+(key==='actions'&&row===0&&col===3?44:0),x1=Math.floor((col+1)*c.width/columns)-(key==='actions'&&row===0&&col===2?36:0),y0=key==='props'?(row===0?0:550):Math.floor(row*c.height/rows),y1=key==='props'?(row===0?550:c.height):Math.floor((row+1)*c.height/rows);let left=x1,right=x0,top=y1,bottom=y0;
    for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)if(data[(y*c.width+x)*4+3]>95){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
    const name=String(row*columns+col);sc.textures.get(key).add(name,0,left,top,Math.max(1,right-left+1),Math.max(1,bottom-top+1));frames.push({name,w:right-left+1,h:bottom-top+1});
   }return frames;
  }
  function ground(sc){
   const texture=sc.textures.createCanvas('ground',V.WIDTH,V.HEIGHT),c=texture.context;let n=123412;const random=()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};
   c.fillStyle='#7d8b58';c.fillRect(0,0,V.WIDTH,V.HEIGHT);
   const colors=['#82915e','#778553','#889763','#71814f','#91976b','#97a371'];
   for(let i=0;i<57000;i++){c.fillStyle=colors[Math.floor(random()*colors.length)];const x=Math.floor(random()*V.WIDTH/3)*3,y=Math.floor(random()*V.HEIGHT/3)*3;c.fillRect(x,y,3+Math.floor(random()*3)*3,3+Math.floor(random()*2)*3);}
   c.lineJoin='round';c.lineCap='round';function path(points,width,color){c.strokeStyle=color;c.lineWidth=width;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();}
   for(const road of V.paths){path(road,102,'#65734b');path(road,91,'#b7a073');path(road,76,'#c1aa7e');}
   for(let i=0;i<1800;i++){const road=V.paths[Math.floor(random()*V.paths.length)],index=Math.floor(random()*(road.length-1)),a=road[index],b=road[index+1],t=random(),x=a[0]+(b[0]-a[0])*t+(random()-.5)*60,y=a[1]+(b[1]-a[1])*t+(random()-.5)*60;c.fillStyle=random()<.5?'#ad966d':'#d0bb91';c.fillRect(Math.floor(x/3)*3,Math.floor(y/3)*3,3+Math.floor(random()*3)*3,3);}
   c.fillStyle='#657e69';c.fillRect(1265,0,154,V.HEIGHT);c.fillStyle='#456f71';c.fillRect(1285,0,115,V.HEIGHT);c.fillStyle='#527e7e';c.fillRect(1294,0,90,V.HEIGHT);
   for(let i=0;i<800;i++){c.fillStyle=i%3?'#638c87':'#86a79a';c.fillRect(1297+Math.floor(random()*74),Math.floor(random()*V.HEIGHT),7+Math.floor(random()*18),2);}
   // The bridge is a real corridor through the river collision boundary.
   c.fillStyle='#514a34';c.fillRect(1258,626,164,94);for(let x=1259;x<1422;x+=13){c.fillStyle=x%2?'#997c50':'#aa8c5c';c.fillRect(x,632,11,82);c.fillStyle='#c3a373';c.fillRect(x,636,10,3);}c.fillStyle='#715433';c.fillRect(1252,623,176,9);c.fillRect(1252,715,176,8);for(const x of[1260,1406])for(const y of[620,713]){c.fillStyle='#58442f';c.fillRect(x,y,12,16);c.fillStyle='#b99765';c.fillRect(x,y,12,4);}
   // Small dock on the west bank.
   c.fillStyle='#604b34';c.fillRect(1165,952,120,115);for(let y=956;y<1063;y+=15){c.fillStyle='#a88756';c.fillRect(1166,y,117,12);c.fillStyle='#c3a478';c.fillRect(1167,y,115,2);}
   for(const p of V.PLOTS){c.fillStyle='#a79465';c.fillRect(p.x-5,p.y-5,p.w+10,p.h+10);c.fillStyle='#715c3d';c.fillRect(p.x,p.y,p.w,p.h);for(let y=p.y+8;y<p.y+p.h;y+=12){c.fillStyle='#594a34';c.fillRect(p.x+3,y,p.w-6,3);c.fillStyle='#8a714b';c.fillRect(p.x+3,y+3,p.w-6,2);}}
   // A round bed reserved for things grown from personal dream seeds.
   c.fillStyle='#566d4d';c.beginPath();c.ellipse(1770,1070,100,57,0,0,Math.PI*2);c.fill();c.fillStyle='#ad9670';c.lineWidth=5;c.stroke();c.fillStyle='#736443';c.beginPath();c.ellipse(1770,1070,88,45,0,0,Math.PI*2);c.fill();
   // Bird bath and a few stones: decorative, with interaction at the standing spot.
   c.fillStyle='#807f68';c.fillRect(724,692,13,37);c.fillStyle='#b8bba3';c.beginPath();c.ellipse(730,693,26,13,0,0,Math.PI*2);c.fill();c.fillStyle='#789ca1';c.beginPath();c.ellipse(730,691,20,8,0,0,Math.PI*2);c.fill();
   for(let i=0;i<240;i++){const x=96+random()*1850,y=300+random()*1000;if(!V.walkable('village',x,y)||x>1240&&x<1460)continue;c.fillStyle='#a5af79';c.fillRect(x,y,2,6);c.fillStyle=i%4?'#d7d4a5':'#c3aa9f';c.fillRect(x-2,y-2,5,3);}
   const shade=c.createLinearGradient(0,0,0,300);shade.addColorStop(0,'#243f31');shade.addColorStop(1,'#52674900');c.fillStyle=shade;c.fillRect(0,0,V.WIDTH,300);texture.refresh();
  }
  class World extends Phaser.Scene{
   preload(){this.load.image('props','assets/village-props-v1.png');this.load.image('witch','assets/witch-directions-v1.png');this.load.image('actions','assets/village-actions-v1.png');this.load.image('room','assets/cottage-map-v1.png');this.load.on('loaderror',file=>api.onError('地图素材暂时没载入：'+file.key+'。请联网刷新重试。'));}
   create(){scene=this;this.propFrames=cutAtlas(this,'props',4,2);this.witchFrames=cutAtlas(this,'witch',3,4);this.actionFrames=cutAtlas(this,'actions',4,2);ground(this);this.ground=this.add.image(0,0,'ground').setOrigin(0).setDepth(-2000);this.room=this.add.image(0,0,'room').setOrigin(0).setDisplaySize(1024,768).setDepth(-2000);this.outside=[];this.hotspots=[];this.inside=[];
    for(const p of V.PROPS){const img=this.add.image(p.x,p.y,'props',String(p.frame)).setOrigin(.5,1).setDisplaySize(p.w,p.h).setDepth(p.y);this.outside.push(img);}
    for(let i=0;i<13;i++){const x=80+i*164;this.outside.push(this.add.image(x,235+(i%2)*50,'props','3').setOrigin(.5,1).setDisplaySize(260,300).setDepth(235+(i%2)*50));}
    this.shadow=this.add.ellipse(0,0,38,12,0x22382a,.23);this.actor=this.add.image(0,0,'witch','0').setOrigin(.5,1);this.actor.setInteractive({useHandCursor:true});this.actor.on('pointerup',()=>{if(!modal())api.onNow();});
    this.npcs={};for(const[id,n]of Object.entries(V.NPCS)){const index=id==='moss'?6:7,f=this.actionFrames[index],image=this.add.image(0,0,'actions',String(index)).setOrigin(.5,1).setDisplaySize(74*f.w/f.h,74),label=this.add.text(0,0,n.name,{fontFamily:'Microsoft YaHei, sans-serif',fontSize:'13px',color:'#fff3cf',stroke:'#344834',strokeThickness:4}).setOrigin(.5);image.setInteractive({useHandCursor:true});image.on('pointerup',()=>{if(modal())return;const n=api.residents().find(n=>n.id===id);walk(n,'npc:'+id);});this.npcs[id]={image,label};}
    for(const[id,p]of Object.entries(V.SPOTS)){const marker=this.add.text(p.x,p.y+5,'◇',{fontSize:'24px',color:'#fff1b8',stroke:'#4e6946',strokeThickness:2}).setOrigin(.5).setDepth(3000);const label=this.add.text(p.x,p.y+24,p.name,{fontFamily:'Microsoft YaHei, sans-serif',fontSize:'12px',color:'#fff4d3',backgroundColor:'#344c38bb',padding:{x:7,y:4}}).setOrigin(.5).setDepth(3000);marker.setInteractive({useHandCursor:true});label.setInteractive({useHandCursor:true});const fn=()=>{if(!modal())select(id);};marker.on('pointerup',fn);label.on('pointerup',fn);this.hotspots.push({id,p,marker,label});}
    this.effects=this.add.graphics().setDepth(2600);this.night=this.add.rectangle(0,0,V.WIDTH,V.HEIGHT,0x142b42,0).setOrigin(0).setDepth(2500);this.marker=this.add.ellipse(0,0,27,12,0xebd394,.1).setStrokeStyle(2,0xefdda0,.75).setDepth(2000).setVisible(false);
    this.speech=this.add.text(0,0,'',{fontFamily:'Microsoft YaHei, sans-serif',fontSize:'14px',color:'#354833',backgroundColor:'#fff2d8',padding:{x:12,y:9},wordWrap:{width:230}}).setOrigin(.5,1).setDepth(3100).setVisible(false);
    this.input.on('pointerup',(pointer,objects)=>{if(modal()||objects.length||!ready)return;const p=this.cameras.main.getWorldPoint(pointer.x,pointer.y);if(V.walkable(area,p.x,p.y)){walk({area,x:p.x,y:p.y});this.marker.setPosition(p.x,p.y).setVisible(true);this.markerUntil=performance.now()+1500;}});
    this.input.keyboard?.on('keydown',e=>{if(!modal()&&['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d','W','A','S','D'].includes(e.key))e.preventDefault();});this.keys=this.input.keyboard?.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT',false);
    this.scale.on('resize',()=>this.resizeView(true));this.cameras.main.setBackgroundColor('#263d30');this.resizeView(true);ready=true;api.onReady?.();
   }
   resizeView(snap=false){if(!state())return;const p=V.position(state(),Date.now()),cam=this.cameras.main,changed=area!==p.area;area=p.area;host.dataset.area=area;const inside=area==='inside';this.ground.setVisible(!inside);this.room.setVisible(inside);for(const o of this.outside)o.setVisible(!inside);for(const h of this.hotspots){h.marker.setVisible(h.p.area===area);h.label.setVisible(h.p.area===area);}for(const o of Object.values(this.npcs)){o.image.setVisible(!inside);o.label.setVisible(!inside);}const w=inside?1024:V.WIDTH,h=inside?768:V.HEIGHT;cam.setBounds(-50,-80,w+100,h+220);let z=overview?Math.min(this.scale.width/w,(this.scale.height-140)/h)*.96:(this.scale.width<600?.93:1.15)*state().village.zoom;if(inside&&!overview)z=Math.min(z,Math.max(.7,this.scale.height/790));cam.setZoom(z);if(snap||changed){cam.centerOn(p.x,p.y-60);this.effects.clear();if(changed&&!reduced)cam.fadeIn(210,24,41,30);}this.actor.setVisible(true);this.shadow.setVisible(true);}
   setAvatar(s){const signature=s.avatar.kind+':'+s.avatar.form+':'+s.avatar.body+':'+s.avatar.accent+':'+(s.avatar.portrait||'');if(signature===this.signature)return;this.signature=signature;if(s.avatar.kind==='original'){this.actor.setTexture('witch','0');return;}const key='player-custom';const tex=this.textures.exists(key)?this.textures.get(key):this.textures.createCanvas(key,140,160);const paint=img=>{if(this.signature!==signature||!this.sys?.isActive())return;tex.context.clearRect(0,0,140,160);root.WitchCompanions.draw(tex.context,s.avatar,70,151,140,0,false,false,img);tex.refresh();this.actor.setTexture(key).setDisplaySize(74,84);};if(s.avatar.kind==='portrait'){const image=new Image();image.onload=()=>paint(image);image.src=s.avatar.portrait;}else paint();}
   update(time,dt){if(!ready||!state())return;const s=state(),at=Date.now(),p=V.position(s,at);if(area!==p.area)this.resizeView(true);this.setAvatar(s);host.dataset.x=p.x.toFixed(1);host.dataset.y=p.y.toFixed(1);host.dataset.moving=String(p.moving);host.dataset.ready='true';
    if(p.moving){if(Math.abs(p.dx)>Math.abs(p.dy)*1.2)lastPose=p.dx>0?'right':'left';else if(Math.abs(p.dy)>Math.abs(p.dx)*1.2)lastPose=p.dy>0?'down':'up';}
    const pose={down:0,right:1,left:2,up:3}[lastPose],col=p.moving&&!reduced?([1,0,2,0][Math.floor(time/140)%4]):0;
    if(s.avatar.kind==='original'){
     const kind=s.activity.kind,action=!p.moving&&({read:0,tea:1,picnic:1,fish:2,garden:3,research:4,craft:4,rest:5,birdwatch:5,game:5,cook:1,tidy:4})[kind];
     if(action!==undefined&&action!==false){const f=this.actionFrames[action],h=[0,1,2,5].includes(action)?74:82;this.actor.setTexture('actions',String(action)).setFlipX(false).setDisplaySize(h*f.w/f.h,h);}else{const index=pose*3+col,f=this.witchFrames[index];this.actor.setTexture('witch',String(index)).setFlipX(false).setDisplaySize(actorHeight*f.w/f.h,actorHeight);}
    }else this.actor.setFlipX(lastPose==='left');
    const bob=p.moving&&!reduced?Math.sin(time/90)*.5:0;this.actor.setPosition(p.x,p.y+bob).setDepth(p.y);this.shadow.setPosition(p.x,p.y-2).setDepth(p.y-.1);
    if(!p.moving&&['read','birdwatch','rest','game','fish'].includes(s.activity.kind)){this.actor.y+=2;}
    if(p.moving&&time-lastStep>290&&!document.hidden){lastStep=time;sound('step');}
    const cam=this.cameras.main;if(focused){const desiredX=overview?(area==='inside'?512:1024):p.x,desiredY=overview?(area==='inside'?420:780):p.y-55;cam.centerOn(cam.midPoint.x+(desiredX-cam.midPoint.x)*(reduced?1:Math.min(1,dt/160)),cam.midPoint.y+(desiredY-cam.midPoint.y)*(reduced?1:Math.min(1,dt/160)));}
    for(const n of api.residents()){const o=this.npcs[n.id];o.image.setPosition(n.x,n.y+(n.moving&&!reduced?Math.sin(time/100)*1.2:0)).setFlipX(n.dx<0).setDepth(n.y);o.label.setPosition(n.x,n.y-83).setDepth(n.y+1);o.image.setVisible(area==='village');o.label.setVisible(area==='village'&&!overview);}
    for(const h of this.hotspots){const near=h.p.area===p.area&&V.dist(p,h.p)<260;h.label.setVisible(h.p.area===area&&(near||overview));h.marker.setAlpha(near?.95:.55);}
    this.night.setSize(area==='inside'?1024:V.WIDTH,area==='inside'?768:V.HEIGHT).setAlpha(s.world.hour>=19||s.world.hour<6?(area==='inside'?.06:.25):0);
    this.effects.clear();const g=this.effects;
    if(area==='village'){
     if(s.world.weather==='小雨'&&!reduced){g.lineStyle(1,0xc9dfdb,.35);for(let i=0;i<110;i++){const x=(i*193+time*.02)%V.WIDTH,y=(i*271+time*.25)%V.HEIGHT;g.lineBetween(x,y,x-5,y+13);}}
     for(let i=0;i<6;i++){const plot=s.country.plots[i],spot=V.PLOTS[i];if(!plot.crop)continue;const progress=plot.workMs/(root.WitchCountry.CROPS[plot.crop].minutes*60000);for(let j=0;j<4;j++){const x=spot.x+17+(j%2)*30,y=spot.y+18+Math.floor(j/2)*26;g.fillStyle(0x43693c);g.fillRect(x-1,y-8-progress*9,3,13+progress*5);g.fillStyle(progress>=1?0xc5b573:0x779657);g.fillEllipse(x-4,y-7-progress*9,10+progress*4,6);g.fillEllipse(x+5,y-10-progress*8,11+progress*4,7);if(progress>=1){g.fillStyle(plot.crop==='berries'?0xb56d69:plot.crop==='moonflower'?0xe5d793:0xdfc5a1);g.fillCircle(x,y-8,5);}}}
     s.plants.slice(-5).forEach((plant,i)=>{const creation=s.creations.find(c=>c.id===plant.creationId),x=1718+(i%3)*39,y=1051+Math.floor(i/3)*30;g.fillStyle(0x718a50);g.fillRect(x,y-12-plant.growth*17,4,30);g.fillEllipse(x-5,y-8-plant.growth*12,15,8);g.fillEllipse(x+7,y-16-plant.growth*12,16,8);g.fillStyle(parseInt((creation?.color||'#d4b177').slice(1),16));g.fillCircle(x+2,y-12-plant.growth*17,plant.bloomed?9:4);});
     if(s.world.hour>=19||s.world.hour<6)for(const lamp of V.PROPS.filter(p=>p.frame===7)){g.fillStyle(0xf6d285,.10);g.fillCircle(lamp.x+15,lamp.y-65,44);g.fillStyle(0xfbe7a3,.17);g.fillCircle(lamp.x+15,lamp.y-65,22);}
    }
    // Hands and a small object visibly connect the current action to the world.
    if(!p.moving&&s.avatar.kind!=='original'){const x=p.x,y=p.y-24;g.setDepth(p.y+1);if(s.activity.kind==='read'||s.activity.studyFragmentId){g.fillStyle(0xc5b07c);g.fillRect(x-12,y-8,24,14);g.lineStyle(1,0x66573b);g.lineBetween(x,y-8,x,y+6);}else if(s.activity.kind==='fish'||s.activity.title.includes('钓鱼')){g.lineStyle(2,0x785837);g.lineBetween(x+9,y,x+36,y-45);g.lineStyle(1,0xd8d6bb);g.lineBetween(x+36,y-45,x+66,y+22);}else if(['tea','cook','picnic'].includes(s.activity.kind)){g.fillStyle(0xddc796);g.fillRoundedRect(x-6,y-2,12,12,3);}}
    if(pending&&!s.village.journey){const action=pending;pending=null;this.marker.setVisible(false);api.onSpot(action);}
    if(this.markerUntil&&performance.now()>this.markerUntil)this.marker.setVisible(false);
    const speech=document.getElementById('speech');if(!speech.hidden&&speech.textContent){this.speech.setText(speech.textContent).setPosition(p.x,p.y-96).setVisible(true);}else this.speech.setVisible(false);
    if(!modal()&&this.keys&&time-lastKey>220){const k=this.keys,dx=Number(k.D.isDown||k.RIGHT.isDown)-Number(k.A.isDown||k.LEFT.isDown),dy=Number(k.S.isDown||k.DOWN.isDown)-Number(k.W.isDown||k.UP.isDown);if(dx||dy){lastKey=time;const target={area:p.area,x:p.x+dx*52,y:p.y+dy*52};if(V.lineClear(p,target))walk(target);}}
   }
  }
  function select(id){const p=V.SPOTS[id];if(!p)return;if(id==='exit')walk(V.HOME);else if(id==='home')walk(V.SPOTS.bed);else walk(p,p.action);}
  const game=new Phaser.Game({type:Phaser.AUTO,parent:host,backgroundColor:'#263d30',pixelArt:true,antialias:false,roundPixels:true,scale:{mode:Phaser.Scale.RESIZE,width:host.clientWidth,height:host.clientHeight},scene:World,render:{powerPreference:'low-power'},fps:{target:60,forceSetTimeOut:false},audio:{noAudio:true}});
  return{select,walk,follow(){focused=true;overview=false;scene?.resizeView(true);},overview(){overview=!overview;focused=true;scene?.resizeView(true);return overview;},zoom(){const s=state();s.village.zoom=s.village.zoom===1?1.3:s.village.zoom===1.3?.65:1;overview=false;scene?.resizeView();return s.village.zoom;},refresh(){scene?.resizeView(true);},toggleSound(){state().village.sound=!state().village.sound;sound('tap');return state().village.sound;},cancelPending(){pending=null;},destroy(){game.destroy(true);audio?.close();},get ready(){return ready;}};
 }
 root.WitchVillageView={mount};
})(globalThis);
