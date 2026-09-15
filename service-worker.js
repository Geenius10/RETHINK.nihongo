const BUILD='19-kill-cache';
self.addEventListener('install',e=>{self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil((async()=>{try{const ks=await caches.keys();await Promise.all(ks.map(k=>caches.delete(k)))}catch(_){};try{await self.clients.claim()}catch(_){};try{const cs=await self.clients.matchAll({type:'window',includeUncontrolled:true});for(const c of cs){c.postMessage({type:'RETHINK_BUILD',build:BUILD})}}catch(_){};try{await self.registration.unregister()}catch(_){}})())});
self.addEventListener('fetch',()=>{});
