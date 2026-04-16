import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SolicitudesDisponiblesService } from '../../services/solicitudes-disponibles.service';
import { ThemeService } from '@core/services/theme.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-solicitudes-disponibles',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
  ],
  template: `
    <div class="px-6 py-4">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span class="material-icons text-3xl">emergency_services_pending</span>
          Solicitudes de Emergencia Disponibles
        </h1>
        <p class="text-sm mt-2 text-gray-600 dark:text-slate-400">
          Selecciona una solicitud para analizar y postularte si deseas brindar atención
        </p>
      </div>

      <!-- Error Message -->
      <div *ngIf="error" class="p-4 rounded-lg mb-4 border flex items-center gap-3"
           [ngClass]="isDarkMode ? 'bg-red-900 border-red-700' : 'bg-red-100 border-red-400'">
        <span class="material-icons text-base" [ngClass]="isDarkMode ? 'text-red-300' : 'text-red-600'">
          error_outline
        </span>
        <span [ngClass]="isDarkMode ? 'text-red-200' : 'text-red-800'">{{ error }}</span>
      </div>

      <!-- Loading Spinner -->
      <div *ngIf="isLoading" class="flex justify-center items-center py-12">
        <div class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p class="text-gray-600 dark:text-slate-400">Cargando solicitudes...</p>
        </div>
      </div>

      <!-- Empty State -->
      <div *ngIf="!isLoading && solicitudes.length === 0"
           class="p-8 text-center rounded-lg border-2 border-dashed"
           [ngClass]="isDarkMode ? 'border-slate-600 bg-slate-800' : 'border-gray-300 bg-gray-50'">
        <div class="text-5xl mb-3">📬</div>
        <h3 class="text-lg font-semibold" [ngClass]="isDarkMode ? 'text-slate-300' : 'text-gray-700'">
          No hay solicitudes disponibles
        </h3>
        <p class="text-sm mt-2" [ngClass]="isDarkMode ? 'text-slate-400' : 'text-gray-600'">
          No existen solicitudes de emergencia compatibles con tus especialidades en este momento.
        </p>
        <p class="text-xs mt-3" [ngClass]="isDarkMode ? 'text-slate-500' : 'text-gray-500'">
          Intenta más tarde o actualiza tus especialidades y ubicación.
        </p>
      </div>

      <!-- Solicitudes Grid -->
      <div *ngIf="!isLoading && solicitudes.length > 0" class="grid gap-4 mb-6" style="grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));">
        <div *ngFor="let solicitud of solicitudes"
             class="rounded-lg shadow-md p-5 border transition-all hover:shadow-lg"
             [ngClass]="isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-200'">

          <!-- Header with Code and Urgency -->
          <div class="flex items-start justify-between mb-3">
            <div>
              <p class="text-xs font-medium mb-1" [ngClass]="isDarkMode ? 'text-slate-400' : 'text-gray-600'">Código</p>
              <h3 class="font-bold text-lg" [ngClass]="isDarkMode ? 'text-white' : 'text-gray-900'">
                {{ solicitud.codigo_solicitud }}
              </h3>
            </div>
            <span class="px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ml-2"
                  [ngClass]="getColorUrgencia(solicitud.nivel_urgencia) === 'warn'
                    ? (isDarkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800')
                    : (isDarkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800')">
              <span class="material-icons text-base align-middle mr-1" style="display: inline;">priority_high</span>
              {{ solicitud.nivel_urgencia }}
            </span>
          </div>

          <!-- Categoría -->
          <p class="text-sm font-medium mb-3" [ngClass]="isDarkMode ? 'text-slate-200' : 'text-gray-700'">
            {{ solicitud.categoria_incidente || 'Sin clasificar' }}
          </p>

          <!-- Distance Info -->
          <div class="flex items-center justify-between mb-4 p-2 rounded text-sm"
               [ngClass]="isDarkMode ? 'bg-slate-600' : 'bg-gray-100'">
            <span class="flex items-center gap-1" [ngClass]="isDarkMode ? 'text-slate-300' : 'text-gray-700'">
              <span class="material-icons text-base">location_on</span>
              Radio búsqueda
            </span>
            <span class="font-bold" [ngClass]="isDarkMode ? 'text-white' : 'text-gray-900'">
              {{ solicitud.radio_busqueda_km }} km
            </span>
          </div>

          <!-- Button -->
          <button (click)="verDetalle(solicitud.id_solicitud)"
                  class="w-full px-4 py-2 rounded-lg font-medium transition-all text-white flex items-center justify-center gap-2"
                  [ngClass]="isDarkMode
                    ? 'bg-purple-600 hover:bg-purple-700'
                    : 'bg-purple-500 hover:bg-purple-600'">
            <span class="material-icons text-base">visibility</span>
            Ver Detalle
          </button>
        </div>
      </div>

      <!-- Pagination -->
      <div *ngIf="!isLoading && solicitudes.length > 0" class="flex justify-between items-center mt-6">
        <button (click)="pageIndex = pageIndex - 1"
                [disabled]="pageIndex === 0"
                class="px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                [ngClass]="isDarkMode
                  ? 'hover:bg-slate-700 text-slate-300'
                  : 'hover:bg-gray-100 text-gray-700'">
          <span class="material-icons text-base align-middle mr-1" style="display: inline;">chevron_left</span>
          Anterior
        </button>
        <span class="text-sm" [ngClass]="isDarkMode ? 'text-slate-400' : 'text-gray-600'">
          Página {{ pageIndex + 1 }}
        </span>
        <button (click)="pageIndex = pageIndex + 1"
                class="px-4 py-2 rounded-lg transition-all"
                [ngClass]="isDarkMode
                  ? 'hover:bg-slate-700 text-slate-300'
                  : 'hover:bg-gray-100 text-gray-700'">
          Siguiente
          <span class="material-icons text-base align-middle ml-1" style="display: inline;">chevron_right</span>
        </button>
      </div>
    </div>
  `
})
export class SolicitudesDisponiblesComponent implements OnInit, OnDestroy {
  solicitudes: any[] = [];
  isLoading = false;
  error: string | null = null;
  isDarkMode = false;

