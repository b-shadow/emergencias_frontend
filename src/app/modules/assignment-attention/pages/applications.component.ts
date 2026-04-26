import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PostulacionesService } from '@modules/assignment-attention/services/postulaciones.service';
import { ThemeService } from '@core/services/theme.service';
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
  imports: [CommonModule],
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
  filtroActual: string = 'TODAS';
  isLoading = true;
  error: string | null = null;
  isDarkMode = false;

  private destroy$ = new Subject<void>();

  constructor(
    private postulacionesService: PostulacionesService,
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

    this.cargarPostulaciones();
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


