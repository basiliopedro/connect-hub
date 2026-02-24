
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open("connecthub").then(cache => {
      return cache.addAll([
        "./",
        "./index.html",
        "./css/style.css"
      ]);
    })
  );
});
