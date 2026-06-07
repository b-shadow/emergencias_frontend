import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgChartsModule } from 'ng2-charts';
import { AuthService } from '@core/services/auth.service';
import { RolUsuario } from '@core/models/user.model';
import { WorkshopService } from '@core/services/workshop.service';
import { EstadisticasSistemaService, EstadisticasGeneralesResponse } from '@core/services/estadisticas-sistema.service';
import { EstadisticasTallerService, EstadisticasTallerResponse } from '@core/services/estadisticas-taller.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NgChartsModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 transition-colors duration-300">
      <div class="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-40 transition-colors duration-300">
        <div class="max-w-7xl mx-auto px-6 py-4">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-3xl font-black bg-gradient-to-r from-sky-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent">
                {{ isTaller ? 'Panel del Taller' : 'Panel de Administración' }}
              </h1>
              <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Bienvenido, <span class="font-bold text-slate-900 dark:text-white">{{ userName }}</span>
              </p>
              <p *ngIf="tenantLabel && isTaller" class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Tenant Taller: <span class="font-semibold">{{ tenantLabel }}</span>
              </p>
            </div>
            <span class="px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-sky-100 to-cyan-100 dark:from-sky-900/30 dark:to-cyan-900/30 text-sky-800 dark:text-cyan-300 border border-sky-300 dark:border-sky-700">
              👤 {{ userRole }}
            </span>
          </div>
        </div>
      </div>

      <div class="max-w-7xl mx-auto px-6 py-8">
        <div class="mb-12 p-8 rounded-2xl bg-gradient-to-br from-sky-50 to-cyan-50 dark:from-sky-900/20 dark:to-cyan-900/20 border border-sky-200 dark:border-sky-800/50">
          <div class="flex items-start gap-4">
            <span class="text-4xl mt-1">{{ isTaller ? '🔧' : '⚙️' }}</span>
            <div>
              <h2 class="text-2xl font-bold text-sky-900 dark:text-cyan-100 mb-2">
                {{ isTaller ? 'Gestión del Taller' : 'Administración del Sistema' }}
              </h2>
              <p class="text-sky-800 dark:text-cyan-200 leading-relaxed">
                {{ isTaller
                  ? 'Panel del Taller para controlar tu operación, revisar métricas y acceder a tus módulos principales.'
                  : 'Panel de Administración para supervisar el sistema, revisar métricas y acceder a los módulos principales.'
                }}
              </p>
            </div>
          </div>
        </div>

        <div class="mb-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 shadow">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-xl font-bold text-slate-900 dark:text-white">Filtros</h3>
            <button (click)="limpiarFiltros()" class="px-3 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white text-sm">
              Reset
            </button>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Fecha inicio</label>
              <input type="date" [(ngModel)]="filtros.fechaInicio" class="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white px-3 py-2" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Fecha fin</label>
              <input type="date" [(ngModel)]="filtros.fechaFin" class="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white px-3 py-2" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Agrupar por</label>
              <select [(ngModel)]="filtros.agruparPor" class="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white px-3 py-2">
                <option value="dia">Día</option>
                <option value="semana">Semana</option>
                <option value="mes">Mes</option>
                <option value="categoria">Categoría</option>
                <option value="urgencia">Urgencia</option>
                <option value="estado">Estado</option>
                <option *ngIf="isTaller" value="estado_solicitud">Estado solicitud</option>
                <option *ngIf="isTaller" value="estado_asignacion">Estado asignación</option>
                <option *ngIf="isTaller" value="estado_resultado">Estado resultado</option>
                <option *ngIf="!isTaller" value="taller">Taller</option>
              </select>
            </div>
            <div class="flex items-end gap-2">
              <button (click)="aplicarFiltros()" class="flex-1 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-medium">
                Aplicar
              </button>
            </div>
          </div>
        </div>

        <div *ngIf="isTaller" class="mb-12 space-y-8">
          <ng-container *ngIf="tallerStats.estadisticas as est; else tallerSinDatos">
            <div>
              <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-6">KPIs del Taller</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div class="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 shadow">
                  <div class="text-sm text-slate-500 dark:text-slate-400">Atendidas</div>
                  <div class="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{{ est.total_solicitudes_atendidas }}</div>
                </div>
                <div class="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 shadow">
                  <div class="text-sm text-slate-500 dark:text-slate-400">Aceptación</div>
                  <div class="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">{{ est.tasa_aceptacion | number:'1.0-2' }}%</div>
                </div>
                <div class="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 shadow">
                  <div class="text-sm text-slate-500 dark:text-slate-400">Calificación</div>
                  <div class="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-2">{{ est.calificacion_promedio ?? 'N/D' }}</div>
                </div>
                <div class="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 shadow">
                  <div class="text-sm text-slate-500 dark:text-slate-400">ETA cumplido</div>
                  <div class="text-3xl font-bold text-cyan-600 dark:text-cyan-400 mt-2">{{ est.cumplimiento_eta_pct | number:'1.0-2' }}%</div>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div class="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 shadow">
                <h4 class="font-bold text-slate-900 dark:text-white mb-4">Servicios más realizados</h4>
                <div *ngIf="est.servicios_mas_realizados.length; else sinServiciosTaller" style="position: relative; width: 100%; height: 260px;">
                  <canvas baseChart [data]="tallerServiciosChart.data" [options]="tallerServiciosChart.options" [type]="'bar'"></canvas>
                </div>
                <ng-template #sinServiciosTaller>
                  <p class="text-sm text-slate-500 dark:text-slate-400">Sin datos aún.</p>
                </ng-template>
              </div>

              <div class="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 shadow">
                <h4 class="font-bold text-slate-900 dark:text-white mb-4">Pagos</h4>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <div class="text-sm text-slate-500 dark:text-slate-400">Confirmados</div>
                    <div class="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{{ est.total_pagos_confirmados }}</div>
                  </div>
                  <div>
                    <div class="text-sm text-slate-500 dark:text-slate-400">Monto total</div>
                    <div class="text-2xl font-bold text-slate-900 dark:text-white">{{ est.monto_total_pagado | number:'1.2-2' }} Bs</div>
                  </div>
                  <div>
                    <div class="text-sm text-slate-500 dark:text-slate-400">Monto promedio</div>
                    <div class="text-2xl font-bold text-slate-900 dark:text-white">{{ est.monto_promedio_pago | number:'1.2-2' }} Bs</div>
                  </div>
                  <div>
                    <div class="text-sm text-slate-500 dark:text-slate-400">Aceptadas</div>
                    <div class="text-2xl font-bold text-sky-600 dark:text-sky-400">{{ est.solicitudes_aceptadas }}</div>
                  </div>
                </div>
              </div>
            </div>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div class="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 shadow">
                <h4 class="font-bold text-slate-900 dark:text-white mb-4">Distribución</h4>
                <div style="position: relative; width: 100%; height: 260px;">
                  <canvas baseChart [data]="tallerDistribucionChart.data" [options]="tallerDistribucionChart.options" [type]="'doughnut'"></canvas>
                </div>
              </div>
              <div class="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 shadow">
                <h4 class="font-bold text-slate-900 dark:text-white mb-4">Evolución</h4>
                <div style="position: relative; width: 100%; height: 260px;">
                  <canvas baseChart [data]="tallerEvolucionChart.data" [options]="tallerEvolucionChart.options" [type]="'bar'"></canvas>
                </div>
              </div>
            </div>
          </ng-container>
          <ng-template #tallerSinDatos>
            <div class="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 shadow">
              <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-2">KPIs del Taller</h3>
              <p class="text-sm text-slate-500 dark:text-slate-400">Sin datos aún.</p>
            </div>
          </ng-template>
        </div>

        <div *ngIf="!isTaller" class="mb-12 space-y-8">
          <ng-container *ngIf="adminStats; else adminSinDatos">
            <div>
              <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-6">KPIs del Sistema</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div class="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 shadow">
                  <div class="text-sm text-slate-500 dark:text-slate-400">Emergencias</div>
                  <div class="text-3xl font-bold text-sky-600 dark:text-sky-400 mt-2">{{ adminStats.total_emergencias }}</div>
                </div>
                <div class="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 shadow">
                  <div class="text-sm text-slate-500 dark:text-slate-400">Cancelación</div>
                  <div class="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-2">{{ adminStats.tasa_cancelacion | number:'1.0-2' }}%</div>
                </div>
                <div class="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 shadow">
                  <div class="text-sm text-slate-500 dark:text-slate-400">Calificación</div>
                  <div class="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-2">{{ adminStats.promedio_calificacion ?? 'N/D' }}</div>
                </div>
                <div class="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 shadow">
                  <div class="text-sm text-slate-500 dark:text-slate-400">Pagos confirmados</div>
                  <div class="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">{{ adminStats.total_pagos_confirmados }}</div>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div class="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 shadow">
                <h4 class="font-bold text-slate-900 dark:text-white mb-4">Servicios más demandados</h4>
                <div *ngIf="adminStats.servicios_frecuentes.length; else sinServiciosAdmin" style="position: relative; width: 100%; height: 260px;">
                  <canvas baseChart [data]="adminServiciosChart.data" [options]="adminServiciosChart.options" [type]="'bar'"></canvas>
                </div>
                <ng-template #sinServiciosAdmin>
                  <p class="text-sm text-slate-500 dark:text-slate-400">Sin datos aún.</p>
                </ng-template>
              </div>

              <div class="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 shadow">
                <h4 class="font-bold text-slate-900 dark:text-white mb-4">Especialidades más demandadas</h4>
                <div *ngIf="adminStats.especialidades_frecuentes.length; else sinEspecialidadesAdmin" style="position: relative; width: 100%; height: 260px;">
                  <canvas baseChart [data]="adminEspecialidadesChart.data" [options]="adminEspecialidadesChart.options" [type]="'doughnut'"></canvas>
                </div>
                <ng-template #sinEspecialidadesAdmin>
                  <p class="text-sm text-slate-500 dark:text-slate-400">Sin datos aún.</p>
                </ng-template>
              </div>
            </div>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div class="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 shadow">
                <h4 class="font-bold text-slate-900 dark:text-white mb-4">Emergencias</h4>
                <div style="position: relative; width: 100%; height: 260px;">
                  <canvas baseChart [data]="adminEmergenciasChart.data" [options]="adminEmergenciasChart.options" [type]="'bar'"></canvas>
                </div>
              </div>
              <div class="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 shadow">
                <h4 class="font-bold text-slate-900 dark:text-white mb-4">Pagos y cancelaciones</h4>
                <div style="position: relative; width: 100%; height: 260px;">
                  <canvas baseChart [data]="adminPagosChart.data" [options]="adminPagosChart.options" [type]="'doughnut'"></canvas>
                </div>
              </div>
            </div>
          </ng-container>
          <ng-template #adminSinDatos>
            <div class="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 shadow">
              <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-2">KPIs del Sistema</h3>
              <p class="text-sm text-slate-500 dark:text-slate-400">Sin datos aún.</p>
            </div>
          </ng-template>
        </div>

      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  userName: string = '';
  userRole: string = '';
  isTaller: boolean = false;
  tenantLabel = '';
  adminStats: EstadisticasGeneralesResponse = this.getDefaultAdminStats();
  tallerStats: EstadisticasTallerResponse = this.getDefaultTallerStats();
  adminServiciosChart: any = { data: {}, options: {} };
  adminEspecialidadesChart: any = { data: {}, options: {} };
  adminEmergenciasChart: any = { data: {}, options: {} };
  adminPagosChart: any = { data: {}, options: {} };
  tallerServiciosChart: any = { data: {}, options: {} };
  tallerDistribucionChart: any = { data: {}, options: {} };
  tallerEvolucionChart: any = { data: {}, options: {} };
  filtros = {
    fechaInicio: '2000-01-01',
    fechaFin: this.formatoFecha(new Date()),
    agruparPor: 'dia',
  };

  constructor(
    private authService: AuthService,
    private workshopService: WorkshopService,
    private estadisticasSistemaService: EstadisticasSistemaService,
    private estadisticasTallerService: EstadisticasTallerService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.userName = user.nombre_completo;
      this.userRole = user.rol;
      this.isTaller = user.rol === RolUsuario.TALLER;
      if (this.isTaller) {
        this.workshopService.getMyTenantContext().subscribe({
          next: (ctx) => {
            this.tenantLabel = ctx?.slug_tenant || ctx?.nombre_tenant || '';
          },
        });
        this.cargarKpisTaller();
      } else {
        this.cargarKpisAdmin();
      }
    }
  }

  cargarKpisAdmin(): void {
    this.estadisticasSistemaService.obtenerEstadisticasSistema(
      this.filtros.fechaInicio,
      this.filtros.fechaFin,
      this.filtros.agruparPor
    ).subscribe({
      next: (data) => {
        this.adminStats = data;
        this.setupAdminCharts();
      },
      error: () => this.adminStats = this.getDefaultAdminStats(),
    });
  }

  cargarKpisTaller(): void {
    this.estadisticasTallerService.obtenerMisEstadisticas(
      this.filtros.fechaInicio,
      this.filtros.fechaFin,
      this.filtros.agruparPor
    ).subscribe({
      next: (data) => {
        this.tallerStats = data;
        this.setupTallerCharts();
      },
      error: () => this.tallerStats = this.getDefaultTallerStats(),
    });
  }

  aplicarFiltros(): void {
    if (this.isTaller) {
      this.cargarKpisTaller();
    } else {
      this.cargarKpisAdmin();
    }
  }

  limpiarFiltros(): void {
    this.filtros.fechaInicio = '2000-01-01';
    this.filtros.fechaFin = this.formatoFecha(new Date());
    this.filtros.agruparPor = 'dia';
    this.aplicarFiltros();
  }

  private formatoFecha(fecha: Date): string {
    return fecha.toISOString().split('T')[0];
  }

  private setupAdminCharts(): void {
    const topServicios = this.adminStats.servicios_frecuentes.slice(0, 5);
    const topEspecialidades = this.adminStats.especialidades_frecuentes.slice(0, 5);
    this.adminServiciosChart = {
      data: {
        labels: topServicios.map((item) => item.nombre),
        datasets: [{ label: 'Servicios', data: topServicios.map((item) => item.cantidad), backgroundColor: '#2563eb' }],
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } },
    };
    this.adminEspecialidadesChart = {
      data: {
        labels: topEspecialidades.map((item) => item.nombre),
        datasets: [{ data: topEspecialidades.map((item) => item.cantidad), backgroundColor: ['#f59e0b', '#f97316', '#ef4444', '#84cc16', '#06b6d4'] }],
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } },
    };
    this.adminEmergenciasChart = {
      data: {
        labels: ['Emergencias', 'Atendidas', 'Canceladas'],
        datasets: [{ data: [this.adminStats.total_emergencias, this.adminStats.total_solicitudes_atendidas, this.adminStats.total_solicitudes_canceladas], backgroundColor: ['#0ea5e9', '#10b981', '#f97316'] }],
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } },
    };
    this.adminPagosChart = {
      data: {
        labels: ['Confirmados', 'Pendientes'],
        datasets: [{ data: [this.adminStats.total_pagos_confirmados, this.adminStats.total_pagos_pendientes], backgroundColor: ['#10b981', '#eab308'] }],
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } },
    };
  }

  private setupTallerCharts(): void {
    const est = this.tallerStats.estadisticas;
    if (!est) {
      return;
    }
    const topServicios = est.servicios_mas_realizados.slice(0, 5);
    this.tallerServiciosChart = {
      data: {
        labels: topServicios.map((item) => item.nombre),
        datasets: [{ label: 'Servicios', data: topServicios.map((item) => item.cantidad), backgroundColor: '#0ea5e9' }],
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } },
    };
    this.tallerDistribucionChart = {
      data: {
        labels: ['Recibidas', 'Aceptadas', 'Canceladas'],
        datasets: [{ data: [est.solicitudes_recibidas, est.solicitudes_aceptadas, est.total_solicitudes_canceladas], backgroundColor: ['#2563eb', '#10b981', '#ef4444'] }],
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } },
    };
    this.tallerEvolucionChart = {
      data: {
        labels: ['Atendidas', 'Completadas', 'ETA cumplido'],
        datasets: [{ label: 'Taller', data: [est.total_solicitudes_atendidas, est.total_servicios_completados, est.cumplimiento_eta_pct], backgroundColor: '#8b5cf6' }],
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } },
    };
  }

  private getDefaultAdminStats(): EstadisticasGeneralesResponse {
    return {
      fecha_inicio: '',
      fecha_fin: '',
      total_emergencias: 0,
      total_solicitudes_atendidas: 0,
      total_solicitudes_canceladas: 0,
      tasa_cancelacion: 0,
      total_servicios_realizados: 0,
      talleres_activos: 0,
      clientes_activos: 0,
      promedio_calificacion: null,
      total_pagos_confirmados: 0,
      total_pagos_pendientes: 0,
      monto_total_pagado: 0,
      monto_promedio_pago: 0,
      incidentes_frecuentes: [],
      servicios_frecuentes: [],
      especialidades_frecuentes: [],
      talleres_top: [],
      zonas_criticas: [],
      tiempo_respuesta: null,
      solicitudes_completadas: 0,
      solicitudes_pendientes: 0,
      solicitudes_canceladas: 0,
      reporte: null,
      opciones_filtros: null,
      mensaje_vacio: null,
    };
  }

  private getDefaultTallerStats(): EstadisticasTallerResponse {
    return {
      id_taller: '',
      nombre_taller: '',
      fecha_inicio: '',
      fecha_fin: '',
      estadisticas: {
        total_solicitudes_atendidas: 0,
        total_solicitudes_canceladas: 0,
        tasa_aceptacion: 0,
        calificacion_promedio: null,
        total_pagos_confirmados: 0,
        total_pagos_pendientes: 0,
        monto_total_pagado: 0,
        monto_promedio_pago: 0,
        cumplimiento_eta_pct: 0,
        solicitudes_recibidas: 0,
        solicitudes_aceptadas: 0,
        servicios_mas_realizados: [],
      },
      reporte: null,
      opciones_filtros: null,
      mensaje_vacio: null,
    } as unknown as EstadisticasTallerResponse;
  }
}
