import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';

interface Servicio {
  id_servicio: string;
  nombre_servicio: string;
  descripcion: string | null;
  estado: string;
}

@Component({
  selector: 'app-gestion-servicios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="px-6 py-4">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 text-transparent bg-clip-text mb-2">
          🔧 Gestionar Servicios
        </h1>
        <p class="text-gray-600 dark:text-slate-400">Crea, edita y elimina servicios del sistema</p>
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

      <!-- Content -->
      <div *ngIf="!cargando" class="space-y-4">
        <!-- Botón Agregar -->
        <div class="flex justify-end">
          <button
            (click)="abrirFormulario()"
            class="px-6 py-2 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-lg font-medium transition flex items-center gap-2"
          >
            ➕ Agregar Servicio
          </button>
        </div>

        <!-- Tabla -->
        <div class="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-100 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600">
                <tr>
                  <th class="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Nombre</th>
                  <th class="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Descripción</th>
                  <th class="px-4 py-3 text-center font-semibold text-gray-900 dark:text-white">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-slate-700">
                <tr *ngFor="let srv of servicios" class="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition">
                  <td class="px-4 py-3 text-gray-900 dark:text-white font-medium">{{ srv.nombre_servicio }}</td>
                  <td class="px-4 py-3 text-gray-700 dark:text-slate-300 text-sm">{{ srv.descripcion || '—' }}</td>
                  <td class="px-4 py-3 text-center">
                    <div class="flex gap-2 justify-center">
                      <button
                        (click)="editarServicio(srv)"
                        class="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-xs font-medium transition"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        (click)="eliminarServicio(srv)"
                        class="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-medium transition"
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Mensaje sin registros -->
          <div *ngIf="servicios.length === 0" class="p-8 text-center text-gray-500 dark:text-slate-400">
            <p class="text-lg">No hay servicios registrados</p>
          </div>
        </div>
      </div>

      <!-- Modal Formulario -->
      <div *ngIf="mostrarFormulario" class="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4 z-50">
        <div class="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full">
          <div class="p-6">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ editandoId ? '✏️ Editar Servicio' : '➕ Agregar Servicio' }}
              </h2>
              <button (click)="cerrarFormulario()" class="text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-white text-2xl">×</button>
            </div>

            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Nombre *</label>
                <input
                  type="text"
                  [(ngModel)]="formulario.nombre_servicio"
                  placeholder="Ej: GRUA"
                  class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Descripción</label>
                <textarea
                  [(ngModel)]="formulario.descripcion"
                  placeholder="Describe en qué consiste este servicio..."
                  rows="3"
                  class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>
            </div>

            <div class="flex gap-2 justify-end border-t border-gray-200 dark:border-slate-700 pt-4 mt-4">
              <button
                (click)="cerrarFormulario()"
                class="px-6 py-2 bg-gray-300 dark:bg-slate-600 hover:bg-gray-400 dark:hover:bg-slate-500 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                (click)="guardarServicio()"
                [disabled]="guardando"
                class="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ guardando ? '⏳ Guardando...' : '💾 Guardar' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Confirmación Eliminar -->
      <div *ngIf="mostrarConfirmacion" class="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4 z-50">
        <div class="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-sm w-full">
          <div class="p-6">
            <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">⚠️ Confirmar eliminación</h2>
            <p class="text-gray-700 dark:text-slate-300 mb-6">
              ¿Estás seguro de que deseas eliminar el servicio <strong>{{ servicioAEliminar?.nombre_servicio }}</strong>?
            </p>
            <div class="flex gap-2 justify-end">
              <button
                (click)="cerrarConfirmacion()"
                class="px-6 py-2 bg-gray-300 dark:bg-slate-600 hover:bg-gray-400 dark:hover:bg-slate-500 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                (click)="confirmarEliminar()"
                [disabled]="eliminando"
                class="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ eliminando ? '⏳ Eliminando...' : '🗑️ Eliminar' }}
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
export class GestionServiciosComponent implements OnInit, OnDestroy {
  servicios: Servicio[] = [];
  cargando = true;
  error: string | null = null;
  mostrarFormulario = false;
  mostrarConfirmacion = false;
  guardando = false;
  eliminando = false;
  editandoId: string | null = null;

  formulario = {
    nombre_servicio: '',
    descripcion: ''
  };

  servicioAEliminar: Servicio | null = null;
  private destroy$ = new Subject<void>();
  private apiUrl = `${environment.apiUrl}/admin/servicios`;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.cargarServicios();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarServicios(): void {
    this.cargando = true;
    this.error = null;

    this.http.get<Servicio[]>(this.apiUrl)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.servicios = data;
          this.cargando = false;
        },
        error: (err) => {
          this.error = 'Error al cargar servicios';
          this.cargando = false;
          console.error('Error:', err);
        }
      });
  }

  abrirFormulario(): void {
    this.editandoId = null;
    this.formulario = { nombre_servicio: '', descripcion: '' };
    this.mostrarFormulario = true;
  }

  editarServicio(srv: Servicio): void {
    this.editandoId = srv.id_servicio;
    this.formulario = {
      nombre_servicio: srv.nombre_servicio,
      descripcion: srv.descripcion || ''
    };
    this.mostrarFormulario = true;
  }

  cerrarFormulario(): void {
    this.mostrarFormulario = false;
    this.editandoId = null;
    this.formulario = { nombre_servicio: '', descripcion: '' };
  }

  guardarServicio(): void {
    if (!this.formulario.nombre_servicio.trim()) {
      alert('El nombre es requerido');
      return;
    }

    this.guardando = true;

    if (this.editandoId) {
      // Editar
      this.http.put<Servicio>(`${this.apiUrl}/${this.editandoId}`, this.formulario)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.cargarServicios();
            this.cerrarFormulario();
            this.guardando = false;
          },
          error: (err) => {
            this.error = 'Error al actualizar servicio';
            this.guardando = false;
            console.error('Error:', err);
          }
        });
    } else {
      // Crear
      this.http.post<Servicio>(this.apiUrl, this.formulario)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.cargarServicios();
            this.cerrarFormulario();
            this.guardando = false;
          },
          error: (err) => {
            this.error = 'Error al crear servicio';
            this.guardando = false;
            console.error('Error:', err);
          }
        });
    }
  }

  eliminarServicio(srv: Servicio): void {
    this.servicioAEliminar = srv;
    this.mostrarConfirmacion = true;
  }

  cerrarConfirmacion(): void {
    this.mostrarConfirmacion = false;
    this.servicioAEliminar = null;
  }

  confirmarEliminar(): void {
    if (!this.servicioAEliminar) return;

    this.eliminando = true;

    this.http.delete(`${this.apiUrl}/${this.servicioAEliminar.id_servicio}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.cargarServicios();
          this.cerrarConfirmacion();
          this.eliminando = false;
        },
        error: (err) => {
          this.error = 'Error al eliminar servicio';
          this.eliminando = false;
          console.error('Error:', err);
        }
      });
  }
}
