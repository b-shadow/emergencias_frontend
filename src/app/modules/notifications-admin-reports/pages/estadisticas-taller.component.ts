import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { NgChartsModule } from 'ng2-charts';
import {
  EstadisticasTallerResponse,
  EstadisticasTallerService,
  OpcionesFiltrosTaller,
} from '@core/services/estadisticas-taller.service';

@Component({
  selector: 'app-estadisticas-taller',
  standalone: true,
  imports: [CommonModule, FormsModule, NgChartsModule],
  template: `
    <div class="px-6 py-4 space-y-6">
      <div>
        <h1 class="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 text-transparent bg-clip-text mb-2">
          Reportes del Taller
        </h1>
        <p class="text-gray-600 dark:text-slate-400">Reportes por filtros de operaciones del taller</p>
      </div>

      <div class="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 p-6">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">Filtros</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Fecha inicio</label>
            <input type="date" [(ngModel)]="filtros.fechaInicio" (change)="aplicarFiltros()"
              class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Fecha fin</label>
            <input type="date" [(ngModel)]="filtros.fechaFin" (change)="aplicarFiltros()"
              class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Agrupar por</label>
            <select [(ngModel)]="filtros.agruparPor" (change)="aplicarFiltros()"
              class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white">
              <option value="dia">Dia</option>
              <option value="semana">Semana</option>
              <option value="mes">Mes</option>
              <option value="categoria">Categoria</option>
              <option value="urgencia">Urgencia</option>
              <option value="estado_solicitud">Estado solicitud</option>
              <option value="estado_asignacion">Estado asignacion</option>
              <option value="estado_resultado">Estado resultado</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Urgencia</label>
            <select [(ngModel)]="filtros.nivelUrgencia" (change)="aplicarFiltros()"
              class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white">
              <option value="">Todas</option>
              <option *ngFor="let item of opciones.urgencias" [value]="item">{{ item }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Estado solicitud</label>
            <select [(ngModel)]="filtros.estadoSolicitud" (change)="aplicarFiltros()"
              class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white">
              <option value="">Todos</option>
              <option *ngFor="let item of opciones.estados_solicitud" [value]="item">{{ item }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Estado asignacion</label>
            <select [(ngModel)]="filtros.estadoAsignacion" (change)="aplicarFiltros()"
              class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white">
              <option value="">Todos</option>
              <option *ngFor="let item of opciones.estados_asignacion" [value]="item">{{ item }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Estado resultado</label>
            <select [(ngModel)]="filtros.estadoResultado" (change)="aplicarFiltros()"
              class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white">
              <option value="">Todos</option>
              <option *ngFor="let item of opciones.estados_resultado" [value]="item">{{ item }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Categoria</label>
            <select [(ngModel)]="filtros.categoriaIncidente" (change)="aplicarFiltros()"
              class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white">
              <option value="">Todas</option>
              <option *ngFor="let item of opciones.categorias_incidente" [value]="item">{{ item }}</option>
            </select>
          </div>
          <div class="flex items-end gap-2">
            <button (click)="cargarEstadisticas()" class="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">
              Actualizar
            </button>
            <button (click)="limpiarFiltros()" class="px-4 py-2 bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg">
              Reset
            </button>
          </div>
        </div>
      </div>

      <div *ngIf="cargando" class="text-center py-10 text-gray-500 dark:text-slate-400">Cargando reportes...</div>
      <div *ngIf="error" class="p-4 rounded-lg border border-red-300 bg-red-50 text-red-700 dark:bg-red-900 dark:text-red-200">{{ error }}</div>

      <div *ngIf="!cargando && respuesta" class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" *ngIf="respuesta.estadisticas as est">
          <div class="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 p-5">
            <div class="text-sm text-gray-600 dark:text-slate-400">Solicitudes atendidas</div>
            <div class="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{{ est.total_solicitudes_atendidas }}</div>
          </div>
          <div class="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 p-5">
            <div class="text-sm text-gray-600 dark:text-slate-400">Canceladas</div>
            <div class="text-3xl font-bold text-red-600 dark:text-red-400 mt-2">{{ est.total_solicitudes_canceladas }}</div>
          </div>
          <div class="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 p-5">
            <div class="text-sm text-gray-600 dark:text-slate-400">Servicios completados</div>
            <div class="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">{{ est.total_servicios_completados }}</div>
          </div>
          <div class="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 p-5">
            <div class="text-sm text-gray-600 dark:text-slate-400">Tasa completacion</div>
            <div class="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">{{ est.tasa_completacion | number : '1.0-2' }}%</div>
          </div>
        </div>

        <div class="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 p-6">
          <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white">Reporte tabular</h3>
            <div class="flex gap-2" *ngIf="respuesta.reporte && respuesta.reporte.tabla.length > 0">
              <button (click)="exportarCsv()" class="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium">Exportar CSV</button>
              <button (click)="exportarHtml()" class="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium">Exportar HTML</button>
            </div>
          </div>

          <div *ngIf="!respuesta.reporte || respuesta.reporte.tabla.length === 0" class="text-gray-500 dark:text-slate-400">
            No hay registros para los filtros aplicados.
          </div>

          <div *ngIf="respuesta.reporte && respuesta.reporte.tabla.length > 0" class="overflow-x-auto">
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
                <tr *ngFor="let item of respuesta.reporte.tabla" class="border-b border-gray-100 dark:border-slate-800">
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

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6" *ngIf="respuesta.reporte && respuesta.reporte.tabla.length > 0">
          <div class="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 p-6">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">Solicitudes por grupo</h3>
            <div style="position: relative; width: 100%; height: 280px;">
              <canvas baseChart [data]="reporteBarrasChart.data" [options]="reporteBarrasChart.options" [type]="'bar'"></canvas>
            </div>
          </div>
          <div class="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 p-6">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">Servicios completados</h3>
            <div style="position: relative; width: 100%; height: 280px;">
              <canvas baseChart [data]="reporteCompletacionChart.data" [options]="reporteCompletacionChart.options" [type]="'doughnut'"></canvas>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class EstadisticasTallerComponent implements OnInit, OnDestroy {
  respuesta: EstadisticasTallerResponse | null = null;
  cargando = false;
  error: string | null = null;

  opciones: OpcionesFiltrosTaller = {
    urgencias: [],
    categorias_incidente: [],
    estados_solicitud: [],
    estados_asignacion: [],
    estados_resultado: [],
  };

  filtros = {
    fechaInicio: '',
    fechaFin: '',
    agruparPor: 'dia',
    nivelUrgencia: '',
    categoriaIncidente: '',
    estadoSolicitud: '',
    estadoAsignacion: '',
    estadoResultado: '',
  };

  reporteBarrasChart: any = { data: {}, options: {} };
  reporteCompletacionChart: any = { data: {}, options: {} };

  private destroy$ = new Subject<void>();
  private filtrosChange$ = new Subject<void>();

  constructor(
    private estadisticasService: EstadisticasTallerService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.inicializarFechas();
    this.cargarEstadisticas();
    this.filtrosChange$.pipe(debounceTime(500), takeUntil(this.destroy$)).subscribe(() => this.cargarEstadisticas());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  inicializarFechas(): void {
    const hoy = new Date();
    const hace30Dias = new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000);
    this.filtros.fechaFin = this.formatoFecha(hoy);
    this.filtros.fechaInicio = this.formatoFecha(hace30Dias);
  }

  formatoFecha(fecha: Date): string {
    return fecha.toISOString().split('T')[0];
  }

  aplicarFiltros(): void {
    this.filtrosChange$.next();
  }

  limpiarFiltros(): void {
    this.inicializarFechas();
    this.filtros.agruparPor = 'dia';
    this.filtros.nivelUrgencia = '';
    this.filtros.categoriaIncidente = '';
    this.filtros.estadoSolicitud = '';
    this.filtros.estadoAsignacion = '';
    this.filtros.estadoResultado = '';
    this.cargarEstadisticas();
  }

  cargarEstadisticas(): void {
    this.cargando = true;
    this.error = null;

    this.estadisticasService
      .obtenerMisEstadisticas(
        this.filtros.fechaInicio,
        this.filtros.fechaFin,
        this.filtros.agruparPor,
        this.filtros.nivelUrgencia || undefined,
        this.filtros.categoriaIncidente || undefined,
        this.filtros.estadoSolicitud || undefined,
        this.filtros.estadoAsignacion || undefined,
        this.filtros.estadoResultado || undefined
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.respuesta = data;
          this.opciones = data.opciones_filtros || this.opciones;
          this.sincronizarFiltrosConOpciones();
          this.cargando = false;
          this.setupReporteCharts();
          this.cdr.markForCheck();
        },
        error: () => {
          this.error = 'Error al cargar reportes del taller';
          this.cargando = false;
          this.cdr.markForCheck();
        },
      });
  }

  private sincronizarFiltrosConOpciones(): void {
    if (this.filtros.nivelUrgencia && !this.opciones.urgencias.includes(this.filtros.nivelUrgencia)) {
      this.filtros.nivelUrgencia = '';
    }
    if (this.filtros.categoriaIncidente && !this.opciones.categorias_incidente.includes(this.filtros.categoriaIncidente)) {
      this.filtros.categoriaIncidente = '';
    }
    if (this.filtros.estadoSolicitud && !this.opciones.estados_solicitud.includes(this.filtros.estadoSolicitud)) {
      this.filtros.estadoSolicitud = '';
    }
    if (this.filtros.estadoAsignacion && !this.opciones.estados_asignacion.includes(this.filtros.estadoAsignacion)) {
      this.filtros.estadoAsignacion = '';
    }
    if (this.filtros.estadoResultado && !this.opciones.estados_resultado.includes(this.filtros.estadoResultado)) {
      this.filtros.estadoResultado = '';
    }
  }

  exportarCsv(): void {
    if (!this.respuesta?.reporte?.tabla?.length) {
      return;
    }

    const encabezados = ['Grupo', 'Total', 'Atendidas', 'Canceladas', 'Completadas', 'Tasa %'];
    let csv = encabezados.map((h) => `"${h}"`).join(',') + '\n';

    for (const item of this.respuesta.reporte.tabla) {
      const fila = [
        item.grupo,
        item.total_solicitudes,
        item.solicitudes_atendidas,
        item.solicitudes_canceladas,
        item.servicios_completados,
        item.tasa_completacion,
      ];
      csv += fila.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',') + '\n';
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `reporte-taller-${Date.now()}.csv`);
    link.click();
    URL.revokeObjectURL(link.href);
  }

  exportarHtml(): void {
    if (!this.respuesta?.reporte?.tabla?.length) {
      return;
    }

    const rows = this.respuesta.reporte.tabla
      .map(
        (item) => `
          <tr>
            <td>${this.escapeHtml(item.grupo)}</td>
            <td>${item.total_solicitudes}</td>
            <td>${item.solicitudes_atendidas}</td>
            <td>${item.solicitudes_canceladas}</td>
            <td>${item.servicios_completados}</td>
            <td>${item.tasa_completacion}</td>
          </tr>`
      )
      .join('');

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Reporte Taller</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background: #f4f4f4; }
  </style>
</head>
<body>
  <h1>Reporte del Taller</h1>
  <p>Generado: ${new Date().toLocaleString()}</p>
  <table>
    <thead>
      <tr>
        <th>Grupo</th>
        <th>Total</th>
        <th>Atendidas</th>
        <th>Canceladas</th>
        <th>Completadas</th>
        <th>Tasa %</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `reporte-taller-${Date.now()}.html`);
    link.click();
    URL.revokeObjectURL(link.href);
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  setupReporteCharts(): void {
    if (!this.respuesta?.reporte || this.respuesta.reporte.tabla.length === 0) {
      this.reporteBarrasChart = { data: {}, options: {} };
      this.reporteCompletacionChart = { data: {}, options: {} };
      return;
    }

    const categorias = this.respuesta.reporte.graficos.categorias;

    this.reporteBarrasChart = {
      data: {
        labels: categorias,
        datasets: [
          {
            label: 'Total',
            data: this.respuesta.reporte.graficos.serie_total_solicitudes,
            backgroundColor: '#3b82f6',
          },
          {
            label: 'Atendidas',
            data: this.respuesta.reporte.graficos.serie_solicitudes_atendidas,
            backgroundColor: '#10b981',
          },
          {
            label: 'Canceladas',
            data: this.respuesta.reporte.graficos.serie_solicitudes_canceladas,
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
            data: this.respuesta.reporte.graficos.serie_servicios_completados,
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
