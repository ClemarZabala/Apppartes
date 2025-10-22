// service-worker.js (Pegar entero)
const CACHE_NAME = "control-partes-v4";
const urlsToCache = ["./","./index.html","./style.css","./script.js?v=5","./manifest.json","./icon-192.png","./icon-512.png"];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  const url = event.request.url;
  // No cachear o interferir con llamadas a Firebase/Firestore:
  if (url.includes("firestore.googleapis.com") || url.includes("firebase.googleapis.com") || url.includes("gstatic.com/firebasejs")) {
    return; // dejamos pasar para que la red maneje la petición
  }
  event.respondWith(
    caches.match(event.request).then(res => res || fetch(event.request)).catch(() => caches.match("./index.html"))
  );
});

