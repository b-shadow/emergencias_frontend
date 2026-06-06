import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, of } from 'rxjs';
import { catchError, takeUntil, timeout } from 'rxjs/operators';
import { TallerPerfil } from '@core/models/workshop.model';
import { AuthService } from '@core/services/auth.service';
import { SubscriptionManagementResponse, SubscriptionPlan } from '@core/models/user.model';
import { WorkshopService } from '@core/services/workshop.service';

@Component({
  selector: 'app-gestionar-suscripcion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="relative px-6 py-5 space-y-6">
      <div class="pointer-events-none absolute right-6 top-0 h-40 w-40 rounded-full bg-sky-100/70 blur-2xl dark:bg-sky-900/20"></div>
      <div class="pointer-events-none absolute left-24 top-24 h-28 w-28 rounded-full bg-cyan-100/70 blur-2xl dark:bg-cyan-900/20"></div>

      <div class="relative z-10 flex items-start gap-4">
        <div class="h-14 w-14 rounded-2xl bg-gradient-to-br from-cyan-100 to-sky-100 text-sky-600 flex items-center justify-center text-2xl border border-sky-200/70">
          📅
        </div>
        <div>
          <h1 class="text-4xl font-black tracking-tight text-slate-900 dark:text-white">Gestionar Suscripción</h1>
          <p class="text-lg text-slate-600 dark:text-slate-400 mt-1">Consulta estado, historial y renueva tu plan.</p>
        </div>
      </div>

      <div *ngIf="loading" class="relative z-10 flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3">
        <span class="h-4 w-4 rounded-full border-2 border-sky-400 border-t-transparent animate-spin"></span>
        <span>Cargando suscripción...</span>
      </div>

      <div
        *ngIf="error && !loading"
        class="relative z-10 p-4 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl"
      >
        {{ error }}
      </div>

      <div *ngIf="message" class="relative z-10 p-3 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-700">
        {{ message }}
      </div>

      <div *ngIf="!loading && resumen" class="relative z-10 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div class="bg-white/95 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
          <p class="text-xs uppercase font-semibold tracking-wide text-slate-500 dark:text-slate-400">Plan actual</p>
          <p class="text-4xl mt-3">👑</p>
          <p class="text-3xl font-black text-slate-900 dark:text-white mt-2">{{ resumen.plan_actual || 'Sin plan activo' }}</p>
        </div>

        <div class="bg-white/95 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
          <p class="text-xs uppercase font-semibold tracking-wide text-slate-500 dark:text-slate-400">Estado</p>
          <p class="text-4xl mt-3">📈</p>
          <p class="text-3xl font-black text-sky-600 dark:text-sky-400 mt-2">{{ resumen.estado_suscripcion || '-' }}</p>
        </div>

        <div class="bg-white/95 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
          <p class="text-xs uppercase font-semibold tracking-wide text-slate-500 dark:text-slate-400">Vence el</p>
          <p class="text-4xl mt-3">🗓️</p>
          <p class="text-3xl font-black text-slate-900 dark:text-white mt-2">
            {{ resumen.fecha_fin ? (resumen.fecha_fin | date: 'dd/MM/yyyy') : '-' }}
          </p>
        </div>

        <div class="bg-white/95 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
          <p class="text-xs uppercase font-semibold tracking-wide text-slate-500 dark:text-slate-400">Días restantes</p>
          <p class="text-4xl mt-3">⏱️</p>
          <p class="text-3xl font-black text-slate-900 dark:text-white mt-2">{{ resumen.dias_restantes ?? '-' }}</p>
        </div>
      </div>

      <div *ngIf="!loading" class="relative z-10 bg-white/95 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
        <p class="text-3xl font-black text-slate-900 dark:text-white mb-2">Renovar suscripción</p>
        <p class="text-slate-600 dark:text-slate-400 mb-5">Selecciona un plan para renovar y continuar operando.</p>
        <div class="flex flex-col lg:flex-row gap-3 lg:items-center">
          <select [(ngModel)]="selectedPlanId" class="px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl min-w-[280px] bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
            <option value="">Selecciona un plan</option>
            <option *ngFor="let p of plans" [value]="p.id_plan">
              {{ p.nombre_plan }} - {{ p.precio_bs | number:'1.2-2' }} Bs / {{ p.duracion_dias }} días
            </option>
          </select>
          <button
            class="px-6 py-3 rounded-xl text-white bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-700 hover:to-sky-700 disabled:opacity-50 font-semibold"
            [disabled]="!selectedPlanId || saving"
            (click)="renovar()"
          >
            {{ saving ? 'Procesando...' : 'Renovar ahora' }}
          </button>
        </div>
      </div>

      <div *ngIf="!loading && resumen?.historial?.length" class="relative z-10 bg-white/95 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
        <p class="text-3xl font-black text-slate-900 dark:text-white mb-2">Historial de suscripción</p>
        <p class="text-slate-600 dark:text-slate-400 mb-5">Planes que tu taller ha tenido y su estado.</p>
        <div class="overflow-auto">
          <table class="min-w-full text-sm">
            <thead>
              <tr class="text-left text-slate-600 bg-slate-100/80 dark:bg-slate-700/40 rounded-xl">
                <th class="py-3 px-4">Plan</th>
                <th class="py-3 px-4">Estado</th>
                <th class="py-3 px-4">Inicio</th>
                <th class="py-3 px-4">Fin</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let h of resumen?.historial || []" class="border-b border-slate-100 dark:border-slate-700">
                <td class="py-3 px-4 font-medium text-slate-900 dark:text-white">{{ h.nombre_plan }}</td>
                <td class="py-3 px-4">
                  <span class="px-3 py-1 rounded-full text-xs font-semibold"
                    [ngClass]="h.estado === 'ACTIVA' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'">
                    {{ h.estado }}
                  </span>
                </td>
                <td class="py-3 px-4 text-slate-700 dark:text-slate-300">{{ h.fecha_inicio | date: 'dd/MM/yyyy' }}</td>
                <td class="py-3 px-4 text-slate-700 dark:text-slate-300">{{ h.fecha_fin | date: 'dd/MM/yyyy' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class GestionarSuscripcionComponent implements OnInit, OnDestroy {
  perfil: TallerPerfil | null = null;
  resumen: SubscriptionManagementResponse | null = null;
  plans: SubscriptionPlan[] = [];
  selectedPlanId = '';
  saving = false;
  message = '';
  loading = true;
  error = '';
  private readonly destroy$ = new Subject<void>();

  constructor(
    private workshopService: WorkshopService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const qs = new URLSearchParams(window.location.search);
    const renewal = qs.get('renewal');
    const sessionId = qs.get('session_id');
    if (renewal === 'processing') {
      this.message = 'Pago recibido por Stripe. Validando renovación...';
      if (sessionId) {
        this.authService
          .validarCheckoutRenovacionSuscripcion(sessionId)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.message = 'Pago confirmado. La renovación fue aplicada correctamente.';
              this.cargarSuscripcion();
            },
            error: (err) => {
              this.error = err?.error?.detail || err?.message || 'No se pudo confirmar la renovación.';
              this.cdr.markForCheck();
            },
          });
      }
    } else if (renewal === 'cancelled') {
      this.error = 'La renovación fue cancelada en Stripe.';
    }

    this.cargarSuscripcion();
  }

  private cargarSuscripcion(): void {
    this.loading = true;
    this.error = '';
    this.cdr.markForCheck();

    this.workshopService
      .getMyProfile()
      .pipe(
        takeUntil(this.destroy$),
        timeout(15000),
      )
      .subscribe({
        next: (perfil) => {
          try {
            this.perfil = perfil;
            if (!this.resumen && perfil) {
              this.resumen = {
                id_taller: perfil.id_taller,
                plan_actual: perfil.plan_actual,
                fecha_fin: perfil.fecha_fin_plan || null,
                dias_restantes: perfil.dias_restantes_plan ?? null,
                historial: [],
              };
            }
          } catch {
            this.error = 'Error al procesar los datos de suscripción';
          } finally {
            this.loading = false;
            this.cdr.markForCheck();
          }
        },
        error: () => {
          this.error = 'No se pudo cargar la suscripción del taller';
          this.loading = false;
          this.cdr.markForCheck();
        },
      });

    this.authService
      .obtenerPlanesSuscripcion()
      .pipe(
        takeUntil(this.destroy$),
        timeout(15000),
        catchError(() => {
          this.error = this.error || 'No se pudieron cargar los planes de suscripción.';
          this.cdr.markForCheck();
          return of([]);
        }),
      )
      .subscribe({
        next: (plans) => {
          this.plans = plans || [];
          this.cdr.markForCheck();
        },
      });

    this.authService
      .obtenerMiSuscripcion()
      .pipe(
        takeUntil(this.destroy$),
        timeout(15000),
        catchError(() => of(null)),
      )
      .subscribe({
        next: (resumen) => {
          if (resumen) {
            this.resumen = resumen;
            this.cdr.markForCheck();
          }
        },
      });
  }

  renovar(): void {
    if (!this.selectedPlanId || this.saving) return;
    this.saving = true;
    this.message = '';
    this.error = '';
    const frontendBaseUrl = window.location.origin;
    this.authService
      .iniciarCheckoutRenovacionSuscripcion({
        id_plan: this.selectedPlanId,
        frontend_base_url: frontendBaseUrl,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          this.saving = false;
          if (resp?.checkout_url) {
            window.location.href = resp.checkout_url;
            return;
          }
          this.error = 'No se pudo obtener la URL de pago de Stripe.';
        },
        error: (err) => {
          this.error =
            err?.error?.detail ||
            err?.message ||
            'No se pudo renovar la suscripción';
          this.cdr.markForCheck();
          this.saving = false;
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}




