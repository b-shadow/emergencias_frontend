import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { WorkshopService, Servicio, TallerServicio } from '@core/services/workshop.service';

@Component({
  selector: 'app-mis-servicios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="px-6 py-4">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 text-transparent bg-clip-text mb-2">
          🛠️ Mis Servicios
        </h1>
        <p class="text-gray-600 dark:text-slate-400">Gestiona los servicios que ofrece tu taller</p>
      </div>

      <!-- Loading -->
      <div *ngIf="cargando" class="text-center py-8">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p class="text-gray-500 dark:text-slate-400 mt-2">Cargando servicios...</p>
      </div>

      <!-- Error -->
      <div *ngIf="error && !cargando" class="mb-4 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg border border-red-300 dark:border-red-700">
        ❌ {{ error }}
      </div>

      <!-- Success -->
      <div *ngIf="mensajeExito" class="mb-4 p-4 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 rounded-lg border border-green-300 dark:border-green-700">
        ✅ {{ mensajeExito }}
      </div>

      <!-- Content -->
      <div *ngIf="!cargando" class="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold text-gray-900 dark:text-white">📌 Servicios Actuales</h2>
          <button
            (click)="abrirModalAgregar()"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
          >
            ➕ Agregar Servicio
          </button>
        </div>

        <!-- Search -->
        <div class="mb-4" *ngIf="misServicios.length > 0">
          <input
            type="text"
            [(ngModel)]="busquedaActuales"
            placeholder="🔍 Buscar servicios..."
            class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div *ngIf="misServicios.length > 0" class="space-y-2">
          <div *ngFor="let srv of serviciosListaFiltrados" class="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600">
            <div class="flex-1">
              <p class="font-semibold text-gray-900 dark:text-white">{{ srv.nombre_servicio }}</p>
              <p class="text-sm text-gray-600 dark:text-slate-400">{{ srv.descripcion }}</p>
              <p *ngIf="srv.observaciones" class="text-xs text-gray-500 dark:text-slate-500 mt-1">{{ srv.observaciones }}</p>
            </div>
            <button
              (click)="removerServicio(srv.id_servicio, srv.nombre_servicio)"
              [disabled]="guardando"
              class="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm font-medium transition-colors disabled:opacity-50"
            >
              ❌ Remover
            </button>
          </div>
          <p *ngIf="serviciosListaFiltrados.length === 0 && busquedaActuales" class="text-gray-500 dark:text-slate-400 text-center py-4">
            No hay servicios que coincidan con la búsqueda
          </p>
        </div>
        <p *ngIf="misServicios.length === 0" class="text-gray-500 dark:text-slate-400 text-center py-8">
          No tienes servicios agregados. ➕ Agrega uno nuevo.
        </p>
      </div>

      <!-- Modal Agregar -->
      <div *ngIf="mostrarModal" class="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4 z-50">
        <div class="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-auto">
          <div class="p-6">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-2xl font-bold text-gray-900 dark:text-white">✨ Agregar Servicios</h2>
              <button (click)="cerrarModal()" class="text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-white text-2xl">×</button>
            </div>

            <!-- Search -->
            <div class="mb-4">
              <input
                type="text"
                [(ngModel)]="busqueda"
                placeholder="🔍 Buscar servicios..."
                class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <!-- Checkboxes -->
            <div class="space-y-2 max-h-96 overflow-y-auto mb-6">
              <div *ngFor="let srv of serviciosFiltrados" class="flex items-start p-3 bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-600 transition">
                <input
                  type="checkbox"
                  [id]="'srv-' + srv.id_servicio"
                  [(ngModel)]="srv.seleccionado"
                  class="mt-1 w-4 h-4 text-blue-600 rounded cursor-pointer"
                />
                <label [for]="'srv-' + srv.id_servicio" class="ml-3 flex-1 cursor-pointer">
                  <p class="font-semibold text-gray-900 dark:text-white">{{ srv.nombre_servicio }}</p>
                  <p class="text-sm text-gray-600 dark:text-slate-400">{{ srv.descripcion }}</p>
                </label>
              </div>
              <p *ngIf="serviciosFiltrados.length === 0" class="text-center text-gray-500 dark:text-slate-400 py-4">
                No hay servicios disponibles
              </p>
            </div>

            <!-- Buttons -->
            <div class="flex gap-2 justify-end border-t border-gray-200 dark:border-slate-700 pt-4">
              <button
                (click)="cerrarModal()"
                class="px-6 py-2 bg-gray-300 dark:bg-slate-600 hover:bg-gray-400 dark:hover:bg-slate-500 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
              >
                ❌ Cancelar
              </button>
              <button
                (click)="agregarSeleccionados()"
                [disabled]="!haySeleccionados || guardando"
                class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ guardando ? '⏳ Agregando...' : '✓ Agregar Seleccionados' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal de Confirmación -->
      <div *ngIf="mostrarModalConfirmacion" class="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4 z-50">
        <div class="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-sm w-full">
          <div class="p-6">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">⚠️ Confirmar eliminación</h3>
            <p class="text-gray-600 dark:text-slate-400 mb-6">
              ¿Estás seguro de que deseas remover el servicio <strong>{{ nombreItemAEliminar }}</strong>?
            </p>
            <div class="flex gap-2 justify-end">
              <button
                (click)="cancelarEliminar()"
                [disabled]="guardando"
                class="px-6 py-2 bg-gray-300 dark:bg-slate-600 hover:bg-gray-400 dark:hover:bg-slate-500 text-gray-900 dark:text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                (click)="confirmarEliminar()"
                [disabled]="guardando"
                class="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ guardando ? '⏳ Eliminando...' : 'Eliminar' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class MisServiciosComponent implements OnInit, OnDestroy {
  misServicios: TallerServicio[] = [];
  todosServicios: Servicio[] = [];
  serviciosFiltrados: (Servicio & { seleccionado: boolean })[] = [];

  cargando = true;
  guardando = false;
  error: string | null = null;
  mensajeExito: string | null = null;
  busqueda = '';
  busquedaActuales = '';
  mostrarModal = false;

  mostrarModalConfirmacion = false;
  itemAEliminar: string | null = null;
  nombreItemAEliminar = '';

  private destroy$ = new Subject<void>();

  constructor(private workshopService: WorkshopService) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private cargarDatos(): void {
    this.cargando = true;
    this.error = null;

    Promise.all([
      this.workshopService.getAllServicios().toPromise(),
      this.workshopService.getMisServicios().toPromise()
    ])
      .then(([todos, mios]) => {
        this.todosServicios = todos || [];
        this.misServicios = mios || [];
        this.cargando = false;
      })
      .catch((err) => {
        this.error = 'Error al cargar servicios';
        this.cargando = false;
      });
  }

  private actualizarServiciosFiltrados(): void {
    const idsDelTaller = new Set(this.misServicios.map(s => s.id_servicio));

    this.serviciosFiltrados = this.todosServicios
      .filter(s => !idsDelTaller.has(s.id_servicio))
      .filter(s =>
        s.nombre_servicio.toLowerCase().includes(this.busqueda.toLowerCase()) ||
        (s.descripcion && s.descripcion.toLowerCase().includes(this.busqueda.toLowerCase()))
      )
      .map(s => ({ ...s, seleccionado: false }));
  }

  abrirModalAgregar(): void {
    this.mostrarModal = true;
    this.actualizarServiciosFiltrados();
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.busqueda = '';
  }

  get haySeleccionados(): boolean {
    return this.serviciosFiltrados.some(s => s.seleccionado);
  }

  get serviciosListaFiltrados(): TallerServicio[] {
    if (!this.busquedaActuales.trim()) {
      return this.misServicios;
    }
    const termino = this.busquedaActuales.toLowerCase();
    return this.misServicios.filter(s =>
      s.nombre_servicio.toLowerCase().includes(termino) ||
      (s.descripcion && s.descripcion.toLowerCase().includes(termino)) ||
      (s.observaciones && s.observaciones.toLowerCase().includes(termino))
    );
  }

  agregarSeleccionados(): void {
    const seleccionados = this.serviciosFiltrados.filter(s => s.seleccionado);
    if (seleccionados.length === 0) return;

    this.guardando = true;
    this.error = null;

    let agregados = 0;
    let errores = 0;

    seleccionados.forEach(srv => {
      this.workshopService
        .agregarServicio({
          id_servicio: srv.id_servicio,
          disponible: true,
          observaciones: null
        })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            agregados++;
            if (agregados + errores === seleccionados.length) {
              this.finalizarAgregar(agregados, errores);
            }
          },
          error: () => {
            errores++;
            if (agregados + errores === seleccionados.length) {
              this.finalizarAgregar(agregados, errores);
            }
          }
        });
    });
  }

  private finalizarAgregar(agregados: number, errores: number): void {
    this.guardando = false;
    if (errores === 0) {
      this.mensajeExito = `✅ Se agregaron ${agregados} servicio(s)`;
      this.cerrarModal();
      this.cargarDatos();
    } else {
      this.error = `Error al agregar ${errores} servicio(s)`;
    }
    setTimeout(() => {
      this.mensajeExito = null;
      this.error = null;
    }, 3000);
  }

  removerServicio(servicioId: string, nombreServicio: string): void {
    this.itemAEliminar = servicioId;
    this.nombreItemAEliminar = nombreServicio;
    this.mostrarModalConfirmacion = true;
  }

  cancelarEliminar(): void {
    this.mostrarModalConfirmacion = false;
    this.itemAEliminar = null;
    this.nombreItemAEliminar = '';
  }

  confirmarEliminar(): void {
    if (!this.itemAEliminar) return;

    this.guardando = true;
    this.error = null;

    this.workshopService
      .removerServicio(this.itemAEliminar)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.mensajeExito = '✅ Servicio removido';
          this.mostrarModalConfirmacion = false;
          this.itemAEliminar = null;
          this.nombreItemAEliminar = '';
          this.guardando = false;
          this.cargarDatos();
          setTimeout(() => this.mensajeExito = null, 3000);
        },
        error: (err) => {
          this.guardando = false;
          this.error = err.error?.detail || 'Error al remover servicio';
        }
      });
  }
}
