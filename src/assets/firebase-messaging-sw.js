/**
 * Firebase Cloud Messaging Service Worker
 * Maneja notificaciones push en background
 */

// Escuchar mensajes desde el contexto principal
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Manejar notificaciones push en background
self.addEventListener('push', (event) => {
  console.log('🔔 Push notification recibida', event);

  if (!event.data) {
    console.log('Sin datos en la notificación');
    return;
  }

  try {
    const payload = event.data.json();
    const notificationTitle = payload.notification?.title || 'Nueva Notificación';
    const notificationOptions = {
      body: payload.notification?.body || 'Tienes un nuevo mensaje',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'fcm-notification',
      requireInteraction: false,
      data: payload.data || {}
    };

    event.waitUntil(
      self.registration.showNotification(notificationTitle, notificationOptions)
    );
  } catch (error) {
    console.error('Error procesando push notification:', error);
  }
});

// Manejar clicks en notificaciones
self.addEventListener('notificationclick', (event) => {
  console.log('📌 Notificación clickeada:', event.notification);
  event.notification.close();

  // Abre la app cuando hace click en la notificación
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Busca una ventana existente
      for (let i = 0; i < clientList.length; i++) {
        if (clientList[i].url === '/' && 'focus' in clientList[i]) {
          return clientList[i].focus();
        }
      }
      // Si no existe, abre una nueva
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// Manejar cierre de notificaciones
self.addEventListener('notificationclose', (event) => {
  console.log('✕ Notificación cerrada:', event.notification);
});
