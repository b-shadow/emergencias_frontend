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
      <div class="mb-6">
        <h1 class="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 text-transparent bg-clip-text mb-2">
          Mis Especialidades
        </h1>
        <p class="text-gray-600 dark:text-slate-400">Gestiona las especialidades que ofrece tu taller</p>
      </div>

      <div *ngIf="cargando" class="text-center py-8">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      </div>

      <div *ngIf="error && !cargando" class="mb-4 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg border border-red-300 dark:border-red-700">{{ error }}</div>
      <div *ngIf="mensajeExito" class="mb-4 p-4 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 rounded-lg border border-green-300 dark:border-green-700">{{ mensajeExito }}</div>

      <div *ngIf="!cargando" class="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold text-gray-900 dark:text-white">Especialidades Actuales</h2>
          <button (click)="abrirModalSolicitudes()" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition">Agregar Especialidad</button>
        </div>
        <div class="mb-4" *ngIf="misEspecialidades.length > 0">
          <input type="text" [(ngModel)]="busquedaActuales" placeholder="Buscar especialidades..." class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white" />
        </div>
        <div *ngIf="misEspecialidades.length > 0" class="space-y-2">
          <div *ngFor="let esp of especialidadesListaFiltradas" class="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600">
            <div>
              <p class="font-semibold text-gray-900 dark:text-white">{{ esp.nombre_especialidad }}</p>
              <p class="text-sm text-gray-600 dark:text-slate-400">{{ esp.descripcion }}</p>
            </div>
            <button (click)="removerEspecialidad(esp.id_especialidad)" [disabled]="guardando" class="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm">Remover</button>
          </div>
        </div>
      </div>

      <div *ngIf="mostrarModal" class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div class="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-auto p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Agregar Especialidad</h2>
            <button (click)="cerrarModal()" class="text-gray-500 text-2xl">x</button>
          </div>
          <input type="text" [(ngModel)]="busqueda" placeholder="Buscar especialidades..." class="w-full px-4 py-2 mb-4 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white" />
          <div class="space-y-2 max-h-96 overflow-y-auto">
            <div *ngFor="let esp of especialidadesFiltradas" class="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600">
              <div>
                <p class="font-semibold text-gray-900 dark:text-white">{{ esp.nombre_especialidad }}</p>
                <p class="text-sm text-gray-600 dark:text-slate-400">{{ esp.descripcion }}</p>
                <p class="text-xs text-gray-500 dark:text-slate-500">Estado: {{ esp.estado }}</p>
              </div>
              <button (click)="solicitarEspecialidad(esp)" [disabled]="guardando" class="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm">Agregar</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class MisEspecialidadesComponent implements OnInit, OnDestroy {
  misEspecialidades: TallerEspecialidad[] = [];
  todasEspecialidades: Especialidad[] = [];
  especialidadesFiltradas: Especialidad[] = [];
  cargando = true;
  guardando = false;
  error: string | null = null;
  mensajeExito: string | null = null;
  busqueda = '';
  busquedaActuales = '';
  mostrarModal = false;

  private destroy$ = new Subject<void>();

  constructor(private workshopService: WorkshopService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.cargarDatos(); }
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  private cargarDatos(): void {
    this.cargando = true;
    this.workshopService.getAllEspecialidades().pipe(takeUntil(this.destroy$)).subscribe({
      next: (all) => {
        this.todasEspecialidades = all || [];
        this.workshopService.getMisEspecialidades().pipe(takeUntil(this.destroy$)).subscribe({
          next: (mine) => {
            this.misEspecialidades = mine || [];
            this.cargando = false;
            this.cdr.markForCheck();
          },
          error: () => { this.error = 'Error al cargar mis especialidades'; this.cargando = false; }
        });
      },
      error: () => { this.error = 'Error al cargar especialidades disponibles'; this.cargando = false; }
    });
  }

  private actualizarEspecialidadesFiltradas(): void {
    const idsDelTaller = new Set(this.misEspecialidades.map(e => e.id_especialidad));
    this.especialidadesFiltradas = this.todasEspecialidades
      .filter(e => !idsDelTaller.has(e.id_especialidad))
      .filter(e => e.nombre_especialidad.toLowerCase().includes(this.busqueda.toLowerCase()) || (e.descripcion || '').toLowerCase().includes(this.busqueda.toLowerCase()));
  }

  abrirModalSolicitudes(): void { this.mostrarModal = true; this.actualizarEspecialidadesFiltradas(); }
  cerrarModal(): void { this.mostrarModal = false; this.busqueda = ''; }

  get especialidadesListaFiltradas(): TallerEspecialidad[] {
    const t = this.busquedaActuales.trim().toLowerCase();
    if (!t) return this.misEspecialidades;
    return this.misEspecialidades.filter(e => e.nombre_especialidad.toLowerCase().includes(t) || (e.descripcion || '').toLowerCase().includes(t));
  }

  solicitarEspecialidad(esp: Especialidad): void {
    this.guardando = true;
    this.workshopService.agregarEspecialidad({ id_especialidad: esp.id_especialidad }).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.guardando = false;
        this.cerrarModal();
        this.mensajeExito = 'Especialidad agregada correctamente';
        this.cargarDatos();
        setTimeout(() => (this.mensajeExito = null), 3000);
      },
      error: (err) => {
        this.guardando = false;
        this.error = err?.error?.detail || 'Error al agregar especialidad';
      }
    });
  }

  removerEspecialidad(especialidadId: string): void {
    this.guardando = true;
    this.workshopService.removerEspecialidad(especialidadId).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.guardando = false;
        this.mensajeExito = 'Especialidad removida';
        this.cargarDatos();
        setTimeout(() => (this.mensajeExito = null), 3000);
      },
      error: (err) => {
        this.guardando = false;
        this.error = err?.error?.detail || 'Error al remover especialidad';
      }
    });
  }
}
