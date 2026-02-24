self.addEventListener("install", event => {
  event.waitUntil(
    caches.open("connecthub-v1").then(cache => {
      return cache.addAll([
        "./",
        "./index.html",
        "./css/style.css"
      ]);
    })
  );
});
