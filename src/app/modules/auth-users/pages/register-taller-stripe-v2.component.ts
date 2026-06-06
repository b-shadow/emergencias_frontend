import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AuthService } from '@core/services/auth.service';
import { ThemeService } from '@core/services/theme.service';
import {
  SubscriptionPlan,
  TallerRegisterCheckoutRequest,
  TallerRegisterCheckoutValidationResponse,
} from '@core/models/user.model';
import { LocationPickerMapComponent, LocationSelection } from '@shared/components/location-picker-map.component';
import { NotificationComponent } from '@shared/components/notification.component';

@Component({
  selector: 'app-register-taller-stripe-v2',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LocationPickerMapComponent, NotificationComponent],
  template: `
    <div [class.dark]="isDarkMode" class="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-sky-50 to-cyan-50 text-slate-900 transition-colors duration-300 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 dark:text-white">
      <button
        type="button"
        (click)="toggleTheme()"
        class="fixed top-6 right-6 z-50 p-3 rounded-full bg-white dark:bg-slate-700 hover:shadow-lg transition-all hover:scale-110 text-lg"
      >
        {{ isDarkMode ? '☀️' : '🌙' }}
      </button>

      <app-notification
        [type]="notificationType"
        [title]="notificationTitle"
        [message]="notificationMessage"
        [isVisible]="showNotification"
        (close)="showNotification = false">
      </app-notification>

      <div class="relative z-10 max-w-4xl mx-auto px-4 py-12">
        <div class="rounded-xl shadow-lg p-8 mb-8 border" [class]="isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'">
          <div class="text-center pb-8 border-b" [class]="isDarkMode ? 'border-slate-700' : 'border-gray-200'">
            <h1 class="text-3xl font-bold mb-2 bg-gradient-to-r from-sky-500 via-cyan-500 to-blue-500 bg-clip-text text-transparent">
              Registrar Taller + Suscripción
            </h1>
            <p class="text-sm" [class]="isDarkMode ? 'text-slate-400' : 'text-gray-600'">
              Completa datos, selecciona plan y paga con Stripe.
            </p>
          </div>

          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="mt-8">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" formControlName="nombre_taller" placeholder="Nombre del Taller *" [class]="fieldClass()" />
              <input type="text" formControlName="razon_social" placeholder="Razón Social" [class]="fieldClass()" />
              <input type="text" formControlName="nit" placeholder="NIT" [class]="fieldClass()" />
              <input type="email" formControlName="correo" placeholder="Correo *" [class]="fieldClass()" />
              <input type="text" formControlName="telefono" placeholder="Teléfono *" [class]="fieldClass()" />
              <input type="text" formControlName="direccion" placeholder="Dirección *" [class]="fieldClass()" />
              <input type="password" formControlName="contrasena" placeholder="Contraseña *" [class]="fieldClass()" />
              <input type="password" formControlName="confirmar_contrasena" placeholder="Confirmar Contraseña *" [class]="fieldClass()" />
            </div>

            <textarea formControlName="descripcion" rows="3" placeholder="Descripción" [class]="textareaClass()"></textarea>

            <div class="mt-6">
              <h2 class="text-lg font-semibold mb-2" [class]="isDarkMode ? 'text-white' : 'text-gray-900'">Ubicación del Taller</h2>
              <app-location-picker-map (locationSelected)="onLocationSelected($event)"></app-location-picker-map>
            </div>

            <div class="mt-6">
              <h2 class="text-lg font-semibold mb-2" [class]="isDarkMode ? 'text-white' : 'text-gray-900'">Plan de Suscripción *</h2>
              <select formControlName="id_plan" [class]="fieldClass()">
                <option value="">Selecciona un plan</option>
                <option *ngFor="let p of subscriptionPlans" [value]="p.id_plan">
                  {{ p.nombre_plan }} - {{ p.precio_bs | number:'1.2-2' }} Bs / {{ p.duracion_dias }} días
                </option>
              </select>
            </div>

            <button type="submit" [disabled]="isLoading || validatingStripe"
                    class="w-full mt-6 px-4 py-3 bg-gradient-to-r from-sky-600 via-cyan-600 to-blue-600 disabled:opacity-60 text-white font-bold rounded-lg">
              <span *ngIf="!isLoading && !validatingStripe">Continuar a Stripe</span>
              <span *ngIf="isLoading">Preparando pago...</span>
              <span *ngIf="validatingStripe">Validando pago...</span>
            </button>
          </form>

          <div class="mt-8 text-center text-sm" [class]="isDarkMode ? 'text-slate-400' : 'text-gray-600'">
            ¿Ya tienes cuenta?
            <a routerLink="/auth/login" class="font-semibold text-cyan-600 hover:text-cyan-700">Inicia sesión</a>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class RegisterTallerStripeV2Component implements OnInit, OnDestroy {
  registerForm!: FormGroup;
  isLoading = false;
  validatingStripe = false;
  isDarkMode = false;
  subscriptionPlans: SubscriptionPlan[] = [];

  showNotification = false;
  notificationType: 'success' | 'error' | 'info' | 'warning' = 'info';
  notificationTitle = '';
  notificationMessage = '';

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private themeService: ThemeService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.registerForm = this.fb.group(
      {
        nombre_taller: ['', [Validators.required, Validators.minLength(3)]],
        razon_social: [''],
        nit: [''],
        correo: ['', [Validators.required, Validators.email]],
        telefono: ['', [Validators.required, Validators.minLength(7)]],
        direccion: ['', Validators.required],
        descripcion: [''],
        latitud: [null],
        longitud: [null],
        contrasena: ['', [Validators.required, Validators.minLength(8)]],
        confirmar_contrasena: ['', Validators.required],
        id_plan: ['', Validators.required],
      },
      {
        validators: (group: FormGroup) => {
          const p1 = group.get('contrasena')?.value;
          const p2 = group.get('confirmar_contrasena')?.value;
          return p1 && p2 && p1 !== p2 ? { passwordMismatch: true } : null;
        },
      },
    );

    this.themeService.darkMode$.pipe(takeUntil(this.destroy$)).subscribe((isDark) => {
      this.isDarkMode = isDark;
    });

    this.authService.obtenerPlanesSuscripcion().subscribe({
      next: (plans) => (this.subscriptionPlans = plans || []),
      error: () => this.notify('error', 'Error', 'No se pudieron cargar los planes de suscripción.'),
    });

    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const payment = params.get('payment');
      const sessionId = params.get('session_id');
      const token = params.get('token');
      if (payment === 'cancelled') {
        this.notify('warning', 'Pago cancelado', 'El pago fue cancelado. Puedes intentar nuevamente.');
        return;
      }
      if (sessionId && token) {
        this.validatingStripe = true;
        this.authService.validarCheckoutRegistroTaller(sessionId, token).subscribe({
          next: (resp: TallerRegisterCheckoutValidationResponse) => {
            this.validatingStripe = false;
            this.notify('success', 'Pago validado', resp.mensaje);
            setTimeout(
              () =>
                this.router.navigate(['/auth/login'], {
                  queryParams: { tallerPendiente: '1', paid: '1' },
                  replaceUrl: true,
                }),
              2500,
            );
          },
          error: (err) => {
            this.validatingStripe = false;
            this.notify('error', 'Validación fallida', err?.error?.detail || 'No se pudo validar pago Stripe.');
          },
        });
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onLocationSelected(location: LocationSelection): void {
    this.registerForm.patchValue({ latitud: location.latitud, longitud: location.longitud });
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.notify('warning', 'Campos incompletos', 'Completa todos los campos requeridos.');
      return;
    }
    this.isLoading = true;

    const payload: TallerRegisterCheckoutRequest = {
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
      descripcion: this.registerForm.get('descripcion')?.value || null,
      id_plan: this.registerForm.get('id_plan')?.value,
      frontend_base_url: window.location.origin,
    };

    this.authService.iniciarCheckoutRegistroTaller(payload).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (!response.checkout_url) {
          this.notify('error', 'Checkout no disponible', 'No se pudo iniciar pago con Stripe.');
          return;
        }
        try {
          const checkoutUrl = new URL(response.checkout_url);
          if (checkoutUrl.hostname !== 'checkout.stripe.com') {
            this.notify('error', 'Checkout inválido', 'La URL de pago no corresponde a Stripe real.');
            return;
          }
        } catch {
          this.notify('error', 'Checkout inválido', 'La URL de pago recibida no es válida.');
          return;
        }
        window.location.href = response.checkout_url;
      },
      error: (err) => {
        this.isLoading = false;
        this.notify('error', 'Error en registro', err?.error?.detail || 'No se pudo iniciar el checkout.');
      },
    });
  }

  toggleTheme(): void {
    this.themeService.toggleDarkMode();
    this.isDarkMode = this.themeService.isDarkMode();
  }

  fieldClass(): string {
    return this.isDarkMode
      ? 'w-full px-4 py-2 rounded-lg border border-slate-600 bg-slate-700 text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent'
      : 'w-full px-4 py-2 rounded-lg border border-gray-300 bg-white text-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-transparent';
  }

  textareaClass(): string {
    return this.isDarkMode
      ? 'mt-4 w-full px-4 py-2 rounded-lg border border-slate-600 bg-slate-700 text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent'
      : 'mt-4 w-full px-4 py-2 rounded-lg border border-gray-300 bg-white text-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-transparent';
  }

  private notify(type: 'success' | 'error' | 'info' | 'warning', title: string, message: string): void {
    this.showNotification = true;
    this.notificationType = type;
    this.notificationTitle = title;
    this.notificationMessage = message;
  }
}
