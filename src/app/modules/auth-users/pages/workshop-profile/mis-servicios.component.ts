import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
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
      <div class="mb-6">
        <h1 class="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 text-transparent bg-clip-text mb-2">Mis Servicios</h1>
        <p class="text-gray-600 dark:text-slate-400">Gestiona los servicios que ofrece tu taller</p>
      </div>

      <div *ngIf="cargando" class="text-center py-8">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p class="text-gray-500 dark:text-slate-400 mt-2">Cargando servicios...</p>
      </div>

      <div *ngIf="error && !cargando" class="mb-4 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg border border-red-300 dark:border-red-700">{{ error }}</div>
      <div *ngIf="mensajeExito" class="mb-4 p-4 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 rounded-lg border border-green-300 dark:border-green-700">{{ mensajeExito }}</div>

      <div *ngIf="!cargando" class="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold text-gray-900 dark:text-white">Servicios Actuales</h2>
          <button (click)="abrirModalSolicitudes()" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition">Agregar Servicio</button>
        </div>

        <div class="mb-4" *ngIf="misServicios.length > 0">
          <input type="text" [(ngModel)]="busquedaActuales" placeholder="Buscar servicios..." class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white" />
        </div>

        <div *ngIf="misServicios.length > 0" class="space-y-2">
          <div *ngFor="let srv of serviciosListaFiltrados" class="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600">
            <div class="flex-1">
              <p class="font-semibold text-gray-900 dark:text-white">{{ srv.nombre_servicio }}</p>
              <p class="text-sm text-gray-600 dark:text-slate-400">{{ srv.descripcion }}</p>
              <p class="text-xs text-gray-500 dark:text-slate-500 mt-1">Tarifa: {{ srv.categoria_tarifa || '-' }} | Base: {{ srv.precio_base || 0 }} | Ida min.: {{ srv.precio_ida_minimo || 0 }}</p>
            </div>
            <div class="flex items-center gap-2">
              <button (click)="abrirModalEditarEspecificaciones(srv)" class="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded text-sm">Editar especificaciones</button>
              <button (click)="removerServicio(srv.id_servicio)" [disabled]="guardando" class="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm">Remover</button>
            </div>
          </div>
        </div>

        <p *ngIf="misServicios.length === 0" class="text-gray-500 dark:text-slate-400 text-center py-8">No tienes servicios agregados.</p>
      </div>

      <div *ngIf="mostrarModal" class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div class="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-auto p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Agregar Servicio</h2>
            <button (click)="cerrarModal()" class="text-gray-500 text-2xl">x</button>
          </div>
          <input type="text" [(ngModel)]="busqueda" placeholder="Buscar servicios..." class="w-full px-4 py-2 mb-4 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white" />
          <div class="space-y-2 max-h-96 overflow-y-auto">
            <div *ngFor="let srv of serviciosFiltrados" class="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600">
              <div>
                <p class="font-semibold text-gray-900 dark:text-white">{{ srv.nombre_servicio }}</p>
                <p class="text-sm text-gray-600 dark:text-slate-400">{{ srv.descripcion }}</p>
              </div>
              <button (click)="abrirModalConfigServicio(srv)" class="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm">Agregar</button>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="mostrarModalConfigServicio" class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div class="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-xl w-full p-6">
          <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-1">Configurar servicio</h3>
          <p class="text-sm text-gray-600 dark:text-slate-400 mb-4">{{ servicioSeleccionado?.nombre_servicio }}</p>
          <ng-container *ngTemplateOutlet="specForm"></ng-container>
          <div class="mt-4 flex justify-end gap-2">
            <button (click)="cerrarModalConfigServicio()" class="px-4 py-2 bg-gray-300 dark:bg-slate-600 rounded">Cancelar</button>
            <button (click)="solicitarServicio()" [disabled]="guardando" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50">Agregar</button>
          </div>
        </div>
      </div>

      <div *ngIf="mostrarModalEditarEspecificaciones" class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div class="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-xl w-full p-6">
          <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-1">Editar especificaciones</h3>
          <p class="text-sm text-gray-600 dark:text-slate-400 mb-4">{{ servicioEditando?.nombre_servicio }}</p>
          <ng-container *ngTemplateOutlet="specForm"></ng-container>
          <div class="mt-4 flex justify-end gap-2">
            <button (click)="cerrarModalEditarEspecificaciones()" class="px-4 py-2 bg-gray-300 dark:bg-slate-600 rounded">Cancelar</button>
            <button (click)="guardarEspecificaciones()" [disabled]="guardando" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50">Guardar</button>
          </div>
        </div>
      </div>

      <ng-template #specForm>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label class="text-sm font-semibold text-gray-700 dark:text-slate-300">
            Precio base
            <input type="number" min="0" [(ngModel)]="formEspecificaciones.precio_base" class="mt-1 w-full px-3 py-2 rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white" />
            <span class="block mt-1 text-xs text-gray-500 dark:text-slate-400">Monto normal del servicio.</span>
          </label>
          <label class="text-sm font-semibold text-gray-700 dark:text-slate-300">
            Precio ida mínimo
            <input type="number" min="0" [(ngModel)]="formEspecificaciones.precio_ida_minimo" class="mt-1 w-full px-3 py-2 rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white" />
            <span class="block mt-1 text-xs text-gray-500 dark:text-slate-400">Cobro mínimo por desplazamiento.</span>
          </label>
        </div>
        <label class="mt-3 block text-sm font-semibold text-gray-700 dark:text-slate-300">
          Observaciones
          <textarea [(ngModel)]="formEspecificaciones.observaciones" rows="3" placeholder="Notas adicionales sobre este servicio" class="mt-1 w-full px-3 py-2 rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"></textarea>
        </label>
        <label class="mt-3 flex items-center gap-2 text-sm text-gray-700 dark:text-slate-300"><input type="checkbox" [(ngModel)]="formEspecificaciones.disponible" /> Servicio disponible ahora</label>
      </ng-template>
    </div>
  `,
})
export class MisServiciosComponent implements OnInit, OnDestroy {
  misServicios: TallerServicio[] = [];
  todosServicios: Servicio[] = [];
  serviciosFiltrados: Servicio[] = [];
  cargando = true;
  guardando = false;
  error: string | null = null;
  mensajeExito: string | null = null;
  busqueda = '';
  busquedaActuales = '';
  mostrarModal = false;
  mostrarModalConfigServicio = false;
  mostrarModalEditarEspecificaciones = false;
  servicioSeleccionado: Servicio | null = null;
  servicioEditando: TallerServicio | null = null;

  formEspecificaciones = {
    disponible: true,
    observaciones: '',
    precio_base: 0,
    precio_ida_minimo: 0,
  };

  private destroy$ = new Subject<void>();
  constructor(private workshopService: WorkshopService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.cargarDatos(); }
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  private cargarDatos(): void {
    this.cargando = true;
    this.workshopService.getAllServicios().pipe(takeUntil(this.destroy$)).subscribe({
      next: (all) => {
        this.todosServicios = all || [];
        this.workshopService.getMisServicios().pipe(takeUntil(this.destroy$)).subscribe({
          next: (mine) => { this.misServicios = mine || []; this.cargando = false; this.cdr.markForCheck(); },
          error: () => { this.error = 'Error al cargar mis servicios'; this.cargando = false; },
        });
      },
      error: () => { this.error = 'Error al cargar servicios disponibles'; this.cargando = false; },
    });
  }

  private actualizarServiciosFiltrados(): void {
    const idsDelTaller = new Set(this.misServicios.map((s) => s.id_servicio));
    this.serviciosFiltrados = this.todosServicios
      .filter((s) => !idsDelTaller.has(s.id_servicio))
      .filter((s) => s.nombre_servicio.toLowerCase().includes(this.busqueda.toLowerCase()) || (s.descripcion || '').toLowerCase().includes(this.busqueda.toLowerCase()));
  }

  abrirModalSolicitudes(): void { this.mostrarModal = true; this.actualizarServiciosFiltrados(); }
  cerrarModal(): void { this.mostrarModal = false; this.busqueda = ''; }

  get serviciosListaFiltrados(): TallerServicio[] {
    const t = this.busquedaActuales.trim().toLowerCase();
    if (!t) return this.misServicios;
    return this.misServicios.filter((s) => s.nombre_servicio.toLowerCase().includes(t) || (s.descripcion || '').toLowerCase().includes(t));
  }

  private resetFormEspecificaciones(): void {
    this.formEspecificaciones = { disponible: true, observaciones: '', precio_base: 0, precio_ida_minimo: 0 };
  }

  abrirModalConfigServicio(srv: Servicio): void {
    this.servicioSeleccionado = srv;
    this.resetFormEspecificaciones();
    this.mostrarModalConfigServicio = true;
  }

  cerrarModalConfigServicio(): void { this.mostrarModalConfigServicio = false; this.servicioSeleccionado = null; }

  abrirModalEditarEspecificaciones(srv: TallerServicio): void {
    this.servicioEditando = srv;
    this.formEspecificaciones = {
      disponible: srv.disponible ?? true,
      observaciones: srv.observaciones || '',
      precio_base: Number(srv.precio_base || 0),
      precio_ida_minimo: Number(srv.precio_ida_minimo || 0),
    };
    this.mostrarModalEditarEspecificaciones = true;
  }

  cerrarModalEditarEspecificaciones(): void { this.mostrarModalEditarEspecificaciones = false; this.servicioEditando = null; }

  private payloadEspecificaciones() {
    return {
      id_servicio: this.servicioSeleccionado?.id_servicio || this.servicioEditando?.id_servicio || '',
      disponible: this.formEspecificaciones.disponible,
      observaciones: this.formEspecificaciones.observaciones || null,
      precio_base: Number(this.formEspecificaciones.precio_base) || 0,
      precio_ida_minimo: Number(this.formEspecificaciones.precio_ida_minimo) || 0,
    };
  }

  solicitarServicio(): void {
    if (!this.servicioSeleccionado) return;
    this.guardando = true;
    this.workshopService.agregarServicio(this.payloadEspecificaciones()).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.guardando = false;
        this.cerrarModalConfigServicio();
        this.cerrarModal();
        this.mensajeExito = 'Servicio agregado correctamente';
        this.cargarDatos();
        setTimeout(() => (this.mensajeExito = null), 3000);
      },
      error: (err) => { this.guardando = false; this.error = err?.error?.detail || 'Error al agregar servicio'; },
    });
  }

  guardarEspecificaciones(): void {
    if (!this.servicioEditando) return;
    this.guardando = true;
    this.workshopService.actualizarServicio(this.servicioEditando.id_servicio, this.payloadEspecificaciones()).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.guardando = false;
        this.cerrarModalEditarEspecificaciones();
        this.mensajeExito = 'Especificaciones actualizadas';
        this.cargarDatos();
        setTimeout(() => (this.mensajeExito = null), 3000);
      },
      error: (err) => { this.guardando = false; this.error = err?.error?.detail || 'Error al actualizar especificaciones'; },
    });
  }

  removerServicio(servicioId: string): void {
    this.guardando = true;
    this.workshopService.removerServicio(servicioId).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { this.guardando = false; this.mensajeExito = 'Servicio removido'; this.cargarDatos(); setTimeout(() => (this.mensajeExito = null), 3000); },
      error: (err) => { this.guardando = false; this.error = err?.error?.detail || 'Error al remover servicio'; },
    });
  }
}
