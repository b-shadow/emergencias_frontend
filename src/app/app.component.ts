import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ThemeService } from '@core/services/theme.service';
import { FirebaseService } from '@core/services/firebase.service';
import { PushNotificationService } from '@core/services/push-notification.service';
import { AuthService } from '@core/services/auth.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  template: `
    <div class="min-h-screen transition-colors duration-300">
      <!-- Main Router Outlet -->
      <router-outlet></router-outlet>
    </div>
  `,
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'frontend20';
  private destroy$ = new Subject<void>();

  constructor(
    private themeService: ThemeService,
    private firebaseService: FirebaseService,
    private pushNotificationService: PushNotificationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Initialize theme from ThemeService
    const isDarkMode = this.themeService.isDarkMode();

    // Aplicar dark mode en el elemento raíz
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    }

    // Subscribe to theme changes
    this.themeService.darkMode$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isDark: boolean) => {
        // Aplicar dark mode en el elemento raíz
        if (isDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      });

    // Restaurar Firebase si hay sesión activa (push web restoration)
    this.restorePushNotificationsIfLoggedIn();
  }

  ngOnDestroy(): void {
    // Limpiar solo los listener de foreground
    // NO desregistramos el token porque el navegador sigue siendo válido después de refresh
    this.pushNotificationService.disposeForegroundListeners();

    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Restaura la configuración de notificaciones push si el usuario ya tiene sesión activa
   * Soluciona el caso donde: refresca la página -> ya tenía token/session -> entra directo al dashboard
   */
  private async restorePushNotificationsIfLoggedIn(): Promise<void> {
    try {
      // Verificar si hay token en localStorage (indica sesión activa)
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        // Sin sesión activa, no hacer nada
        return;
      }

      console.log('🔄 Sesión activa detectada. Restaurando Firebase...');

      // Inicializar Firebase si no está ya inicializado
      if (!this.firebaseService.isFCMAvailable()) {
        console.log('📱 Inicializando Firebase para sesión existente...');
        await this.firebaseService.initializeFirebase();
      }

      // Verificar si ya hay token FCM guardado
      const fcmToken = this.firebaseService.getFCMToken();
      if (!fcmToken) {
        console.log('⚠️ Sin token FCM. Se obtendrá en el siguiente login.');
        return;
      }

      // Re-registrar el token en backend para renovar la sesión
      console.log('📤 Re-registrando token FCM para sesión existente...');
      await this.pushNotificationService.registerTokenInBackend();
      console.log('✅ Notificaciones push restauradas');
    } catch (error) {
      // No bloquear la app si falla, es solo una restauración
      console.warn('⚠️ Error restaurando notificaciones push:', error);
    }
  }
}
