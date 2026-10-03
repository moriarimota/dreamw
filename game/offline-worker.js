/* Only public runtime files enter this cache. Saves and private APIs never do. */
importScripts('./offline-manifest.js');
const CACHE='witchlife-offline-'+self.WITCH_OFFLINE.version;
const FILES=self.WITCH_OFFLINE.files.map(p=>new URL(p,self.registration.scope).href);
self.addEventListener('install',event=>event.waitUntil((async()=>{const cache=await caches.open(CACHE);await cache.addAll(FILES.map(url=>new Request(url,{cache:'reload'})));})()));
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('message',event=>{if(event.data?.type==='ACTIVATE'){self.skipWaiting();return;}if(event.data?.type==='STATUS')event.waitUntil((async()=>{const cache=await caches.open(CACHE),found=await Promise.all(FILES.map(url=>cache.match(url))),count=found.filter(Boolean).length;event.ports[0]?.postMessage({version:self.WITCH_OFFLINE.version,complete:count===FILES.length,count,total:FILES.length});})());});
self.addEventListener('fetch',event=>{const request=event.request,url=new URL(request.url);if(request.method!=='GET'||url.origin!==self.location.origin||!url.href.startsWith(self.registration.scope)||url.pathname.includes('/api/')||url.pathname.endsWith('/__health'))return;
 if(request.mode==='navigate'){event.respondWith((async()=>{const cache=await caches.open(CACHE),saved=await cache.match(new URL('index.html',self.registration.scope).href);return saved||fetch(request);})());return;}
 if(!FILES.includes(url.href)&&!url.searchParams.has('v'))return;
 event.respondWith((async()=>{const cache=await caches.open(CACHE);return await cache.match(request)||await caches.match(request)||fetch(request);})());
});
