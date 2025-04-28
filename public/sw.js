self.addEventListener('install', event => {
    event.waitUntil(
        caches.open('smartphone-shop-v1').then(cache => {
            return cache.addAll([
                '/',
                '/index.html',
                '/register.html',
                '/login.html',
                '/dashboard.html',
                '/commander.html',
                '/success.html',
                '/css/styles.css',
                '/js/auth.js',
                '/js/cart.js',
                '/js/crypto-js.min.js',
                '/assets/icon-192.png',
                '/manifest.json'
            ]);
        })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});