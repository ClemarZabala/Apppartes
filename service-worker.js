// ✅ service-worker.js (versión corregida)
const CACHE_NAME = "control-partes-v3";
const urlsToCache = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

// Instalar: guarda archivos básicos
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// Activar: limpia versiones viejas
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: deja pasar las llamadas a Firestore, solo sirve archivos locales
self.addEventListener("fetch", event => {
  const url = event.request.url;

  // 🔹 Si la solicitud es a Firestore o Firebase → siempre red
  if (url.includes("firestore.googleapis.com") || url.includes("firebaseio.com")) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});

