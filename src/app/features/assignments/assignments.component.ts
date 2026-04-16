import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AsignacionesService } from '../workshops/services/asignaciones.service';
import { ThemeService } from '@core/services/theme.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface Cliente {
  id: number;
  nombre: string;
  email: string;
  telefono: string;
}

interface Vehiculo {
  id: number;
  placa: string;
  marca: string;
  modelo: string;
  color: string;
}

interface Solicitud {
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
  cliente: Cliente;
  vehiculo?: Vehiculo;
  fecha_creacion?: string;
}

interface Servicio {
  id: string;
  id_servicio?: string;
  id_taller_servicio?: string;
  nombre_servicio: string;
  descripcion?: string;
  realizado: boolean;
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
  solicitud?: Solicitud;
  taller?: {
    id_taller: string;
    nombre_taller: string;
    latitud?: number | null;
    longitud?: number | null;
  };
  servicios_realizados?: Servicio[];
}

@Component({
  selector: 'app-assignments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="px-6 py-4">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-3xl font-bold" [ngClass]="isDarkMode ? 'text-white' : 'text-gray-900'">
            Atención Asignada
          </h1>
          <p class="text-sm mt-1" [ngClass]="isDarkMode ? 'text-slate-400' : 'text-gray-600'">
            {{ asignaciones.length }} asignación{{ asignaciones.length !== 1 ? 'es' : '' }} activa{{ asignaciones.length !== 1 ? 's' : '' }}
          </p>
        </div>
        <button (click)="onRefresh()"
                class="px-4 py-2 rounded-lg font-medium transition-all duration-300"
                [ngClass]="isDarkMode ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-purple-500 hover:bg-purple-600 text-white'">
          <span class="material-icons align-middle text-xl">refresh</span>
        </button>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="flex justify-center items-center py-12">
        <div class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p [ngClass]="isDarkMode ? 'text-slate-400' : 'text-gray-600'">Cargando asignaciones...</p>
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
      <div *ngIf="!isLoading && !error && asignacionesFiltradas.length === 0"
           class="p-8 text-center rounded-lg border-2 border-dashed"
           [ngClass]="isDarkMode ? 'border-slate-600 bg-slate-800' : 'border-gray-300 bg-gray-50'">
        <div class="text-5xl mb-3">📋</div>
        <p class="text-lg font-semibold" [ngClass]="isDarkMode ? 'text-slate-300' : 'text-gray-700'">
          No hay asignaciones activas
        </p>
        <p class="text-sm mt-2" [ngClass]="isDarkMode ? 'text-slate-400' : 'text-gray-600'">
          Aún no te han asignado emergencias
        </p>
      </div>

      <!-- Assignments List -->
      <div *ngIf="!isLoading && !error && asignacionesFiltradas.length > 0"
           class="space-y-4">
        <div *ngFor="let asignacion of asignacionesFiltradas; let i = index"
             class="rounded-lg shadow-md p-6 border transition-all hover:shadow-lg"
             [ngClass]="isDarkMode ?
               'bg-slate-700 border-slate-600' :
               'bg-white border-gray-200'">

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
            <span class="px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ml-2"
                  [ngClass]="getEstadoClasses(asignacion.solicitud?.estado_actual || 'TALLER_SELECCIONADO')">
              {{ formatearEstado(asignacion.solicitud?.estado_actual || 'TALLER_SELECCIONADO') }}
            </span>
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

          <!-- Emergency Details Grid -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <!-- Urgency -->
            <div class="p-2 rounded" [ngClass]="isDarkMode ? 'bg-slate-600' : 'bg-gray-100'">
              <p class="text-xs" [ngClass]="isDarkMode ? 'text-slate-400' : 'text-gray-600'">Urgencia</p>
              <p class="font-bold flex items-center" [ngClass]="isDarkMode ? 'text-white' : 'text-gray-900'">
                <span class="material-icons text-base mr-1" [ngClass]="getUrgenciaColor(asignacion.solicitud?.nivel_urgencia)">
                  warning
                </span>
                {{ asignacion.solicitud?.nivel_urgencia }}
              </p>
            </div>

            <!-- Distance -->
            <div class="p-2 rounded" [ngClass]="isDarkMode ? 'bg-slate-600' : 'bg-gray-100'">
              <p class="text-xs" [ngClass]="isDarkMode ? 'text-slate-400' : 'text-gray-600'">Radio búsqueda</p>
              <p class="font-bold flex items-center" [ngClass]="isDarkMode ? 'text-white' : 'text-gray-900'">
                <span class="material-icons text-base mr-1">my_location</span>
                {{ asignacion.solicitud?.radio_busqueda_km }} km
              </p>
            </div>

            <!-- Assignment Date -->
            <div class="p-2 rounded" [ngClass]="isDarkMode ? 'bg-slate-600' : 'bg-gray-100'">
              <p class="text-xs" [ngClass]="isDarkMode ? 'text-slate-400' : 'text-gray-600'">Asignada</p>
              <p class="font-bold text-sm" [ngClass]="isDarkMode ? 'text-white' : 'text-gray-900'">
                {{ asignacion.fecha_asignacion | date: 'short' }}
              </p>
            </div>
          </div>

          <!-- Description -->
          <div class="mb-4 p-3 rounded" [ngClass]="isDarkMode ? 'bg-slate-600' : 'bg-gray-100'">
            <p class="text-xs font-semibold mb-2" [ngClass]="isDarkMode ? 'text-slate-300' : 'text-gray-700'">
              Descripción:
            </p>
            <p class="text-sm" [ngClass]="isDarkMode ? 'text-slate-200' : 'text-gray-700'">
              {{ asignacion.solicitud?.descripcion_texto || 'Sin descripción' }}
            </p>
          </div>



          <!-- Previously Completed Services Section -->
          <div *ngIf="serviciosRealizados[i] && serviciosRealizados[i].length > 0"
               class="mt-4 p-4 rounded border-2"
               [ngClass]="isDarkMode ? 'border-amber-600 bg-amber-900 bg-opacity-20' : 'border-amber-200 bg-amber-50'">
            <p class="text-sm font-bold mb-3" [ngClass]="isDarkMode ? 'text-amber-300' : 'text-amber-800'">
              ✅ Servicios Ya Realizados:
            </p>

            <div class="space-y-2">
              <div *ngFor="let servicio of serviciosRealizados[i]"
                   class="p-3 rounded border"
                   [ngClass]="isDarkMode ? 'border-slate-500 bg-slate-700' : 'border-gray-200 bg-gray-50'">

                <div class="flex items-center justify-between mb-2">
                  <span class="text-sm font-semibold" [ngClass]="isDarkMode ? 'text-green-300' : 'text-green-700'">
                    <span class="material-icons text-base align-middle mr-1">check_circle</span>
                    Servicio Completado
                  </span>
                  <span class="text-xs px-2 py-1 rounded" [ngClass]="isDarkMode ? 'bg-green-800 text-green-200' : 'bg-green-100 text-green-800'">
                    {{ servicio.estado_resultado }}
                  </span>
                </div>

                <div *ngIf="servicio.diagnostico" class="mb-2 pb-2 border-b" [ngClass]="isDarkMode ? 'border-slate-600' : 'border-gray-200'">
                  <p class="text-xs font-medium" [ngClass]="isDarkMode ? 'text-slate-400' : 'text-gray-600'">Diagnóstico:</p>
                  <p class="text-sm mt-1" [ngClass]="isDarkMode ? 'text-slate-200' : 'text-gray-700'">{{ servicio.diagnostico }}</p>
                </div>

                <div *ngIf="servicio.solucion_aplicada" class="mb-2 pb-2 border-b" [ngClass]="isDarkMode ? 'border-slate-600' : 'border-gray-200'">
                  <p class="text-xs font-medium" [ngClass]="isDarkMode ? 'text-slate-400' : 'text-gray-600'">Solución Aplicada:</p>
                  <p class="text-sm mt-1" [ngClass]="isDarkMode ? 'text-slate-200' : 'text-gray-700'">{{ servicio.solucion_aplicada }}</p>
                </div>

                <div *ngIf="servicio.observaciones" class="mb-2 pb-2 border-b" [ngClass]="isDarkMode ? 'border-slate-600' : 'border-gray-200'">
                  <p class="text-xs font-medium" [ngClass]="isDarkMode ? 'text-slate-400' : 'text-gray-600'">Observaciones:</p>
                  <p class="text-sm mt-1" [ngClass]="isDarkMode ? 'text-slate-200' : 'text-gray-700'">{{ servicio.observaciones }}</p>
                </div>

                <div class="flex items-center justify-between text-xs">
                  <span *ngIf="servicio.requiere_seguimiento" class="text-blue-600 dark:text-blue-300">
                    <span class="material-icons text-sm align-middle mr-1" style="display: inline;">info</span>
                    Requiere seguimiento
                  </span>
                  <span [ngClass]="isDarkMode ? 'text-slate-400' : 'text-gray-500'">
                    {{ servicio.fecha_registro | date:'short' }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Services Completed Section (only show if NOT ATENDIDA) -->
          <div *ngIf="asignacion.solicitud?.estado_actual !== 'ATENDIDA'" class="mt-4 p-4 rounded border-2" [ngClass]="isDarkMode ? 'border-green-600 bg-green-900 bg-opacity-30' : 'border-green-200 bg-green-50'">
            <p class="text-sm font-bold mb-3" [ngClass]="isDarkMode ? 'text-green-300' : 'text-green-800'">
              Servicios Realizados (según tu catálogo):
            </p>

            <div *ngIf="!serviciosCargados[i]" class="text-center py-2">
              <p class="text-xs" [ngClass]="isDarkMode ? 'text-slate-400' : 'text-gray-600'">Cargando servicios...</p>
            </div>

            <div *ngIf="serviciosCargados[i]" class="space-y-2">
              <div *ngIf="serviciosPorAsignacion[i]?.length === 0" class="text-sm" [ngClass]="isDarkMode ? 'text-slate-400' : 'text-gray-600'">
                No tienes servicios registrados.
              </div>

              <div *ngFor="let servicio of serviciosPorAsignacion[i]; let j = index" class="mb-3 p-3 rounded border" [ngClass]="isDarkMode ? 'border-slate-500 bg-slate-700' : 'border-gray-200 bg-gray-50'">
                <div class="flex items-center mb-2">
                  <input type="checkbox"
                         [(ngModel)]="servicio.realizado"
                         [id]="'servicio_' + i + '_' + j"
                         class="w-4 h-4">
                  <label [for]="'servicio_' + i + '_' + j" class="ml-2 text-sm cursor-pointer flex-1 font-medium" [ngClass]="isDarkMode ? 'text-slate-200' : 'text-gray-900'">
                    {{ servicio.nombre_servicio }}
                  </label>
                  <span *ngIf="servicio.realizado" class="material-icons text-green-500 text-sm">check_circle</span>
                </div>

                <!-- Resultado Servicio Form -->
                <div *ngIf="servicio.realizado" class="mt-2 pt-2 border-t" [ngClass]="isDarkMode ? 'border-slate-600' : 'border-gray-200'">
                  <p class="text-xs font-semibold mb-3" [ngClass]="isDarkMode ? 'text-slate-300' : 'text-gray-700'">Registrar Resultado:</p>

  <!-- Diagnóstico (Auto-filled with service name) -->
                  <div class="mb-2 p-2 rounded" [ngClass]="isDarkMode ? 'bg-slate-600' : 'bg-gray-100'">
                    <label class="text-xs font-medium" [ngClass]="isDarkMode ? 'text-slate-300' : 'text-gray-700'">
                      Servicio
                    </label>
                    <p class="text-sm mt-1 font-semibold" [ngClass]="isDarkMode ? 'text-white' : 'text-gray-900'">
                      {{ servicio.nombre_servicio }}
                    </p>
                  </div>

                  <!-- Solución Aplicada -->
                  <div class="mb-2">
                    <label class="text-xs font-medium" [ngClass]="isDarkMode ? 'text-slate-300' : 'text-gray-700'">
                      Solución Aplicada (qué se hizo para solucionarlo)
                    </label>
                    <textarea placeholder="Describe la solución implementada..."
                              [(ngModel)]="solucionResultado[i + '_' + j]"
                              rows="2"
                              class="w-full p-2 rounded border text-xs resize-none mt-1"
                              [ngClass]="isDarkMode ?
                                'bg-slate-600 border-slate-500 text-white placeholder-slate-400' :
                                'bg-white border-gray-300 text-gray-900 placeholder-gray-500'"></textarea>
                  </div>

                  <!-- Requiere Seguimiento -->
                  <div class="mb-2 flex items-center">
                    <input type="checkbox"
                           [(ngModel)]="requiereSeguimiento[i + '_' + j]"
                           [id]="'seguimiento_' + i + '_' + j"
                           class="w-4 h-4">
                    <label [for]="'seguimiento_' + i + '_' + j" class="ml-2 text-xs cursor-pointer" [ngClass]="isDarkMode ? 'text-slate-300' : 'text-gray-700'">
                      ¿Requiere seguimiento posterior?
                    </label>
                  </div>

                  <!-- Observaciones -->
                  <div>
                    <label class="text-xs font-medium" [ngClass]="isDarkMode ? 'text-slate-300' : 'text-gray-700'">
                      Observaciones (opcional)
                    </label>
                    <textarea placeholder="Notas o comentarios adicionales..."
                              [(ngModel)]="observacionesResultado[i + '_' + j]"
                              rows="2"
                              class="w-full p-2 rounded border text-xs resize-none mt-1"
                              [ngClass]="isDarkMode ?
                                'bg-slate-600 border-slate-500 text-white placeholder-slate-400' :
                                'bg-white border-gray-300 text-gray-900 placeholder-gray-500'"></textarea>
                  </div>
                </div>
              </div>

              <div *ngIf="hayServiciosRealizados(i)">
                <button (click)="guardarServiciosRealizados(asignacion.id_asignacion, i)"
                        class="w-full px-4 py-2 rounded-lg font-medium transition-all duration-300 mt-3"
                        [ngClass]="isDarkMode ?
                          'bg-blue-600 hover:bg-blue-700 text-white' :
                          'bg-blue-500 hover:bg-blue-600 text-white'">
                  <span class="material-icons text-base align-middle mr-1">save</span>
                  Guardar Resultado de Servicios
                </button>
              </div>

              <!-- Finalizar Asignación Button (only show if NOT ATENDIDA) -->
              <button *ngIf="asignacion.solicitud?.estado_actual !== 'ATENDIDA'"
                      (click)="finalizarAsignacion(asignacion.id_asignacion, i)"
                      class="w-full px-4 py-2 rounded-lg font-medium transition-all duration-300 mt-3"
                      [ngClass]="isDarkMode ?
                        'bg-purple-600 hover:bg-purple-700 text-white' :
                        'bg-purple-500 hover:bg-purple-600 text-white'">
                <span class="material-icons text-base align-middle mr-1">check_circle</span>
                Finalizar Asignación
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div *ngIf="mostrarModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-sm mx-auto shadow-lg" [ngClass]="isDarkMode ? 'bg-slate-800' : 'bg-white'">
        <div class="flex items-center mb-4">
          <span class="material-icons text-lg mr-2" [ngClass]="tipoMensaje === 'exito' ? 'text-green-500' : tipoMensaje === 'error' ? 'text-red-500' : 'text-blue-500'">
            {{ tipoMensaje === 'exito' ? 'check_circle' : tipoMensaje === 'error' ? 'error' : 'info' }}
          </span>
          <h3 class="text-lg font-bold" [ngClass]="isDarkMode ? 'text-white' : 'text-gray-900'">
            {{ tipoMensaje === 'exito' ? 'Éxito' : tipoMensaje === 'error' ? 'Error' : 'Información' }}
          </h3>
        </div>
        <p class="mb-6" [ngClass]="isDarkMode ? 'text-slate-300' : 'text-gray-700'">
          {{ mensajeModal }}
        </p>
        <button (click)="cerrarModal()"
                class="w-full px-4 py-2 rounded-lg font-medium transition-all duration-300"
                [ngClass]="isDarkMode ?
                  'bg-blue-600 hover:bg-blue-700 text-white' :
                  'bg-blue-500 hover:bg-blue-600 text-white'">
          Aceptar
        </button>
      </div>
    </div>
  `,
  styles: [`
    .material-icons {
      font-family: 'Material Icons';
      font-weight: normal;
      font-style: normal;
      font-size: 24px;
      display: inline-flex;
      line-height: 1;
      text-transform: none;
      letter-spacing: normal;
      word-wrap: normal;
      white-space: nowrap;
      direction: ltr;
    }

    @media (prefers-color-scheme: dark) {
      :host {
        --card-bg: rgb(55, 65, 81);
        --text-primary: rgb(255, 255, 255);
        --text-secondary: rgb(148, 163, 184);
        --border-color: rgb(51, 65, 85);
      }
    }

    @media (prefers-color-scheme: light) {
      :host {
        --card-bg: rgb(255, 255, 255);
        --text-primary: rgb(17, 24, 39);
        --text-secondary: rgb(107, 114, 128);
        --border-color: rgb(229, 231, 235);
      }
    }
  `]
})
export class AssignmentsComponent implements OnInit, OnDestroy {
  asignaciones: Asignacion[] = [];
  asignacionesFiltradas: Asignacion[] = [];
  isLoading = true;
  error: string | null = null;
  isDarkMode = false;
  actualizando = false;

  // State management for each assignment
  estadoActualizar: { [key: number]: string } = {};
  informacionAdicional: { [key: number]: string } = {};
  exitoActualizacion: { [key: number]: boolean } = {};
  serviciosCargados: { [key: number]: boolean } = {};
  serviciosPorAsignacion: { [key: number]: Servicio[] | undefined } = {};
  serviciosRealizados: { [key: number]: any[] } = {};
  observacionesResultado: { [key: string]: string } = {};
  solucionResultado: { [key: string]: string } = {};
  requiereSeguimiento: { [key: string]: boolean } = {};

  // Modal properties
  mostrarModal = false;
  mensajeModal = '';
  tipoMensaje: 'exito' | 'error' | 'info' = 'info';

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

    this.cargarAsignaciones();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarAsignaciones(): void {
    this.isLoading = true;
    this.error = null;

    this.asignacionesService.obtenerAsignacionesActivas().subscribe({
      next: (data: any) => {
        // Seguir patrón de Postulaciones: data viene directo o en data.data
        this.asignaciones = Array.isArray(data) ? data : (data?.data || []);

        console.log('✅ Asignaciones cargadas:', this.asignaciones);

        if (!this.asignaciones || this.asignaciones.length === 0) {
          this.isLoading = false;
          this.aplicarFiltro();
          this.cdr.markForCheck();
          return;
        }

        // Cargar servicios automáticamente para cada asignación
        this.asignaciones.forEach((_, index) => {
          this.cargarServiciosTaller(index);
          this.cargarServiciosRealizados(index);
        });

        this.aplicarFiltro();
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error = 'Error al cargar asignaciones. Intenta de nuevo.';
        this.isLoading = false;
        console.error('❌ Error en cargarAsignaciones:', err);
        this.cdr.markForCheck();
      }
    });
  }

  cargarDatosSolicitud(index: number): void {
    // Ya no es necesario - toda la información viene del endpoint /activas
    // Este método se mantiene por compatibilidad, pero no se usa
  }

  cargarServiciosTaller(index: number): void {
    const asignacion = this.asignaciones[index];
    const asignacionId = asignacion.id_asignacion as string;

    // Solo cargar servicios cuando sea necesario (cuando el usuario lo solicite)
    this.asignacionesService.obtenerServiciosTaller(asignacionId).subscribe({
      next: (servicios: any[]) => {
        // Convertir a array mutable con realizado=false
        this.serviciosPorAsignacion[index] = servicios.map(s => ({
          id: s.id_taller_servicio || s.id_servicio,
          id_servicio: s.id_servicio,
          id_taller_servicio: s.id_taller_servicio,
          nombre_servicio: s.nombre_servicio || s.nombre,
          descripcion: s.descripcion,
          realizado: false
        }));
        this.serviciosCargados[index] = true;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.warn(`Servicios no disponibles para asignación ${index}:`, err);
        this.serviciosPorAsignacion[index] = [];
        this.serviciosCargados[index] = true;
      }
    });
  }

  cargarServiciosRealizados(index: number): void {
    const asignacion = this.asignaciones[index];
    const asignacionId = asignacion.id_asignacion as string;

    this.asignacionesService.obtenerServiciosRealizados(asignacionId).subscribe({
      next: (servicios: any[]) => {
        this.serviciosRealizados[index] = servicios || [];
        console.log(`✅ Servicios realizados cargados para asignación ${index}:`, servicios);
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.warn(`No hay servicios realizados para asignación ${index}:`, err);
        this.serviciosRealizados[index] = [];
      }
    });
  }

  guardarServiciosRealizados(asignacionId: string | number, index: number): void {
    const serviciosRealizados = this.serviciosPorAsignacion[index]
      ?.map((s, j) => ({
        id_taller_servicio: s.id_taller_servicio || s.id,
        realizado: s.realizado,
        diagnostico: s.nombre_servicio,
        solucion_aplicada: this.solucionResultado[index + '_' + j] || '',
        observaciones: this.observacionesResultado[index + '_' + j] || '',
        requiere_seguimiento: this.requiereSeguimiento[index + '_' + j] || false
      }))
      ?.filter(s => s.realizado) || [];

    if (serviciosRealizados.length === 0) {
      alert('Por favor selecciona al menos un servicio realizado');
      return;
    }

    this.asignacionesService.guardarServiciosRealizados(asignacionId, serviciosRealizados)
      .subscribe({
        next: () => {
          this.mensajeModal = `Se registraron ${serviciosRealizados.length} servicio(s) realizado(s)`;
          this.tipoMensaje = 'exito';
          this.mostrarModal = true;
          // Limpiar todos los datos del formulario
          Object.keys(this.observacionesResultado).forEach(key => {
            if (key.startsWith(index + '_')) {
              delete this.observacionesResultado[key];
            }
          });
          Object.keys(this.solucionResultado).forEach(key => {
            if (key.startsWith(index + '_')) {
              delete this.solucionResultado[key];
            }
          });
          Object.keys(this.requiereSeguimiento).forEach(key => {
            if (key.startsWith(index + '_')) {
              delete this.requiereSeguimiento[key];
            }
          });
          // Recargar servicios
          this.cargarServiciosTaller(index);
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error guardando servicios:', err);
          this.mensajeModal = 'Error al guardar los servicios realizados';
          this.tipoMensaje = 'error';
          this.mostrarModal = true;
        }
      });
  }

  hayServiciosRealizados(index: number): boolean {
    return (this.serviciosPorAsignacion[index] || []).some(s => s.realizado);
  }

  finalizarAsignacion(asignacionId: string | number, index: number): void {
    const asignacion = this.asignaciones[index];

    this.asignacionesService.actualizarEstadoAtencion(
      asignacionId,
      'ATENDIDA',
      undefined
    ).subscribe({
      next: () => {
        // Actualizar estado local
        if (asignacion.solicitud) {
          asignacion.solicitud.estado_actual = 'ATENDIDA';
        }
        this.mensajeModal = '✓ Asignación finalizada exitosamente';
        this.tipoMensaje = 'exito';
        this.mostrarModal = true;

        // Recargar asignaciones después de 2 segundos
        setTimeout(() => {
          this.cargarAsignaciones();
        }, 2000);
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error finalizando asignación:', err);
        this.mensajeModal = 'Error al finalizar la asignación';
        this.tipoMensaje = 'error';
        this.mostrarModal = true;
      }
    });
  }

  cerrarModal(): void {
    this.mostrarModal = false;
  }

  filterByState(estado: string): void {
    // Método removido: las asignaciones se filtran automáticamente
  }

  aplicarFiltro(): void {
    // Filtrar automáticamente: mostrar solo asignaciones que NO sean ATENDIDA
    // Las ATENDIDA aparecen en "Resultado del Servicio"
    this.asignacionesFiltradas = this.asignaciones.filter(
      a => a.solicitud?.estado_actual !== 'ATENDIDA'
    );
  }

  getProximosEstados(estadoActual: string): string[] {
    const transiciones: { [key: string]: string[] } = {
      'TALLER_SELECCIONADO': ['EN_CAMINO', 'CANCELADA'],
      'EN_CAMINO': ['EN_PROCESO', 'CANCELADA'],
      'EN_PROCESO': ['ATENDIDA', 'CANCELADA'],
      'ATENDIDA': ['CANCELADA'],
      'CANCELADA': []
    };
    return transiciones[estadoActual] || [];
  }

  actualizarEstado(asignacionId: string | number | undefined, index: number): void {
    if (!asignacionId) {
      this.error = 'ID de asignación inválido';
      return;
    }

    if (!this.estadoActualizar[index]) {
      this.error = 'Por favor selecciona un estado';
      return;
    }

    this.actualizando = true;
    this.asignacionesService.actualizarEstadoAtencion(
      asignacionId as number,
      this.estadoActualizar[index],
      this.informacionAdicional[index] ? { nota: this.informacionAdicional[index] } : undefined
    ).subscribe({
      next: () => {
        this.exitoActualizacion[index] = true;
        // Reload asignaciones
        setTimeout(() => {
          this.cargarAsignaciones();
          this.exitoActualizacion[index] = false;
        }, 2000);
        this.actualizando = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error = 'Error al actualizar estado';
        console.error(err);
        this.actualizando = false;
        this.cdr.markForCheck();
      }
    });
  }

  cancelarActualizacion(index: number): void {
    this.estadoActualizar[index] = '';
    this.informacionAdicional[index] = '';
  }

  onEstadoChange(index: number): void {
    // Se ejecuta cuando cambiar el progreso editablelpara actualizar el estado directamente
    const nuevoEstado = this.estadoActualizar[index];
    if (!nuevoEstado) return;

    const asignacion = this.asignaciones[index];
    this.actualizando = true;

    this.asignacionesService.actualizarEstadoAtencion(
      asignacion.id_asignacion,
      nuevoEstado,
      undefined
    ).subscribe({
      next: () => {
        // Actualizar el estado en el objeto local
        if (asignacion.solicitud) {
          asignacion.solicitud.estado_actual = nuevoEstado;
        }

        // Si llegó a ATENDIDA, cargar servicios
        if (nuevoEstado === 'ATENDIDA') {
          this.cargarServiciosTaller(index);
        }

        this.exitoActualizacion[index] = true;
        setTimeout(() => {
          this.exitoActualizacion[index] = false;
        }, 2000);

        this.actualizando = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error = 'Error al actualizar progreso';
        console.error(err);
        this.estadoActualizar[index] = ''; // Revertir
        this.actualizando = false;
        this.cdr.markForCheck();
      }
    });
  }

  onRefresh(): void {
    this.cargarAsignaciones();
  }

  formatearEstado(estado: string): string {
    const estados: { [key: string]: string } = {
      'REGISTRADA': 'Registrada',
      'EN_BUSQUEDA': 'En Búsqueda',
      'EN_ESPERA_RESPUESTAS': 'En Espera de Respuestas',
      'TALLER_SELECCIONADO': 'Taller Seleccionado',
      'EN_CAMINO': 'En Camino',
      'EN_PROCESO': 'En Proceso',
      'ATENDIDA': 'Atendida',
      'CANCELADA': 'Cancelada'
    };
    return estados[estado] || estado;
  }

  getProgressoEstado(estado: string): string {
    const progreso: { [key: string]: string } = {
      'REGISTRADA': '0%',
      'EN_BUSQUEDA': '20%',
      'EN_ESPERA_RESPUESTAS': '40%',
      'TALLER_SELECCIONADO': '50%',
      'EN_CAMINO': '60%',
      'EN_PROCESO': '80%',
      'ATENDIDA': '100%',
      'CANCELADA': 'Cancelada'
    };
    return progreso[estado] || 'Desconocido';
  }

  getEstadoClasses(estado: string): string {
    const base = 'px-3 py-1 rounded-full text-xs font-bold';
    switch (estado) {
      case 'REGISTRADA':
      case 'EN_BUSQUEDA':
      case 'EN_ESPERA_RESPUESTAS':
        return `${base} ${this.isDarkMode ? 'bg-gray-600 text-gray-200' : 'bg-gray-100 text-gray-800'}`;
      case 'TALLER_SELECCIONADO':
        return `${base} ${this.isDarkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'}`;
      case 'EN_CAMINO':
        return `${base} ${this.isDarkMode ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800'}`;
      case 'EN_PROCESO':
        return `${base} ${this.isDarkMode ? 'bg-orange-900 text-orange-200' : 'bg-orange-100 text-orange-800'}`;
      case 'ATENDIDA':
        return `${base} ${this.isDarkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'}`;
      case 'CANCELADA':
        return `${base} ${this.isDarkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'}`;
      default:
        return `${base} ${this.isDarkMode ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-800'}`;
    }
  }

  getUrgenciaColor(urgencia?: string): string {
    switch (urgencia) {
      case 'CRITICO':
        return 'text-red-500';
      case 'ALTO':
        return 'text-orange-500';
      case 'MEDIO':
        return 'text-yellow-500';
      case 'BAJO':
        return 'text-green-500';
      default:
        return 'text-gray-500';
    }
  }

  getCategoriaNombre(categoria?: string): string {
    const categorias: { [key: string]: string } = {
      'MECANICO': 'Problema Mecánico',
      'ELECTRICO': 'Problema Eléctrico',
      'ESTRUCTURAL': 'Daño Estructural',
      'OTRO': 'Otro'
    };
    return categorias[categoria || ''] || categoria || 'Sin categoría';
  }
}
