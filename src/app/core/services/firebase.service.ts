import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging, isSupported } from 'firebase/messaging';
import { firebaseConfig } from '@environments/firebase.config';
import { environment } from '@environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';

export interface NotificationPayload {
  notification?: {
    title?: string;
    body?: string;
    image?: string;
  };
  data?: Record<string, string>;
}

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private initialized = false;
  private messaging: Messaging | null = null;
  private swRegistration: ServiceWorkerRegistration | null = null;
  private notificationSubject = new BehaviorSubject<NotificationPayload | null>(null);
  private tokenSubject = new BehaviorSubject<string | null>(localStorage.getItem('fcm_token'));

  // VAPID Key para Firebase Cloud Messaging
  private readonly VAPID_KEY = 'BOl4UrmI1rRULH5pxE49-0eLYgNq-CIAygp0-bVBqPPiJxqgEKIO3tePWwx2rq_uGKxUf5wvK79TcPtS6P0kZTw';
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Inicializa Firebase y solicita permisos de notificación
   */
  async initializeFirebase(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Verificar si el navegador soporta FCM
      const supported = await isSupported();
      if (!supported) {
        console.warn('⚠️ Este navegador no soporta Firebase Cloud Messaging');
        return;
      }

      // Inicializar Firebase
      const app = initializeApp(firebaseConfig);
      console.log('✅ Firebase inicializado correctamente');

      // Obtener el servicio de messaging
      this.messaging = getMessaging(app);

      // Registrar Service Worker si está disponible
      if ('serviceWorker' in navigator) {
        try {
          this.swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
          console.log('✅ Service Worker registrado correctamente');
        } catch (err) {
          console.warn('⚠️ Error registrando Service Worker:', err);
        }
      }

      // Solicitar permiso y obtener token
      await this.requestTokenAndRegister();

      // Escuchar mensajes en foreground
      if (this.messaging) {
        onMessage(this.messaging, (payload: NotificationPayload) => {
          console.log('🔔 Notificación recibida en foreground:', payload);
          this.notificationSubject.next(payload);
        });
      }

      this.initialized = true;
    } catch (error) {
      console.error('❌ Error inicializando Firebase:', error);
    }
  }

  /**
   * Solicita permiso y obtiene el token FCM
   */
  private async requestTokenAndRegister(): Promise<void> {
    if (!this.messaging) {
      console.warn('⚠️ Messaging no está disponible');
      return;
    }

    try {
      const permission = await Notification.requestPermission();

      if (permission === 'granted') {
        console.log('✅ Permiso de notificación concedido');

        // Obtener token (pasar swRegistration si está disponible)
        const tokenOptions: any = {
          vapidKey: this.VAPID_KEY
        };

        // Pasar Service Worker Registration si fue registrado
        if (this.swRegistration) {
          tokenOptions.serviceWorkerRegistration = this.swRegistration;
        }

        const token = await getToken(this.messaging, tokenOptions);

        if (token) {
          console.log('✅ Token FCM obtenido');
          localStorage.setItem('fcm_token', token);
          this.tokenSubject.next(token);
        }
      } else if (permission === 'denied') {
        console.warn('⚠️ Permiso de notificación denegado por el usuario');
      }
    } catch (err: any) {
      console.warn('⚠️ Error solicitando permiso de notificación:', err);
    }
  }

  /**
   * Registra el token FCM en el backend
   */
  registerTokenInBackend(token?: string): Observable<any> {
    const fcmToken = token || localStorage.getItem('fcm_token');

    if (!fcmToken) {
      console.warn('⚠️ No hay token FCM para registrar');
      return new Observable(observer => observer.error('No FCM token available'));
    }

    const payload = {
      token_fcm: fcmToken,
      plataforma: 'WEB',
      device_id: this.getStableDeviceId(),
      nombre_dispositivo: this.getDeviceInfo()
    };

    console.log('📤 Enviando token a backend:', {
      ...payload,
      token_fcm: payload.token_fcm.substring(0, 20) + '...'
    });

    return this.http.post(`${this.API_URL}/push/register-token`, payload);
  }

  /**
   * Obtiene un device_id estable para el navegador web
   * Se almacena en localStorage para persistencia
   */
  private getStableDeviceId(): string {
    const storageKey = 'web_device_id';
    let deviceId = localStorage.getItem(storageKey);

    if (!deviceId) {
      // Generar un ID estable basado en características del navegador
      deviceId = this.generateDeviceId();
      localStorage.setItem(storageKey, deviceId);
      console.log('✅ Device ID generado y guardado');
    }

    return deviceId;
  }

  /**
   * Genera un ID único estable para el navegador
   * Basado en user agent y otras características
   */
  private generateDeviceId(): string {
    const userAgent = navigator.userAgent;
    const language = navigator.language;
    const cores = navigator.hardwareConcurrency || 1;

    const input = `${userAgent}|${language}|${cores}|${new Date().getFullYear()}`;

    // Simple hash function
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }

    return `web_${Math.abs(hash).toString(16)}`;
  }

  /**
   * Obtiene información del dispositivo/navegador
   */
  private getDeviceInfo(): string {
    const userAgent = navigator.userAgent;
    const browserName = this.getBrowserName();
    return `${browserName} - ${window.innerWidth}x${window.innerHeight}`;
  }

  /**
   * Detecta el nombre del navegador
   */
  private getBrowserName(): string {
    const ua = navigator.userAgent;
    if (ua.indexOf('Firefox') > -1) return 'Firefox';
    if (ua.indexOf('SamsungBrowser') > -1) return 'Samsung Browser';
    if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) return 'Opera';
    if (ua.indexOf('Trident') > -1) return 'Internet Explorer';
    if (ua.indexOf('Edge') > -1) return 'Edge';
    if (ua.indexOf('Chrome') > -1) return 'Chrome';
    if (ua.indexOf('Safari') > -1) return 'Safari';
    return 'Unknown Browser';
  }

  /**
   * Desregistra el token FCM del backend
   */
  unregisterTokenInBackend(token: string): Observable<any> {
    if (!token) {
      console.warn('⚠️ No hay token FCM para desregistrar');
      return new Observable(observer => observer.error('No FCM token provided'));
    }

    return this.http.post(`${this.API_URL}/push/unregister-token`, {
      token_fcm: token
    });
  }

  /**
   * Obtiene el token FCM del navegador
   */
  getFCMToken(): string | null {
    return localStorage.getItem('fcm_token');
  }

  /**
   * Observable para el token FCM
   */
  getToken$(): Observable<string | null> {
    return this.tokenSubject.asObservable();
  }

  /**
   * Observable para escuchar notificaciones push en foreground
   */
  getNotifications$(): Observable<NotificationPayload | null> {
    return this.notificationSubject.asObservable();
  }

  /**
   * Verifica si FCM está disponible
   */
  isFCMAvailable(): boolean {
    return this.initialized && this.messaging !== null;
  }
}
