import { Injectable } from '@angular/core';
import { FirebaseService, NotificationPayload } from './firebase.service';
import { Subscription } from 'rxjs';

/**
 * Servicio para manejar notificaciones push en el frontend
 *
 * FLUJO DE LIFECYCLE:
 * ====================
 *
 * 1. LOGIN:
 *    - FirebaseService.initializeFirebase() en LoginComponent.onSubmit()
 *    - PushNotificationService.registerTokenInBackend() => token guardado en DB
 *
 * 2. APP RUNNING (foreground notifications):
 *    - AppComponent.ngOnInit() restaura Firebase si hay sesión activa
 *    - Escucha notificaciones con PushNotificationService
 *    - Background: Service Worker maneja con onBackgroundMessage
 *
 * 3. REFRESH/NAVEGACIÓN:
 *    - AppComponent.ngOnDestroy() llama disposeForegroundListeners()
 *    - IMPORTANTE: NO desregistra token (permite que after-refresh siga siendo válido)
 *    - AppComponent.ngOnInit() en siguiente ciclo re-registra token si hay sesión
 *
 * 4. LOGOUT EXPLÍCITO (en componente de logout):
 *    - await pushNotificationService.onLogout()
 *    - Luego: authService.logout().subscribe(...)
 *    - Esto desregistra token en backend ANTES de limpiar localStorage
 *
 * 5. CIERRE DE NAVEGADOR:
 *    - Service Worker se detiene automáticamente
 *    - Token en DB sigue siendo válido (se desactivará automáticamente al expirar)
 */
@Injectable({
  providedIn: 'root'
})
export class PushNotificationService {
  private notificationSubscription: Subscription | null = null;

  constructor(private firebaseService: FirebaseService) {
    this.initializeNotificationListener();
  }

  /**
   * Inicializa el escuchador de notificaciones en foreground
   */
  private initializeNotificationListener(): void {
    this.notificationSubscription = this.firebaseService
      .getNotifications$()
      .subscribe((payload: NotificationPayload | null) => {
        if (payload) {
          this.handleForegroundNotification(payload);
        }
      });
  }

  /**
   * Maneja notificaciones recibidas en foreground
   */
  private handleForegroundNotification(payload: NotificationPayload): void {
    const title = payload.notification?.title || 'Nueva Notificación';
    const body = payload.notification?.body || 'Tienes un nuevo mensaje';
    const image = payload.notification?.image;

    console.log('🔔 Procesando notificación en foreground:', { title, body });

    // Mostrar notificación del navegador (incluso en foreground)
    this.showBrowserNotification(title, body, image);

    // Opcionalmente, también mostrar un toast/banner en la app
    this.showAppNotification(title, body);
  }

  /**
   * Muestra una notificación del navegador
   */
  private showBrowserNotification(
    title: string,
    body: string,
    image?: string
  ): void {
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification(title, {
          body: body,
          icon: image || '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'app-notification',
          requireInteraction: false
        });

        // Manejar click en notificación
        notification.addEventListener('click', () => {
          window.focus();
          notification.close();
        });

        // Auto-cerrar después de 5 segundos
        setTimeout(() => notification.close(), 5000);
      }
    } catch (error) {
      console.error('Error mostrando notificación del navegador:', error);
    }
  }

  /**
   * Muestra una notificación dentro de la app (puedes reemplazar con tu toast/snackbar)
   */
  private showAppNotification(title: string, body: string): void {
    // Aquí podrías integrar con Angular Material Snackbar, ngx-toastr, etc.
    console.log(`📢 Notificación App - ${title}: ${body}`);

    // Ejemplo con window alert (considera usar toast mejorado)
    // alert(`${title}\n${body}`);
  }

  /**
   * Registra el token FCM en el backend después de login
   */
  registerTokenInBackend(): Promise<any> {
    return new Promise((resolve, reject) => {
      const token = this.firebaseService.getFCMToken();

      if (!token) {
        console.warn('⚠️ No hay token FCM disponible');
        reject('No FCM token available');
        return;
      }

      this.firebaseService.registerTokenInBackend(token).subscribe({
        next: (response) => {
          console.log('✅ Token FCM registrado en backend:', response);
          resolve(response);
        },
        error: (error) => {
          console.error('❌ Error registrando token FCM en backend:', error);
          // No rechazar, permitir que la app continúe aunque falle el registro
          resolve(null);
        }
      });
    });
  }

  /**
   * Desregistra el token FCM en el backend (para logout explícito)
   */
  unregisterTokenInBackend(): Promise<any> {
    return new Promise((resolve, reject) => {
      const token = this.firebaseService.getFCMToken();

      if (!token) {
        console.warn('⚠️ No hay token FCM para desregistrar');
        resolve(null);
        return;
      }

      this.firebaseService.unregisterTokenInBackend(token).subscribe({
        next: (response) => {
          console.log('✅ Token FCM desregistrado en logout:', response);
          localStorage.removeItem('fcm_token');
          resolve(response);
        },
        error: (error) => {
          console.warn('⚠️ Error desregistrando token FCM:', error);
          // No rechazar, permitir logout incluso si falla desregistro
          resolve(null);
        }
      });
    });
  }

  /**
   * Limpia los listener de foreground (llamado en ngOnDestroy)
   * NO desregistra el token - mantén la validez del navegador aunque se recargue la página
   */
  disposeForegroundListeners(): void {
    if (this.notificationSubscription) {
      this.notificationSubscription.unsubscribe();
      console.log('✅ Listener de notificaciones en foreground desuscrito');
    }
  }

  /**
   * Limpia TODO al hacer logout explícito (incluye desregistro de token)
   */
  async onLogout(): Promise<void> {
    // Desregistrar token en backend
    await this.unregisterTokenInBackend();

    // Desuscribirse del observable
    this.disposeForegroundListeners();
  }

  /**
   * @deprecated Usa onLogout() para logout explícito o disposeForegroundListeners() para cleanup local
   * Limpia recursos cuando el usuario cierra sesión
   */
  async cleanup(): Promise<void> {
    // Backward compatibility - ahora es un alias a onLogout()
    await this.onLogout();
  }

  /**
   * Obtiene el token FCM actual
   */
  getToken(): string | null {
    return this.firebaseService.getFCMToken();
  }

  /**
   * Verifica si FCM está disponible
   */
  isFCMAvailable(): boolean {
    return this.firebaseService.isFCMAvailable();
  }
}
