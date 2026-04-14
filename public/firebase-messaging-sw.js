/**
 * Firebase Cloud Messaging Service Worker
 * Maneja notificaciones push en background
 *
 * Este worker se encarga de:
 * 1. Recibir mensajes de FCM en background
 * 2. Mostrar notificaciones visuales
 * 3. Manejar clicks en notificaciones
 */

// Importar Firebase Scripts
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Inicializar Firebase en el Service Worker
firebase.initializeApp({
  apiKey: "AIzaS8ZYo0Hm4IQe5jcbrU0Sh2bFsuy2h3Nj",
  authDomain: "parcial20-f6eb3.firebaseapp.com",
  projectId: "parcial20-f6eb3",
  storageBucket: "parcial20-f6eb3.firebasestorage.app",
  messagingSenderId: "68107658206",
  appId: "1:68107658206:web:c0c231adc38a28d73b34f",
  measurementId: "G-40H25E7KT"
});

const messaging = firebase.messaging();

// ==================== MANEJO DE MENSAJES EN BACKGROUND ====================

/**
 * Escucha mensajes cuando la app está en background
 */
messaging.onBackgroundMessage((payload) => {
  console.log('🔔 Mensaje recibido en background:', payload);

  const notificationTitle = payload.notification?.title || 'Nueva Notificación';
  const notificationOptions = {
    body: payload.notification?.body || 'Tienes un nuevo mensaje',
    icon: payload.notification?.image || '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'fcm-notification',
    requireInteraction: false,
    data: payload.data || {}
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// ==================== MANEJO DE SKIP_WAITING ====================

/**
 * Escuchar mensajes del contexto principal (para actualizaciones de SW)
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ==================== MANEJO DE CLICKS EN NOTIFICACIONES ====================

/**
 * Manejar clicks en notificaciones push
 */
self.addEventListener('notificationclick', (event) => {
  console.log('📌 Notificación clickeada:', event.notification.tag);
  event.notification.close();

  // Extraer URL de redirección si está en los datos
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Buscar ventana existente
      for (let i = 0; i < clientList.length; i++) {
        if (clientList[i].url === urlToOpen && 'focus' in clientList[i]) {
          return clientList[i].focus();
        }
      }
      // Si no existe, abrir una nueva
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// ==================== MANEJO DE CIERRE DE NOTIFICACIONES ====================

/**
 * Log cuando el usuario cierra una notificación
 */
self.addEventListener('notificationclose', (event) => {
  console.log('✕ Notificación cerrada:', event.notification.tag);
});
