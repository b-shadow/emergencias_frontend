import { Component, OnInit, ChangeDetectorRef, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SolicitudesDisponiblesService } from '@modules/assignment-attention/services/solicitudes-disponibles.service';
import { PostulacionesService } from '@modules/assignment-attention/services/postulaciones.service';
import { ThemeService } from '@core/services/theme.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

declare var maplibregl: any;

interface Cliente {
  id: number;
  nombre: string;
  email: string;
  telefono: string;
}

interface Solicitud {
  id: number;
  codigo: string;
  categoria_incidente: string;
  nivel_urgencia: string;
  descripcion: string;
  ubicacion: { lat: number; long: number };
  radio_busqueda_km: number;
  especialidades_requeridas: string[];
  servicios_requeridos: string[];
  cliente?: Cliente;
  vehiculo?: Vehiculo;
  estado_actual?: string;
  fecha_creacion?: string;
  evidencias?: Evidencia[];
}

interface Vehiculo {
  placa: string | null;
  marca: string | null;
  modelo: string | null;
  color: string | null;
}

interface Evidencia {
  id_evidencia?: string;
  tipo_evidencia: string;
  url_archivo: string;
  nombre_archivo?: string | null;
  descripcion?: string | null;
  fecha_subida?: string;
}

@Component({
  selector: 'app-solicitud-detalle',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="px-6 py-4">
      <!-- Back Button -->
      <button (click)="goBack()"
              class="mb-4 px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2"
              [ngClass]="isDarkMode ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700'">
        <span class="material-icons text-base">arrow_back</span>
        Volver
      </button>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="flex justify-center items-center py-12">
        <div class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p [ngClass]="isDarkMode ? 'text-slate-400' : 'text-gray-600'">Cargando detalles...</p>
        </div>
      </div>

      <!-- Error State -->
      <div *ngIf="error && !isLoading" class="p-4 rounded-lg mb-4"
           [ngClass]="isDarkMode ? 'bg-red-900 border border-red-700' : 'bg-red-100 border border-red-400'">
        <p [ngClass]="isDarkMode ? 'text-red-200' : 'text-red-800'">{{ error }}</p>
        <button (click)="cargarDetalles()" class="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm">
          Reintentar
        </button>
      </div>

      <!-- Content -->
      <div *ngIf="!isLoading && !error && solicitud" class="space-y-4">
        <!-- Header Card -->
        <div class="rounded-lg shadow-md p-6 border"
             [ngClass]="isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-200'">
          <div class="flex items-start justify-between mb-4">
            <div class="flex-1">
              <p class="text-sm font-medium mb-1" [ngClass]="isDarkMode ? 'text-slate-400' : 'text-gray-600'">
                Código de Solicitud
              </p>
              <h1 class="text-3xl font-bold" [ngClass]="isDarkMode ? 'text-white' : 'text-gray-900'">
                {{ solicitud.codigo }}
              </h1>
            </div>
            <div class="text-right">
              <span class="px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap"
                    [ngClass]="getEstadoClasses(solicitud.estado_actual)">
                {{ solicitud.estado_actual }}
              </span>
            </div>
          </div>

          <!-- Quick Info Grid -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            <!-- Urgency -->
            <div class="p-3 rounded" [ngClass]="isDarkMode ? 'bg-slate-600' : 'bg-gray-100'">
              <p class="text-xs" [ngClass]="isDarkMode ? 'text-slate-400' : 'text-gray-600'">Urgencia</p>
              <p class="font-bold flex items-center mt-1" [ngClass]="isDarkMode ? 'text-white' : 'text-gray-900'">
                <span class="material-icons text-base mr-1" [ngClass]="getUrgenciaColor(solicitud.nivel_urgencia)">
                  warning
                </span>
                {{ solicitud.nivel_urgencia }}
              </p>
            </div>

            <!-- Distance -->
            <div class="p-3 rounded" [ngClass]="isDarkMode ? 'bg-slate-600' : 'bg-gray-100'">
              <p class="text-xs" [ngClass]="isDarkMode ? 'text-slate-400' : 'text-gray-600'">Radio de búsqueda</p>
              <p class="font-bold flex items-center mt-1" [ngClass]="isDarkMode ? 'text-white' : 'text-gray-900'">
                <span class="material-icons text-base mr-1">my_location</span>
                {{ solicitud.radio_busqueda_km }} km
              </p>
            </div>

            <!-- Category -->
            <div class="p-3 rounded" [ngClass]="isDarkMode ? 'bg-slate-600' : 'bg-gray-100'">
              <p class="text-xs" [ngClass]="isDarkMode ? 'text-slate-400' : 'text-gray-600'">Categoría</p>
              <p class="font-bold text-sm mt-1" [ngClass]="isDarkMode ? 'text-white' : 'text-gray-900'">
                {{ getCategoriaNombre(solicitud.categoria_incidente) }}
              </p>
            </div>

            <!-- Date -->
            <div class="p-3 rounded" [ngClass]="isDarkMode ? 'bg-slate-600' : 'bg-gray-100'">
              <p class="text-xs" [ngClass]="isDarkMode ? 'text-slate-400' : 'text-gray-600'">Fecha</p>
              <p class="font-bold text-sm mt-1" [ngClass]="isDarkMode ? 'text-white' : 'text-gray-900'">
                {{ solicitud.fecha_creacion | date: 'dd/M/yyyy HH:mm' }}
              </p>
            </div>
          </div>
        </div>

        <!-- Description Section -->
        <div class="rounded-lg shadow-md p-6 border"
             [ngClass]="isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-200'">
          <h2 class="text-xl font-bold mb-3" [ngClass]="isDarkMode ? 'text-white' : 'text-gray-900'">
            <span class="material-icons text-base mr-2 align-middle">description</span>
            Descripción
          </h2>
          <p class="text-base leading-relaxed" [ngClass]="isDarkMode ? 'text-slate-300' : 'text-gray-700'">
            {{ solicitud.descripcion }}
          </p>
        </div>

        <!-- Evidence Section -->
        <div class="rounded-lg shadow-md p-6 border"
             [ngClass]="isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-200'">
          <h2 class="text-lg font-bold mb-4" [ngClass]="isDarkMode ? 'text-white' : 'text-gray-900'">
            <span class="material-icons text-base mr-2 align-middle">image</span>
            Evidencias Adjuntas
          </h2>

          <div *ngIf="evidenciasImagen.length > 0; else sinEvidencias" class="space-y-3">
            <a *ngFor="let evidencia of evidenciasImagen"
               [href]="evidencia.url_archivo"
               target="_blank"
               rel="noopener noreferrer"
               class="block rounded-lg border p-2 transition-all hover:shadow-lg"
               [ngClass]="isDarkMode ? 'border-slate-500 bg-slate-600' : 'border-gray-200 bg-gray-50'">
              <img [src]="evidencia.url_archivo"
                   [alt]="evidencia.nombre_archivo || 'Evidencia'"
                   class="w-full max-h-[70vh] object-contain rounded-md">
            </a>
          </div>

          <ng-template #sinEvidencias>
            <p class="text-sm" [ngClass]="isDarkMode ? 'text-slate-400' : 'text-gray-600'">
              Esta solicitud no tiene imágenes adjuntas.
            </p>
          </ng-template>
        </div>

        <!-- Requirements Grid -->
        <div class="grid md:grid-cols-2 gap-4">
          <!-- Especialidades -->
          <div class="rounded-lg shadow-md p-6 border"
               [ngClass]="isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-200'">
            <h2 class="text-lg font-bold mb-3" [ngClass]="isDarkMode ? 'text-white' : 'text-gray-900'">
              <span class="material-icons text-base mr-2 align-middle">build</span>
              Especialidades Requeridas
            </h2>
            <div class="flex flex-wrap gap-2">
              <span *ngFor="let esp of solicitud && solicitud.especialidades_requeridas || []"
                    class="px-3 py-1 rounded-full text-sm font-medium"
                    [ngClass]="isDarkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'">
                {{ esp }}
              </span>
              <span *ngIf="!(solicitud && solicitud.especialidades_requeridas && solicitud.especialidades_requeridas.length > 0)"
                    class="text-sm"
                    [ngClass]="isDarkMode ? 'text-slate-400' : 'text-gray-600'">
                No especificadas
              </span>
            </div>
          </div>

          <!-- Servicios -->
          <div class="rounded-lg shadow-md p-6 border"
               [ngClass]="isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-200'">
            <h2 class="text-lg font-bold mb-3" [ngClass]="isDarkMode ? 'text-white' : 'text-gray-900'">
              <span class="material-icons text-base mr-2 align-middle">handyman</span>
              Servicios Requeridos
            </h2>
            <div class="flex flex-wrap gap-2">
              <span *ngFor="let srv of solicitud && solicitud.servicios_requeridos || []"
                    class="px-3 py-1 rounded-full text-sm font-medium"
                    [ngClass]="isDarkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'">
                {{ srv }}
              </span>
              <span *ngIf="!(solicitud && solicitud.servicios_requeridos && solicitud.servicios_requeridos.length > 0)"
                    class="text-sm"
                    [ngClass]="isDarkMode ? 'text-slate-400' : 'text-gray-600'">
                No especificados
              </span>
            </div>
          </div>
        </div>

        <!-- Client Information -->
        <div class="rounded-lg shadow-md p-6 border"
             [ngClass]="isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-200'">
          <h2 class="text-lg font-bold mb-4" [ngClass]="isDarkMode ? 'text-white' : 'text-gray-900'">
            <span class="material-icons text-base mr-2 align-middle">person</span>
            Información del Cliente
          </h2>
          <div class="grid md:grid-cols-2 gap-4">
            <div class="p-3 rounded" [ngClass]="isDarkMode ? 'bg-slate-600' : 'bg-gray-100'">
              <p class="text-xs" [ngClass]="isDarkMode ? 'text-slate-400' : 'text-gray-600'">Nombre</p>
              <p class="font-semibold mt-1" [ngClass]="isDarkMode ? 'text-white' : 'text-gray-900'">
                {{ solicitud.cliente?.nombre || 'No disponible' }}
              </p>
            </div>
            <div class="p-3 rounded" [ngClass]="isDarkMode ? 'bg-slate-600' : 'bg-gray-100'">
              <p class="text-xs" [ngClass]="isDarkMode ? 'text-slate-400' : 'text-gray-600'">Teléfono</p>
              <p class="font-semibold mt-1" [ngClass]="isDarkMode ? 'text-white' : 'text-gray-900'">
                {{ solicitud.cliente?.telefono || 'No disponible' }}
              </p>
            </div>
          </div>
        </div>

        <!-- Vehicle Information -->
        <div class="rounded-lg shadow-md p-6 border"
             [ngClass]="isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-200'">
          <h2 class="text-lg font-bold mb-4" [ngClass]="isDarkMode ? 'text-white' : 'text-gray-900'">
            <span class="material-icons text-base mr-2 align-middle">directions_car</span>
            Información del Vehículo
          </h2>
          <div class="grid md:grid-cols-2 gap-4">
            <div class="p-3 rounded" [ngClass]="isDarkMode ? 'bg-slate-600' : 'bg-gray-100'">
              <p class="text-xs" [ngClass]="isDarkMode ? 'text-slate-400' : 'text-gray-600'">Placa</p>
              <p class="font-semibold mt-1" [ngClass]="isDarkMode ? 'text-white' : 'text-gray-900'">
                {{ solicitud.vehiculo?.placa || 'No disponible' }}
              </p>
            </div>
            <div class="p-3 rounded" [ngClass]="isDarkMode ? 'bg-slate-600' : 'bg-gray-100'">
              <p class="text-xs" [ngClass]="isDarkMode ? 'text-slate-400' : 'text-gray-600'">Marca</p>
              <p class="font-semibold mt-1" [ngClass]="isDarkMode ? 'text-white' : 'text-gray-900'">
                {{ solicitud.vehiculo?.marca || 'No disponible' }}
              </p>
            </div>
            <div class="p-3 rounded" [ngClass]="isDarkMode ? 'bg-slate-600' : 'bg-gray-100'">
              <p class="text-xs" [ngClass]="isDarkMode ? 'text-slate-400' : 'text-gray-600'">Modelo</p>
              <p class="font-semibold mt-1" [ngClass]="isDarkMode ? 'text-white' : 'text-gray-900'">
                {{ solicitud.vehiculo?.modelo || 'No disponible' }}
              </p>
            </div>
            <div class="p-3 rounded" [ngClass]="isDarkMode ? 'bg-slate-600' : 'bg-gray-100'">
              <p class="text-xs" [ngClass]="isDarkMode ? 'text-slate-400' : 'text-gray-600'">Color</p>
              <p class="font-semibold mt-1" [ngClass]="isDarkMode ? 'text-white' : 'text-gray-900'">
                {{ solicitud.vehiculo?.color || 'No disponible' }}
              </p>
            </div>
          </div>
        </div>

        <!-- Application Section -->
        <div class="rounded-lg shadow-md p-6 border-2"
             [ngClass]="isDarkMode ? 'border-purple-600 bg-purple-900 bg-opacity-30' : 'border-purple-200 bg-purple-50'">
          <h2 class="text-lg font-bold mb-4" [ngClass]="isDarkMode ? 'text-purple-300' : 'text-purple-800'">
            <span class="material-icons text-base mr-2 align-middle">send</span>
            Postularme a esta Solicitud
          </h2>

          <!-- Time Estimate -->
          <div class="mb-4">
            <label class="block text-sm font-medium mb-2" [ngClass]="isDarkMode ? 'text-slate-300' : 'text-gray-700'">
              Tiempo Estimado de Llegada (minutos) *
            </label>
            <input type="number"
                   [(ngModel)]="tiempoEstimado"
                   min="1"
                   max="480"
                   placeholder="Ej: 15"
                   class="w-full p-2 rounded border text-sm"
                   [ngClass]="isDarkMode ?
                     'bg-slate-600 border-slate-500 text-white placeholder-slate-400' :
                     'bg-white border-gray-300 text-gray-900 placeholder-gray-500'">
            <p class="text-xs mt-1" [ngClass]="isDarkMode ? 'text-slate-400' : 'text-gray-600'">
              Indica cuánto tiempo aproximadamente tardará tu equipo en llegar al lugar
            </p>
          </div>

          <!-- Message Proposal -->
          <div class="mb-4">
            <label class="block text-sm font-medium mb-2" [ngClass]="isDarkMode ? 'text-slate-300' : 'text-gray-700'">
              Mensaje o Propuesta Adicional (Opcional)
            </label>
            <textarea
                   [(ngModel)]="mensajePropuesta"
                   placeholder="Ej: Podemos atender en los próximos 20 minutos, disponemos de equipos especializados..."
                   rows="3"
                   maxlength="1000"
                   class="w-full p-2 rounded border text-sm resize-none"
                   [ngClass]="isDarkMode ?
                     'bg-slate-600 border-slate-500 text-white placeholder-slate-400' :
                     'bg-white border-gray-300 text-gray-900 placeholder-gray-500'"></textarea>
            <p class="text-xs mt-1" [ngClass]="isDarkMode ? 'text-slate-400' : 'text-gray-600'">
              {{ mensajePropuesta.length }}/1000 caracteres
            </p>
          </div>

          <!-- Availability Confirmation -->
          <div class="mb-4 p-3 rounded border" [ngClass]="isDarkMode ? 'border-slate-500 bg-slate-600' : 'border-gray-300 bg-gray-100'">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox"
                     [(ngModel)]="disponibilidadConfirmada"
                     class="w-4 h-4">
              <span class="text-sm" [ngClass]="isDarkMode ? 'text-slate-200' : 'text-gray-700'">
                Confirmo que mi taller está disponible para atender esta emergencia
              </span>
            </label>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-3">
            <button (click)="postularme()"
                    [disabled]="!tiempoEstimado || !disponibilidadConfirmada || enviando"
                    class="flex-1 px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                    [ngClass]="!tiempoEstimado || !disponibilidadConfirmada || enviando ?
                      (isDarkMode ? 'bg-slate-600 text-slate-400 cursor-not-allowed' : 'bg-gray-300 text-gray-600 cursor-not-allowed') :
                      (isDarkMode ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-purple-500 hover:bg-purple-600 text-white')">
              <span class="material-icons text-base" *ngIf="!enviando">send</span>
              <span class="material-icons text-base animate-spin" *ngIf="enviando">hourglass_empty</span>
              {{ enviando ? 'Enviando...' : 'Postularme' }}
            </button>
            <button (click)="goBack()"
                    class="px-6 py-2 rounded-lg font-medium transition-all"
                    [ngClass]="isDarkMode ?
                      'bg-slate-600 hover:bg-slate-500 text-slate-300' :
                      'bg-gray-300 hover:bg-gray-400 text-gray-700'">
              <span class="material-icons text-base align-middle">close</span>
            </button>
          </div>

          <!-- Success Message -->
          <div *ngIf="exitoPostulacion" class="mt-4 p-3 rounded flex items-center gap-2"
               [ngClass]="isDarkMode ? 'bg-green-900 bg-opacity-50' : 'bg-green-100'">
            <span class="material-icons text-base" [ngClass]="isDarkMode ? 'text-green-300' : 'text-green-800'">
              check_circle
            </span>
            <p class="text-sm font-semibold" [ngClass]="isDarkMode ? 'text-green-300' : 'text-green-800'">
              ¡Postulación enviada exitosamente! Serás notificado cuando el cliente responda.
            </p>
          </div>

          <!-- Error Message -->
          <div *ngIf="errorPostulacion" class="mt-4 p-3 rounded flex items-center gap-2"
               [ngClass]="isDarkMode ? 'bg-red-900 bg-opacity-50' : 'bg-red-100'">
            <span class="material-icons text-base" [ngClass]="isDarkMode ? 'text-red-300' : 'text-red-800'">
              error
            </span>
            <p class="text-sm font-semibold" [ngClass]="isDarkMode ? 'text-red-300' : 'text-red-800'">
              {{ errorPostulacion }}
            </p>
          </div>
        </div>

        <!-- Location Map Info (Future Enhancement) -->
        <div class="rounded-lg shadow-md p-6 border"
             [ngClass]="isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-200'">
          <h2 class="text-lg font-bold mb-3" [ngClass]="isDarkMode ? 'text-white' : 'text-gray-900'">
            <span class="material-icons text-base mr-2 align-middle">place</span>
            Ubicación
          </h2>
          <div class="p-4 rounded" [ngClass]="isDarkMode ? 'bg-slate-600' : 'bg-gray-100'">
            <p class="text-sm" [ngClass]="isDarkMode ? 'text-slate-300' : 'text-gray-700'">
              <strong>Coordenadas:</strong> {{ solicitud.ubicacion.lat }}, {{ solicitud.ubicacion.long }}
            </p>
            <p class="text-sm mt-2" [ngClass]="isDarkMode ? 'text-slate-300' : 'text-gray-700'">
              <strong>Radio de búsqueda:</strong> {{ solicitud.radio_busqueda_km }} km
            </p>
            <div class="mt-4 rounded overflow-hidden border h-80 w-full" [ngClass]="isDarkMode ? 'border-slate-600 bg-slate-600' : 'border-gray-300 bg-gray-100'"
                 #mapContainer id="mapContainer" style="position: relative; min-height: 320px;"></div>
          </div>
        </div>
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
export class SolicitudDetalleComponent implements OnInit, OnDestroy, AfterViewInit {
  solicitud: Solicitud | null = null;
  evidenciasImagen: Evidencia[] = [];
  isLoading = true;
  error: string | null = null;

  // Application form
  tiempoEstimado: number | null = null;
  mensajePropuesta: string = '';
  disponibilidadConfirmada = false;
  enviando = false;
  exitoPostulacion = false;
  errorPostulacion: string | null = null;

  // Mapa
  map: any = null;
  @ViewChild('mapContainer', { static: false }) mapContainer: ElementRef<HTMLDivElement> | null = null;
  private isLoadingMap = true;

  // Theme
  isDarkMode = false;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private solicitudesService: SolicitudesDisponiblesService,
    private postulacionesService: PostulacionesService,
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

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.cargarDetalles(id);
    }
  }

  ngAfterViewInit(): void {
    if (this.mapContainer && this.solicitud) {
      setTimeout(() => {
        this.inicializarMapa();
      }, 50);
    }
  }

  cargarDetalles(id?: string): void {
    const solicitudId = id || this.route.snapshot.paramMap.get('id');
    if (!solicitudId) {
      this.error = 'ID de solicitud no encontrado';
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.error = null;

    this.solicitudesService.obtenerDetalleDisponible(solicitudId).subscribe({
      next: (data: any) => {
        const datosRaw = data.data || data;
        // Mapear campos del backend al formato esperado del componente
        this.solicitud = {
          id: datosRaw.id_solicitud || datosRaw.id,
          codigo: datosRaw.codigo_solicitud || datosRaw.codigo,
          categoria_incidente: datosRaw.categoria_incidente || 'No especificada',
          nivel_urgencia: datosRaw.nivel_urgencia || 'MEDIO',
          descripcion: datosRaw.descripcion_texto || datosRaw.descripcion || '',
          ubicacion: {
            lat: datosRaw.latitud || 0,
            long: datosRaw.longitud || 0
          },
          radio_busqueda_km: datosRaw.radio_busqueda_km || 0,
          especialidades_requeridas: datosRaw.especialidades_requeridas || [],
          servicios_requeridos: datosRaw.servicios_requeridos || [],
          cliente: {
            id: 0,
            nombre: datosRaw.cliente_nombre || 'Cliente',
            email: datosRaw.cliente_email === 'N/A' ? 'No disponible' : (datosRaw.cliente_email || 'No disponible'),
            telefono: datosRaw.cliente_telefono === 'N/A' ? 'No disponible' : (datosRaw.cliente_telefono || 'No disponible')
          },
          vehiculo: {
            placa: datosRaw.vehiculo_placa || null,
            marca: datosRaw.vehiculo_marca || null,
            modelo: datosRaw.vehiculo_modelo || null,
            color: datosRaw.vehiculo_color || null
          },
          estado_actual: datosRaw.estado_actual || 'REGISTRADA',
          fecha_creacion: datosRaw.fecha_creacion || new Date(),
          evidencias: Array.isArray(datosRaw.evidencias) ? datosRaw.evidencias : [],
        };
        this.evidenciasImagen = (this.solicitud.evidencias || []).filter(
          (e: Evidencia) => (e.tipo_evidencia || '').toUpperCase() === 'IMAGEN' && !!e.url_archivo
        );
        this.isLoading = false;
        this.cdr.markForCheck();
        // Inicializar mapa después de que los datos se hayan asignado
        setTimeout(() => {
          this.inicializarMapa();
        }, 100);
      },
      error: (err: any) => {
        this.error = 'Error al cargar los detalles de la solicitud';
        this.isLoading = false;
        console.error(err);
        this.cdr.markForCheck();
      }
    });
  }

  postularme(): void {
    if (!this.solicitud || !this.tiempoEstimado || !this.disponibilidadConfirmada) {
      this.errorPostulacion = 'Por favor completa todos los campos requeridos';
      return;
    }

    this.enviando = true;
    this.errorPostulacion = null;

    this.postulacionesService.crearPostulacion(this.solicitud.id, {
      tiempo_estimado_llegada: this.tiempoEstimado,
      disponibilidad: this.disponibilidadConfirmada,
      mensaje_propuesta: this.mensajePropuesta.trim() || undefined
    }).subscribe({
      next: () => {
        this.exitoPostulacion = true;
        this.enviando = false;
        setTimeout(() => {
          this.router.navigate(['/applications']);
        }, 2000);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.errorPostulacion = err?.error?.detail || 'Error al enviar postulación';
        this.enviando = false;
        console.error(err);
        this.cdr.markForCheck();
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/emergency-requests']);
  }

  getEstadoClasses(estado?: string): string {
    const base = 'px-3 py-1 rounded-full text-xs font-bold';
    switch (estado) {
      case 'NUEVA':
        return `${base} ${this.isDarkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'}`;
      case 'EN_ATENCION':
        return `${base} ${this.isDarkMode ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800'}`;
      case 'RESUELTA':
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

  inicializarMapa(): void {
    if (!this.solicitud || !this.mapContainer?.nativeElement) {
      console.warn('No solicitud o no map container');
      return;
    }

    console.log('Iniciando mapa con ubicación:', this.solicitud.ubicacion);

    // Cargar MapLibre GL CSS si no está ya cargada
    if (!document.querySelector('link[href*="maplibre-gl.css"]')) {
      const link = document.createElement('link');
      link.href = 'https://unpkg.com/maplibre-gl@3.6.0/dist/maplibre-gl.css';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }

    // Verificar si MapLibre GL ya está cargado
    if (typeof (window as any).maplibregl !== 'undefined') {
      this.initializeMapLibre();
      return;
    }

    // Cargar MapLibre GL JS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/maplibre-gl@3.6.0/dist/maplibre-gl.js';
    script.async = true;

    script.onload = () => {
      console.log('MapLibre GL cargado exitosamente');
      this.initializeMapLibre();
    };

    script.onerror = () => {
      console.error('Error loading MapLibre GL');
      this.isLoadingMap = false;
    };

    document.head.appendChild(script);
  }

  private initializeMapLibre(): void {
    if (!this.solicitud || !this.mapContainer?.nativeElement) {
      console.warn('Solicitud o contenedor no disponible en initializeMapLibre');
      return;
    }

    const lat = this.solicitud.ubicacion.lat;
    const lng = this.solicitud.ubicacion.long;
    const radio = this.solicitud.radio_busqueda_km;

    console.log('Creando mapa en coordenadas:', [lat, lng], 'radio:', radio);

    // Limpiar mapa anterior si existe
    if (this.map) {
      this.map.remove();
      this.map = null;
    }

    try {
      const maplibregl = (window as any).maplibregl;

      if (!maplibregl) {
        console.error('maplibregl no está disponible globalmente');
        this.isLoadingMap = false;
        return;
      }

      this.map = new maplibregl.Map({
        container: this.mapContainer.nativeElement,
        style: {
          version: 8,
          sources: {
            'osm': {
              type: 'raster',
              tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
              tileSize: 256,
              attribution: '© OpenStreetMap contributors'
            }
          },
          layers: [
            {
              id: 'osm',
              type: 'raster',
              source: 'osm',
              minzoom: 0,
              maxzoom: 19
            }
          ]
        },
        center: [lng, lat],
        zoom: 14
      });

      this.map.on('load', () => {
        console.log('Mapa cargado, agregando elementos');
        this.addMapElements();
        this.isLoadingMap = false;
        this.cdr.markForCheck();
      });

      // Timeout de seguridad
      setTimeout(() => {
        if (this.isLoadingMap && this.map) {
          console.log('Timeout de seguridad: agregando elementos');
          this.addMapElements();
          this.isLoadingMap = false;
          this.cdr.markForCheck();
        }
      }, 3000);

    } catch (error) {
      console.error('Error initializing MapLibre:', error);
      this.isLoadingMap = false;
      this.cdr.markForCheck();
    }
  }

  private addMapElements(): void {
    if (!this.map || !this.solicitud) {
      console.warn('Mapa o solicitud no disponible en addMapElements');
      return;
    }

    const lat = this.solicitud.ubicacion.lat;
    const lng = this.solicitud.ubicacion.long;
    const radio = this.solicitud.radio_busqueda_km;
    const maplibregl = (window as any).maplibregl;

    try {
      // Crear marcador personalizado
      const markerEl = document.createElement('div');
      markerEl.style.width = '32px';
      markerEl.style.height = '40px';
      markerEl.style.cursor = 'pointer';
      markerEl.innerHTML = `
        <svg viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 0C9.4 0 4 5.4 4 12c0 8 12 28 12 28s12-20 12-28c0-6.6-5.4-12-12-12z" fill="#ef4444" stroke="#fff" stroke-width="2"/>
          <circle cx="16" cy="12" r="5" fill="#fff"/>
        </svg>
      `;

      const marker = new maplibregl.Marker({
        element: markerEl
      })
        .setLngLat([lng, lat])
        .addTo(this.map);

      // Crear popup con información
      const popupContent = document.createElement('div');
      popupContent.style.textAlign = 'center';
      popupContent.style.padding = '8px';
      popupContent.innerHTML = `
        <div>
          <strong>${this.solicitud.codigo}</strong><br>
          Radio: ${radio} km<br>
          <small>${lat.toFixed(4)}, ${lng.toFixed(4)}</small>
        </div>
      `;

      marker.setPopup(new maplibregl.Popup({ offset: 25 }).setDOMContent(popupContent));

      // Cargar Turf.js para crear el buffer circular
      this.loadTurfAndCreateCircle(lat, lng, radio);

      console.log('Elementos del mapa agregados exitosamente');
    } catch (error) {
      console.error('Error adding map elements:', error);
    }
  }

  private loadTurfAndCreateCircle(lat: number, lng: number, radiusKm: number): void {
    // Verificar si Turf ya está cargado
    if (typeof (window as any).turf !== 'undefined') {
      this.createCircleWithTurf(lat, lng, radiusKm);
      return;
    }

    // Cargar Turf.js de CDN
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@turf/turf@6/turf.min.js';
    script.async = true;

    script.onload = () => {
      console.log('Turf.js cargado exitosamente');
      this.createCircleWithTurf(lat, lng, radiusKm);
    };

    script.onerror = () => {
      console.error('Error loading Turf.js, usando polígono alternativo');
      this.createCirclePolygonManual(lat, lng, radiusKm);
    };

    document.head.appendChild(script);
  }

  private createCircleWithTurf(lat: number, lng: number, radiusKm: number): void {
    if (!this.map) return;

    try {
      const turf = (window as any).turf;
      const center = turf.point([lng, lat]);
      const circlePolygon = turf.circle(center, radiusKm, { units: 'kilometers', steps: 64 });

      console.log('Círculo creado con Turf:', circlePolygon);

      // Agregar o actualizar la fuente
      if (this.map.getSource('search-circle')) {
        (this.map.getSource('search-circle') as any).setData(circlePolygon);
      } else {
        this.map.addSource('search-circle', {
          type: 'geojson',
          data: circlePolygon
        });

        // Capa del círculo relleno
        this.map.addLayer({
          id: 'search-circle-fill',
          type: 'fill',
          source: 'search-circle',
          paint: {
            'fill-color': '#06b6d4',
            'fill-opacity': 0.25
          }
        });

        // Capa del borde del círculo
        this.map.addLayer({
          id: 'search-circle-stroke',
          type: 'line',
          source: 'search-circle',
          paint: {
            'line-color': '#06b6d4',
            'line-width': 3,
            'line-opacity': 0.8
          }
        });
      }
    } catch (error) {
      console.error('Error creating circle with Turf:', error);
      this.createCirclePolygonManual(lat, lng, radiusKm);
    }
  }

  private createCirclePolygonManual(lat: number, lng: number, radiusKm: number): void {
    if (!this.map) return;

    try {
      const circlePolygon = this.createCirclePolygon(lat, lng, radiusKm);
      console.log('Polígono circular manual creado:', circlePolygon);

      // Agregar o actualizar la fuente
      if (this.map.getSource('search-circle')) {
        (this.map.getSource('search-circle') as any).setData(circlePolygon);
      } else {
        this.map.addSource('search-circle', {
          type: 'geojson',
          data: circlePolygon
        });

        // Capa del círculo relleno
        this.map.addLayer({
          id: 'search-circle-fill',
          type: 'fill',
          source: 'search-circle',
          paint: {
            'fill-color': '#06b6d4',
            'fill-opacity': 0.25
          }
        });

        // Capa del borde del círculo
        this.map.addLayer({
          id: 'search-circle-stroke',
          type: 'line',
          source: 'search-circle',
          paint: {
            'line-color': '#06b6d4',
            'line-width': 3,
            'line-opacity': 0.8
          }
        });
      }
    } catch (error) {
      console.error('Error creating manual circle polygon:', error);
    }
  }

  // Crear un polígono circular GeoJSON con radio en kilómetros
  private createCirclePolygon(lat: number, lng: number, radiusKm: number): any {
    const points = 64; // Número de puntos para suavidad
    const coordinates: [number, number][] = [];

    // Factor de conversión: 1 grado de latitud ≈ 111 km
    const latOffset = radiusKm / 111;
    // Para longitud, depende de la latitud
    const lngOffset = radiusKm / (111 * Math.cos(lat * Math.PI / 180));

    for (let i = 0; i < points; i++) {
      const angle = (i / points) * (2 * Math.PI);
      const x = lng + lngOffset * Math.cos(angle);
      const y = lat + latOffset * Math.sin(angle);
      coordinates.push([x, y]);
    }

    // Cerrar el polígono
    coordinates.push(coordinates[0]);

    return {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [coordinates]
      }
    };
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }
}


