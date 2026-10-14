// MyBankin service worker: tekee pelistä asennettavan sovelluksen (PWA) ja toimii myös ilman verkkoa.
// Pelin tiedostojen nimet eivät muutu versiosta toiseen, joten haetaan aina ensin verkosta (uusin versio) ja
// käytetään välimuistia vain, jos verkkoa ei ole. Versio tulee rekisteröinnistä: sw.js?v=0.12.1-beta.
const VERSION = new URL(self.location).searchParams.get("v") || "dev";
const CACHE = "mybank-" + VERSION;
const CORE = ["./", "index.html", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith("mybank-") && key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request).then((cached) =>
        cached || (request.mode === "navigate" ? caches.match("index.html") : Response.error())))
  );
});
