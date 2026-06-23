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
  console.log('[firebase-messaging-sw.js] Notificación Push recibida en background ', payload);
  const notificationTitle = payload.notification?.title || 'Notificación H&S';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/favicon-180.png',
    badge: '/favicon-32.png',
    tag: payload.data?.tag || 'hys-push',
    data: {
      url: payload.data?.url || '/'
    }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const urlToOpen = new URL(event.notification.data?.url || '/', self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
