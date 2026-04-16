import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { EstadisticasSistemaService, EstadisticasGeneralesResponse } from '@core/services/estadisticas-sistema.service';

@Component({
  selector: 'app-admin-estadisticas-sistema',
  standalone: true,
  imports: [CommonModule, FormsModule, NgChartsModule],
  template: `
    <div class="px-6 py-4">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 text-transparent bg-clip-text mb-2">
          📊 Estadísticas Generales del Sistema
        </h1>
        <p class="text-gray-600 dark:text-slate-400">Análisis global del funcionamiento de la plataforma de emergencias vehiculares</p>
      </div>

      <!-- Filtros -->
      <div class="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 p-6 mb-6">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">🔍 Filtros de Fecha</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Desde</label>
            <input
              type="date"
              [(ngModel)]="filtro.fecha_inicio"
              (change)="aplicarFiltros()"
              class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Hasta</label>
            <input
              type="date"
              [(ngModel)]="filtro.fecha_fin"
              (change)="aplicarFiltros()"
              class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div class="flex items-end">
            <button
              (click)="limpiarFiltros()"
              class="w-full px-4 py-2 bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors"
            >
              ↻ Resetear
            </button>
          </div>
        </div>
      </div>

      <!-- Cargando -->
      <div *ngIf="cargando" class="text-center py-8">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p class="text-gray-500 dark:text-slate-400 mt-2">Cargando estadísticas...</p>
      </div>

      <!-- Error -->
      <div *ngIf="error && !cargando" class="mb-4 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg border border-red-300 dark:border-red-700">
        ❌ {{ error }}
      </div>

      <!-- Sin datos -->
      <div *ngIf="!cargando && !error && estadisticas?.mensaje_vacio" class="mb-4 p-6 bg-yellow-50 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-200 rounded-lg border border-yellow-300 dark:border-yellow-700 text-center">
        <p class="text-lg">ℹ️ {{ estadisticas?.mensaje_vacio }}</p>
      </div>

      <!-- Contenido -->
      <div *ngIf="!cargando && !error && !estadisticas?.mensaje_vacio && estadisticas" class="space-y-6">
        <!-- Resumen General -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div class="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-700 dark:to-blue-800 rounded-lg p-6 text-white shadow-md">
            <p class="text-sm font-medium opacity-90">Total Emergencias</p>
            <p class="text-3xl font-bold mt-2">{{ estadisticas.total_emergencias }}</p>
          </div>
          <div class="bg-gradient-to-br from-green-500 to-green-600 dark:from-green-700 dark:to-green-800 rounded-lg p-6 text-white shadow-md">
            <p class="text-sm font-medium opacity-90">Atendidas</p>
            <p class="text-3xl font-bold mt-2">{{ estadisticas.total_solicitudes_atendidas }}</p>
          </div>
          <div class="bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-700 dark:to-purple-800 rounded-lg p-6 text-white shadow-md">
            <p class="text-sm font-medium opacity-90">Servicios</p>
            <p class="text-3xl font-bold mt-2">{{ estadisticas.total_servicios_realizados }}</p>
          </div>
          <div class="bg-gradient-to-br from-orange-500 to-orange-600 dark:from-orange-700 dark:to-orange-800 rounded-lg p-6 text-white shadow-md">
            <p class="text-sm font-medium opacity-90">Talleres Activos</p>
            <p class="text-3xl font-bold mt-2">{{ estadisticas.talleres_activos }}</p>
          </div>
          <div class="bg-gradient-to-br from-pink-500 to-pink-600 dark:from-pink-700 dark:to-pink-800 rounded-lg p-6 text-white shadow-md">
            <p class="text-sm font-medium opacity-90">Clientes</p>
            <p class="text-3xl font-bold mt-2">{{ estadisticas.clientes_activos }}</p>
          </div>
        </div>

        <!-- Estado de Solicitudes - GRÁFICA DONA -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 p-6">
            <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4">📊 Estado de Solicitudes</h3>
            <div style="position: relative; width: 100%; height: 250px;">
              <canvas
                baseChart
                [data]="estadoSolicitudesChart.data"
                [options]="estadoSolicitudesChart.options"
                [type]="'doughnut'"
              ></canvas>
            </div>
          </div>

          <!-- Tiempo de Respuesta -->
          <div *ngIf="estadisticas.tiempo_respuesta" class="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 p-6">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">⏱️ Tiempo de Respuesta (minutos)</h3>
            <div class="space-y-4">
              <div class="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
                <p class="text-blue-600 dark:text-blue-300 text-sm font-medium">Promedio</p>
                <p class="text-3xl font-bold text-blue-900 dark:text-blue-100 mt-2">{{ estadisticas.tiempo_respuesta.promedio }}</p>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div class="bg-green-50 dark:bg-green-900 p-4 rounded-lg">
                  <p class="text-green-600 dark:text-green-300 text-sm font-medium">Mínimo</p>
                  <p class="text-2xl font-bold text-green-900 dark:text-green-100">{{ estadisticas.tiempo_respuesta.minimo }}</p>
                </div>
                <div class="bg-red-50 dark:bg-red-900 p-4 rounded-lg">
                  <p class="text-red-600 dark:text-red-300 text-sm font-medium">Máximo</p>
                  <p class="text-2xl font-bold text-red-900 dark:text-red-100">{{ estadisticas.tiempo_respuesta.maximo }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Incidentes - GRÁFICA DE BARRAS -->
        <div class="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 p-6">
          <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4">🚨 Tipos de Incidentes Más Frecuentes</h3>
          <div style="position: relative; width: 100%; height: 300px;" *ngIf="estadisticas.incidentes_frecuentes.length > 0">
            <canvas
              baseChart
              [data]="incidentesChart.data"
              [options]="incidentesChart.options"
              [type]="'bar'"
            ></canvas>
          </div>
          <p *ngIf="estadisticas.incidentes_frecuentes.length === 0" class="text-gray-500 dark:text-slate-400 text-center py-8">
            Sin datos disponibles
          </p>
        </div>

        <!-- Resumen Estado de Solicitudes (Tabla) -->
        <div class="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 p-6">
          <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">📈 Resumen de Solicitudes</h3>
          <div class="grid grid-cols-3 gap-4">
            <div class="bg-green-100 dark:bg-green-900 rounded-lg p-4 text-center">
              <p class="text-green-700 dark:text-green-300 text-sm font-semibold">Completadas</p>
              <p class="text-3xl font-bold text-green-900 dark:text-green-100 mt-2">{{ estadisticas.solicitudes_completadas }}</p>
            </div>
            <div class="bg-yellow-100 dark:bg-yellow-900 rounded-lg p-4 text-center">
              <p class="text-yellow-700 dark:text-yellow-300 text-sm font-semibold">Pendientes</p>
              <p class="text-3xl font-bold text-yellow-900 dark:text-yellow-100 mt-2">{{ estadisticas.solicitudes_pendientes }}</p>
            </div>
            <div class="bg-red-100 dark:bg-red-900 rounded-lg p-4 text-center">
              <p class="text-red-700 dark:text-red-300 text-sm font-semibold">Canceladas</p>
              <p class="text-3xl font-bold text-red-900 dark:text-red-100 mt-2">{{ estadisticas.solicitudes_canceladas }}</p>
            </div>
          </div>
        </div>

        <!-- Talleres Top - DOS GRÁFICAS CIRCULARES -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Solicitudes Atendidas por Taller -->
          <div class="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 p-6">
            <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4">📋 Solicitudes Atendidas por Taller</h3>
            <div style="position: relative; width: 100%; height: 250px;" *ngIf="estadisticas.talleres_top.length > 0">
              <canvas
                baseChart
                [data]="talleresSolicitudesChart.data"
                [options]="talleresSolicitudesChart.options"
                [type]="'doughnut'"
              ></canvas>
            </div>
            <p *ngIf="estadisticas.talleres_top.length === 0" class="text-gray-500 dark:text-slate-400 text-center py-8">
              Sin datos disponibles
            </p>
          </div>

          <!-- Servicios Realizados por Taller -->
          <div class="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 p-6">
            <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4">🔧 Servicios Realizados por Taller</h3>
            <div style="position: relative; width: 100%; height: 250px;" *ngIf="estadisticas.talleres_top.length > 0">
              <canvas
                baseChart
                [data]="talleresServiciosChart.data"
                [options]="talleresServiciosChart.options"
                [type]="'doughnut'"
              ></canvas>
            </div>
            <p *ngIf="estadisticas.talleres_top.length === 0" class="text-gray-500 dark:text-slate-400 text-center py-8">
              Sin datos disponibles
            </p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AdminEstadisticasSistemaComponent implements OnInit, OnDestroy {
  estadisticas: EstadisticasGeneralesResponse | null = null;
  cargando = false;
  error: string | null = null;

  // Gráficas
  estadoSolicitudesChart: any = { data: {}, options: {} };
  incidentesChart: any = { data: {}, options: {} };
  talleresSolicitudesChart: any = { data: {}, options: {} };
  talleresServiciosChart: any = { data: {}, options: {} };

  filtro = {
    fecha_inicio: '',
    fecha_fin: ''
  };

  private destroy$ = new Subject<void>();
  private filtrosChange$ = new Subject<void>();

  get tasaRespuesta(): number {
    if (!this.estadisticas || this.estadisticas.total_emergencias === 0) return 0;
    return Math.round(
      (this.estadisticas.total_solicitudes_atendidas / this.estadisticas.total_emergencias) * 100
    );
  }

  constructor(private estadisticasService: EstadisticasSistemaService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.inicializarFechas();
    this.cargarEstadisticas();

    this.filtrosChange$
      .pipe(
        debounceTime(500),
        takeUntil(this.destroy$)
      )
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

  cargarEstadisticas(): void {
    this.cargando = true;
    this.error = null;

    this.estadisticasService
      .obtenerEstadisticasSistema(this.filtro.fecha_inicio, this.filtro.fecha_fin)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.estadisticas = data;
          this.cargando = false;

          // Configurar gráficas después de cargar datos
          setTimeout(() => {
            this.setupEstadoSolicitudesChart();
            this.setupIncidentesChart();
            this.setupTalleresSolicitudesChart();
            this.setupTalleresServiciosChart();
            this.cdr.markForCheck();
          }, 0);

          this.cdr.markForCheck();
        },
        error: (err) => {
          this.error = 'Error al cargar las estadísticas del sistema';
          this.cargando = false;
          this.cdr.markForCheck();
          console.error(err);
        }
      });
  }

  setupEstadoSolicitudesChart(): void {
    if (!this.estadisticas) return;

    const completadas = this.estadisticas.solicitudes_completadas || 0;
    const pendientes = this.estadisticas.solicitudes_pendientes || 0;
    const canceladas = this.estadisticas.solicitudes_canceladas || 0;

    this.estadoSolicitudesChart = {
      data: {
        labels: ['Completadas', 'Pendientes', 'Canceladas'],
        datasets: [
          {
            data: [completadas, pendientes, canceladas],
            backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
            borderColor: ['#059669', '#d97706', '#dc2626'],
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              color: '#6b7280',
              font: { size: 12 },
              usePointStyle: true,
            },
          },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                return `${context.label}: ${context.parsed}`;
              },
            },
          },
        },
      },
    };
  }

  setupIncidentesChart(): void {
    if (!this.estadisticas || this.estadisticas.incidentes_frecuentes.length === 0) {
      this.incidentesChart = { data: {}, options: {} };
      return;
    }

    const colores = [
      '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
      '#ec4899', '#06b6d4', '#14b8a6', '#f97316', '#6366f1'
    ];

    this.incidentesChart = {
      data: {
        labels: this.estadisticas.incidentes_frecuentes.map(i => i.tipo_incidente),
        datasets: [
          {
            label: 'Cantidad de Incidentes',
            data: this.estadisticas.incidentes_frecuentes.map(i => i.cantidad),
            backgroundColor: colores.slice(0, this.estadisticas.incidentes_frecuentes.length),
            borderColor: colores.slice(0, this.estadisticas.incidentes_frecuentes.length),
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: '#6b7280',
              font: { size: 12 },
            },
          },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                const incident = this.estadisticas?.incidentes_frecuentes[context.dataIndex];
                return `${incident?.tipo_incidente}: ${context.parsed.x} (${incident?.porcentaje}%)`;
              },
            },
          },
        },
        scales: {
          x: {
            ticks: {
              color: '#6b7280',
            },
            grid: {
              color: '#e5e7eb',
            },
          },
          y: {
            ticks: {
              color: '#6b7280',
            },
            grid: {
              display: false,
            },
          },
        },
      },
    };
  }

  setupTalleresSolicitudesChart(): void {
    if (!this.estadisticas || this.estadisticas.talleres_top.length === 0) {
      this.talleresSolicitudesChart = { data: {}, options: {} };
      return;
    }

    const colores = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

    this.talleresSolicitudesChart = {
      data: {
        labels: this.estadisticas.talleres_top.map(t => t.nombre_taller),
        datasets: [
          {
            data: this.estadisticas.talleres_top.map(t => t.solicitudes_atendidas || 0),
            backgroundColor: colores.slice(0, this.estadisticas.talleres_top.length),
            borderColor: colores.slice(0, this.estadisticas.talleres_top.length),
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              color: '#6b7280',
              font: { size: 11 },
              usePointStyle: true,
            },
          },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                return `Solicitudes: ${context.parsed}`;
              },
            },
          },
        },
      },
    };
  }

  setupTalleresServiciosChart(): void {
    if (!this.estadisticas || this.estadisticas.talleres_top.length === 0) {
      this.talleresServiciosChart = { data: {}, options: {} };
      return;
    }

    const colores = ['#10b981', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

    this.talleresServiciosChart = {
      data: {
        labels: this.estadisticas.talleres_top.map(t => t.nombre_taller),
        datasets: [
          {
            data: this.estadisticas.talleres_top.map(t => t.servicios_realizados || 0),
            backgroundColor: colores.slice(0, this.estadisticas.talleres_top.length),
            borderColor: colores.slice(0, this.estadisticas.talleres_top.length),
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              color: '#6b7280',
              font: { size: 11 },
              usePointStyle: true,
            },
          },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                return `Servicios: ${context.parsed}`;
              },
            },
          },
        },
      },
    };
  }

  aplicarFiltros(): void {
    this.filtrosChange$.next();
  }

  limpiarFiltros(): void {
    this.inicializarFechas();
    this.cargarEstadisticas();
  }
}
