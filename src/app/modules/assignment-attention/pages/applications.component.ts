import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PostulacionesService } from '@modules/assignment-attention/services/postulaciones.service';
import { ThemeService } from '@core/services/theme.service';
import { WorkshopService } from '@core/services/workshop.service';
import { TallerServicio } from '@core/models/especialidad-servicio.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface Postulacion {
  id_postulacion: string;
  id_solicitud: string;
  id_taller: string;
  estado_postulacion: string;
  fecha_postulacion: string;
  tiempo_estimado_llegada_min: number;
  mensaje_propuesta?: string;
  solicitud?: {
    id_solicitud: string;
    codigo_solicitud: string;
    categoria_incidente: string;
    nivel_urgencia: string;
    radio_busqueda_km: number;
  };
}

@Component({
  selector: 'app-applications',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="px-6 py-4">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-3xl font-bold" [ngClass]="isDarkMode ? 'text-white' : 'text-gray-900'">
            Mis Postulaciones
          </h1>
          <p class="text-sm mt-1" [ngClass]="isDarkMode ? 'text-slate-400' : 'text-gray-600'">
            {{ postulaciones.length }} postulación{{ postulaciones.length !== 1 ? 'es' : '' }} registrada{{ postulaciones.length !== 1 ? 's' : '' }}
          </p>
        </div>
        <button (click)="onRefresh()"
                class="px-4 py-2 rounded-lg font-medium transition-all duration-300"
                [ngClass]="isDarkMode ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-purple-500 hover:bg-purple-600 text-white'">
          <span class="material-icons align-middle text-xl">refresh</span>
        </button>
      </div>

      <!-- Filter Section -->
      <div class="mb-6 p-4 rounded-lg" [ngClass]="isDarkMode ? 'bg-slate-700' : 'bg-gray-100'">
        <p class="text-sm font-semibold mb-3" [ngClass]="isDarkMode ? 'text-slate-300' : 'text-gray-700'">
          Filtrar por estado:
        </p>
        <div class="flex flex-wrap gap-2">
          <button (click)="filterByState('TODAS')"
                  class="px-3 py-1 rounded-full text-sm font-medium transition-all"
                  [ngClass]="filtroActual === 'TODAS' ?
                    (isDarkMode ? 'bg-purple-600 text-white' : 'bg-purple-500 text-white') :
                    (isDarkMode ? 'bg-slate-600 text-slate-300 hover:bg-slate-500' : 'bg-gray-300 text-gray-700 hover:bg-gray-400')">
            Todas
          </button>
          <button (click)="filterByState('POSTULADA')"
                  class="px-3 py-1 rounded-full text-sm font-medium transition-all"
                  [ngClass]="filtroActual === 'POSTULADA' ?
                    (isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white') :
                    (isDarkMode ? 'bg-slate-600 text-slate-300 hover:bg-slate-500' : 'bg-gray-300 text-gray-700 hover:bg-gray-400')">
            En Espera
          </button>
          <button (click)="filterByState('ACEPTADA')"
                  class="px-3 py-1 rounded-full text-sm font-medium transition-all"
                  [ngClass]="filtroActual === 'ACEPTADA' ?
                    (isDarkMode ? 'bg-green-600 text-white' : 'bg-green-500 text-white') :
                    (isDarkMode ? 'bg-slate-600 text-slate-300 hover:bg-slate-500' : 'bg-gray-300 text-gray-700 hover:bg-gray-400')">
            Aceptada
          </button>
          <button (click)="filterByState('RECHAZADA')"
                  class="px-3 py-1 rounded-full text-sm font-medium transition-all"
                  [ngClass]="filtroActual === 'RECHAZADA' ?
                    (isDarkMode ? 'bg-red-600 text-white' : 'bg-red-500 text-white') :
                    (isDarkMode ? 'bg-slate-600 text-slate-300 hover:bg-slate-500' : 'bg-gray-300 text-gray-700 hover:bg-gray-400')">
            Rechazada
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="flex justify-center items-center py-12">
        <div class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p [ngClass]="isDarkMode ? 'text-slate-400' : 'text-gray-600'">Cargando postulaciones...</p>
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
      <div *ngIf="!isLoading && !error && postulacionesFiltradas.length === 0"
           class="p-8 text-center rounded-lg border-2 border-dashed"
           [ngClass]="isDarkMode ? 'border-slate-600 bg-slate-800' : 'border-gray-300 bg-gray-50'">
        <div class="text-5xl mb-3">📝</div>
        <p class="text-lg font-semibold" [ngClass]="isDarkMode ? 'text-slate-300' : 'text-gray-700'">
          No hay postulaciones
        </p>
        <p class="text-sm mt-2" [ngClass]="isDarkMode ? 'text-slate-400' : 'text-gray-600'">
          {{ filtroActual === 'TODAS' ? 'Aún no has postulado a ninguna solicitud' : 'No hay postulaciones con estado: ' + filtroActual }}
        </p>
      </div>

      <!-- Postulations Grid -->
      <div *ngIf="!isLoading && !error && postulacionesFiltradas.length > 0"
           class="grid gap-4" style="grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));">
        <div *ngFor="let postulacion of postulacionesFiltradas"
             class="rounded-lg shadow-md p-5 border transition-all hover:shadow-lg hover:scale-102"
             [ngClass]="isDarkMode ?
               'bg-slate-700 border-slate-600' :
               'bg-white border-gray-200'">

          <!-- Header with Estado Badge -->
          <div class="flex items-start justify-between mb-3">
            <div class="flex-1">
              <p class="text-xs font-medium mb-1" [ngClass]="isDarkMode ? 'text-slate-400' : 'text-gray-600'">
                <span class="material-icons text-base align-middle">location_on</span>
                Emergencia {{ postulacion.solicitud?.codigo_solicitud || 'N/A' }}
              </p>
              <h3 class="font-bold text-lg" [ngClass]="isDarkMode ? 'text-white' : 'text-gray-900'">
                {{ getCategoriaNombre(postulacion.solicitud?.categoria_incidente) }}
              </h3>
            </div>
            <span class="px-2 py-1 rounded-full text-xs font-bold whitespace-nowrap ml-2"
                  [ngClass]="getEstadoClasses(postulacion.estado_postulacion)">
              {{ postulacion.estado_postulacion }}
            </span>
          </div>

          <!-- Urgency Level -->
          <div class="flex items-center mb-3 p-2 rounded" [ngClass]="isDarkMode ? 'bg-slate-600' : 'bg-gray-100'">
            <span class="material-icons text-base mr-2" [ngClass]="getUrgenciaColor(postulacion.solicitud?.nivel_urgencia)">
              warning
            </span>
            <span class="text-sm font-medium" [ngClass]="isDarkMode ? 'text-slate-200' : 'text-gray-700'">
              Nivel: {{ postulacion.solicitud?.nivel_urgencia || 'N/A' }}
            </span>
          </div>

          <!-- Distance Info -->
          <div class="flex items-center justify-between mb-3 text-sm" [ngClass]="isDarkMode ? 'text-slate-300' : 'text-gray-600'">
            <span class="flex items-center">
              <span class="material-icons text-base mr-1">my_location</span>
              Radio de búsqueda
            </span>
            <span class="font-semibold" [ngClass]="isDarkMode ? 'text-white' : 'text-gray-900'">
              {{ postulacion.solicitud?.radio_busqueda_km || 'N/A' }} km
            </span>
          </div>

          <!-- Time Estimate -->
          <div class="flex items-center justify-between mb-4 p-2 rounded" [ngClass]="isDarkMode ? 'bg-slate-600' : 'bg-gray-100'">
            <span class="flex items-center text-sm" [ngClass]="isDarkMode ? 'text-slate-200' : 'text-gray-700'">
              <span class="material-icons text-base mr-1">schedule</span>
              Tiempo estimado
            </span>
            <span class="font-bold" [ngClass]="isDarkMode ? 'text-green-400' : 'text-green-600'">
              {{ postulacion.tiempo_estimado_llegada_min || 'N/A' }} min
            </span>
          </div>

          <!-- Fecha Postulación -->
          <p class="text-xs mb-4" [ngClass]="isDarkMode ? 'text-slate-400' : 'text-gray-600'">
            Postulada: {{ postulacion.fecha_postulacion | date: 'short' }}
          </p>

          <!-- Cotización -->
          <div class="mb-4 p-3 rounded border" [ngClass]="isDarkMode ? 'bg-slate-800 border-slate-600' : 'bg-slate-50 border-slate-200'">
            <div class="flex items-center justify-between">
              <p class="text-sm font-semibold" [ngClass]="isDarkMode ? 'text-slate-200' : 'text-slate-700'">
                Cotización
              </p>
              <button
                *ngIf="postulacion.estado_postulacion === 'POSTULADA'"
                (click)="toggleCotizacion(postulacion.id_postulacion)"
                class="text-xs px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white"
              >
                {{ cotizacionVisible[postulacion.id_postulacion] ? 'Ocultar' : 'Gestionar' }}
              </button>
            </div>

            <div *ngIf="cotizaciones[postulacion.id_postulacion]" class="mt-2 text-xs" [ngClass]="isDarkMode ? 'text-slate-300' : 'text-slate-600'">
              Estado: <strong>{{ cotizaciones[postulacion.id_postulacion].estado_cotizacion }}</strong> ·
              Total: <strong>{{ cotizaciones[postulacion.id_postulacion].precio_total_estimado | number:'1.2-2' }}</strong>
            </div>

            <div *ngIf="cotizacionVisible[postulacion.id_postulacion]" class="mt-3 space-y-2">
              <div class="max-h-36 overflow-auto rounded border p-2"
                [ngClass]="isDarkMode ? 'bg-slate-700 border-slate-500' : 'bg-white border-gray-300'">
                <label *ngFor="let s of misServicios" class="flex items-center gap-2 text-sm py-1"
                  [ngClass]="isDarkMode ? 'text-white' : 'text-gray-900'">
                  <input
                    type="checkbox"
                    [checked]="hasServicioSeleccionado(postulacion.id_postulacion, s.id_taller_servicio)"
                    (change)="onServicioCotizacionChange(postulacion.id_postulacion, s.id_taller_servicio, $any($event.target).checked)"
                  />
                  <span>{{ s.nombre_servicio }} {{ s.categoria_tarifa ? '(' + s.categoria_tarifa + ')' : '' }}</span>
                </label>
              </div>
              <div *ngFor="let item of cotizacionForm[postulacion.id_postulacion].servicios" class="grid grid-cols-12 gap-2 items-center">
                <span class="col-span-8 text-xs" [ngClass]="isDarkMode ? 'text-slate-200' : 'text-slate-700'">{{ item.nombre_servicio || item.id_taller_servicio }}</span>
                <input type="number" min="0" [(ngModel)]="item.precio_servicio"
                  placeholder="Precio"
                  class="col-span-4 p-2 rounded border text-sm"
                  [ngClass]="isDarkMode ? 'bg-slate-700 border-slate-500 text-white' : 'bg-white border-gray-300 text-gray-900'" />
              </div>
              <div class="grid grid-cols-2 gap-2">
                <input type="number" min="0" [(ngModel)]="cotizacionForm[postulacion.id_postulacion].costo_ida"
                  placeholder="Costo ida"
                  class="p-2 rounded border text-sm"
                  [ngClass]="isDarkMode ? 'bg-slate-700 border-slate-500 text-white' : 'bg-white border-gray-300 text-gray-900'" />
                <input type="text" [value]="getSubtotalCotizacion(postulacion.id_postulacion) | number:'1.2-2'" disabled
                  placeholder="Subtotal"
                  class="p-2 rounded border text-sm opacity-70"
                  [ngClass]="isDarkMode ? 'bg-slate-700 border-slate-500 text-white' : 'bg-white border-gray-300 text-gray-900'" />
              </div>
              <input type="text" [(ngModel)]="cotizacionForm[postulacion.id_postulacion].tipo_pintura"
                placeholder="Tipo de pintura (chaperio)"
                class="w-full p-2 rounded border text-sm"
                [ngClass]="isDarkMode ? 'bg-slate-700 border-slate-500 text-white' : 'bg-white border-gray-300 text-gray-900'" />
              <textarea [(ngModel)]="cotizacionForm[postulacion.id_postulacion].detalle"
                placeholder="Detalle de cotizacion"
                rows="2"
                class="w-full p-2 rounded border text-sm"
                [ngClass]="isDarkMode ? 'bg-slate-700 border-slate-500 text-white' : 'bg-white border-gray-300 text-gray-900'"></textarea>
              <button
                (click)="guardarCotizacion(postulacion.id_postulacion)"
                class="w-full px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium"
              >
                Guardar cotización
              </button>
            </div>
          </div>

          <!-- Action Button -->
          <button *ngIf="postulacion.estado_postulacion === 'POSTULADA'"
                  (click)="retirarPostulacion(postulacion.id_postulacion)"
                  class="w-full px-4 py-2 rounded-lg font-medium transition-all duration-300"
                  [ngClass]="isDarkMode ?
                    'bg-red-600 hover:bg-red-700 text-white' :
                    'bg-red-500 hover:bg-red-600 text-white'">
            <span class="material-icons text-base align-middle mr-1">close</span>
            Retirar Postulación
          </button>

          <button *ngIf="postulacion.estado_postulacion !== 'POSTULADA'"
                  disabled
                  class="w-full px-4 py-2 rounded-lg font-medium transition-all duration-300 opacity-50 cursor-not-allowed"
                  [ngClass]="isDarkMode ? 'bg-slate-600 text-slate-400' : 'bg-gray-300 text-gray-600'">
            {{ getButtonText(postulacion.estado_postulacion) }}
          </button>
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

    .hover\\:scale-102:hover {
      transform: scale(1.02);
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
export class ApplicationsComponent implements OnInit, OnDestroy {
  postulaciones: Postulacion[] = [];
  postulacionesFiltradas: Postulacion[] = [];
  misServicios: TallerServicio[] = [];
  cotizaciones: Record<string, any> = {};
  cotizacionVisible: Record<string, boolean> = {};
  cotizacionForm: Record<string, {
    servicios: {
      id_taller_servicio: string;
      precio_servicio: number;
      nombre_servicio?: string;
      categoria_tarifa?: string;
      incluido_en_solicitud: boolean;
    }[];
    costo_ida: number;
    tipo_pintura: string;
    detalle: string;
  }> = {};
  filtroActual: string = 'TODAS';
  isLoading = true;
  error: string | null = null;
  isDarkMode = false;

  private destroy$ = new Subject<void>();

  constructor(
    private postulacionesService: PostulacionesService,
    private router: Router,
    private themeService: ThemeService,
    private workshopService: WorkshopService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Subscribe to theme changes
    this.themeService.darkMode$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isDark: boolean) => {
        this.isDarkMode = isDark;
      });

    this.cargarPostulaciones();
    this.cargarMisServicios();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarPostulaciones(): void {
    this.isLoading = true;
    this.error = null;

    this.postulacionesService.obtenerMisPostulaciones().subscribe({
      next: (data: any) => {
        this.postulaciones = data.data || data;
        this.aplicarFiltro();
        this.inicializarCotizaciones();
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error = 'Error al cargar postulaciones. Intenta de nuevo.';
        this.isLoading = false;
        console.error(err);
        this.cdr.markForCheck();
      }
    });
  }

  filterByState(estado: string): void {
    this.filtroActual = estado;
    this.aplicarFiltro();
  }

  aplicarFiltro(): void {
    if (this.filtroActual === 'TODAS') {
      this.postulacionesFiltradas = this.postulaciones;
    } else {
      this.postulacionesFiltradas = this.postulaciones.filter(
        p => p.estado_postulacion === this.filtroActual
      );
    }
  }

  retirarPostulacion(postulacionId: string): void {
    if (confirm('¿Estás seguro de que deseas retirar esta postulación?')) {
      this.postulacionesService.retirarPostulacion(postulacionId).subscribe({
        next: () => {
          this.postulaciones = this.postulaciones.filter(p => p.id_postulacion !== postulacionId);
          this.aplicarFiltro();
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.error = 'Error al retirar postulación';
          console.error(err);
          this.cdr.markForCheck();
        }
      });
    }
  }

  onRefresh(): void {
    this.cargarPostulaciones();
  }

  cargarMisServicios(): void {
    this.workshopService.getMisServicios().subscribe({
      next: (rows) => {
        this.misServicios = rows || [];
      },
      error: () => {
        this.misServicios = [];
      },
    });
  }

  inicializarCotizaciones(): void {
    this.postulaciones.forEach((p) => {
      if (!this.cotizacionForm[p.id_postulacion]) {
          this.cotizacionForm[p.id_postulacion] = {
            servicios: [],
            costo_ida: 0,
            tipo_pintura: '',
            detalle: '',
          };
      }
    });
  }

  toggleCotizacion(idPostulacion: string): void {
    this.cotizacionVisible[idPostulacion] = !this.cotizacionVisible[idPostulacion];
    if (!this.cotizacionVisible[idPostulacion]) return;
    if (this.cotizaciones[idPostulacion]) return;

    this.postulacionesService.obtenerCotizacion(idPostulacion).subscribe({
      next: (cot) => {
        this.cotizaciones[idPostulacion] = cot;
        this.cotizacionForm[idPostulacion] = {
          servicios: (cot.servicios || []).map((s: any) => ({
            id_taller_servicio: s.id_taller_servicio,
            precio_servicio: Number(s.precio_servicio || 0),
            nombre_servicio: s.nombre_servicio || '',
            categoria_tarifa: s.categoria_tarifa || '',
            incluido_en_solicitud: s.incluido_en_solicitud !== false,
          })),
          costo_ida: cot.costo_ida,
          tipo_pintura: cot.tipo_pintura || '',
          detalle: '',
        };
        this.cdr.markForCheck();
      },
      error: () => {
        // Sin cotización aún para esta postulación
      },
    });
  }

  onServicioCotizacionChange(idPostulacion: string, idTallerServicio: string, checked: boolean): void {
    const form = this.cotizacionForm[idPostulacion];
    if (!form) return;
    const servicio = this.misServicios.find((s) => s.id_taller_servicio === idTallerServicio);
    if (!servicio) return;

    const existingIndex = form.servicios.findIndex((s) => s.id_taller_servicio === idTallerServicio);
    if (!checked) {
      if (existingIndex >= 0) form.servicios.splice(existingIndex, 1);
      return;
    }
    if (existingIndex >= 0) return;

    form.servicios.push({
      id_taller_servicio: idTallerServicio,
      precio_servicio: Number(servicio.precio_base || 0),
      nombre_servicio: servicio.nombre_servicio || '',
      categoria_tarifa: servicio.categoria_tarifa || '',
      incluido_en_solicitud: true,
    });
    if (form.costo_ida <= 0 && typeof servicio.precio_ida_minimo === 'number') {
      form.costo_ida = Number(servicio.precio_ida_minimo);
    }
    if ((servicio.categoria_tarifa || '').toUpperCase() === 'CHAPERIO' && !form.tipo_pintura) {
      form.tipo_pintura = servicio.tipo_pintura_chaperio || '';
    }
  }

  hasServicioSeleccionado(idPostulacion: string, idTallerServicio: string): boolean {
    return !!this.cotizacionForm[idPostulacion]?.servicios?.some((s) => s.id_taller_servicio === idTallerServicio);
  }

  getSubtotalCotizacion(idPostulacion: string): number {
    const servicios = this.cotizacionForm[idPostulacion]?.servicios || [];
    return servicios.reduce((acc, s) => acc + Number(s.precio_servicio || 0), 0);
  }

  guardarCotizacion(idPostulacion: string): void {
    const form = this.cotizacionForm[idPostulacion];
    if (!form?.servicios?.length) {
      this.error = 'Selecciona al menos un servicio para cotizar';
      return;
    }
    this.postulacionesService.crearOActualizarCotizacion(idPostulacion, {
      servicios: form.servicios.map((s) => ({
        id_taller_servicio: s.id_taller_servicio,
        precio_servicio: Number(s.precio_servicio || 0),
        nombre_servicio: s.nombre_servicio || null,
        categoria_tarifa: s.categoria_tarifa || null,
        incluido_en_solicitud: s.incluido_en_solicitud,
      })),
      costo_ida: Number(form.costo_ida || 0),
      tipo_pintura: form.tipo_pintura || null,
      detalle: form.detalle || null,
    }).subscribe({
      next: (cot) => {
        this.cotizaciones[idPostulacion] = cot;
        this.cotizacionVisible[idPostulacion] = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error = err?.error?.detail || 'Error al guardar cotización';
        this.cdr.markForCheck();
      },
    });
  }

  getEstadoClasses(estado: string): string {
    const base = 'px-3 py-1 rounded-full text-xs font-bold';
    switch (estado) {
      case 'POSTULADA':
        return `${base} ${this.isDarkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'}`;
      case 'ACEPTADA':
        return `${base} ${this.isDarkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'}`;
      case 'RECHAZADA':
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

  getButtonText(estado: string): string {
    switch (estado) {
      case 'ACEPTADA':
        return '✓ Aceptada';
      case 'RECHAZADA':
        return '✗ Rechazada';
      default:
        return 'No disponible';
    }
  }
}


