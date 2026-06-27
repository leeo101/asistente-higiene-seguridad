importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBzm6eZVk6WdfTJ8--4s6JWH47ytA9i0Mk",
  authDomain: "asistentehs-b594e.firebaseapp.com",
  projectId: "asistentehs-b594e",
  storageBucket: "asistentehs-b594e.firebasestorage.app",
  messagingSenderId: "598244038733",
  appId: "1:598244038733:web:76e8d22d2432afbefea404"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Push en background:', payload);

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
      FCM_MSG: payload
    },
    actions: [
      { action: 'open', title: 'Abrir' },
      { action: 'dismiss', title: 'Descartar' }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const urlToOpen = new URL(event.notification.data?.url || '/', self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focus an existing window if already open
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client) client.navigate(urlToOpen);
          return;
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

