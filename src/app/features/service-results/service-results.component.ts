import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AsignacionesService } from '../workshops/services/asignaciones.service';
import { ThemeService } from '@core/services/theme.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface Servicio {
  id: string;
  id_servicio?: string;
  id_taller_servicio?: string;
  nombre_servicio: string;
  descripcion?: string;
  realizado: boolean;
}

interface ResultadoServicio {
  id_resultado_servicio: string;
  id_asignacion: string;
  id_solicitud: string;
  id_taller_servicio?: string;
  diagnostico?: string;
  solucion_aplicada?: string;
  estado_resultado?: string;
  requiere_seguimiento?: boolean;
  observaciones?: string;
  fecha_registro?: string;
  taller_servicio?: {
    id_taller_servicio: string;
    nombre_servicio: string;
  };
}

interface Asignacion {
  id?: number;
  id_asignacion: string;
  id_solicitud: string;
  id_taller: string;
  estado_asignacion: string;
  fecha_asignacion: string;
  fecha_inicio_atencion?: string | null;
  fecha_fin_atencion?: string | null;
  motivo_cancelacion?: string | null;
  solicitud?: {
    id: number;
    id_solicitud?: string;
    codigo: string;
    codigo_solicitud?: string;
    categoria_incidente: string;
    nivel_urgencia: string;
    descripcion: string;
    descripcion_texto?: string;
    estado_actual?: string;
    ubicacion: { lat: number; long: number };
    radio_busqueda_km: number;
    latitud?: number;
    longitud?: number;
    cliente?: {
      id: number;
      nombre: string;
      email: string;
      telefono: string;
    };
    vehiculo?: {
      id: number;
      placa: string;
      marca: string;
      modelo: string;
      color: string;
    };
    fecha_creacion?: string;
  };
  taller?: {
    id_taller: string;
    nombre_taller: string;
    latitud?: number | null;
    longitud?: number | null;
  };
  servicios_realizados?: Servicio[];
  resultados?: ResultadoServicio[];
}

