import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { NgChartsModule } from 'ng2-charts';
import {
  EstadisticasGeneralesResponse,
  EstadisticasSistemaService,
} from '@core/services/estadisticas-sistema.service';

@Component({
  selector: 'app-admin-estadisticas-sistema',
  standalone: true,
  imports: [CommonModule, FormsModule, NgChartsModule],
  template: `
    <div class="px-6 py-4 space-y-6">
      <div>
        <h1 class="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 text-transparent bg-clip-text mb-2">
          Reportes del Sistema
        </h1>
        <p class="text-gray-600 dark:text-slate-400">
          Reportes por filtros para administracion
        </p>
      </div>

      <div class="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 p-6">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">Filtros</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Desde</label>
            <input
              type="date"
              [(ngModel)]="filtro.fecha_inicio"
              (change)="aplicarFiltros()"
              class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Hasta</label>
            <input
              type="date"
              [(ngModel)]="filtro.fecha_fin"
              (change)="aplicarFiltros()"
              class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Agrupar por</label>
            <select
              [(ngModel)]="filtro.agrupar_por"
              (change)="aplicarFiltros()"
              class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            >
              <option value="dia">Dia</option>
              <option value="semana">Semana</option>
              <option value="mes">Mes</option>
              <option value="categoria">Categoria</option>
              <option value="urgencia">Urgencia</option>
              <option value="estado">Estado</option>
              <option value="taller">Taller</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Urgencia</label>
            <select
              [(ngModel)]="filtro.nivel_urgencia"
              (change)="aplicarFiltros()"
              class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            >
              <option value="">Todas</option>
              <option value="BAJO">BAJO</option>
              <option value="MEDIO">MEDIO</option>
              <option value="ALTO">ALTO</option>
              <option value="CRITICO">CRITICO</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Estado solicitud</label>
            <select
              [(ngModel)]="filtro.estado_solicitud"
              (change)="aplicarFiltros()"
              class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            >
              <option value="">Todos</option>
              <option value="REGISTRADA">REGISTRADA</option>
              <option value="EN_PROCESO">EN_PROCESO</option>
              <option value="ATENDIDA">ATENDIDA</option>
              <option value="CANCELADA">CANCELADA</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Categoria</label>
            <input
              type="text"
              [(ngModel)]="filtro.categoria_incidente"
              (input)="aplicarFiltros()"
              placeholder="Ej: PINCHAZO_LLANTA"
              class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Id taller</label>
            <input
              type="text"
              [(ngModel)]="filtro.id_taller"
              (input)="aplicarFiltros()"
              placeholder="UUID opcional"
              class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            />
          </div>
          <div class="flex items-end gap-2">
            <button
              (click)="cargarEstadisticas()"
              class="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
            >
              Actualizar
            </button>
            <button
              (click)="limpiarFiltros()"
              class="px-4 py-2 bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      <div *ngIf="cargando" class="text-center py-10 text-gray-500 dark:text-slate-400">Cargando reportes...</div>
      <div *ngIf="error" class="p-4 rounded-lg border border-red-300 bg-red-50 text-red-700 dark:bg-red-900 dark:text-red-200">{{ error }}</div>

      <div *ngIf="!cargando && estadisticas" class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-5 text-white">
            <div class="text-sm">Total emergencias</div>
            <div class="text-3xl font-bold mt-2">{{ estadisticas.total_emergencias }}</div>
          </div>
          <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-5 text-white">
            <div class="text-sm">Atendidas</div>
            <div class="text-3xl font-bold mt-2">{{ estadisticas.total_solicitudes_atendidas }}</div>
          </div>
          <div class="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-5 text-white">
            <div class="text-sm">Servicios</div>
            <div class="text-3xl font-bold mt-2">{{ estadisticas.total_servicios_realizados }}</div>
          </div>
          <div class="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-5 text-white">
            <div class="text-sm">Talleres activos</div>
            <div class="text-3xl font-bold mt-2">{{ estadisticas.talleres_activos }}</div>
          </div>
          <div class="bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg p-5 text-white">
            <div class="text-sm">Clientes activos</div>
            <div class="text-3xl font-bold mt-2">{{ estadisticas.clientes_activos }}</div>
          </div>
        </div>

        <div class="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 p-6">
          <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">Reporte tabular</h3>

          <div *ngIf="!estadisticas.reporte || estadisticas.reporte.tabla.length === 0" class="text-gray-500 dark:text-slate-400">
            No hay registros para los filtros aplicados.
          </div>

          <div *ngIf="estadisticas.reporte && estadisticas.reporte.tabla.length > 0" class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-gray-200 dark:border-slate-700 text-left text-gray-700 dark:text-slate-300">
                  <th class="py-2 pr-4">Grupo</th>
                  <th class="py-2 pr-4">Total</th>
                  <th class="py-2 pr-4">Atendidas</th>
                  <th class="py-2 pr-4">Canceladas</th>
                  <th class="py-2 pr-4">Completadas</th>
                  <th class="py-2 pr-4">Tasa %</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of estadisticas.reporte.tabla" class="border-b border-gray-100 dark:border-slate-800">
                  <td class="py-2 pr-4 font-medium text-gray-900 dark:text-white">{{ item.grupo }}</td>
                  <td class="py-2 pr-4">{{ item.total_solicitudes }}</td>
                  <td class="py-2 pr-4">{{ item.solicitudes_atendidas }}</td>
                  <td class="py-2 pr-4">{{ item.solicitudes_canceladas }}</td>
                  <td class="py-2 pr-4">{{ item.servicios_completados }}</td>
                  <td class="py-2 pr-4">{{ item.tasa_completacion | number : '1.0-2' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6" *ngIf="estadisticas.reporte && estadisticas.reporte.tabla.length > 0">
          <div class="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 p-6">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">Solicitudes por grupo</h3>
            <div style="position: relative; width: 100%; height: 280px;">
              <canvas baseChart [data]="reporteBarrasChart.data" [options]="reporteBarrasChart.options" [type]="'bar'"></canvas>
            </div>
          </div>
          <div class="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 p-6">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">Completacion por grupo</h3>
            <div style="position: relative; width: 100%; height: 280px;">
              <canvas baseChart [data]="reporteCompletacionChart.data" [options]="reporteCompletacionChart.options" [type]="'doughnut'"></canvas>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AdminEstadisticasSistemaComponent implements OnInit, OnDestroy {
  estadisticas: EstadisticasGeneralesResponse | null = null;
  cargando = false;
  error: string | null = null;

  reporteBarrasChart: any = { data: {}, options: {} };
  reporteCompletacionChart: any = { data: {}, options: {} };

  filtro = {
    fecha_inicio: '',
    fecha_fin: '',
    agrupar_por: 'dia',
    nivel_urgencia: '',
    categoria_incidente: '',
    estado_solicitud: '',
    id_taller: '',
  };

  private destroy$ = new Subject<void>();
  private filtrosChange$ = new Subject<void>();

  constructor(
    private estadisticasService: EstadisticasSistemaService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.inicializarFechas();
    this.cargarEstadisticas();

    this.filtrosChange$
      .pipe(debounceTime(500), takeUntil(this.destroy$))
      .subscribe(() => this.cargarEstadisticas());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  inicializarFechas(): void {
    const hoy = new Date();
    const hace30Dias = new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000);
    this.filtro.fecha_fin = this.formatoFecha(hoy);
    this.filtro.fecha_inicio = this.formatoFecha(hace30Dias);
  }

  formatoFecha(fecha: Date): string {
    return fecha.toISOString().split('T')[0];
  }

  aplicarFiltros(): void {
    this.filtrosChange$.next();
  }

  limpiarFiltros(): void {
    this.inicializarFechas();
    this.filtro.agrupar_por = 'dia';
    this.filtro.nivel_urgencia = '';
    this.filtro.categoria_incidente = '';
    this.filtro.estado_solicitud = '';
    this.filtro.id_taller = '';
    this.cargarEstadisticas();
  }

  cargarEstadisticas(): void {
    this.cargando = true;
    this.error = null;

    this.estadisticasService
      .obtenerEstadisticasSistema(
        this.filtro.fecha_inicio,
        this.filtro.fecha_fin,
        this.filtro.agrupar_por,
        this.filtro.nivel_urgencia || undefined,
        this.filtro.categoria_incidente || undefined,
        this.filtro.estado_solicitud || undefined,
        this.filtro.id_taller || undefined
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.estadisticas = data;
          this.cargando = false;
          this.setupReporteCharts();
          this.cdr.markForCheck();
        },
        error: () => {
          this.error = 'Error al cargar reportes del sistema';
          this.cargando = false;
          this.cdr.markForCheck();
        },
      });
  }

  setupReporteCharts(): void {
    if (!this.estadisticas?.reporte || this.estadisticas.reporte.tabla.length === 0) {
      this.reporteBarrasChart = { data: {}, options: {} };
      this.reporteCompletacionChart = { data: {}, options: {} };
      return;
    }

    const categorias = this.estadisticas.reporte.graficos.categorias;
    const completadas = this.estadisticas.reporte.graficos.serie_servicios_completados;

    this.reporteBarrasChart = {
      data: {
        labels: categorias,
        datasets: [
          {
            label: 'Total solicitudes',
            data: this.estadisticas.reporte.graficos.serie_total_solicitudes,
            backgroundColor: '#3b82f6',
          },
          {
            label: 'Atendidas',
            data: this.estadisticas.reporte.graficos.serie_solicitudes_atendidas,
            backgroundColor: '#10b981',
          },
          {
            label: 'Canceladas',
            data: this.estadisticas.reporte.graficos.serie_solicitudes_canceladas,
            backgroundColor: '#ef4444',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
      },
    };

    this.reporteCompletacionChart = {
      data: {
        labels: categorias,
        datasets: [
          {
            data: completadas,
            backgroundColor: ['#8b5cf6', '#06b6d4', '#f59e0b', '#22c55e', '#ef4444', '#3b82f6'],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
      },
    };
  }
}