  pageSize = 10;
  pageIndex = 0;
  totalItems = 0;

  private destroy$ = new Subject<void>();

  constructor(
    private solicitudesService: SolicitudesDisponiblesService,
    private router: Router,
    private themeService: ThemeService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Subscribe to theme changes
    this.themeService.darkMode$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isDark: boolean) => {
        this.isDarkMode = isDark;
      });

    this.cargarSolicitudes();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarSolicitudes(): void {
    this.isLoading = true;
    this.error = null;

    this.solicitudesService
      .listarSolicitudesDisponibles(
        this.pageIndex * this.pageSize,
        this.pageSize
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          // El backend retorna: { total_disponibles, cantidad_por_especialidad, solicitudes }
          // El frontend espera: { solicitudes, total }
          this.solicitudes = response.solicitudes || response.data?.solicitudes || [];
          this.totalItems = response.total_disponibles || response.total || 0;
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (err: any) => {
          this.error = 'Error al cargar solicitudes disponibles';
          console.error('Error in listarSolicitudesDisponibles:', err);
          this.isLoading = false;
          this.cdr.markForCheck();
        },
      });
  }

  onPageChange(): void {
    this.cargarSolicitudes();
  }

  verDetalle(solicitudId: string): void {
    this.router.navigate([
      '/emergency-requests',
      solicitudId,
    ]);
  }

  /**
   * Devuelve el color del chip según la urgencia
   */
  getColorUrgencia(urgencia: string): string {
    switch (urgencia) {
      case 'CRITICO':
        return 'warn';
      case 'ALTO':
        return 'accent';
      default:
        return '';
    }
  }
}
