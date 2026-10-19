const C='prodz-v1';
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>clients.claim())));
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET'||!r.url.startsWith(location.origin))return;
const net=()=>fetch(r).then(res=>{const c=res.clone();caches.open(C).then(x=>x.put(r,c));return res});
e.respondWith(r.mode==='navigate'?net().catch(()=>caches.match('/')):caches.match(r).then(m=>m||net()))});
