
const CACHE="medicina-ufmg-v7-planilha";
const FILES=["./","./index.html","./styles.css","./app.js","./eventos.json","./manifest.webmanifest","./icon.svg"];

self.addEventListener("install",event=>{
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)));
});

self.addEventListener("activate",event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener("fetch",event=>{
  const request=event.request;
  if(request.method!=="GET")return;
  const url=new URL(request.url);

  // A planilha é sempre consultada diretamente. O app já possui fallback local.
  if(url.origin!==self.location.origin){
    event.respondWith(fetch(request));
    return;
  }

  const networkFirst=request.mode==="navigate" ||
    ["eventos.json","app.js","styles.css"].some(name=>url.pathname.endsWith(name));

  if(networkFirst){
    event.respondWith(
      fetch(request)
        .then(response=>{
          const copy=response.clone();
          caches.open(CACHE).then(cache=>cache.put(request,copy));
          return response;
        })
        .catch(()=>caches.match(request))
    );
  }else{
    event.respondWith(
      caches.match(request).then(cached=>cached||fetch(request).then(response=>{
        const copy=response.clone();
        caches.open(CACHE).then(cache=>cache.put(request,copy));
        return response;
      }))
    );
  }
});
