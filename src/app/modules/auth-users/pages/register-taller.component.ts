import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { ThemeService } from '@core/services/theme.service';
import { TallerRegisterRequest, TallerRegisterResponse } from '@core/models/user.model';
import { LocationPickerMapComponent, LocationSelection } from '@shared/components/location-picker-map.component';
import { NotificationComponent } from '@shared/components/notification.component';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-register-taller',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LocationPickerMapComponent,
    RouterLink,
    NotificationComponent
  ],
  template: `
    <div class="min-h-screen" [class]="isDarkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-gray-50 to-gray-100'">
      <!-- Notificación Flotante -->
      <app-notification
        [type]="notificationType"
        [title]="notificationTitle"
        [message]="notificationMessage"
        [isVisible]="showNotification"
        (close)="onNotificationClose()"
      ></app-notification>

      <div class="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 pointer-events-none"></div>

      <!-- Theme Toggle -->
      <button
        type="button"
        (click)="toggleTheme()"
        class="fixed top-6 right-6 z-50 p-3 rounded-full bg-white dark:bg-slate-700 hover:shadow-lg transition-all hover:scale-110 text-lg"
      >
        {{ isDarkMode ? '☀️' : '🌙' }}
      </button>

      <!-- Register Container -->
      <div class="relative z-10 max-w-4xl mx-auto px-4 py-12">
        <!-- Card -->
        <div class="rounded-xl shadow-lg p-8 mb-8" [class]="isDarkMode ? 'bg-slate-800' : 'bg-white'">
          <!-- Header -->
          <div class="text-center pb-8 border-b" [class]="isDarkMode ? 'border-slate-700' : 'border-gray-200'">
            <h1 class="text-3xl font-bold mb-2 bg-gradient-to-r from-sky-500 via-cyan-500 to-blue-500 bg-clip-text text-transparent">
              Registrar Taller
            </h1>
            <p class="text-sm" [class]="isDarkMode ? 'text-slate-400' : 'text-gray-600'">
              Plataforma de Emergencias Vehiculares
            </p>
          </div>

          <!-- Form -->
          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="mt-8">
            <!-- Informacion Basica Section -->
            <div class="mb-8">
              <h2 class="text-xl font-semibold mb-4" [class]="isDarkMode ? 'text-white' : 'text-gray-900'">
                Información Básica
              </h2>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Nombre del Taller -->
                <div>
                  <label class="block text-sm font-medium mb-2" [class]="isDarkMode ? 'text-slate-300' : 'text-gray-700'">
                    Nombre del Taller *
                  </label>
                  <input
                    type="text"
                    formControlName="nombre_taller"
                    placeholder="Ej: Taller Los Andes"
                    class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
                    [class]="isDarkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'"
                  />
                  <div *ngIf="registerForm.get('nombre_taller')?.touched && registerForm.get('nombre_taller')?.errors" class="text-red-500 text-xs mt-1">
                    <p *ngIf="registerForm.get('nombre_taller')?.hasError('required')">El nombre del taller es requerido</p>
                    <p *ngIf="registerForm.get('nombre_taller')?.hasError('minlength')">Mínimo 3 caracteres</p>
                  </div>
                </div>

                <!-- Razon Social -->
                <div>
                  <label class="block text-sm font-medium mb-2" [class]="isDarkMode ? 'text-slate-300' : 'text-gray-700'">
                    Razón Social (Opcional)
                  </label>
                  <input
                    type="text"
                    formControlName="razon_social"
                    placeholder="Ej: Sociedad Anónima"
                    class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
                    [class]="isDarkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'"
                  />
                </div>

                <!-- NIT -->
                <div>
                  <label class="block text-sm font-medium mb-2" [class]="isDarkMode ? 'text-slate-300' : 'text-gray-700'">
                    NIT (Opcional)
                  </label>
                  <input
                    type="text"
                    formControlName="nit"
                    placeholder="Ej: 1234567890"
                    class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
                    [class]="isDarkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'"
                  />
                </div>

                <!-- Correo -->
                <div>
                  <label class="block text-sm font-medium mb-2" [class]="isDarkMode ? 'text-slate-300' : 'text-gray-700'">
                    Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    formControlName="correo"
                    placeholder="taller@example.com"
                    class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
                    [class]="isDarkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'"
                  />
                  <div *ngIf="registerForm.get('correo')?.touched && registerForm.get('correo')?.errors" class="text-red-500 text-xs mt-1">
                    <p *ngIf="registerForm.get('correo')?.hasError('required')">El correo es requerido</p>
                    <p *ngIf="registerForm.get('correo')?.hasError('email')">Correo inválido</p>
                  </div>
                </div>

                <!-- Telefono -->
                <div>
                  <label class="block text-sm font-medium mb-2" [class]="isDarkMode ? 'text-slate-300' : 'text-gray-700'">
                    Teléfono *
                  </label>
                  <input
                    type="tel"
                    formControlName="telefono"
                    placeholder="+57 300 1234567"
                    class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
                    [class]="isDarkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'"
                  />
                  <div *ngIf="registerForm.get('telefono')?.touched && registerForm.get('telefono')?.errors" class="text-red-500 text-xs mt-1">
                    <p *ngIf="registerForm.get('telefono')?.hasError('required')">El teléfono es requerido</p>
                    <p *ngIf="registerForm.get('telefono')?.hasError('minlength')">Mínimo 10 caracteres</p>
                  </div>
                </div>

                <!-- Direccion -->
                <div>
                  <label class="block text-sm font-medium mb-2" [class]="isDarkMode ? 'text-slate-300' : 'text-gray-700'">
                    Dirección *
                  </label>
                  <input
                    type="text"
                    formControlName="direccion"
                    placeholder="Calle Principal 123, Apto 4B"
                    class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
                    [class]="isDarkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'"
                  />
                  <div *ngIf="registerForm.get('direccion')?.touched && registerForm.get('direccion')?.errors" class="text-red-500 text-xs mt-1">
                    <p *ngIf="registerForm.get('direccion')?.hasError('required')">La dirección es requerida</p>
                  </div>
                </div>
              </div>

              <!-- Descripcion -->
              <div class="mt-4">
                <label class="block text-sm font-medium mb-2" [class]="isDarkMode ? 'text-slate-300' : 'text-gray-700'">
                  Descripción (Opcional)
                </label>
                <textarea
                  formControlName="descripcion"
                  placeholder="Describe los servicios que ofrece tu taller"
                  rows="3"
                  class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
                  [class]="isDarkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'"
                ></textarea>
              </div>
            </div>

            <!-- Señal de separación -->
            <div class="border-t my-8" [class]="isDarkMode ? 'border-slate-700' : 'border-gray-200'"></div>

            <!-- Ubicación Section -->
            <div class="mb-8">
              <h2 class="text-xl font-semibold mb-4" [class]="isDarkMode ? 'text-white' : 'text-gray-900'">
                Ubicación del Taller
              </h2>
              <app-location-picker-map (locationSelected)="onLocationSelected($event)"></app-location-picker-map>
            </div>

            <!-- Señal de separación -->
            <div class="border-t my-8" [class]="isDarkMode ? 'border-slate-700' : 'border-gray-200'"></div>

            <!-- Contraseña Section -->
            <div class="mb-8">
              <h2 class="text-xl font-semibold mb-4" [class]="isDarkMode ? 'text-white' : 'text-gray-900'">
                Seguridad
              </h2>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Contraseña -->
                <div>
                  <label class="block text-sm font-medium mb-2" [class]="isDarkMode ? 'text-slate-300' : 'text-gray-700'">
                    Contraseña *
                  </label>
                  <div class="relative">
                    <input
                      [type]="showPassword ? 'text' : 'password'"
                      formControlName="contrasena"
                      placeholder="Mínimo 8 caracteres"
                      class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition pr-12"
                      [class]="isDarkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'"
                    />
                    <button
                      type="button"
                      (click)="togglePasswordVisibility()"
                      class="absolute right-3 top-1/2 -translate-y-1/2 text-xl hover:text-cyan-500 transition"
                    >
                      {{ showPassword ? '👁️' : '🔒' }}
                    </button>
                  </div>
                  <div *ngIf="registerForm.get('contrasena')?.touched && registerForm.get('contrasena')?.errors" class="text-red-500 text-xs mt-1">
                    <p *ngIf="registerForm.get('contrasena')?.hasError('required')">La contraseña es requerida</p>
                    <p *ngIf="registerForm.get('contrasena')?.hasError('minlength')">Mínimo 8 caracteres</p>
                  </div>
                </div>

                <!-- Confirmar Contraseña -->
                <div>
                  <label class="block text-sm font-medium mb-2" [class]="isDarkMode ? 'text-slate-300' : 'text-gray-700'">
                    Confirmar Contraseña *
                  </label>
                  <div class="relative">
                    <input
                      [type]="showPassword ? 'text' : 'password'"
                      formControlName="confirmar_contrasena"
                      placeholder="Repite tu contraseña"
                      class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition pr-12"
                      [class]="isDarkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'"
                    />
                    <span *ngIf="registerForm.get('confirmar_contrasena')?.value" class="absolute right-3 top-1/2 -translate-y-1/2 text-lg">
                      {{ registerForm.hasError('passwordMismatch') ? '❌' : '✅' }}
                    </span>
                  </div>
                  <div *ngIf="registerForm.hasError('passwordMismatch')" class="text-red-500 text-xs mt-1">
                    Las contraseñas no coinciden
                  </div>
                </div>
              </div>
            </div>

            <!-- Submit Button -->
            <button
              type="submit"
              [disabled]="registerForm.invalid || isLoading"
              class="w-full px-4 py-3 bg-gradient-to-r from-sky-600 via-cyan-600 to-blue-600 hover:shadow-lg hover:shadow-cyan-500/50 disabled:opacity-60 text-white font-bold rounded-lg transition flex items-center justify-center gap-2 mt-4"
            >
              <span *ngIf="!isLoading">📝 Crear Cuenta de Taller</span>
              <span *ngIf="isLoading" class="flex items-center gap-2">
                <span class="animate-spin">⌛</span>
                Registrando...
              </span>
            </button>

            <!-- Loading Bar -->
            <div *ngIf="isLoading" class="h-1 w-full bg-gradient-to-r from-sky-500 via-cyan-500 to-blue-500 rounded animate-pulse mt-4"></div>
          </form>

          <!-- Links -->
          <div class="mt-8 text-center text-sm" [class]="isDarkMode ? 'text-slate-400' : 'text-gray-600'">
            <p>¿Ya tienes cuenta?
              <a
                routerLink="/auth/login"
                class="font-semibold transition"
                [class]="isDarkMode ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-700 hover:text-cyan-800'"
              >
                Inicia sesión aquí
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class RegisterTallerComponent implements OnInit, OnDestroy {
  registerForm!: FormGroup;
  isLoading = false;
  showPassword = false;
  isDarkMode = false;
  selectedLocation: LocationSelection | null = null;

  showNotification = false;
  notificationType: 'success' | 'error' | 'info' | 'warning' = 'info';
  notificationTitle = '';
  notificationMessage = '';

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private themeService: ThemeService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      nombre_taller: ['', [Validators.required, Validators.minLength(3)]],
      razon_social: [''],
      nit: [''],
      correo: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.required, Validators.minLength(10)]],
      direccion: ['', Validators.required],
      descripcion: [''],
      latitud: [null],
      longitud: [null],
      contrasena: ['', [Validators.required, Validators.minLength(8)]],
      confirmar_contrasena: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });

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

  toggleTheme(): void {
    this.themeService.toggleDarkMode();
  }

  onNotificationClose(): void {
    this.showNotification = false;
  }

  onLocationSelected(location: LocationSelection): void {
    this.selectedLocation = location;
    this.registerForm.patchValue({
      latitud: location.latitud,
      longitud: location.longitud
    });
  }

  passwordMatchValidator(group: FormGroup): { [key: string]: any } | null {
    const password = group.get('contrasena')?.value;
    const confirmPassword = group.get('confirmar_contrasena')?.value;

    if (password && confirmPassword && password !== confirmPassword) {
      return { passwordMismatch: true };
    }
    return null;
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.showNotification = true;
      this.notificationType = 'warning';
      this.notificationTitle = 'Campos incompletos';
      this.notificationMessage = 'Por favor completa todos los campos requeridos correctamente';
      return;
    }

    this.isLoading = true;

    const registerData: TallerRegisterRequest = {
      correo: this.registerForm.get('correo')?.value,
      contrasena: this.registerForm.get('contrasena')?.value,
      confirmar_contrasena: this.registerForm.get('confirmar_contrasena')?.value,
      nombre_taller: this.registerForm.get('nombre_taller')?.value,
      razon_social: this.registerForm.get('razon_social')?.value || null,
      nit: this.registerForm.get('nit')?.value || null,
      telefono: this.registerForm.get('telefono')?.value,
      direccion: this.registerForm.get('direccion')?.value,
      latitud: this.registerForm.get('latitud')?.value || null,
      longitud: this.registerForm.get('longitud')?.value || null,
      descripcion: this.registerForm.get('descripcion')?.value || null
    };

    this.authService.registrarTaller(registerData).subscribe({
      next: (response: TallerRegisterResponse) => {
        this.isLoading = false;

        if (response.estado === 'PENDIENTE_DE_APROBACION') {
          this.showNotification = true;
          this.notificationType = 'info';
          this.notificationTitle = '✅ Registro Pending';
          this.notificationMessage = response.nota || 'Recibirás notificación cuando tu solicitud sea aprobada o rechazada.';

          setTimeout(() => {
            this.router.navigate(['/auth/login']);
          }, 3000);
        } else {
          this.showNotification = true;
          this.notificationType = 'success';
          this.notificationTitle = '¡Registro exitoso!';
          this.notificationMessage = response.mensaje;

          setTimeout(() => {
            this.router.navigate(['/auth/login']);
          }, 2000);
        }
      },
      error: (error: any) => {
        this.isLoading = false;
        let errorMessage = 'Error al registrar el taller';

        if (error.error?.detail && Array.isArray(error.error.detail)) {
          // Validación de Pydantic con múltiples errores
          const errors = error.error.detail.map((e: any) => {
            const campo = e.loc?.[1] || e.loc?.[0] || 'desconocido';
            return `${campo}: ${e.msg}`;
          }).join(' | ');
          errorMessage = errors;
        } else if (error.error?.detail) {
          errorMessage = error.error.detail;
        } else if (error.error?.mensaje) {
          errorMessage = error.error.mensaje;
        } else if (error.message) {
          errorMessage = error.message;
        }

        this.showNotification = true;
        this.notificationType = 'error';
        this.notificationTitle = 'Error en el registro';
        this.notificationMessage = errorMessage;
        console.error('Register error:', error);
      }
    });
  }
}
