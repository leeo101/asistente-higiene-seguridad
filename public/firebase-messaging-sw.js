// firebase-messaging-sw.js
// Service Worker para Firebase Cloud Messaging (FCM)
// Maneja notificaciones push cuando la app está en background o cerrada.
//
// NOTA SEGURIDAD: Las credenciales de Firebase Client SDK son seguras para
// exponer en el frontend (están protegidas por Firebase Security Rules y
// App Check). NO confundir con las credenciales de Admin SDK (service account).

importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js');

// Leer config desde el scope del SW (inyectada por el cliente al registrar el SW)
// Si no hay config, usar valores de fallback (no sensibles — son credenciales de cliente)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FIREBASE_CONFIG') {
    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(event.data.config);
        const messaging = firebase.messaging();
        setupMessaging(messaging);
      }
    } catch (e) {
      console.error('[SW] Error inicializando Firebase:', e);
    }
  }
});

// Inicialización con valores embebidos como fallback (credenciales de cliente — seguras)
try {
  if (!firebase.apps.length) {
    firebase.initializeApp({
      apiKey: "AIzaSyBzm6eZVk6WdfTJ8--4s6JWH47ytA9i0Mk",
      authDomain: "asistentehs-b594e.firebaseapp.com",
      projectId: "asistentehs-b594e",
      storageBucket: "asistentehs-b594e.firebasestorage.app",
      messagingSenderId: "598244038733",
      appId: "1:598244038733:web:76e8d22d2432afbefea404"
    });
  }
} catch (e) {
  console.warn('[SW] Firebase ya inicializado o error:', e);
}

const messaging = firebase.messaging();
setupMessaging(messaging);

function setupMessaging(msg) {
  msg.onBackgroundMessage(function(payload) {
    console.log('[SW] Push en background:', payload.notification?.title);

    const notificationTitle = payload.notification?.title || '🔔 Asistente HYS';
    const notificationOptions = {
      body: payload.notification?.body || '',
      icon: '/favicon-180.png',
      badge: '/favicon-180.png',
      tag: payload.data?.tag || 'hys-push',
      vibrate: [200, 100, 200],
      requireInteraction: false,
      data: {
        url: payload.data?.url || '/',
      },
      actions: [
        { action: 'open', title: '📂 Abrir' },
        { action: 'dismiss', title: '✕ Descartar' }
      ]
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
}

// Click en notificación → navegar a la URL correspondiente
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const urlToOpen = new URL(
    event.notification.data?.url || '/',
    self.location.origin
  ).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Si ya hay una ventana abierta, la enfocamos y navegamos
      for (const client of windowClients) {
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client) client.navigate(urlToOpen);
          return;
        }
      }
      // Si no hay ventana abierta, abrimos una nueva
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
