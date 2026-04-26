import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { ThemeService } from '@core/services/theme.service';
import { FirebaseService } from '@core/services/firebase.service';
import { PushNotificationService } from '@core/services/push-notification.service';
import { NotificationComponent } from '@shared/components/notification.component';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    NotificationComponent
  ],
  template: `
    <div [class.dark]="isDarkMode" class="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-sky-50 to-cyan-50 text-slate-900 transition-colors duration-300 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 dark:text-white">
      <!-- NOTIFICACIÓN FLOTANTE -->
      <app-notification
        [type]="notificationType"
        [title]="notificationTitle"
        [message]="notificationMessage"
        [isVisible]="showNotification"
        (close)="onNotificationClose()"
      ></app-notification>

      <!-- Theme Toggle Button -->
      <button
        type="button"
        (click)="toggleTheme()"
        class="fixed top-6 right-6 z-50 p-3 rounded-full bg-white dark:bg-slate-700 hover:shadow-lg transition-all hover:scale-110 text-lg"
      >
        {{ isDarkMode ? '☀️' : '🌙' }}
      </button>

      <!-- FONDO GLOBAL CON BLOBS AZULES/CELESTES -->
      <div class="pointer-events-none absolute inset-0 overflow-hidden">
        <div class="absolute left-[-120px] top-[-120px] h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl dark:bg-cyan-500/20"></div>
        <div class="absolute right-[-120px] top-[120px] h-80 w-80 rounded-full bg-sky-400/20 blur-3xl dark:bg-sky-500/20"></div>
        <div class="absolute bottom-[-120px] left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-blue-400/10 blur-3xl dark:bg-blue-500/10"></div>
      </div>

      <!-- CONTENIDO CENTRADO VERTICALMENTE -->
      <main class="relative z-10 flex items-center justify-center min-h-screen px-4 py-8">
        <div class="w-full max-w-6xl">
          <!-- LAYOUT DE DOS COLUMNAS CENTRADO -->
          <div class="grid items-center gap-12 lg:grid-cols-[1fr_520px]">
            <!-- PANEL IZQUIERDA - Info Sistema -->
            <section class="hidden lg:block">
              <div class="max-w-xl">
                <h2 class="max-w-2xl text-4xl font-black leading-tight">
                  Ingresa a
                  <span class="bg-gradient-to-r from-sky-500 via-cyan-500 to-blue-500 bg-clip-text text-transparent">
                    Taller Mecánico
                  </span>
                </h2>

                <p class="mt-4 max-w-2xl text-base leading-6" [class]="isDarkMode ? 'text-slate-300' : 'text-slate-600'">
                  Plataforma integral de gestión de emergencias vehiculares diseñada para talleres modernos.
                </p>

                <!-- CARACTERÍSTICAS DEL SISTEMA - COMPACTO -->
                <div class="mt-8 space-y-3">
                  <div class="flex gap-3">
                    <div class="flex-shrink-0">
                      <span class="text-2xl">⚡</span>
                    </div>
                    <div>
                      <h4 class="font-bold text-sm" [class]="isDarkMode ? 'text-white' : 'text-slate-900'">Respuesta Rápida</h4>
                      <p class="text-xs leading-5" [class]="isDarkMode ? 'text-slate-400' : 'text-slate-600'">Solicitudes de emergencias en tiempo real.</p>
                    </div>
                  </div>

                  <div class="flex gap-3">
                    <div class="flex-shrink-0">
                      <span class="text-2xl">🗺️</span>
                    </div>
                    <div>
                      <h4 class="font-bold text-sm" [class]="isDarkMode ? 'text-white' : 'text-slate-900'">Ubicación Real</h4>
                      <p class="text-xs leading-5" [class]="isDarkMode ? 'text-slate-400' : 'text-slate-600'">Rastrea tu flota de vehículos.</p>
                    </div>
                  </div>

                  <div class="flex gap-3">
                    <div class="flex-shrink-0">
                      <span class="text-2xl">📊</span>
                    </div>
                    <div>
                      <h4 class="font-bold text-sm" [class]="isDarkMode ? 'text-white' : 'text-slate-900'">Dashboard</h4>
                      <p class="text-xs leading-5" [class]="isDarkMode ? 'text-slate-400' : 'text-slate-600'">Reportes y análisis de desempeño.</p>
                    </div>
                  </div>

                  <div class="flex gap-3">
                    <div class="flex-shrink-0">
                      <span class="text-2xl">🔧</span>
                    </div>
                    <div>
                      <h4 class="font-bold text-sm" [class]="isDarkMode ? 'text-white' : 'text-slate-900'">Gestión de Servicios</h4>
                      <p class="text-xs leading-5" [class]="isDarkMode ? 'text-slate-400' : 'text-slate-600'">Órdenes y especialidades centralizadas.</p>
                    </div>
                  </div>

                  <div class="flex gap-3">
                    <div class="flex-shrink-0">
                      <span class="text-2xl">👥</span>
                    </div>
                    <div>
                      <h4 class="font-bold text-sm" [class]="isDarkMode ? 'text-white' : 'text-slate-900'">Gestión de Usuarios</h4>
                      <p class="text-xs leading-5" [class]="isDarkMode ? 'text-slate-400' : 'text-slate-600'">Permisos y roles de seguridad.</p>
                    </div>
                  </div>
                </div>

                <!-- CTA COMPACTA -->
                <div class="mt-6 p-4 rounded-xl border backdrop-blur" [class]="isDarkMode ? 'border-white/10 bg-white/5' : 'border-slate-200/70 bg-slate-100/50'">
                  <p class="font-semibold text-sm mb-1" [class]="isDarkMode ? 'text-white' : 'text-slate-900'">
                    🚀 Seguro y Confiable
                  </p>
                  <p [class]="isDarkMode ? 'text-slate-400' : 'text-slate-600'" class="text-xs">
                    Validación de dos factores, encriptación de datos y respaldos automáticos.
                  </p>
                </div>
              </div>
            </section>

            <!-- FORM LOGIN - DERECHA -->
            <section class="mx-auto w-full max-w-xl">
              <div class="overflow-hidden rounded-3xl border shadow-2xl backdrop-blur-2xl transition-all duration-300 hover:shadow-3xl hover:scale-[1.01]" [class]="isDarkMode ? 'border-white/15 bg-gradient-to-br from-white/8 to-white/5 dark:shadow-[0_40px_100px_rgba(13,110,253,0.25)]' : 'border-white/80 bg-gradient-to-br from-white/95 via-white/90 to-white/85 shadow-[0_20px_60px_rgba(15,23,42,0.12)]'">
                <!-- HEADER CARD CON GRADIENTE AZUL - MEJORADO -->
                <div class="relative overflow-hidden border-b bg-gradient-to-br from-sky-600 via-cyan-600 to-blue-600 px-8 py-10 text-white" [class]="isDarkMode ? 'border-white/10' : 'border-white/40'">
                  <div class="absolute -right-20 -top-16 h-40 w-40 rounded-full bg-white/15 blur-3xl"></div>
                  <div class="absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-white/10 blur-2xl"></div>
                  <div class="relative z-10">
                    <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-white/20 text-4xl shadow-lg backdrop-blur">
                      🔑
                    </div>
                    <h3 class="text-3xl font-black tracking-tight">Acceso Taller</h3>
                    <p class="mt-2 text-white/90 font-medium">Inicia sesión en tu cuenta</p>
                  </div>
                </div>

                <!-- BODY FORM -->
                <div class="p-8">
                  <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-5">
                    <!-- EMAIL -->
                    <div>
                      <label class="block text-sm font-semibold mb-2.5" [class]="isDarkMode ? 'text-slate-300' : 'text-slate-700'">
                        📧 Email
                      </label>
                      <input
                        type="email"
                        formControlName="correo"
                        placeholder="tu@email.com"
                        class="w-full px-5 py-3.5 border-2 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 font-medium"
                        [class]="isDarkMode ? 'bg-white/10 border-white/20 text-white placeholder-slate-400 focus:bg-white/15' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-500 focus:bg-cyan-50'"
                        required
                      />
                      <div *ngIf="loginForm.get('correo')?.touched && loginForm.get('correo')?.errors" class="text-red-500 text-xs mt-2 font-medium">
                        <p *ngIf="loginForm.get('correo')?.hasError('required')">El correo es requerido</p>
                        <p *ngIf="loginForm.get('correo')?.hasError('email')">Correo inválido</p>
                      </div>
                    </div>

                    <!-- PASSWORD -->
                    <div>
                      <label class="block text-sm font-semibold mb-2.5" [class]="isDarkMode ? 'text-slate-300' : 'text-slate-700'">
                        🔐 Contraseña
                      </label>
                      <div class="relative">
                        <input
                          [type]="showPassword ? 'text' : 'password'"
                          formControlName="contrasena"
                          placeholder="Tu contraseña"
                          class="w-full px-5 py-3.5 border-2 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 pr-14 font-medium"
                          [class]="isDarkMode ? 'bg-white/10 border-white/20 text-white placeholder-slate-400 focus:bg-white/15' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-500 focus:bg-cyan-50'"
                          required
                        />
                        <button
                          type="button"
                          (click)="togglePasswordVisibility()"
                          class="absolute right-4 top-1/2 -translate-y-1/2 text-2xl transition hover:scale-110 active:scale-95"
                        >
                          {{ showPassword ? '👁️' : '🔒' }}
                        </button>
                      </div>
                      <div *ngIf="loginForm.get('contrasena')?.touched && loginForm.get('contrasena')?.errors" class="text-red-500 text-xs mt-2 font-medium">
                        <p *ngIf="loginForm.get('contrasena')?.hasError('required')">La contraseña es requerida</p>
                        <p *ngIf="loginForm.get('contrasena')?.hasError('minlength')">Mínimo 8 caracteres</p>
                      </div>
                    </div>

                    <input type="hidden" formControlName="client_type" value="web" />

                    <!-- SUBMIT BOTÓN AZUL/CELESTE - MEJORADO -->
                    <button
                      type="submit"
                      [disabled]="loginForm.invalid || isLoading"
                      class="w-full rounded-2xl bg-gradient-to-r from-sky-600 via-cyan-600 to-blue-600 px-6 py-4 font-bold text-white shadow-lg shadow-cyan-500/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-cyan-500/40 disabled:opacity-60 disabled:scale-100 disabled:shadow-none active:scale-95 text-lg"
                    >
                      <span *ngIf="!isLoading" class="flex items-center justify-center gap-2">
                        <span class="text-xl">🚀</span>
                        {{ 'Ingresar' }}
                      </span>
                      <span *ngIf="isLoading" class="flex items-center justify-center gap-2">
                        <span class="animate-spin">⏳</span>
                        Iniciando sesión...
                      </span>
                    </button>
                  </form>

                  <!-- FOOTER LINKS -->
                  <div class="mt-8 space-y-4 border-t pt-6 text-center text-sm" [class]="isDarkMode ? 'border-white/10 text-slate-300' : 'border-slate-200 text-slate-600'">
                    <p>
                      ¿No tienes cuenta?
                      <a
                        routerLink="/auth/register-taller"
                        class="font-semibold transition"
                        [class]="isDarkMode ? 'text-cyan-300 hover:text-cyan-200' : 'text-cyan-700 hover:text-cyan-800'"
                      >
                        Regístrate aquí
                      </a>
                    </p>

                    <div [class]="isDarkMode ? 'border-white/10' : 'border-slate-200'" class="border-t pt-4">
                      <a
                        routerLink="/auth/forgot-password"
                        class="transition"
                        [class]="isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'"
                      >
                        ¿Olvidaste tu contraseña?
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  `
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm!: FormGroup;
  isLoading = false;
  showPassword = false;
  isDarkMode = false;

  showNotification = false;
  notificationType: 'success' | 'error' | 'info' | 'warning' = 'info';
  notificationTitle = '';
  notificationMessage = '';

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private themeService: ThemeService,
    private firebaseService: FirebaseService,
    private pushNotificationService: PushNotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Initialize form with proper disabled state handling
    this.loginForm = this.fb.group({
      correo: [{ value: '', disabled: false }, [Validators.required, Validators.email]],
      contrasena: [{ value: '', disabled: false }, [Validators.required, Validators.minLength(8)]],
      client_type: ['web']
    });

    // Subscribe to theme changes
    this.themeService.darkMode$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isDark: boolean) => {
        this.isDarkMode = isDark;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onNotificationClose(): void {
    this.showNotification = false;
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.showNotification = true;
      this.notificationType = 'warning';
      this.notificationTitle = 'Campos incompletos';
      this.notificationMessage = 'Por favor completa todos los campos correctamente';
      return;
    }

    this.isLoading = true;
    // Disable controls using proper FormControl method
    this.loginForm.get('correo')?.disable();
    this.loginForm.get('contrasena')?.disable();

    const loginData = {
      ...this.loginForm.getRawValue(),
      client_type: 'web'
    };

    this.authService.login(loginData).subscribe({
      next: async (response: any) => {
        this.isLoading = false;

        // Guardar nombre de usuario si viene en la respuesta
        if (response.nombre_completo) {
          localStorage.setItem('userName', response.nombre_completo);
          console.log('User name saved:', response.nombre_completo);
        }

        this.showNotification = true;
        this.notificationType = 'success';
        this.notificationTitle = '¡Bienvenido!';
        this.notificationMessage = 'Autenticación exitosa, configurando notificaciones...';

        try {
          // Inicializar Firebase si no está inicializado
          if (!this.firebaseService.isFCMAvailable()) {
            console.log('📱 Inicializando Firebase...');
            await this.firebaseService.initializeFirebase();
          }

          // Registrar token FCM en el backend
          console.log('📤 Registrando token FCM en el backend...');
          await this.pushNotificationService.registerTokenInBackend();
          console.log('✅ Notificaciones push configuradas');
        } catch (error) {
          // No bloquear login si falla configuración de notificaciones
          console.warn('⚠️ Error configurando notificaciones push:', error);
        }

        // Navegar al dashboard después de 1.5 segundos
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 1500);
      },
      error: (error: any) => {
        this.isLoading = false;
        // Re-enable controls on error
        this.loginForm.get('correo')?.enable();
        this.loginForm.get('contrasena')?.enable();

        let errorMessage = 'Error al iniciar sesión';

        if (error.error?.detail) {
          errorMessage = error.error.detail;
        } else if (error.message) {
          errorMessage = error.message;
        }

        this.showNotification = true;
        this.notificationType = 'error';
        this.notificationTitle = 'Error de autenticación';
        this.notificationMessage = errorMessage;
        console.error('Login error:', error);
      }
    });
  }

  toggleTheme(): void {
    this.themeService.toggleDarkMode();
    this.isDarkMode = this.themeService.isDarkMode();
  }
}
