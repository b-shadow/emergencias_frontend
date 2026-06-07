import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgChartsModule } from 'ng2-charts';
import { Subject, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

import { AuthService } from '@core/services/auth.service';
import { RolUsuario } from '@core/models/user.model';
import { WorkshopService } from '@core/services/workshop.service';
import {
  EstadisticasGeneralesResponse,
  EstadisticasSistemaService,
} from '@core/services/estadisticas-sistema.service';
import {
  EstadisticaDemacruzada,
  EstadisticasTallerResponse,
  EstadisticasTallerService,
  KPIEficienciaServicio,
} from '@core/services/estadisticas-taller.service';

interface SummaryCard {
  label: string;
  value: string;
  helper: string;
  tone: 'blue' | 'green' | 'amber' | 'violet' | 'cyan' | 'emerald' | 'rose';
  icon: string;
}

interface ProgressRow {
  label: string;
  value: number;
  color?: string;
  helper?: string;
}

interface TimeCard {
  label: string;
  value: string;
  helper?: string;
  icon: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NgChartsModule],
  template: `
    <div class="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <div #dashboardExportRoot class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <section class="rounded-[28px] border border-slate-200/80 bg-white/95 p-6 shadow-[0_20px_60px_-28px_rgba(15,23,42,0.25)] dark:border-slate-800 dark:bg-slate-900/95">
          <div class="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div class="flex items-start gap-4">
              <div class="flex h-16 w-16 items-center justify-center rounded-2xl border border-sky-200 bg-sky-50 text-sky-600 shadow-sm dark:border-sky-900/70 dark:bg-sky-950/50 dark:text-sky-300">
                <svg class="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M14.7 6.3a1 1 0 0 0-1.4 0L4.9 14.7a2 2 0 0 0 2.8 2.8l8.4-8.4a1 1 0 0 0 0-1.4l-1.4-1.4Z"></path>
                  <path d="m16 8 2.7-2.7a1 1 0 0 1 1.4 0l.6.6a1 1 0 0 1 0 1.4L18 10"></path>
                  <path d="m10 14 4 4"></path>
                </svg>
              </div>
              <div>
                <h1 class="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                  {{ isTaller ? 'Panel del Taller' : 'Panel de Administración' }}
                </h1>
                <p class="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  Bienvenido, <span class="font-semibold text-slate-900 dark:text-white">{{ userName }}</span>
                </p>
                <p *ngIf="tenantLabel && isTaller" class="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                  Tenant Taller: {{ tenantLabel }}
                </p>
              </div>
            </div>

            <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <svg class="h-4 w-4 text-slate-500 dark:text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2"></rect>
                  <path d="M16 2v4M8 2v4M3 10h18"></path>
                </svg>
                {{ filtros.fechaInicio }} - {{ filtros.fechaFin }}
              </div>

              <span class="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-xs font-bold uppercase tracking-wide text-sky-700 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300">
                <span class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-sky-100 text-[10px] dark:bg-sky-900/70">
                  {{ isTaller ? 'T' : 'A' }}
                </span>
                {{ userRole }}
              </span>

              <button
                type="button"
                (click)="exportarDashboardPdf()"
                [disabled]="exportandoPdf"
                class="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 3v12"></path>
                  <path d="m7 10 5 5 5-5"></path>
                  <path d="M5 21h14"></path>
                </svg>
                {{ exportandoPdf ? 'Generando PDF...' : 'Exportar PDF' }}
              </button>
            </div>
          </div>

          <div class="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <div class="grid grid-cols-1 gap-4 xl:grid-cols-[1.15fr_1fr_1fr_auto_auto]">
              <div>
                <label class="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Fecha inicio</label>
                <input
                  type="date"
                  [(ngModel)]="filtros.fechaInicio"
                  class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-blue-900/40"
                />
              </div>
              <div>
                <label class="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Fecha fin</label>
                <input
                  type="date"
                  [(ngModel)]="filtros.fechaFin"
                  class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-blue-900/40"
                />
              </div>
              <div>
                <label class="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Agrupar por</label>
                <select
                  [(ngModel)]="filtros.agruparPor"
                  class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-blue-900/40"
                >
                  <option value="dia">Día</option>
                  <option value="semana">Semana</option>
                  <option value="mes">Mes</option>
                  <option *ngIf="isTaller" value="categoria">Categoría</option>
                  <option *ngIf="isTaller" value="urgencia">Urgencia</option>
                  <option *ngIf="isTaller" value="estado_solicitud">Estado solicitud</option>
                  <option *ngIf="isTaller" value="estado_asignacion">Estado asignación</option>
                  <option *ngIf="isTaller" value="estado_resultado">Estado resultado</option>
                  <option *ngIf="!isTaller" value="categoria">Categoría</option>
                  <option *ngIf="!isTaller" value="urgencia">Urgencia</option>
                  <option *ngIf="!isTaller" value="estado">Estado</option>
                  <option *ngIf="!isTaller" value="taller">Taller</option>
                </select>
              </div>
              <button
                type="button"
                (click)="limpiarFiltros()"
                class="self-end rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                Reset
              </button>
              <button
                type="button"
                (click)="aplicarFiltros()"
                class="self-end rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
              >
                Aplicar
              </button>
            </div>
          </div>
        </section>

        <section class="mt-8 space-y-8" *ngIf="isTaller; else adminDashboard">
          <article>
            <h2 class="mb-4 text-xl font-black text-slate-900 dark:text-white">Resumen principal</h2>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
              <div
                *ngFor="let card of tallerSummaryCards"
                class="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_15px_40px_-30px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-slate-900"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="text-sm font-semibold text-slate-600 dark:text-slate-400">{{ card.label }}</div>
                  <span class="flex h-10 w-10 items-center justify-center rounded-2xl" [ngClass]="iconTone(card.tone)">
                    <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path [attr.d]="card.icon"></path>
                    </svg>
                  </span>
                </div>
                <div class="mt-5 text-3xl font-black tracking-tight text-slate-900 dark:text-white">{{ card.value }}</div>
                <div class="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">{{ card.helper }}</div>
              </div>
            </div>
          </article>

          <div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <article class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h3 class="text-lg font-black text-slate-900 dark:text-white">Flujo de atención</h3>
              <div class="mt-5 h-[320px]">
                <canvas baseChart [data]="tallerFlujoChart.data" [options]="barChartOptions" [type]="'bar'"></canvas>
              </div>
            </article>

            <article class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h3 class="text-lg font-black text-slate-900 dark:text-white">Distribución de solicitudes</h3>
              <div class="mt-5 grid grid-cols-1 items-center gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                <div class="h-[280px]">
                  <canvas baseChart [data]="tallerDistribucionChart.data" [options]="doughnutChartOptions" [type]="'doughnut'"></canvas>
                </div>
                <div class="space-y-4">
                  <div *ngFor="let row of tallerDistribucionRows" class="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-800">
                    <div class="flex items-center gap-3">
                      <span class="h-3 w-3 rounded-full" [style.background]="row.color"></span>
                      <div>
                        <div class="text-sm font-semibold text-slate-800 dark:text-slate-100">{{ row.label }}</div>
                        <div class="text-xs text-slate-500 dark:text-slate-400">{{ row.helper }}</div>
                      </div>
                    </div>
                    <div class="text-sm font-bold text-slate-900 dark:text-white">{{ row.value }}</div>
                  </div>
                </div>
              </div>
            </article>
          </div>

          <div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <article class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h3 class="text-lg font-black text-slate-900 dark:text-white">Servicios más realizados</h3>
              <div class="mt-6 space-y-5">
                <ng-container *ngIf="tallerServiciosRows.length; else sinServicios">
                  <div *ngFor="let row of tallerServiciosRows">
                    <div class="mb-2 flex items-center justify-between gap-4">
                      <span class="text-sm font-semibold text-slate-700 dark:text-slate-200">{{ row.label }}</span>
                      <span class="text-sm font-bold text-slate-900 dark:text-white">{{ row.value }}</span>
                    </div>
                    <div class="h-3 rounded-full bg-slate-100 dark:bg-slate-800">
                      <div class="h-3 rounded-full bg-blue-600" [style.width.%]="barWidth(row.value, tallerServiciosMax)"></div>
                    </div>
                  </div>
                </ng-container>
              </div>
            </article>

            <article class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h3 class="text-lg font-black text-slate-900 dark:text-white">Diagnósticos más frecuentes</h3>
              <div class="mt-6 space-y-5">
                <ng-container *ngIf="tallerDiagnosticosRows.length; else sinDiagnosticos">
                  <div *ngFor="let row of tallerDiagnosticosRows">
                    <div class="mb-2 flex items-center justify-between gap-4">
                      <span class="text-sm font-semibold text-slate-700 dark:text-slate-200">{{ row.label }}</span>
                      <span class="text-sm font-bold text-slate-900 dark:text-white">{{ row.value }}</span>
                    </div>
                    <div class="h-3 rounded-full bg-slate-100 dark:bg-slate-800">
                      <div class="h-3 rounded-full bg-violet-500" [style.width.%]="barWidth(row.value, tallerDiagnosticosMax)"></div>
                    </div>
                  </div>
                </ng-container>
              </div>
            </article>
          </div>

          <div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <article class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h3 class="text-lg font-black text-slate-900 dark:text-white">Tiempos operativos</h3>
              <div class="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div *ngFor="let card of tallerTiempoCards" class="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                  <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                    <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path [attr.d]="card.icon"></path>
                    </svg>
                  </div>
                  <div class="mt-4 text-sm font-semibold text-slate-600 dark:text-slate-400">{{ card.label }}</div>
                  <div class="mt-2 text-2xl font-black text-slate-900 dark:text-white">{{ card.value }}</div>
                  <div *ngIf="card.helper" class="mt-2 text-xs text-slate-500 dark:text-slate-400">{{ card.helper }}</div>
                </div>
              </div>
            </article>

            <article class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h3 class="text-lg font-black text-slate-900 dark:text-white">Motivos de cancelación</h3>
              <div class="mt-6 space-y-5">
                <ng-container *ngIf="tallerCancelacionesRows.length; else sinCancelaciones">
                  <div *ngFor="let row of tallerCancelacionesRows">
                    <div class="mb-2 flex items-center justify-between gap-4">
                      <span class="text-sm font-semibold text-slate-700 dark:text-slate-200">{{ row.label }}</span>
                      <span class="text-sm font-bold text-slate-900 dark:text-white">{{ row.value }}</span>
                    </div>
                    <div class="h-3 rounded-full bg-slate-100 dark:bg-slate-800">
                      <div class="h-3 rounded-full bg-rose-500" [style.width.%]="barWidth(row.value, tallerCancelacionesMax)"></div>
                    </div>
                  </div>
                </ng-container>
              </div>
            </article>
          </div>

          <div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <article class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h3 class="text-lg font-black text-slate-900 dark:text-white">Tipos de incidentes</h3>
              <div class="mt-5 grid grid-cols-1 items-center gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                <div class="h-[260px]">
                  <canvas baseChart [data]="tallerIncidentesChart.data" [options]="doughnutChartOptions" [type]="'doughnut'"></canvas>
                </div>
                <div class="space-y-3">
                  <div *ngFor="let row of tallerIncidentesRows" class="flex items-center justify-between gap-4">
                    <div class="flex items-center gap-3">
                      <span class="h-3 w-3 rounded-full" [style.background]="row.color"></span>
                      <span class="text-sm font-semibold text-slate-700 dark:text-slate-200">{{ row.label }}</span>
                    </div>
                    <span class="text-sm font-bold text-slate-900 dark:text-white">{{ row.value }}</span>
                  </div>
                </div>
              </div>
            </article>

            <article class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h3 class="text-lg font-black text-slate-900 dark:text-white">Pagos</h3>
              <div class="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div *ngFor="let card of tallerPagoCards" class="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800">
                  <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                    <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path [attr.d]="card.icon"></path>
                    </svg>
                  </div>
                  <div class="mt-4 text-sm font-semibold text-slate-600 dark:text-slate-400">{{ card.label }}</div>
                  <div class="mt-2 text-2xl font-black text-slate-900 dark:text-white">{{ card.value }}</div>
                  <div class="mt-2 text-xs text-slate-500 dark:text-slate-400">{{ card.helper }}</div>
                </div>
              </div>
            </article>
          </div>

          <article class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div class="flex items-center justify-between gap-4">
              <div>
                <h3 class="text-lg font-black text-slate-900 dark:text-white">Eficiencia por servicio</h3>
                <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">Compara servicio, categoría tarifaria y tasa de completación.</p>
              </div>
              <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                Zona más incidentes: {{ tallerZonaMasIncidentes || 'N/D' }}
              </span>
            </div>

            <div class="mt-6 overflow-x-auto">
              <table class="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                <thead>
                  <tr class="text-left text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    <th class="pb-3 pr-4">Servicio</th>
                    <th class="pb-3 pr-4">Categoría</th>
                    <th class="pb-3 pr-4">Total</th>
                    <th class="pb-3 pr-4">Completados</th>
                    <th class="pb-3 pr-4">Tasa</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr *ngFor="let item of tallerEficienciaRows">
                    <td class="py-4 pr-4 font-semibold text-slate-900 dark:text-white">{{ item.servicio }}</td>
                    <td class="py-4 pr-4 text-slate-600 dark:text-slate-300">{{ item.categoria_tarifa }}</td>
                    <td class="py-4 pr-4 text-slate-600 dark:text-slate-300">{{ item.total }}</td>
                    <td class="py-4 pr-4 text-slate-600 dark:text-slate-300">{{ item.completados }}</td>
                    <td class="py-4 pr-4">
                      <div class="flex items-center gap-3">
                        <div class="h-2.5 w-32 rounded-full bg-slate-100 dark:bg-slate-800">
                          <div class="h-2.5 rounded-full bg-emerald-500" [style.width.%]="item.tasa_completacion"></div>
                        </div>
                        <span class="font-semibold text-slate-700 dark:text-slate-200">{{ item.tasa_completacion | number:'1.0-1' }}%</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </article>
        </section>

        <ng-template #adminDashboard>
          <section class="mt-8 space-y-8">
            <article>
              <h2 class="mb-4 text-xl font-black text-slate-900 dark:text-white">Resumen principal</h2>
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
                <div
                  *ngFor="let card of adminSummaryCards"
                  class="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_15px_40px_-30px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-slate-900"
                >
                  <div class="flex items-start justify-between gap-3">
                    <div class="text-sm font-semibold text-slate-600 dark:text-slate-400">{{ card.label }}</div>
                    <span class="flex h-10 w-10 items-center justify-center rounded-2xl" [ngClass]="iconTone(card.tone)">
                      <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path [attr.d]="card.icon"></path>
                      </svg>
                    </span>
                  </div>
                  <div class="mt-5 text-3xl font-black tracking-tight text-slate-900 dark:text-white">{{ card.value }}</div>
                  <div class="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">{{ card.helper }}</div>
                </div>
              </div>
            </article>

            <div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <article class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h3 class="text-lg font-black text-slate-900 dark:text-white">Estado general de solicitudes</h3>
                <div class="mt-5 h-[320px]">
                  <canvas baseChart [data]="adminEstadoChart.data" [options]="barChartOptions" [type]="'bar'"></canvas>
                </div>
              </article>

              <article class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h3 class="text-lg font-black text-slate-900 dark:text-white">Distribución de solicitudes</h3>
                <div class="mt-5 grid grid-cols-1 items-center gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                  <div class="h-[280px]">
                    <canvas baseChart [data]="adminDistribucionChart.data" [options]="doughnutChartOptions" [type]="'doughnut'"></canvas>
                  </div>
                  <div class="space-y-4">
                    <div *ngFor="let row of adminDistribucionRows" class="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-800">
                      <div class="flex items-center gap-3">
                        <span class="h-3 w-3 rounded-full" [style.background]="row.color"></span>
                        <div>
                          <div class="text-sm font-semibold text-slate-800 dark:text-slate-100">{{ row.label }}</div>
                          <div class="text-xs text-slate-500 dark:text-slate-400">{{ row.helper }}</div>
                        </div>
                      </div>
                      <div class="text-sm font-bold text-slate-900 dark:text-white">{{ row.value }}</div>
                    </div>
                  </div>
                </div>
              </article>
            </div>

            <div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <article class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h3 class="text-lg font-black text-slate-900 dark:text-white">Incidentes más frecuentes</h3>
                <div class="mt-6 space-y-5">
                  <div *ngFor="let row of adminIncidentesRows">
                    <div class="mb-2 flex items-center justify-between gap-4">
                      <span class="text-sm font-semibold text-slate-700 dark:text-slate-200">{{ row.label }}</span>
                      <span class="text-sm font-bold text-slate-900 dark:text-white">{{ row.value }}</span>
                    </div>
                    <div class="h-3 rounded-full bg-slate-100 dark:bg-slate-800">
                      <div class="h-3 rounded-full bg-blue-600" [style.width.%]="barWidth(row.value, adminIncidentesMax)"></div>
                    </div>
                  </div>
                </div>
              </article>

              <article class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h3 class="text-lg font-black text-slate-900 dark:text-white">Servicios más demandados</h3>
                <div class="mt-6 space-y-5">
                  <div *ngFor="let row of adminServiciosRows">
                    <div class="mb-2 flex items-center justify-between gap-4">
                      <span class="text-sm font-semibold text-slate-700 dark:text-slate-200">{{ row.label }}</span>
                      <span class="text-sm font-bold text-slate-900 dark:text-white">{{ row.value }}</span>
                    </div>
                    <div class="h-3 rounded-full bg-slate-100 dark:bg-slate-800">
                      <div class="h-3 rounded-full bg-violet-500" [style.width.%]="barWidth(row.value, adminServiciosMax)"></div>
                    </div>
                  </div>
                </div>
              </article>
            </div>

            <div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <article class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h3 class="text-lg font-black text-slate-900 dark:text-white">Especialidades más demandadas</h3>
                <div class="mt-6 space-y-5">
                  <div *ngFor="let row of adminEspecialidadesRows">
                    <div class="mb-2 flex items-center justify-between gap-4">
                      <span class="text-sm font-semibold text-slate-700 dark:text-slate-200">{{ row.label }}</span>
                      <span class="text-sm font-bold text-slate-900 dark:text-white">{{ row.value }}</span>
                    </div>
                    <div class="h-3 rounded-full bg-slate-100 dark:bg-slate-800">
                      <div class="h-3 rounded-full bg-cyan-500" [style.width.%]="barWidth(row.value, adminEspecialidadesMax)"></div>
                    </div>
                  </div>
                </div>
              </article>

              <article class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h3 class="text-lg font-black text-slate-900 dark:text-white">Talleres con mayor actividad</h3>
                <div class="mt-5 h-[300px]">
                  <canvas baseChart [data]="adminTalleresChart.data" [options]="barChartOptions" [type]="'bar'"></canvas>
                </div>
              </article>
            </div>

            <div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <article class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h3 class="text-lg font-black text-slate-900 dark:text-white">Zonas críticas</h3>
                <div class="mt-6 space-y-5">
                  <div *ngFor="let row of adminZonasRows">
                    <div class="mb-2 flex items-center justify-between gap-4">
                      <div>
                        <div class="text-sm font-semibold text-slate-700 dark:text-slate-200">{{ row.label }}</div>
                        <div class="text-xs text-slate-500 dark:text-slate-400">{{ row.helper }}</div>
                      </div>
                      <span class="text-sm font-bold text-slate-900 dark:text-white">{{ row.value }}</span>
                    </div>
                    <div class="h-3 rounded-full bg-slate-100 dark:bg-slate-800">
                      <div class="h-3 rounded-full bg-amber-500" [style.width.%]="barWidth(row.value, adminZonasMax)"></div>
                    </div>
                  </div>
                </div>
              </article>

              <article class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h3 class="text-lg font-black text-slate-900 dark:text-white">Pagos</h3>
                <div class="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
                  <div *ngFor="let card of adminPagoCards" class="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800">
                    <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                      <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path [attr.d]="card.icon"></path>
                      </svg>
                    </div>
                    <div class="mt-4 text-sm font-semibold text-slate-600 dark:text-slate-400">{{ card.label }}</div>
                    <div class="mt-2 text-2xl font-black text-slate-900 dark:text-white">{{ card.value }}</div>
                    <div class="mt-2 text-xs text-slate-500 dark:text-slate-400">{{ card.helper }}</div>
                  </div>
                </div>
              </article>
            </div>

            <article class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h3 class="text-lg font-black text-slate-900 dark:text-white">Tiempos de respuesta</h3>
              <div class="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
                <div *ngFor="let card of adminTiempoCards" class="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800">
                  <div class="text-sm font-semibold text-slate-600 dark:text-slate-400">{{ card.label }}</div>
                  <div class="mt-3 text-3xl font-black text-slate-900 dark:text-white">{{ card.value }}</div>
                  <div class="mt-2 text-xs text-slate-500 dark:text-slate-400">{{ card.helper }}</div>
                </div>
              </div>
            </article>
          </section>
        </ng-template>

        <ng-template #sinServicios>
          <p class="text-sm text-slate-500 dark:text-slate-400">Sin datos aún.</p>
        </ng-template>
        <ng-template #sinDiagnosticos>
          <p class="text-sm text-slate-500 dark:text-slate-400">Sin diagnósticos registrados aún.</p>
        </ng-template>
        <ng-template #sinCancelaciones>
          <p class="text-sm text-slate-500 dark:text-slate-400">Sin cancelaciones registradas.</p>
        </ng-template>
      </div>
    </div>
  `,
})
export class DashboardComponent implements OnInit, OnDestroy {
  @ViewChild('dashboardExportRoot') dashboardExportRoot?: ElementRef<HTMLElement>;

