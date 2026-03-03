// ─── Asistente HYS Service Worker ───────────────────────────────────────────
// Cache-first para assets estáticos, network-first para APIs y datos dinámicos.

const CACHE_NAME = 'hys-v2';

// Assets que se precargan al instalar el SW
const PRECACHE_URLS = [
    '/',
    '/manifest.json',
    '/logo.png',
    '/og-image.png',
];

// ── Install: precachear los assets clave ─────────────────────────────────────
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
    );
    self.skipWaiting();
});

// ── Activate: limpiar cachés viejos ─────────────────────────────────────────
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// ── Fetch: estrategia según tipo de recurso ──────────────────────────────────
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // No interceptar peticiones a APIs, Firebase ni Mercado Pago
    if (
        url.pathname.startsWith('/api/') ||
        url.hostname.includes('firebasedatabase') ||
        url.hostname.includes('firestore') ||
        url.hostname.includes('mercadopago') ||
        url.hostname.includes('resend') ||
        request.method !== 'GET'
    ) {
        return; // dejar pasar sin caché
    }

    // Para peticiones de navegación (HTML) — network-first
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((res) => {
                    const clone = res.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                    return res;
                })
                .catch(() => caches.match('/'))
        );
        return;
    }

    // Para assets (JS, CSS, imágenes) — cache-first
    event.respondWith(
        caches.match(request).then((cached) => {
            if (cached) return cached;

            return fetch(request).then((res) => {
                if (res.ok) {
                    const clone = res.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                }
                return res;
            });
        })
    );
});
