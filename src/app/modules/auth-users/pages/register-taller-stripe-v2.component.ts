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
import {
  LocationPickerMapComponent,
  LocationSelection,
} from '@shared/components/location-picker-map.component';
import { NotificationComponent } from '@shared/components/notification.component';

@Component({
  selector: 'app-register-taller-stripe-v2',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    LocationPickerMapComponent,
    NotificationComponent,
  ],
  template: `
    <div
      [class.dark]="isDarkMode"
      class="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.08),_transparent_38%),linear-gradient(180deg,#f8fbff_0%,#eef5ff_55%,#f8fbff_100%)] text-slate-900 transition-colors duration-300 dark:bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.14),_transparent_30%),linear-gradient(180deg,#020617_0%,#0f172a_58%,#020617_100%)] dark:text-white"
    >
      <button
        type="button"
        (click)="toggleTheme()"
        class="fixed right-5 top-5 z-50 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200/80 bg-white/90 text-xl shadow-lg shadow-slate-200/40 backdrop-blur transition hover:-translate-y-0.5 hover:shadow-xl dark:border-slate-700 dark:bg-slate-800/90 dark:shadow-black/20"
        [attr.aria-label]="isDarkMode ? 'Activar modo claro' : 'Activar modo oscuro'"
      >
        {{ isDarkMode ? '☀️' : '🌙' }}
      </button>

      <app-notification
        [type]="notificationType"
        [title]="notificationTitle"
        [message]="notificationMessage"
        [isVisible]="showNotification"
        (close)="showNotification = false"
      />

      <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div class="mb-6 flex flex-col gap-5 rounded-[30px] border border-white/70 bg-white/90 p-6 shadow-[0_24px_70px_rgba(59,130,246,0.10)] backdrop-blur xl:flex-row xl:items-start xl:justify-between dark:border-slate-700 dark:bg-slate-900/95 dark:shadow-[0_24px_80px_rgba(2,6,23,0.55)]">
          <div class="flex items-start gap-4">
            <div
              class="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-600 text-white shadow-lg shadow-sky-500/30"
            >
              <svg viewBox="0 0 24 24" class="h-8 w-8 fill-none stroke-current" stroke-width="1.9">
                <path d="M14.7 6.3a1 1 0 0 1 1.4 0l1.6 1.6a1 1 0 0 1 0 1.4l-2 2-3-3 2-2Z" />
                <path d="m11.7 9.3-7.4 7.4-.8 3.1 3.1-.8 7.4-7.4" />
                <path d="M8 5H6a2 2 0 0 0-2 2v2" />
                <path d="M19 9v8a2 2 0 0 1-2 2H9" />
              </svg>
            </div>
            <div>
              <h1 class="text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                Registrar Taller + Suscripción
              </h1>
              <p class="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                Completa los datos, selecciona un plan y continúa con el pago seguro en Stripe.
              </p>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <div
              class="inline-flex items-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200"
            >
              <span class="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
              Registro guiado
            </div>
            <a
              routerLink="/auth/login"
              class="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-200 hover:text-sky-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-sky-500/40 dark:hover:text-sky-300"
            >
              Ya tengo cuenta
            </a>
          </div>
        </div>

        <div class="rounded-[30px] border border-white/70 bg-white/90 p-5 shadow-[0_24px_70px_rgba(59,130,246,0.08)] backdrop-blur dark:border-slate-700 dark:bg-slate-900/95 dark:shadow-[0_24px_80px_rgba(2,6,23,0.55)] sm:p-7">
          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="space-y-6">
            <section class="rounded-[26px] border border-slate-200/90 bg-white/90 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800/90">
              <div class="mb-5 flex items-start gap-4">
                <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">
                  <svg viewBox="0 0 24 24" class="h-6 w-6 fill-none stroke-current" stroke-width="1.8">
                    <path d="M4 20h16" />
                    <path d="M5 20V8l7-4 7 4v12" />
                    <path d="M9 20v-5h6v5" />
                    <path d="M9 10h.01M15 10h.01" />
                  </svg>
                </div>
                <div>
                  <h2 class="text-xl font-black text-slate-950 dark:text-white">Datos del taller</h2>
                  <p class="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    Completa la información principal y de contacto para crear tu cuenta.
                  </p>
                </div>
              </div>

              <div class="grid gap-5 md:grid-cols-2">
                <div>
                  <label class="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Nombre del taller *</label>
                  <input type="text" formControlName="nombre_taller" placeholder="Ej. Taller Auto Madrid" [class]="fieldClass()" />
                </div>
                <div>
                  <label class="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Razón social</label>
                  <input type="text" formControlName="razon_social" placeholder="Ej. Auto Madrid S.R.L." [class]="fieldClass()" />
                </div>
                <div>
                  <label class="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">NIT</label>
                  <input type="text" formControlName="nit" placeholder="Ej. 123456789" [class]="fieldClass()" />
                </div>
                <div>
                  <label class="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Correo *</label>
                  <input type="email" formControlName="correo" placeholder="Ej. contacto@tallermadrid.com" [class]="fieldClass()" />
                </div>
                <div>
                  <label class="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Teléfono *</label>
                  <input type="text" formControlName="telefono" placeholder="Ej. +591 70000000" [class]="fieldClass()" />
                </div>
                <div>
                  <label class="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Dirección *</label>
                  <input type="text" formControlName="direccion" placeholder="Ej. Av. América #1234" [class]="fieldClass()" />
                </div>
                <div>
                  <label class="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Contraseña *</label>
                  <div class="relative">
                    <input
                      [type]="showPassword ? 'text' : 'password'"
                      formControlName="contrasena"
                      placeholder="Mínimo 8 caracteres"
                      [class]="fieldClass()"
                    />
                    <button
                      type="button"
                      (click)="showPassword = !showPassword"
                      class="absolute inset-y-0 right-3 inline-flex items-center text-slate-400 transition hover:text-sky-600 dark:hover:text-sky-300"
                    >
                      {{ showPassword ? 'Ocultar' : 'Ver' }}
                    </button>
                  </div>
                </div>
                <div>
                  <label class="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Confirmar contraseña *</label>
                  <div class="relative">
                    <input
                      [type]="showConfirmPassword ? 'text' : 'password'"
                      formControlName="confirmar_contrasena"
                      placeholder="Repite tu contraseña"
                      [class]="fieldClass()"
                    />
                    <button
                      type="button"
                      (click)="showConfirmPassword = !showConfirmPassword"
                      class="absolute inset-y-0 right-3 inline-flex items-center text-slate-400 transition hover:text-sky-600 dark:hover:text-sky-300"
                    >
                      {{ showConfirmPassword ? 'Ocultar' : 'Ver' }}
                    </button>
                  </div>
                </div>
              </div>

              <div *ngIf="registerForm.hasError('passwordMismatch')" class="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
                Las contraseñas no coinciden.
              </div>

              <div class="mt-5">
                <div class="mb-2 flex items-center justify-between">
                  <label class="block text-sm font-semibold text-slate-700 dark:text-slate-200">Descripción</label>
                  <span class="text-xs font-medium text-slate-400 dark:text-slate-500">{{ descripcionLength }}/300</span>
                </div>
                <textarea
                  formControlName="descripcion"
                  rows="4"
                  maxlength="300"
                  placeholder="Cuéntanos sobre tu taller, servicios principales, experiencia, etc."
                  [class]="textareaClass()"
                ></textarea>
              </div>
            </section>

            <section class="rounded-[26px] border border-slate-200/90 bg-white/90 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800/90">
              <div class="mb-4 flex items-start gap-4">
                <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">
                  <svg viewBox="0 0 24 24" class="h-6 w-6 fill-none stroke-current" stroke-width="1.8">
                    <path d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11Z" />
                    <circle cx="12" cy="10" r="2.5" />
                  </svg>
                </div>
                <div>
                  <h2 class="text-xl font-black text-slate-950 dark:text-white">Ubicación del taller</h2>
                  <p class="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    Selecciona el punto exacto en el mapa para que tus clientes te encuentren mejor.
                  </p>
                </div>
              </div>

              <app-location-picker-map (locationSelected)="onLocationSelected($event)"></app-location-picker-map>
            </section>

            <section class="rounded-[26px] border border-slate-200/90 bg-white/90 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800/90">
              <div class="mb-5 flex items-start gap-4">
                <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">
                  <svg viewBox="0 0 24 24" class="h-6 w-6 fill-none stroke-current" stroke-width="1.8">
                    <path d="M6 8h12" />
                    <path d="M6 12h12" />
                    <path d="M6 16h12" />
                    <path d="M4 6h16v12H4z" />
                  </svg>
                </div>
                <div>
                  <h2 class="text-xl font-black text-slate-950 dark:text-white">Plan de suscripción *</h2>
                  <p class="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    Elige el plan que mejor se adapte a la operación de tu taller.
                  </p>
                </div>
              </div>

              <div class="grid gap-5 lg:grid-cols-3">
                <button
                  *ngFor="let plan of subscriptionPlans"
                  type="button"
                  (click)="selectPlan(plan.id_plan)"
                  class="group relative overflow-hidden rounded-[24px] border p-5 text-left transition duration-200"
                  [ngClass]="
                    isPlanSelected(plan.id_plan)
                      ? 'border-emerald-300 bg-emerald-50/80 shadow-lg shadow-emerald-500/10 dark:border-emerald-400/40 dark:bg-emerald-500/10'
                      : 'border-slate-200 bg-white hover:-translate-y-1 hover:border-sky-200 hover:shadow-lg hover:shadow-sky-100/80 dark:border-slate-700 dark:bg-slate-900/60 dark:hover:border-sky-500/30 dark:hover:shadow-black/20'
                  "
                >
                  <div
                    *ngIf="isPopularPlan(plan)"
                    class="absolute right-4 top-4 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200"
                  >
                    Más popular
                  </div>

                  <div class="mb-4 flex items-center justify-between">
                    <div
                      class="flex h-12 w-12 items-center justify-center rounded-2xl"
                      [ngClass]="
                        isPlanSelected(plan.id_plan)
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-200'
                          : 'bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300'
                      "
                    >
                      <svg viewBox="0 0 24 24" class="h-6 w-6 fill-none stroke-current" stroke-width="1.8">
                        <path d="M5 12 3 7l6 2 3-5 3 5 6-2-2 5 3 5-6-.5L12 21l-3.5-4.5L2 17l3-5Z" />
                      </svg>
                    </div>
                    <span
                      class="inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs font-black"
                      [ngClass]="
                        isPlanSelected(plan.id_plan)
                          ? 'border-emerald-400 bg-emerald-500 text-white'
                          : 'border-slate-300 bg-white text-transparent dark:border-slate-600 dark:bg-slate-800'
                      "
                    >
                      •
                    </span>
                  </div>

                  <h3 class="text-xl font-black text-slate-950 dark:text-white">
                    {{ plan.nombre_plan }}
                  </h3>
                  <p class="mt-1 min-h-[40px] text-sm text-slate-600 dark:text-slate-300">
                    {{ plan.descripcion || defaultPlanDescription(plan) }}
                  </p>

                  <div class="mt-5 flex items-end gap-2">
                    <span class="text-4xl font-black text-slate-950 dark:text-white">
                      Bs {{ plan.precio_bs | number: '1.0-0' }}
                    </span>
                    <span class="pb-1 text-sm text-slate-500 dark:text-slate-400">/ {{ plan.duracion_dias }} días</span>
                  </div>

                  <ul class="mt-5 space-y-2">
                    <li *ngFor="let feature of planFeatures(plan)" class="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <span class="mt-1 h-2 w-2 rounded-full bg-sky-500"></span>
                      <span>{{ feature }}</span>
                    </li>
                  </ul>
                </button>
              </div>

              <input type="hidden" formControlName="id_plan" />
              <div *ngIf="registerForm.get('id_plan')?.invalid && registerForm.touched" class="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                Selecciona un plan antes de continuar.
              </div>
            </section>

            <section class="rounded-[26px] border border-slate-200/90 bg-white/90 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800/90">
              <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div class="flex items-start gap-4">
                  <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">
                    <svg viewBox="0 0 24 24" class="h-6 w-6 fill-none stroke-current" stroke-width="1.8">
                      <path d="M12 3 4 7v5c0 5 3.4 8.7 8 9 4.6-.3 8-4 8-9V7l-8-4Z" />
                      <path d="m9.5 12 1.7 1.7L15 9.8" />
                    </svg>
                  </div>
                  <div>
                    <h2 class="text-xl font-black text-slate-950 dark:text-white">Todo listo para comenzar</h2>
                    <p class="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      Al continuar, podrás revisar tu información y proceder al pago seguro con Stripe.
                    </p>
                    <div
                      *ngIf="selectedPlan"
                      class="mt-3 inline-flex flex-wrap items-center gap-2 rounded-2xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                      <span>Plan elegido:</span>
                      <span class="rounded-full bg-white px-3 py-1 text-sky-700 shadow-sm dark:bg-slate-700 dark:text-sky-300">
                        {{ selectedPlan.nombre_plan }} · Bs {{ selectedPlan.precio_bs | number: '1.0-0' }}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  [disabled]="isLoading || validatingStripe"
                  class="inline-flex min-w-[280px] items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 px-6 py-4 text-base font-black text-white shadow-xl shadow-sky-500/25 transition hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-sky-500/30 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span *ngIf="!isLoading && !validatingStripe">Continuar con Stripe</span>
                  <span *ngIf="isLoading">Preparando pago...</span>
                  <span *ngIf="validatingStripe">Validando pago...</span>
                  <svg *ngIf="!isLoading && !validatingStripe" viewBox="0 0 24 24" class="h-5 w-5 fill-none stroke-current" stroke-width="2">
                    <path d="M5 12h14" />
                    <path d="m13 5 7 7-7 7" />
                  </svg>
                </button>
              </div>
            </section>
          </form>

          <div class="mt-8 flex flex-col items-center justify-center gap-2 text-center text-sm text-slate-500 dark:text-slate-400 sm:flex-row">
            <span>Pago 100% seguro con Stripe</span>
            <span class="hidden sm:inline">•</span>
            <span>Tus datos están protegidos</span>
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
  showPassword = false;
  showConfirmPassword = false;

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

    this.themeService.darkMode$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isDark) => (this.isDarkMode = isDark));

    this.authService.obtenerPlanesSuscripcion().subscribe({
      next: (plans) => (this.subscriptionPlans = plans || []),
      error: () =>
        this.notify('error', 'Error', 'No se pudieron cargar los planes de suscripción.'),
    });

    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const payment = params.get('payment');
      const sessionId = params.get('session_id');
      const token = params.get('token');
      if (payment === 'cancelled') {
        this.notify(
          'warning',
          'Pago cancelado',
          'El pago fue cancelado. Puedes intentarlo nuevamente.',
        );
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
            this.notify(
              'error',
              'Validación fallida',
              err?.error?.detail || 'No se pudo validar el pago con Stripe.',
            );
          },
        });
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get descripcionLength(): number {
    return (this.registerForm?.get('descripcion')?.value || '').length;
  }

  get selectedPlan(): SubscriptionPlan | undefined {
    return this.subscriptionPlans.find(
      (plan) => plan.id_plan === this.registerForm?.get('id_plan')?.value,
    );
  }

  onLocationSelected(location: LocationSelection): void {
    this.registerForm.patchValue({
      latitud: location.latitud,
      longitud: location.longitud,
    });
  }

  onSubmit(): void {
    this.registerForm.markAllAsTouched();
    if (this.registerForm.invalid) {
      this.notify(
        'warning',
        'Campos incompletos',
        'Completa todos los campos requeridos antes de continuar.',
      );
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
          this.notify(
            'error',
            'Checkout no disponible',
            'No se pudo iniciar el pago con Stripe.',
          );
          return;
        }
        try {
          const checkoutUrl = new URL(response.checkout_url);
          if (checkoutUrl.hostname !== 'checkout.stripe.com') {
            this.notify(
              'error',
              'Checkout inválido',
              'La URL de pago no corresponde a Stripe real.',
            );
            return;
          }
        } catch {
          this.notify(
            'error',
            'Checkout inválido',
            'La URL de pago recibida no es válida.',
          );
          return;
        }
        window.location.href = response.checkout_url;
      },
      error: (err) => {
        this.isLoading = false;
        this.notify(
          'error',
          'Error en el registro',
          err?.error?.detail || 'No se pudo iniciar el checkout.',
        );
      },
    });
  }

  selectPlan(idPlan: string): void {
    this.registerForm.patchValue({ id_plan: idPlan });
    this.registerForm.get('id_plan')?.markAsTouched();
  }

  isPlanSelected(idPlan: string): boolean {
    return this.registerForm.get('id_plan')?.value === idPlan;
  }

  isPopularPlan(plan: SubscriptionPlan): boolean {
    const code = (plan.codigo_plan || plan.nombre_plan || '').toLowerCase();
    return code.includes('stand') || code.includes('estandar') || code.includes('estándar');
  }

  defaultPlanDescription(plan: SubscriptionPlan): string {
    const name = (plan.codigo_plan || plan.nombre_plan || '').toLowerCase();
    if (name.includes('basic') || name.includes('basico') || name.includes('básico')) {
      return 'Ideal para talleres pequeños que están comenzando.';
    }
    if (name.includes('stand') || name.includes('estandar') || name.includes('estándar')) {
      return 'Para talleres en crecimiento que necesitan más control.';
    }
    if (name.includes('premium')) {
      return 'Para talleres que buscan una operación más completa.';
    }
    return 'Un plan diseñado para profesionalizar la gestión de tu taller.';
  }

  planFeatures(plan: SubscriptionPlan): string[] {
    const name = (plan.codigo_plan || plan.nombre_plan || '').toLowerCase();
    if (name.includes('basic') || name.includes('basico') || name.includes('básico')) {
      return ['Gestión de clientes', 'Órdenes de trabajo', 'Reportes básicos', 'Soporte por email'];
    }
    if (name.includes('stand') || name.includes('estandar') || name.includes('estándar')) {
      return ['Todo lo del plan Básico', 'Inventario y repuestos', 'Reportes avanzados', 'Soporte prioritario'];
    }
    if (name.includes('premium')) {
      return ['Todo lo del plan Estándar', 'Multi-sucursal', 'Integraciones API', 'Soporte 24/7'];
    }
    return ['Operación centralizada', 'Gestión comercial', 'Panel de indicadores', 'Soporte incluido'];
  }

  toggleTheme(): void {
    this.themeService.toggleDarkMode();
    this.isDarkMode = this.themeService.isDarkMode();
  }

  fieldClass(): string {
    return this.isDarkMode
      ? 'w-full rounded-2xl border border-slate-600 bg-slate-700 px-4 py-3 text-white placeholder-slate-400 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-500/15'
      : 'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-500/15';
  }

  textareaClass(): string {
    return this.isDarkMode
      ? 'w-full rounded-2xl border border-slate-600 bg-slate-700 px-4 py-3 text-white placeholder-slate-400 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-500/15'
      : 'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-500/15';
  }

  private notify(
    type: 'success' | 'error' | 'info' | 'warning',
    title: string,
    message: string,
  ): void {
    this.showNotification = true;
    this.notificationType = type;
    this.notificationTitle = title;
    this.notificationMessage = message;
  }
}
