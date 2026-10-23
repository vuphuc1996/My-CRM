/* Service worker tối giản: giúp trình duyệt nhận đây là ứng dụng cài được.
   Chỉ lưu bản sao giao diện (cùng nguồn gốc). KHÔNG đụng tới yêu cầu dữ liệu gửi tới script.google.com. */
const CACHE = "crm-shell-v1";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; /* CDN và Script dữ liệu đi thẳng ra mạng */
  /* Ưu tiên mạng để luôn nhận bản giao diện mới; mất mạng thì dùng bản đã lưu */
  event.respondWith(
    fetch(request)
      .then(response => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request).then(hit => hit || caches.match("./index.html")))
  );
});