  userName = '';
  userRole = '';
  isTaller = false;
  tenantLabel = '';
  exportandoPdf = false;

  private readonly destroy$ = new Subject<void>();

  adminStats: EstadisticasGeneralesResponse = this.getDefaultAdminStats();
  tallerStats: EstadisticasTallerResponse = this.getDefaultTallerStats();

  filtros = {
    fechaInicio: '2000-01-01',
    fechaFin: this.formatoFecha(new Date()),
    agruparPor: 'dia',
  };

  barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 11 } } },
      y: { beginAtZero: true, grid: { color: 'rgba(148,163,184,0.15)' }, ticks: { color: '#64748b' } },
    },
    plugins: {
      legend: { display: false },
    },
  };

  lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 11 } } },
      y: { beginAtZero: true, grid: { color: 'rgba(148,163,184,0.15)' }, ticks: { color: '#64748b' } },
    },
    elements: {
      line: { tension: 0.35, borderWidth: 3 },
      point: { radius: 4, hoverRadius: 5, backgroundColor: '#2563eb' },
    },
  };

  doughnutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: { display: false },
    },
  };

  tallerFlujoChart: any = { data: { labels: [], datasets: [] } };
  tallerDistribucionChart: any = { data: { labels: [], datasets: [] } };
  tallerDemandaDiaChart: any = { data: { labels: [], datasets: [] } };
  tallerDemandaHoraChart: any = { data: { labels: [], datasets: [] } };
  tallerIncidentesChart: any = { data: { labels: [], datasets: [] } };

  adminEstadoChart: any = { data: { labels: [], datasets: [] } };
  adminDistribucionChart: any = { data: { labels: [], datasets: [] } };
  adminTalleresChart: any = { data: { labels: [], datasets: [] } };

  constructor(
    private authService: AuthService,
    private workshopService: WorkshopService,
    private estadisticasSistemaService: EstadisticasSistemaService,
    private estadisticasTallerService: EstadisticasTallerService,
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (!user) {
      return;
    }

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

    this.iniciarAutoRefresh();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('window:focus')
  onWindowFocus(): void {
    this.refrescarDashboard();
  }

  get tallerSummaryCards(): SummaryCard[] {
    const est = this.tallerStats.estadisticas;
    if (!est) return [];
    return [
      this.summaryCard('Total solicitudes atendidas', est.total_solicitudes_atendidas, 'Atenciones completadas en el rango', 'blue', 'M4 19.5V4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v15.5M8 8h8M8 12h8M8 16h5'),
      this.summaryCard('Tasa de aceptación', `${this.formatNumber(est.tasa_aceptacion)}%`, 'Conversión de solicitudes recibidas', 'green', 'M20 6 9 17l-5-5'),
      this.summaryCard('Calificación promedio', est.calificacion_promedio ?? 'N/D', 'Valoración promedio del taller', 'amber', 'm12 17.27 6.18 20.5 7.64 14 2 9.24l6.91-1L12 2l3.09 6.24 6.91 1-5.64 4.76L17.82 20.5z'),
      this.summaryCard('Cumplimiento ETA', `${this.formatNumber(est.cumplimiento_eta_pct)}%`, 'Llegadas dentro del tiempo prometido', 'cyan', 'M12 8v5l3 3M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20'),
      this.summaryCard('Monto total pagado', `${this.formatMoney(est.monto_total_pagado)} Bs`, 'Pagos confirmados acumulados', 'emerald', 'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7H14.5a3.5 3.5 0 0 1 0 7H6'),
      this.summaryCard('Monto promedio pago', `${this.formatMoney(est.monto_promedio_pago)} Bs`, 'Ticket promedio confirmado', 'violet', 'M3 7h18M6 12h12M8 17h8'),
    ];
  }

  get tallerDistribucionRows(): Array<ProgressRow & { color: string }> {
    const est = this.tallerStats.estadisticas;
    if (!est) return [];
    return [
      { label: 'Solicitudes aceptadas', value: est.solicitudes_aceptadas, color: '#2563eb', helper: `${this.formatNumber(est.tasa_aceptacion)}% de aceptación` },
      { label: 'Solicitudes atendidas', value: est.total_solicitudes_atendidas, color: '#10b981', helper: 'Solicitudes cerradas con atención' },
      { label: 'Canceladas', value: est.total_solicitudes_canceladas, color: '#ef4444', helper: 'Solicitudes canceladas en el período' },
    ];
  }

  get tallerServiciosRows(): ProgressRow[] {
    return this.toProgressRows(this.tallerStats.estadisticas?.servicios_mas_realizados || [], 'nombre', 'cantidad');
  }

  get tallerServiciosMax(): number {
    return this.maxValue(this.tallerServiciosRows);
  }

  get tallerDiagnosticosRows(): ProgressRow[] {
    return (this.tallerStats.estadisticas?.diagnosticos || []).map((item: any) => ({
      label: String(item.diagnostico ?? item.categoria ?? 'N/D'),
      value: Number(item.cantidad ?? 0),
    }));
  }

  get tallerDiagnosticosMax(): number {
    return this.maxValue(this.tallerDiagnosticosRows);
  }

  get tallerCancelacionesRows(): ProgressRow[] {
    return this.toProgressRows(this.tallerStats.estadisticas?.cancelaciones_por_tipo || [], 'motivo', 'cantidad');
  }

  get tallerCancelacionesMax(): number {
    return this.maxValue(this.tallerCancelacionesRows);
  }

  get tallerIncidentesRows(): Array<ProgressRow & { color: string }> {
    const palette = ['#2563eb', '#10b981', '#8b5cf6', '#f97316', '#ec4899', '#06b6d4'];
    return (this.tallerStats.estadisticas?.incidentes_por_tipo || []).map((item, index) => ({
      label: item.tipo,
      value: item.cantidad,
      color: palette[index % palette.length],
    }));
  }

  get tallerTiempoCards(): TimeCard[] {
    const est = this.tallerStats.estadisticas;
    if (!est) return [];
    return [
      {
        label: 'Asignación promedio',
        value: `${this.formatNumber(est.tiempo_promedio_asignacion_minutos)} min`,
        helper: 'Tiempo desde la creación hasta la asignación',
        icon: 'M12 8v5l3 3M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20',
      },
      {
        label: 'Llegada promedio',
        value: `${this.formatNumber(est.tiempo_promedio_llegada_minutos)} min`,
        helper: 'Tiempo estimado real de llegada',
        icon: 'M5 12h14M12 5l7 7-7 7',
      },
      {
        label: 'Atención promedio',
        value: `${this.formatNumber(est.tiempo_promedio_atencion.tiempo_promedio_minutos)} min`,
        helper: `Mín ${this.formatNumber(est.tiempo_promedio_atencion.tiempo_minimo_minutos)} · Máx ${this.formatNumber(est.tiempo_promedio_atencion.tiempo_maximo_minutos)}`,
        icon: 'M9 11l3 3L22 4',
      },
    ];
  }

  get tallerPagoCards(): SummaryCard[] {
    const est = this.tallerStats.estadisticas;
    if (!est) return [];
    return [
      this.summaryCard('Pagos confirmados', est.total_pagos_confirmados, 'Total de pagos confirmados', 'emerald', 'M3 10h18M7 15h10M6 6h12'),
      this.summaryCard('Monto total pagado', `${this.formatMoney(est.monto_total_pagado)} Bs`, 'Suma confirmada del período', 'emerald', 'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7H14.5a3.5 3.5 0 0 1 0 7H6'),
      this.summaryCard('Monto promedio pago', `${this.formatMoney(est.monto_promedio_pago)} Bs`, 'Promedio por pago confirmado', 'emerald', 'M3 7h18M6 12h12M8 17h8'),
    ];
  }

  get tallerEficienciaRows(): KPIEficienciaServicio[] {
    return this.tallerStats.estadisticas?.eficiencia_por_servicio || [];
  }

  get tallerZonaMasIncidentes(): string | null | undefined {
    return this.tallerStats.estadisticas?.zona_mas_incidentes;
  }

  get adminSummaryCards(): SummaryCard[] {
    return [
      this.summaryCard('Emergencias', this.adminStats.total_emergencias, 'Solicitudes registradas en el rango', 'blue', 'M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.36a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z'),
      this.summaryCard('Tasa cancelación', `${this.formatNumber(this.adminStats.tasa_cancelacion)}%`, 'Solicitudes que terminaron canceladas', 'rose', 'M18 6 6 18M6 6l12 12'),
      this.summaryCard('Calificación', this.adminStats.promedio_calificacion ?? 'N/D', 'Promedio de calificaciones recibidas', 'amber', 'm12 17.27 6.18 20.5 7.64 14 2 9.24l6.91-1L12 2l3.09 6.24 6.91 1-5.64 4.76L17.82 20.5z'),
      this.summaryCard('Pagos confirmados', this.adminStats.total_pagos_confirmados, 'Pagos procesados con éxito', 'emerald', 'M3 10h18M7 15h10M6 6h12'),
      this.summaryCard('Monto total', `${this.formatMoney(this.adminStats.monto_total_pagado)} Bs`, 'Monto confirmado en el sistema', 'emerald', 'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7H14.5a3.5 3.5 0 0 1 0 7H6'),
      this.summaryCard('Monto promedio', `${this.formatMoney(this.adminStats.monto_promedio_pago)} Bs`, 'Promedio por pago registrado', 'violet', 'M3 7h18M6 12h12M8 17h8'),
      this.summaryCard('Talleres activos', this.adminStats.talleres_activos, 'Talleres con actividad en el rango', 'cyan', 'M4 21v-7M8 21V10M12 21V3M16 21v-5M20 21v-9'),
      this.summaryCard('Clientes activos', this.adminStats.clientes_activos, 'Clientes con solicitudes registradas', 'green', 'M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8'),
    ];
  }

  get adminDistribucionRows(): Array<ProgressRow & { color: string }> {
    return [
      { label: 'Completadas', value: this.adminStats.solicitudes_completadas, color: '#2563eb', helper: 'Solicitudes completadas en el período' },
      { label: 'Pendientes', value: this.adminStats.solicitudes_pendientes, color: '#f59e0b', helper: 'Solicitudes aún en curso' },
      { label: 'Canceladas', value: this.adminStats.solicitudes_canceladas, color: '#ef4444', helper: 'Solicitudes canceladas en el período' },
    ];
  }

  get adminIncidentesRows(): ProgressRow[] {
    return this.toProgressRows(this.adminStats.incidentes_frecuentes || [], 'tipo_incidente', 'cantidad');
  }

  get adminIncidentesMax(): number {
    return this.maxValue(this.adminIncidentesRows);
  }

  get adminServiciosRows(): ProgressRow[] {
    return this.toProgressRows(this.adminStats.servicios_frecuentes || [], 'nombre', 'cantidad');
  }

  get adminServiciosMax(): number {
    return this.maxValue(this.adminServiciosRows);
  }

  get adminEspecialidadesRows(): ProgressRow[] {
    return this.toProgressRows(this.adminStats.especialidades_frecuentes || [], 'nombre', 'cantidad');
  }

  get adminEspecialidadesMax(): number {
    return this.maxValue(this.adminEspecialidadesRows);
  }

  get adminZonasRows(): ProgressRow[] {
    return (this.adminStats.zonas_criticas || []).map((item) => ({
      label: item.zona,
      value: item.cantidad_emergencias,
      helper: `${item.talleres_disponibles} talleres disponibles`,
      color: '#f59e0b',
    }));
  }

  get adminZonasMax(): number {
    return this.maxValue(this.adminZonasRows);
  }

  get adminPagoCards(): SummaryCard[] {
    return [
      this.summaryCard('Pagos confirmados', this.adminStats.total_pagos_confirmados, 'Pagos confirmados del sistema', 'emerald', 'M3 10h18M7 15h10M6 6h12'),
      this.summaryCard('Pagos pendientes', this.adminStats.total_pagos_pendientes, 'Pagos aún sin confirmar', 'amber', 'M12 8v4l3 3M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20'),
      this.summaryCard('Monto total', `${this.formatMoney(this.adminStats.monto_total_pagado)} Bs`, 'Monto confirmado acumulado', 'emerald', 'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7H14.5a3.5 3.5 0 0 1 0 7H6'),
      this.summaryCard('Monto promedio', `${this.formatMoney(this.adminStats.monto_promedio_pago)} Bs`, 'Promedio por pago', 'violet', 'M3 7h18M6 12h12M8 17h8'),
    ];
  }

  get adminTiempoCards(): TimeCard[] {
    const tiempo = this.adminStats.tiempo_respuesta;
    if (!tiempo) {
      return [
        { label: 'Mínimo', value: '0 min', helper: 'Sin datos suficientes', icon: '' },
        { label: 'Máximo', value: '0 min', helper: 'Sin datos suficientes', icon: '' },
        { label: 'Promedio', value: '0 min', helper: 'Sin datos suficientes', icon: '' },
        { label: 'Mediana', value: '0 min', helper: 'Sin datos suficientes', icon: '' },
      ];
    }
    return [
      { label: 'Mínimo', value: `${this.formatNumber(tiempo.minimo)} min`, helper: 'Tiempo de respuesta más bajo', icon: '' },
      { label: 'Máximo', value: `${this.formatNumber(tiempo.maximo)} min`, helper: 'Tiempo de respuesta más alto', icon: '' },
      { label: 'Promedio', value: `${this.formatNumber(tiempo.promedio)} min`, helper: 'Promedio del período', icon: '' },
      { label: 'Mediana', value: `${this.formatNumber(tiempo.mediana)} min`, helper: 'Valor central de respuesta', icon: '' },
    ];
  }

  cargarKpisAdmin(): void {
    this.estadisticasSistemaService
      .obtenerEstadisticasSistema(this.filtros.fechaInicio, this.filtros.fechaFin, this.filtros.agruparPor)
      .subscribe({
        next: (data) => {
          this.adminStats = data;
          this.setupAdminCharts();
        },
        error: () => {
          this.adminStats = this.getDefaultAdminStats();
          this.setupAdminCharts();
        },
      });
  }

  cargarKpisTaller(): void {
    this.estadisticasTallerService
      .obtenerMisEstadisticas(this.filtros.fechaInicio, this.filtros.fechaFin, this.filtros.agruparPor)
      .subscribe({
        next: (data) => {
          this.tallerStats = data;
          this.setupTallerCharts();
        },
        error: () => {
          this.tallerStats = this.getDefaultTallerStats();
          this.setupTallerCharts();
        },
      });
  }

  aplicarFiltros(): void {
    this.refrescarDashboard();
  }

  limpiarFiltros(): void {
    this.filtros.fechaInicio = '2000-01-01';
    this.filtros.fechaFin = this.formatoFecha(new Date());
    this.filtros.agruparPor = 'dia';
    this.refrescarDashboard();
  }

  async exportarDashboardPdf(): Promise<void> {
    const root = this.dashboardExportRoot?.nativeElement;
    if (!root || this.exportandoPdf) {
      return;
    }

    this.exportandoPdf = true;

    try {
      const canvas = await html2canvas(root, {
        scale: 2,
        useCORS: true,
        backgroundColor: this.isDarkMode() ? '#020617' : '#f8fafc',
        logging: false,
        windowWidth: document.documentElement.scrollWidth,
        windowHeight: root.scrollHeight,
      });

      const imageData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 8;
      const usableWidth = pdfWidth - margin * 2;
      const pageUsableHeight = pdfHeight - margin * 2;
      const imageHeight = (canvas.height * usableWidth) / canvas.width;

      let heightLeft = imageHeight;
      let position = margin;

      pdf.addImage(imageData, 'PNG', margin, position, usableWidth, imageHeight, undefined, 'FAST');
      heightLeft -= pageUsableHeight;

      while (heightLeft > 0) {
        position = heightLeft - imageHeight + margin;
        pdf.addPage();
        pdf.addImage(imageData, 'PNG', margin, position, usableWidth, imageHeight, undefined, 'FAST');
        heightLeft -= pageUsableHeight;
      }

      pdf.save(this.isTaller ? `dashboard-taller-${Date.now()}.pdf` : `dashboard-admin-${Date.now()}.pdf`);
    } finally {
      this.exportandoPdf = false;
    }
  }

  barWidth(value: number, max: number): number {
    if (!max) return 0;
    return Math.max((value / max) * 100, 8);
  }

  iconTone(tone: SummaryCard['tone']): string {
    switch (tone) {
      case 'green':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';
      case 'amber':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
      case 'violet':
        return 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300';
      case 'cyan':
        return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300';
      case 'emerald':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';
      case 'rose':
        return 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300';
      default:
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
    }
  }

  private iniciarAutoRefresh(): void {
    interval(60000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.refrescarDashboard());
  }

  private refrescarDashboard(): void {
    if (this.isTaller) {
      this.cargarKpisTaller();
      return;
    }
    this.cargarKpisAdmin();
  }

  private formatoFecha(fecha: Date): string {
    return fecha.toISOString().split('T')[0];
  }

  private setupTallerCharts(): void {
    const est = this.tallerStats.estadisticas;
    if (!est) {
      this.tallerFlujoChart = { data: { labels: [], datasets: [] } };
      this.tallerDistribucionChart = { data: { labels: [], datasets: [] } };
      this.tallerDemandaDiaChart = { data: { labels: [], datasets: [] } };
      this.tallerDemandaHoraChart = { data: { labels: [], datasets: [] } };
      this.tallerIncidentesChart = { data: { labels: [], datasets: [] } };
      return;
    }

    this.tallerFlujoChart = {
      data: {
        labels: ['Recibidas', 'Aceptadas', 'Atendidas', 'Canceladas', 'Servicios completados'],
        datasets: [
          {
            data: [
              est.solicitudes_recibidas,
              est.solicitudes_aceptadas,
              est.total_solicitudes_atendidas,
              est.total_solicitudes_canceladas,
              est.total_servicios_completados,
            ],
            backgroundColor: ['#2563eb', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6'],
            borderRadius: 14,
            maxBarThickness: 44,
          },
        ],
      },
    };

    this.tallerDistribucionChart = {
      data: {
        labels: this.tallerDistribucionRows.map((row) => row.label),
        datasets: [
          {
            data: this.tallerDistribucionRows.map((row) => row.value),
            backgroundColor: this.tallerDistribucionRows.map((row) => row.color),
            borderWidth: 0,
          },
        ],
      },
    };

    this.tallerDemandaDiaChart = {
      data: {
        labels: this.extractLabels(est.dias_mayor_demanda),
        datasets: [
          {
            data: this.extractValues(est.dias_mayor_demanda),
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37,99,235,0.12)',
            fill: true,
          },
        ],
      },
    };

    this.tallerDemandaHoraChart = {
      data: {
        labels: this.extractLabels(est.horas_mayor_demanda),
        datasets: [
          {
            data: this.extractValues(est.horas_mayor_demanda),
            backgroundColor: '#3b82f6',
            borderRadius: 12,
            maxBarThickness: 36,
          },
        ],
      },
    };

    this.tallerIncidentesChart = {
      data: {
        labels: this.tallerIncidentesRows.map((row) => row.label),
        datasets: [
          {
            data: this.tallerIncidentesRows.map((row) => row.value),
            backgroundColor: this.tallerIncidentesRows.map((row) => row.color),
            borderWidth: 0,
          },
        ],
      },
    };
  }

  private setupAdminCharts(): void {
    this.adminEstadoChart = {
      data: {
        labels: ['Emergencias', 'Atendidas', 'Canceladas', 'Completadas', 'Pendientes'],
        datasets: [
          {
            data: [
              this.adminStats.total_emergencias,
              this.adminStats.total_solicitudes_atendidas,
              this.adminStats.total_solicitudes_canceladas,
              this.adminStats.solicitudes_completadas,
              this.adminStats.solicitudes_pendientes,
            ],
            backgroundColor: ['#2563eb', '#10b981', '#ef4444', '#8b5cf6', '#f59e0b'],
            borderRadius: 14,
            maxBarThickness: 44,
          },
        ],
      },
    };

    this.adminDistribucionChart = {
      data: {
        labels: this.adminDistribucionRows.map((row) => row.label),
        datasets: [
          {
            data: this.adminDistribucionRows.map((row) => row.value),
            backgroundColor: this.adminDistribucionRows.map((row) => row.color),
            borderWidth: 0,
          },
        ],
      },
    };

    this.adminTalleresChart = {
      data: {
        labels: (this.adminStats.talleres_top || []).map((item) => item.nombre_taller),
        datasets: [
          {
            label: 'Solicitudes atendidas',
            data: (this.adminStats.talleres_top || []).map((item) => item.solicitudes_atendidas),
            backgroundColor: '#2563eb',
            borderRadius: 10,
            maxBarThickness: 24,
          },
          {
            label: 'Servicios realizados',
            data: (this.adminStats.talleres_top || []).map((item) => item.servicios_realizados),
            backgroundColor: '#8b5cf6',
            borderRadius: 10,
            maxBarThickness: 24,
          },
        ],
      },
      options: {
        ...this.barChartOptions,
        plugins: { legend: { display: true, position: 'bottom' } },
      },
    };
  }

  private summaryCard(
    label: string,
    value: string | number | null | undefined,
    helper: string,
    tone: SummaryCard['tone'],
    icon: string,
  ): SummaryCard {
    return {
      label,
      value: typeof value === 'number' ? this.formatNumber(value) : String(value ?? '0'),
      helper,
      tone,
      icon,
    };
  }

  private toProgressRows<T extends Record<string, any>>(items: T[], labelKey: keyof T, valueKey: keyof T): ProgressRow[] {
    return items.map((item) => ({
      label: String(item[labelKey] ?? 'N/D'),
      value: Number(item[valueKey] ?? 0),
    }));
  }

  private maxValue(rows: ProgressRow[]): number {
    return rows.reduce((max, row) => (row.value > max ? row.value : max), 0);
  }

  private extractLabels(rows: EstadisticaDemacruzada[]): string[] {
    return (rows || []).map((item) => item.periodo);
  }

  private extractValues(rows: EstadisticaDemacruzada[]): number[] {
    return (rows || []).map((item) => item.cantidad);
  }

  private formatNumber(value: number | string): string {
    const numeric = Number(value ?? 0);
    return Number.isInteger(numeric)
      ? numeric.toLocaleString('es-BO')
      : numeric.toLocaleString('es-BO', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  }

  private formatMoney(value: number): string {
    return Number(value || 0).toLocaleString('es-BO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  private isDarkMode(): boolean {
    return document.documentElement.classList.contains('dark');
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
        solicitudes_recibidas: 0,
        solicitudes_aceptadas: 0,
        tasa_aceptacion: 0,
        total_servicios_completados: 0,
        tasa_completacion: 0,
        calificacion_promedio: null,
        total_pagos_confirmados: 0,
        monto_total_pagado: 0,
        monto_promedio_pago: 0,
        cumplimiento_eta_pct: 0,
        diagnosticos: [],
        total_diagnosticos_con_seguimiento: 0,
        dias_mayor_demanda: [],
        horas_mayor_demanda: [],
        tiempo_promedio_atencion: {
          tiempo_promedio_minutos: 0,
          tiempo_minimo_minutos: 0,
          tiempo_maximo_minutos: 0,
        },
        tiempo_promedio_asignacion_minutos: 0,
        tiempo_promedio_llegada_minutos: 0,
        incidentes_por_tipo: [],
        zona_mas_incidentes: null,
        cancelaciones_por_tipo: [],
        eficiencia_por_servicio: [],
        servicios_mas_realizados: [],
      },
      reporte: null,
      opciones_filtros: null,
      mensaje_vacio: null,
    } as unknown as EstadisticasTallerResponse;
  }
}
