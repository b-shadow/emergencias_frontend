import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import {
  EstadisticasTallerService,
  EstadisticasTallerResponse,
} from '@core/services/estadisticas-taller.service';

@Component({
  selector: 'app-estadisticas-taller',
  standalone: true,
  imports: [CommonModule, FormsModule, NgChartsModule],
  template: `
    <div class="px-6 py-4">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 text-transparent bg-clip-text mb-2">
          📊 Estadísticas del Taller
        </h1>
        <p class="text-gray-600 dark:text-slate-400">Análisis de tu actividad operativa</p>
      </div>

      <!-- Filtros -->
      <div class="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 p-6 mb-6">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">🔍 Filtros</h2>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              Fecha Inicio
            </label>
            <input
              type="date"
              [(ngModel)]="filtros.fechaInicio"
              class="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              Fecha Fin
            </label>
            <input
              type="date"
              [(ngModel)]="filtros.fechaFin"
              class="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            />
          </div>

          <div class="flex items-end">
            <button
              (click)="cargarEstadisticas()"
              [disabled]="cargando"
              class="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition"
            >
              <span *ngIf="!cargando">🔄 Actualizar</span>
              <span *ngIf="cargando">⏳ Cargando...</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="cargando" class="text-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p class="text-gray-500 dark:text-slate-400 mt-2">Calculando estadísticas...</p>
      </div>

      <!-- Error -->
      <div
        *ngIf="error && !cargando"
        class="mb-4 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg border border-red-300 dark:border-red-700"
      >
        ❌ {{ error }}
      </div>

      <!-- Sin datos -->
      <div
        *ngIf="!cargando && !error && !estadisticas"
        class="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg p-6 text-center"
      >
        <p class="text-yellow-800 dark:text-yellow-200">
          ⚠️ {{ mensajeSinDatos || 'No hay datos disponibles' }}
        </p>
      </div>

      <!-- Estadísticas -->
      <div *ngIf="!cargando && estadisticas" class="space-y-6">
        <!-- Tarjetas KPI principales -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 p-6">
            <p class="text-gray-600 dark:text-slate-400 text-sm font-medium">
              Solicitudes Atendidas
            </p>
            <p class="text-4xl font-bold text-blue-600 dark:text-blue-400 mt-2">
              {{ estadisticas.total_solicitudes_atendidas }}
            </p>
          </div>

          <div class="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 p-6">
            <p class="text-gray-600 dark:text-slate-400 text-sm font-medium">
              Solicitudes Canceladas
            </p>
            <p class="text-4xl font-bold text-red-600 dark:text-red-400 mt-2">
              {{ estadisticas.total_solicitudes_canceladas }}
            </p>
          </div>

          <div class="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 p-6">
            <p class="text-gray-600 dark:text-slate-400 text-sm font-medium">
              Servicios Completados
            </p>
            <p class="text-4xl font-bold text-green-600 dark:text-green-400 mt-2">
              {{ estadisticas.total_servicios_completados }}
            </p>
          </div>

          <div class="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 p-6">
            <p class="text-gray-600 dark:text-slate-400 text-sm font-medium">
              Tasa de Completación
            </p>
            <p class="text-4xl font-bold text-purple-600 dark:text-purple-400 mt-2">
              {{ estadisticas.tasa_completacion.toFixed(1) }}%
            </p>
          </div>
        </div>

        <!-- Tiempo promedio de atención -->
        <div class="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 p-6">
          <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
            ⏱️ Tiempo de Atención
          </h3>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
              <p class="text-blue-600 dark:text-blue-300 text-sm font-medium">
                Promedio
              </p>
              <p class="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">
                {{ estadisticas.tiempo_promedio_atencion.tiempo_promedio_minutos.toFixed(2) }}
                min
              </p>
            </div>

            <div class="bg-green-50 dark:bg-green-900 p-4 rounded-lg">
              <p class="text-green-600 dark:text-green-300 text-sm font-medium">
                Mínimo
              </p>
              <p class="text-2xl font-bold text-green-900 dark:text-green-100 mt-1">
                {{ estadisticas.tiempo_promedio_atencion.tiempo_minimo_minutos.toFixed(2) }}
                min
              </p>
            </div>

            <div class="bg-red-50 dark:bg-red-900 p-4 rounded-lg">
              <p class="text-red-600 dark:text-red-300 text-sm font-medium">
                Máximo
              </p>
              <p class="text-2xl font-bold text-red-900 dark:text-red-100 mt-1">
                {{ estadisticas.tiempo_promedio_atencion.tiempo_maximo_minutos.toFixed(2) }}
                min
              </p>
            </div>
          </div>
        </div>

        <!-- Tasa de Completación - Gráfica Doughnut -->
        <div class="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 p-6 flex flex-col items-center">
          <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4 w-full">
            📊 Tasa de Completación
          </h3>

          <div style="position: relative; width: 250px; height: 250px;">
            <canvas
              baseChart
              [data]="tasaCompletacionChart.data"
              [options]="tasaCompletacionChart.options"
              [type]="'doughnut'"
            ></canvas>
          </div>

          <p class="text-center text-gray-600 dark:text-slate-400 mt-4">
            <span class="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {{ estadisticas.tasa_completacion.toFixed(1) }}%
            </span>
          </p>
        </div>

        <!-- Gráficas de Diagnósticos y Seguimiento -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Diagnósticos - Gráfica Doughnut -->
          <div class="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 p-6 flex flex-col">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-xl font-bold text-gray-900 dark:text-white">
                🩺 Diagnósticos Más Frecuentes
              </h3>
              <div class="bg-orange-100 dark:bg-orange-900 px-3 py-1 rounded-full text-sm">
                <span class="text-orange-800 dark:text-orange-200 font-semibold">
                  🔄 {{ estadisticas.total_diagnosticos_con_seguimiento }}
                </span>
              </div>
            </div>

            <div
              *ngIf="estadisticas.diagnosticos.length === 0"
              class="text-center py-8 text-gray-500 dark:text-slate-400 flex-grow flex items-center justify-center"
            >
              No hay datos disponibles
            </div>

            <div
              *ngIf="estadisticas.diagnosticos.length > 0"
              style="position: relative; width: 100%; height: 250px; padding: 10px 0;"
            >
              <canvas
                baseChart
                [data]="diagnosticosChart.data"
                [options]="diagnosticosChart.options"
                [type]="'doughnut'"
              ></canvas>
            </div>
          </div>

          <!-- Estado de Seguimiento - Gráfica Doughnut -->
          <div class="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 p-6 flex flex-col">
            <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
              🔄 Estado de Seguimiento
            </h3>

            <div style="position: relative; width: 100%; height: 250px; padding: 10px 0;">
              <canvas
                baseChart
                [data]="seguimientoChart.data"
                [options]="seguimientoChart.options"
                [type]="'doughnut'"
              ></canvas>
            </div>
          </div>
        </div>

        <!-- Información de rango de fechas -->
        <div class="text-center text-sm text-gray-500 dark:text-slate-400 mt-4">
          <p>
            Estadísticas generadas para el período del
            {{ (estadisticas.fecha_inicio | date: 'dd/MM/yyyy') }}
            al
            {{ (estadisticas.fecha_fin | date: 'dd/MM/yyyy') }}
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class EstadisticasTallerComponent implements OnInit, OnDestroy {
  estadisticas: any = null;
  cargando = true;
  error: string | null = null;
  mensajeSinDatos: string | null = null;
  private destroy$ = new Subject<void>();

  filtros = {
    fechaInicio: '',
    fechaFin: '',
  };

  // Chart configurations
  tasaCompletacionChart: any = { data: {}, options: {} };
  diagnosticosChart: any = { data: {}, options: {} };
  seguimientoChart: any = { data: {}, options: {} };

  constructor(
    private estadisticasService: EstadisticasTallerService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarEstadisticas();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarEstadisticas(): void {
    this.cargando = true;
    this.error = null;
    this.mensajeSinDatos = null;
    this.estadisticas = null;
    this.cdr.markForCheck();

    this.estadisticasService
      .obtenerMisEstadisticas(this.filtros.fechaInicio, this.filtros.fechaFin)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (respuesta) => {
          console.log('📊 Respuesta de estadísticas:', respuesta);

          if (respuesta.estadisticas) {
            this.estadisticas = respuesta.estadisticas;
            console.log('✅ Estadísticas cargadas:', this.estadisticas);

            // Setup charts after data loads
            setTimeout(() => {
              this.setupTasaCompletacionChart();
              this.setupDiagnosticosChart();
              this.setupSeguimientoChart();
              this.cdr.markForCheck();
            }, 0);
          } else {
            this.mensajeSinDatos =
              respuesta.mensaje_vacio || 'No hay datos disponibles';
            console.log('⚠️ Sin datos:', this.mensajeSinDatos);
          }
          this.cargando = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('❌ Error al cargar estadísticas:', err);
          this.error = 'Error al cargar las estadísticas. Intenta de nuevo.';
          this.cargando = false;
          this.cdr.markForCheck();
        },
      });
  }

  setupTasaCompletacionChart(): void {
    const tasa = this.estadisticas.tasa_completacion || 0;
    const pendiente = 100 - tasa;

    this.tasaCompletacionChart = {
      data: {
        labels: ['Completadas', 'Pendientes'],
        datasets: [
          {
            data: [tasa, pendiente],
            backgroundColor: ['#10b981', '#ef4444'],
            borderColor: ['#059669', '#dc2626'],
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
                return `${context.label}: ${context.parsed.toFixed(1)}%`;
              },
            },
          },
        },
      },
    };
  }

  setupDiagnosticosChart(): void {
    if (!this.estadisticas.diagnosticos || this.estadisticas.diagnosticos.length === 0) {
      this.diagnosticosChart = { data: {}, options: {} };
      return;
    }

    const colores = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6', '#f97316', '#6366f1'];

    this.diagnosticosChart = {
      data: {
        labels: this.estadisticas.diagnosticos.map((d: any) => d.diagnostico),
        datasets: [
          {
            data: this.estadisticas.diagnosticos.map((d: any) => d.cantidad),
            backgroundColor: colores.slice(0, this.estadisticas.diagnosticos.length),
            borderColor: '#ffffff',
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
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
                const diagnostic = this.estadisticas.diagnosticos[context.dataIndex];
                return `${diagnostic.categoria}: ${context.parsed} (${diagnostic.porcentaje}%)`;
              },
            },
          },
        },
      },
    };
  }

  setupSeguimientoChart(): void {
    const conSeguimiento = this.estadisticas.total_diagnosticos_con_seguimiento || 0;
    const totalDiagnosticos = this.estadisticas.diagnosticos.length || 0;
    const sinSeguimiento = totalDiagnosticos - conSeguimiento;

    this.seguimientoChart = {
      data: {
        labels: ['Requieren Seguimiento', 'Sin Seguimiento'],
        datasets: [
          {
            data: [conSeguimiento, sinSeguimiento],
            backgroundColor: ['#f59e0b', '#10b981'],
            borderColor: '#ffffff',
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
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
                const label = context.label || '';
                const value = context.parsed || 0;
                return `${label}: ${value}`;
              },
            },
          },
        },
      },
    };
  }
}
