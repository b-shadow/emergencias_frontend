import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { WorkshopService, Especialidad, TallerEspecialidad } from '@core/services/workshop.service';

@Component({
  selector: 'app-mis-especialidades',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="px-6 py-4">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 text-transparent bg-clip-text mb-2">
          🔧 Mis Especialidades
        </h1>
        <p class="text-gray-600 dark:text-slate-400">Gestiona las especialidades que ofrece tu taller</p>
      </div>

      <!-- Loading -->
      <div *ngIf="cargando" class="text-center py-8">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p class="text-gray-500 dark:text-slate-400 mt-2">Cargando especialidades...</p>
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
          <h2 class="text-xl font-bold text-gray-900 dark:text-white">📌 Especialidades Actuales</h2>
          <button
            (click)="abrirModalAgregar()"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
          >
            ➕ Agregar Especialidad
          </button>
        </div>

        <!-- Search -->
        <div class="mb-4" *ngIf="misEspecialidades.length > 0">
          <input
            type="text"
            [(ngModel)]="busquedaActuales"
            placeholder="🔍 Buscar especialidades..."
            class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div *ngIf="misEspecialidades.length > 0" class="space-y-2">
          <div *ngFor="let esp of especialidadesListaFiltradas" class="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600">
            <div>
              <p class="font-semibold text-gray-900 dark:text-white">{{ esp.nombre_especialidad }}</p>
              <p class="text-sm text-gray-600 dark:text-slate-400">{{ esp.descripcion }}</p>
            </div>
            <button
              (click)="removerEspecialidad(esp.id_especialidad, esp.nombre_especialidad)"
              [disabled]="guardando"
              class="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm font-medium transition-colors disabled:opacity-50"
            >
              ❌ Remover
            </button>
          </div>
          <p *ngIf="especialidadesListaFiltradas.length === 0 && busquedaActuales" class="text-gray-500 dark:text-slate-400 text-center py-4">
            No hay especialidades que coincidan con la búsqueda
          </p>
        </div>
        <p *ngIf="misEspecialidades.length === 0" class="text-gray-500 dark:text-slate-400 text-center py-8">
          No tienes especialidades agregadas. ➕ Agrega una nueva.
        </p>
      </div>

      <!-- Modal Agregar -->
      <div *ngIf="mostrarModal" class="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4 z-50">
        <div class="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-auto">
          <div class="p-6">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-2xl font-bold text-gray-900 dark:text-white">✨ Agregar Especialidades</h2>
              <button (click)="cerrarModal()" class="text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-white text-2xl">×</button>
            </div>

            <!-- Search -->
            <div class="mb-4">
              <input
                type="text"
                [(ngModel)]="busqueda"
                placeholder="🔍 Buscar especialidades..."
                class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <!-- Checkboxes -->
            <div class="space-y-2 max-h-96 overflow-y-auto mb-6">
              <div *ngFor="let esp of especialidadesFiltradas" class="flex items-start p-3 bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-600 transition">
                <input
                  type="checkbox"
                  [id]="'esp-' + esp.id_especialidad"
                  [(ngModel)]="esp.seleccionada"
                  class="mt-1 w-4 h-4 text-blue-600 rounded cursor-pointer"
                />
                <label [for]="'esp-' + esp.id_especialidad" class="ml-3 flex-1 cursor-pointer">
                  <p class="font-semibold text-gray-900 dark:text-white">{{ esp.nombre_especialidad }}</p>
                  <p class="text-sm text-gray-600 dark:text-slate-400">{{ esp.descripcion }}</p>
                </label>
              </div>
              <p *ngIf="especialidadesFiltradas.length === 0" class="text-center text-gray-500 dark:text-slate-400 py-4">
                No hay especialidades disponibles
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
                (click)="agregarSeleccionadas()"
                [disabled]="!haySeleccionadas || guardando"
                class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ guardando ? '⏳ Agregando...' : '✓ Agregar Seleccionadas' }}
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
              ¿Estás seguro de que deseas remover la especialidad <strong>{{ nombreItemAEliminar }}</strong>?
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
export class MisEspecialidadesComponent implements OnInit, OnDestroy {
  misEspecialidades: TallerEspecialidad[] = [];
  todasEspecialidades: Especialidad[] = [];
  especialidadesFiltradas: (Especialidad & { seleccionada: boolean })[] = [];

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