@Component({
  selector: 'app-service-results',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="px-6 py-4">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-3xl font-bold" [ngClass]="isDarkMode ? 'text-white' : 'text-gray-900'">
            Resultado del Servicio
          </h1>
          <p class="text-sm mt-1" [ngClass]="isDarkMode ? 'text-slate-400' : 'text-gray-600'">
            {{ asignaciones.length }} servicio{{ asignaciones.length !== 1 ? 's' : '' }} completado{{ asignaciones.length !== 1 ? 's' : '' }}
          </p>
        </div>
        <button (click)="onRefresh()"
                class="px-4 py-2 rounded-lg font-medium transition-all duration-300"
                [ngClass]="isDarkMode ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-green-500 hover:bg-green-600 text-white'">
          <span class="material-icons align-middle text-xl">refresh</span>
        </button>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="flex justify-center items-center py-12">
        <div class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p [ngClass]="isDarkMode ? 'text-slate-400' : 'text-gray-600'">Cargando resultados...</p>
        </div>
      </div>

      <!-- Error State -->
      <div *ngIf="error && !isLoading" class="p-4 rounded-lg mb-4"
           [ngClass]="isDarkMode ? 'bg-red-900 border border-red-700' : 'bg-red-100 border border-red-400'">
        <p [ngClass]="isDarkMode ? 'text-red-200' : 'text-red-800'">{{ error }}</p>
        <button (click)="onRefresh()" class="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm">
          Reintentar
        </button>
      </div>

      <!-- Empty State -->
      <div *ngIf="!isLoading && !error && asignaciones.length === 0"
           class="p-8 text-center rounded-lg border-2 border-dashed"
           [ngClass]="isDarkMode ? 'border-slate-600 bg-slate-800' : 'border-gray-300 bg-gray-50'">
        <div class="text-5xl mb-3">✅</div>
        <p class="text-lg font-semibold" [ngClass]="isDarkMode ? 'text-slate-300' : 'text-gray-700'">
          No hay servicios completados
        </p>
        <p class="text-sm mt-2" [ngClass]="isDarkMode ? 'text-slate-400' : 'text-gray-600'">
          Los servicios completados se mostrarán aquí
        </p>
      </div>

      <!-- Completed Services List -->
      <div *ngIf="!isLoading && !error && asignaciones.length > 0" class="space-y-4">
        <div *ngFor="let asignacion of asignaciones; let i = index"
             class="rounded-lg shadow-md p-6 border transition-all hover:shadow-lg"
             [ngClass]="isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-200'">

          <!-- Header -->
          <div class="flex items-start justify-between mb-4 pb-4 border-b" [ngClass]="isDarkMode ? 'border-slate-600' : 'border-gray-200'">
            <div class="flex-1">
              <p class="text-xs font-medium mb-1" [ngClass]="isDarkMode ? 'text-slate-400' : 'text-gray-600'">
                <span class="material-icons text-base align-middle">location_on</span>
                Emergencia {{ asignacion.solicitud?.codigo_solicitud || asignacion.solicitud?.codigo }}
              </p>
              <h3 class="font-bold text-xl" [ngClass]="isDarkMode ? 'text-white' : 'text-gray-900'">
                {{ asignacion.solicitud?.categoria_incidente || 'Sin categoría' }}
              </h3>
              <p *ngIf="asignacion.solicitud?.descripcion" class="text-xs mt-1" [ngClass]="isDarkMode ? 'text-slate-400' : 'text-gray-600'">
                {{ asignacion.solicitud?.descripcion }}
              </p>
            </div>
            <div class="flex gap-2 ml-2">
              <span class="px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap bg-green-600 text-white">
                ✅ ATENDIDA
              </span>
              <button (click)="toggleExpanded(i)"
                      type="button"
                      class="px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all"
                      [ngClass]="expandedRows[i]
                        ? (isDarkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white')
                        : (isDarkMode ? 'bg-gray-600 hover:bg-gray-700 text-white' : 'bg-gray-300 hover:bg-gray-400 text-gray-900')"
                      [title]="expandedRows[i] ? 'Ocultar detalles' : 'Mostrar detalles del servicio'">
                <span class="material-icons text-base align-middle mr-1">{{ expandedRows[i] ? 'unfold_less' : 'unfold_more' }}</span>
                {{ expandedRows[i] ? 'Ocultar Detalles' : 'Ver Detalles' }}
              </button>
            </div>
          </div>

          <!-- Client Information -->
          <div class="mb-4 p-3 rounded" [ngClass]="isDarkMode ? 'bg-slate-600' : 'bg-blue-50'">
            <p class="text-xs font-semibold mb-2" [ngClass]="isDarkMode ? 'text-slate-300' : 'text-blue-800'">
              Información del Cliente:
            </p>
            <div class="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span class="material-icons text-base mr-1 align-middle">person</span>
                <span [ngClass]="isDarkMode ? 'text-slate-200' : 'text-gray-700'">
                  {{ asignacion.solicitud?.cliente?.nombre || 'N/A' }}
                </span>
              </div>
              <div>
                <span class="material-icons text-base mr-1 align-middle">phone</span>
                <span [ngClass]="isDarkMode ? 'text-slate-200' : 'text-gray-700'">
                  {{ asignacion.solicitud?.cliente?.telefono || 'N/A' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Vehicle Information -->
          <div *ngIf="asignacion.solicitud?.vehiculo" class="mb-4 p-3 rounded" [ngClass]="isDarkMode ? 'bg-slate-600' : 'bg-green-50'">
            <p class="text-xs font-semibold mb-2" [ngClass]="isDarkMode ? 'text-slate-300' : 'text-green-800'">
              Información del Vehículo:
            </p>
            <div class="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span class="material-icons text-base mr-1 align-middle">directions_car</span>
                <span [ngClass]="isDarkMode ? 'text-slate-200' : 'text-gray-700'">
                  {{ asignacion.solicitud?.vehiculo?.placa || 'N/A' }}
                </span>
              </div>
              <div>
                <span class="material-icons text-base mr-1 align-middle">badge</span>
                <span [ngClass]="isDarkMode ? 'text-slate-200' : 'text-gray-700'">
                  {{ asignacion.solicitud?.vehiculo?.marca }} {{ asignacion.solicitud?.vehiculo?.modelo }}
                </span>
              </div>
              <div class="col-span-2">
                <span class="material-icons text-base mr-1 align-middle">palette</span>
                <span [ngClass]="isDarkMode ? 'text-slate-200' : 'text-gray-700'">
                  Color: {{ asignacion.solicitud?.vehiculo?.color || 'N/A' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Service Timeline -->
          <div class="mb-4 p-3 rounded" [ngClass]="isDarkMode ? 'bg-slate-600' : 'bg-gray-100'">
            <p class="text-xs font-semibold mb-3" [ngClass]="isDarkMode ? 'text-slate-300' : 'text-gray-700'">
              📅 Cronología:
            </p>
            <div class="space-y-2 text-sm">
              <div class="flex items-center gap-2">
                <span class="material-icons text-base text-blue-500">assignment</span>
                <span [ngClass]="isDarkMode ? 'text-slate-300' : 'text-gray-700'">
                  <strong>Asignada:</strong> {{ asignacion.fecha_asignacion | date: 'dd/MM/yyyy HH:mm' }}
                </span>
              </div>
              <div *ngIf="asignacion.fecha_inicio_atencion" class="flex items-center gap-2">
                <span class="material-icons text-base text-yellow-500">schedule</span>
                <span [ngClass]="isDarkMode ? 'text-slate-300' : 'text-gray-700'">
                  <strong>Inicio:</strong> {{ asignacion.fecha_inicio_atencion | date: 'dd/MM/yyyy HH:mm' }}
                </span>
              </div>
              <div *ngIf="asignacion.fecha_fin_atencion" class="flex items-center gap-2">
                <span class="material-icons text-base text-green-500">check_circle</span>
                <span [ngClass]="isDarkMode ? 'text-slate-300' : 'text-gray-700'">
                  <strong>Completada:</strong> {{ asignacion.fecha_fin_atencion | date: 'dd/MM/yyyy HH:mm' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Expandible Details Section -->
          <div *ngIf="expandedRows[i]" class="border-t" [ngClass]="isDarkMode ? 'border-slate-600' : 'border-gray-200'">
            <!-- Service Results -->
            <div *ngIf="asignacion.resultados && asignacion.resultados.length > 0" class="mt-4 space-y-3">
              <p class="text-sm font-bold mb-3" [ngClass]="isDarkMode ? 'text-green-400' : 'text-green-800'">
                ✅ Detalles del Servicio:
              </p>

              <div *ngFor="let resultado of asignacion.resultados"
                   class="p-4 rounded border-l-4 border-green-500"
                   [ngClass]="isDarkMode ? 'bg-slate-600' : 'bg-green-50'">

                <!-- Diagnostico -->
                <div *ngIf="resultado.diagnostico" class="mb-3">
                  <p class="text-xs font-semibold" [ngClass]="isDarkMode ? 'text-slate-300' : 'text-gray-700'">
                    🔍 Diagnóstico:
                  </p>
                  <p class="text-sm mt-1" [ngClass]="isDarkMode ? 'text-slate-200' : 'text-gray-700'">
                    {{ resultado.diagnostico }}
                  </p>
                </div>

                <!-- Solucion Aplicada -->
                <div *ngIf="resultado.solucion_aplicada" class="mb-3">
                  <p class="text-xs font-semibold" [ngClass]="isDarkMode ? 'text-slate-300' : 'text-gray-700'">
                    🛠️ Solución Aplicada:
                  </p>
                  <p class="text-sm mt-1" [ngClass]="isDarkMode ? 'text-slate-200' : 'text-gray-700'">
                    {{ resultado.solucion_aplicada }}
                  </p>
                </div>

                <!-- Estado Resultado -->
                <div *ngIf="resultado.estado_resultado" class="mb-3">
                  <p class="text-xs font-semibold" [ngClass]="isDarkMode ? 'text-slate-300' : 'text-gray-700'">
                    📊 Estado:
                  </p>
                  <span class="inline-block text-xs font-bold mt-1 px-2 py-1 rounded"
                        [ngClass]="getEstadoResultadoClass(resultado.estado_resultado)">
                    {{ resultado.estado_resultado }}
                  </span>
                </div>

                <!-- Requiere Seguimiento -->
                <div class="mb-3">
                  <p class="text-xs font-semibold" [ngClass]="isDarkMode ? 'text-slate-300' : 'text-gray-700'">
                    ⚠️ Requiere Seguimiento:
                  </p>
                  <span class="text-sm mt-1"
                        [ngClass]="resultado.requiere_seguimiento ? 'text-yellow-500 font-bold' : 'text-green-500'">
                    {{ resultado.requiere_seguimiento ? '✓ Sí' : '✗ No' }}
                  </span>
                </div>

                <!-- Observaciones -->
                <div *ngIf="resultado.observaciones">
                  <p class="text-xs font-semibold" [ngClass]="isDarkMode ? 'text-slate-300' : 'text-gray-700'">
                    📝 Observaciones:
                  </p>
                  <p class="text-sm mt-1" [ngClass]="isDarkMode ? 'text-slate-200' : 'text-gray-700'">
                    {{ resultado.observaciones }}
                  </p>
                </div>

                <!-- Fecha Registro -->
                <div *ngIf="resultado.fecha_registro" class="mt-3 pt-3 border-t" [ngClass]="isDarkMode ? 'border-slate-500' : 'border-gray-300'">
                  <p class="text-xs" [ngClass]="isDarkMode ? 'text-slate-400' : 'text-gray-600'">
                    <span class="material-icons text-base mr-1 align-middle">schedule</span>
                    Registrado: {{ resultado.fecha_registro | date: 'dd/MM/yyyy HH:mm' }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ServiceResultsComponent implements OnInit, OnDestroy {
  asignaciones: Asignacion[] = [];
  isLoading = true;
  error: string | null = null;
  isDarkMode = false;
  expandedRows: { [key: number]: boolean } = {};

  private destroy$ = new Subject<void>();

  constructor(
    private asignacionesService: AsignacionesService,
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

    this.cargarResultados();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarResultados(): void {
    this.isLoading = true;
    this.error = null;

    this.asignacionesService.obtenerAsignacionesActivas().subscribe({
      next: (data: any) => {
        // Obtener todas las asignaciones
        const todas = Array.isArray(data) ? data : (data?.data || []);

        // Filtrar solo las que están ATENDIDA
        this.asignaciones = todas.filter(
          (a: Asignacion) => a.solicitud?.estado_actual === 'ATENDIDA'
        );

        console.log('✅ Resultados cargados:', this.asignaciones);

        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error = 'Error al cargar resultados de servicios. Intenta de nuevo.';
        this.isLoading = false;
        console.error('❌ Error en cargarResultados:', err);
        this.cdr.markForCheck();
      }
    });
  }

  onRefresh(): void {
    this.cargarResultados();
  }

  toggleExpanded(index: number): void {
    this.expandedRows[index] = !this.expandedRows[index];
  }

  getEstadoResultadoClass(estado: string): string {
    const baseClasses = 'px-2 py-1 rounded text-white font-bold';

    if (!estado) return baseClasses + ' bg-gray-500';

    const estadoUpper = estado.toUpperCase();

    if (estadoUpper === 'COMPLETADO' || estadoUpper === 'COMPLETADA') {
      return baseClasses + ' bg-green-600';
    } else if (estadoUpper === 'PENDIENTE') {
      return baseClasses + ' bg-yellow-600';
    } else if (estadoUpper === 'CANCELADO' || estadoUpper === 'CANCELADA') {
      return baseClasses + ' bg-red-600';
    } else if (estadoUpper === 'EN_PROGRESO') {
      return baseClasses + ' bg-blue-600';
    }

    return baseClasses + ' bg-gray-500';
  }
}