  constructor(private workshopService: WorkshopService, private cdr: ChangeDetectorRef) {}

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

    // Cargar ambas listas en paralelo
    let especialidadesCompletas = false;
    let misEspecialidadesCompletas = false;

    // Cargar todas las especialidades
    this.workshopService
      .getAllEspecialidades()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.todasEspecialidades = data || [];
          especialidadesCompletas = true;
          if (misEspecialidadesCompletas) {
            this.cargando = false;
            this.cdr.markForCheck();
          }
        },
        error: (err) => {
          this.error = 'Error al cargar especialidades disponibles';
          this.cargando = false;
          this.cdr.markForCheck();
        }
      });

    // Cargar mis especialidades
    this.workshopService
      .getMisEspecialidades()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.misEspecialidades = data || [];
          misEspecialidadesCompletas = true;
          if (especialidadesCompletas) {
            this.cargando = false;
            this.cdr.markForCheck();
          }
        },
        error: (err) => {
          this.error = 'Error al cargar mis especialidades';
          this.cargando = false;
          this.cdr.markForCheck();
        }
      });
  }

  private actualizarEspecialidadesFiltradas(): void {
    const idsDelTaller = new Set(this.misEspecialidades.map(e => e.id_especialidad));

    this.especialidadesFiltradas = this.todasEspecialidades
      .filter(e => !idsDelTaller.has(e.id_especialidad))
      .filter(e =>
        e.nombre_especialidad.toLowerCase().includes(this.busqueda.toLowerCase()) ||
        (e.descripcion && e.descripcion.toLowerCase().includes(this.busqueda.toLowerCase()))
      )
      .map(e => ({ ...e, seleccionada: false }));
  }

  abrirModalAgregar(): void {
    this.mostrarModal = true;
    this.actualizarEspecialidadesFiltradas();
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.busqueda = '';
  }

  get haySeleccionadas(): boolean {
    return this.especialidadesFiltradas.some(e => e.seleccionada);
  }

  get especialidadesListaFiltradas(): TallerEspecialidad[] {
    if (!this.busquedaActuales.trim()) {
      return this.misEspecialidades;
    }
    const termino = this.busquedaActuales.toLowerCase();
    return this.misEspecialidades.filter(e =>
      e.nombre_especialidad.toLowerCase().includes(termino) ||
      (e.descripcion && e.descripcion.toLowerCase().includes(termino))
    );
  }

  agregarSeleccionadas(): void {
    const seleccionadas = this.especialidadesFiltradas.filter(e => e.seleccionada);
    if (seleccionadas.length === 0) return;

    this.guardando = true;
    this.error = null;

    let agregadas = 0;
    let errores = 0;

    seleccionadas.forEach(esp => {
      this.workshopService
        .agregarEspecialidad({ id_especialidad: esp.id_especialidad })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            agregadas++;
            if (agregadas + errores === seleccionadas.length) {
              this.finalizarAgregar(agregadas, errores);
            }
          },
          error: () => {
            errores++;
            if (agregadas + errores === seleccionadas.length) {
              this.finalizarAgregar(agregadas, errores);
            }
          }
        });
    });
  }

  private finalizarAgregar(agregadas: number, errores: number): void {
    this.guardando = false;
    if (errores === 0) {
      this.mensajeExito = `✅ Se agregaron ${agregadas} especialidad(es)`;
      this.cerrarModal();
      this.cargarDatos();
    } else {
      this.error = `Error al agregar ${errores} especialidad(es)`;
    }
    setTimeout(() => {
      this.mensajeExito = null;
      this.error = null;
    }, 3000);
  }

  removerEspecialidad(especialidadId: string, nombreEspecialidad: string): void {
    this.itemAEliminar = especialidadId;
    this.nombreItemAEliminar = nombreEspecialidad;
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
      .removerEspecialidad(this.itemAEliminar)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.mensajeExito = '✅ Especialidad removida';
          this.mostrarModalConfirmacion = false;
          this.itemAEliminar = null;
          this.nombreItemAEliminar = '';
          this.guardando = false;
          this.cargarDatos();
          setTimeout(() => this.mensajeExito = null, 3000);
        },
        error: (err) => {
          this.guardando = false;
          this.error = err.error?.detail || 'Error al remover especialidad';
        }
      });
  }
}
