import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';
import { BitacoraService } from '@core/services/bitacora.service';
import { BitacoraEvento, BitacoraListResponse, BitacoraFiltros } from '@core/models/bitacora.model';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-bitacora',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="px-6 py-4">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 text-transparent bg-clip-text mb-2">
          📋 Bitácora del Sistema
        </h1>
        <p class="text-gray-600 dark:text-slate-400">Consulta y supervisa todas las acciones del sistema</p>
      </div>

      <!-- Loading -->
      <div *ngIf="cargando" class="text-center py-8">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p class="text-gray-500 dark:text-slate-400 mt-2">Cargando registros...</p>
      </div>

      <!-- Error -->
      <div *ngIf="error && !cargando" class="mb-4 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg border border-red-300 dark:border-red-700">
        ❌ {{ error }}
      </div>

      <!-- Content -->
      <div *ngIf="!cargando" class="space-y-4">
        <!-- Filtros -->
        <div class="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 p-6">
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">🔍 Filtros</h2>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <!-- Buscador -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Buscar</label>
              <input
                type="text"
                [(ngModel)]="filtros.accion"
                (ngModelChange)="onAccionChange()"
                placeholder="Buscar acción..."
                class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <!-- Tipo de Actor -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Tipo de Actor</label>
              <select
                [(ngModel)]="filtros.tipo_actor"
                (change)="aplicarFiltros()"
                class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Todos --</option>
                <option value="CLIENTE">Cliente</option>
                <option value="TALLER">Taller</option>
                <option value="ADMINISTRADOR">Administrador</option>
                <option value="SISTEMA">Sistema</option>
              </select>
            </div>

            <!-- Fecha Inicio -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Fecha Inicio</label>
              <input
                type="date"
                [(ngModel)]="filtros.fecha_inicio"
                (change)="aplicarFiltros()"
                class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <!-- Fecha Fin -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Fecha Fin</label>
              <input
                type="date"
                [(ngModel)]="filtros.fecha_fin"
                (change)="aplicarFiltros()"
                class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <!-- Botones de Exportación -->
        <div class="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 p-6">
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">📥 Exportar Bitácora</h2>

          <div class="flex flex-wrap gap-3">
            <button
              (click)="exportarHTML()"
              [disabled]="registros.length === 0"
              class="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition flex items-center gap-2"
            >
              🌐 Exportar a HTML
            </button>

            <button
              (click)="exportarCSV()"
              [disabled]="registros.length === 0"
              class="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition flex items-center gap-2"
            >
              📊 Exportar a CSV
            </button>

            <button
              (click)="exportarExcel()"
              [disabled]="registros.length === 0"
              class="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition flex items-center gap-2"
            >
              📈 Exportar a Excel
            </button>
          </div>

          <p class="text-xs text-gray-600 dark:text-slate-400 mt-2">
            Los botones de exportación se habilitarán cuando haya registros en la tabla
          </p>
        </div>

        <!-- Tabla -->
        <div class="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-100 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600">
                <tr>
                  <th class="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Fecha</th>
                  <th class="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Actor</th>
                  <th class="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Correo</th>
                  <th class="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Acción</th>
                  <th class="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Descripción</th>
                  <th class="px-4 py-3 text-center font-semibold text-gray-900 dark:text-white">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-slate-700">
                <tr *ngFor="let evento of registros" class="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition">
                  <td class="px-4 py-3 text-gray-900 dark:text-white text-xs">
                    {{ evento.fecha_evento | date: 'dd/MM/yyyy HH:mm:ss' }}
                  </td>
                  <td class="px-4 py-3 text-gray-700 dark:text-slate-300">
                    <span [ngClass]="{
                      'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200': evento.tipo_actor === 'CLIENTE',
                      'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200': evento.tipo_actor === 'TALLER',
                      'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200': evento.tipo_actor === 'ADMINISTRADOR',
                      'bg-gray-100 dark:bg-slate-600 text-gray-800 dark:text-slate-200': evento.tipo_actor === 'SISTEMA'
                    }" class="px-2 py-1 rounded text-xs font-medium">
                      {{ evento.tipo_actor }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-gray-700 dark:text-slate-300 text-xs">
                    {{ evento.correo || '—' }}
                  </td>
                  <td class="px-4 py-3 text-gray-700 dark:text-slate-300 font-mono text-xs">{{ evento.accion }}</td>
                  <td class="px-4 py-3 text-gray-700 dark:text-slate-300 text-xs">{{ evento.detalle || '—' }}</td>
                  <td class="px-4 py-3 text-center">
                    <button
                      (click)="abrirDetalles(evento)"
                      class="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-medium transition"
                    >
                      👁️ Ver
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Mensaje sin registros -->
          <div *ngIf="registros.length === 0" class="p-8 text-center text-gray-500 dark:text-slate-400">
            <p class="text-lg">No hay registros que coincidan con los filtros seleccionados</p>
          </div>

          <!-- Paginación -->
          <div *ngIf="registros.length > 0" class="flex items-center justify-between px-4 py-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50">
            <div class="text-sm text-gray-600 dark:text-slate-400">
              Mostrando {{ (filtros.pagina! - 1) * filtros.por_pagina! + 1 }} a {{ Math.min(filtros.pagina! * filtros.por_pagina!, total) }} de {{ total }} registros
            </div>
            <div class="flex gap-2">
              <button
                (click)="paginarAnterior()"
                [disabled]="filtros.pagina === 1"
                class="px-3 py-1 bg-gray-300 dark:bg-slate-600 hover:bg-gray-400 dark:hover:bg-slate-500 text-gray-900 dark:text-white rounded text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Anterior
              </button>
              <span class="px-3 py-1 text-sm text-gray-700 dark:text-white">
                Página {{ filtros.pagina }} de {{ Math.ceil(total / filtros.por_pagina!) }}
              </span>
              <button
                (click)="paginarSiguiente()"
                [disabled]="filtros.pagina! * filtros.por_pagina! >= total"
                class="px-3 py-1 bg-gray-300 dark:bg-slate-600 hover:bg-gray-400 dark:hover:bg-slate-500 text-gray-900 dark:text-white rounded text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente →
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal de Detalles -->
      <div *ngIf="mostrarDetalles && eventoSeleccionado" class="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4 z-50">
        <div class="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-auto">
          <div class="p-6">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-2xl font-bold text-gray-900 dark:text-white">📄 Detalles del Evento</h2>
              <button (click)="cerrarDetalles()" class="text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-white text-2xl">×</button>
            </div>

            <div class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <p class="text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase mb-1">Fecha</p>
                  <p class="text-sm text-gray-900 dark:text-white">{{ eventoSeleccionado.fecha_evento | date: 'dd/MM/yyyy HH:mm:ss' }}</p>
                </div>
                <div>
                  <p class="text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase mb-1">ID Bitácora</p>
                  <p class="text-xs font-mono text-gray-900 dark:text-white break-all">{{ eventoSeleccionado.id_bitacora }}</p>
                </div>
                <div>
                  <p class="text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase mb-1">Tipo de Actor</p>
                  <p class="text-sm text-gray-900 dark:text-white">{{ eventoSeleccionado.tipo_actor }}</p>
                </div>
                <div>
                  <p class="text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase mb-1">Usuario</p>
                  <p class="text-sm text-gray-900 dark:text-white">{{ eventoSeleccionado.nombre_completo || '—' }}</p>
                </div>
                <div>
                  <p class="text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase mb-1">Correo</p>
                  <p class="text-sm text-gray-900 dark:text-white">{{ eventoSeleccionado.correo || '—' }}</p>
                </div>
                <div>
                  <p class="text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase mb-1">Acción</p>
                  <p class="text-sm font-mono text-gray-900 dark:text-white">{{ eventoSeleccionado.accion }}</p>
                </div>
                <div>
                  <p class="text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase mb-1">Módulo</p>
                  <p class="text-sm text-gray-900 dark:text-white">{{ eventoSeleccionado.modulo }}</p>
                </div>
                <div>
                  <p class="text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase mb-1">Entidad Afectada</p>
                  <p class="text-sm text-gray-900 dark:text-white">{{ eventoSeleccionado.entidad_afectada }}</p>
                </div>
                <div>
                  <p class="text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase mb-1">ID Entidad</p>
                  <p class="text-xs font-mono text-gray-900 dark:text-white break-all">{{ eventoSeleccionado.id_entidad_afectada || '—' }}</p>
                </div>
                <div>
                  <p class="text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase mb-1">Resultado</p>
                  <p class="text-sm text-gray-900 dark:text-white">{{ eventoSeleccionado.resultado }}</p>
                </div>
                <div>
                  <p class="text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase mb-1">IP Origen</p>
                  <p class="text-xs font-mono text-gray-900 dark:text-white">{{ eventoSeleccionado.ip_origen || '—' }}</p>
                </div>
              </div>

              <!-- Detalle -->
              <div *ngIf="eventoSeleccionado.detalle" class="border-t border-gray-200 dark:border-slate-700 pt-4">
                <p class="text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase mb-2">Detalle</p>
                <p class="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-slate-700 p-3 rounded font-mono break-words">{{ eventoSeleccionado.detalle }}</p>
              </div>
            </div>

            <div class="flex gap-2 justify-end border-t border-gray-200 dark:border-slate-700 pt-4 mt-4">
              <button
                (click)="cerrarDetalles()"
                class="px-6 py-2 bg-gray-300 dark:bg-slate-600 hover:bg-gray-400 dark:hover:bg-slate-500 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
              >
                Cerrar
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
export class BitacoraComponent implements OnInit, OnDestroy {
  registros: BitacoraEvento[] = [];
  cargando = true;
  error: string | null = null;
  total = 0;

  mostrarDetalles = false;
  eventoSeleccionado: BitacoraEvento | null = null;

  filtros: BitacoraFiltros = {
    pagina: 1,
    por_pagina: 20,
    tipo_actor: '',
    accion: '',
    fecha_inicio: '',
    fecha_fin: '',
  };

  private destroy$ = new Subject<void>();
  private busquedaSubject$ = new Subject<void>();

  readonly Math = Math;

  constructor(private bitacoraService: BitacoraService) {}

  ngOnInit(): void {
    this.cargarDatos();

    // Debounce para búsqueda
    this.busquedaSubject$
      .pipe(
        debounceTime(500),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.filtros.pagina = 1;
        this.cargarDatos();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private cargarDatos(): void {
    this.cargando = true;
    this.error = null;

    this.bitacoraService
      .consultarBitacora(this.filtros)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (respuesta) => {
          this.registros = respuesta.registros;
          this.total = respuesta.total;
          this.cargando = false;
        },
        error: (err) => {
          this.error = err.error?.detail || 'Error al cargar la bitácora';
          this.cargando = false;
        }
      });
  }

  aplicarFiltros(): void {
    this.filtros.pagina = 1;
    this.cargarDatos();
  }

  onAccionChange(): void {
    this.busquedaSubject$.next();
  }

  limpiarFiltros(): void {
    this.filtros = {
      pagina: 1,
      por_pagina: 20,
      tipo_actor: '',
      accion: '',
      fecha_inicio: '',
      fecha_fin: '',
    };
    this.cargarDatos();
  }

  paginarAnterior(): void {
    if (this.filtros.pagina! > 1) {
      this.filtros.pagina!--;
      this.cargarDatos();
    }
  }

  paginarSiguiente(): void {
    if (this.filtros.pagina! * this.filtros.por_pagina! < this.total) {
      this.filtros.pagina!++;
      this.cargarDatos();
    }
  }

  abrirDetalles(evento: BitacoraEvento): void {
    this.eventoSeleccionado = evento;
    this.mostrarDetalles = true;
  }

  cerrarDetalles(): void {
    this.mostrarDetalles = false;
    this.eventoSeleccionado = null;
  }

  exportarHTML(): void {
    if (this.registros.length === 0) {
      alert('No hay registros para exportar');
      return;
    }
    this.crearHTML(this.registros);
  }

  exportarCSV(): void {
    if (this.registros.length === 0) {
      alert('No hay registros para exportar');
      return;
    }
    this.crearCSV(this.registros);
  }

  exportarExcel(): void {
    if (this.registros.length === 0) {
      alert('No hay registros para exportar');
      return;
    }
    this.crearExcel(this.registros);
  }

  private crearHTML(eventos: BitacoraEvento[]): void {
    try {
      const fecha = new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      let html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bitácora del Sistema</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 {
            color: #2980b9;
            border-bottom: 3px solid #2980b9;
            padding-bottom: 10px;
        }
        .info {
            background-color: #ecf0f1;
            padding: 10px;
            border-radius: 4px;
            margin: 10px 0;
            font-size: 14px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        th {
            background-color: #2980b9;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: bold;
        }
        td {
            padding: 10px;
            border-bottom: 1px solid #ddd;
        }
        tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        tr:hover {
            background-color: #f0f0f0;
        }
        .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            color: white;
        }
        .badge-cliente { background-color: #3498db; }
        .badge-taller { background-color: #9b59b6; }
        .badge-admin { background-color: #e74c3c; }
        .badge-sistema { background-color: #95a5a6; }
        .badge-exito { background-color: #27ae60; }
        .badge-error { background-color: #e74c3c; }
        .badge-advertencia { background-color: #f39c12; }
        footer {
            margin-top: 20px;
            padding-top: 10px;
            border-top: 1px solid #ddd;
            font-size: 12px;
            color: #666;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📋 Bitácora del Sistema</h1>
        <div class="info">
            <p><strong>Generado:</strong> ${fecha}</p>
            <p><strong>Total de registros:</strong> ${eventos.length}</p>
        </div>
        <table>
            <thead>
                <tr>
                    <th>Fecha</th>
                    <th>Tipo Actor</th>
                    <th>Usuario</th>
                    <th>Correo</th>
                    <th>Acción</th>
                    <th>Módulo</th>
                    <th>Resultado</th>
                </tr>
            </thead>
            <tbody>`;

      eventos.forEach(evento => {
        const tipoActorClass = `badge-${evento.tipo_actor.toLowerCase()}`;
        const resultadoClass = `badge-${evento.resultado.toLowerCase()}`;
        const fechaFormato = evento.fecha_evento
          ? new Date(evento.fecha_evento).toLocaleString('es-ES')
          : '—';

        html += `
                <tr>
                    <td>${fechaFormato}</td>
                    <td><span class="badge ${tipoActorClass}">${evento.tipo_actor}</span></td>
                    <td>${evento.nombre_completo || '—'}</td>
                    <td>${evento.correo || '—'}</td>
                    <td><strong>${evento.accion}</strong></td>
                    <td>${evento.modulo}</td>
                    <td><span class="badge ${resultadoClass}">${evento.resultado}</span></td>
                </tr>`;
      });

      html += `
            </tbody>
        </table>
        <footer>
            <p>Este documento fue generado automáticamente desde la Bitácora del Sistema</p>
        </footer>
    </div>
</body>
</html>`;

      // Descargar
      const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `bitacora-${new Date().getTime()}.html`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error al generar HTML:', error);
      alert('Error al generar el HTML');
    }
  }

  private crearPDF(eventos: BitacoraEvento[]): void {
    try {
      const doc = new jsPDF();
      const titulo = 'Bitácora del Sistema';
      const fecha = new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // Título
      doc.setFontSize(16);
      doc.text(titulo, 14, 15);

      // Fecha de generación
      doc.setFontSize(10);
      doc.text(`Generado: ${fecha}`, 14, 22);
      doc.text(`Total de registros: ${eventos.length}`, 14, 28);

      // Preparar datos para la tabla
      const datos = eventos.map(evento => [
        evento.fecha_evento ? new Date(evento.fecha_evento).toLocaleString('es-ES') : '—',
        evento.tipo_actor,
        evento.nombre_completo || '—',
        evento.correo || '—',
        evento.accion,
        evento.resultado
      ]);

      // Agregar tabla con autoTable
      const pageHeight = doc.internal.pageSize.getHeight();
      const startY = 35;

      (doc as any).autoTable({
        head: [['Fecha', 'Actor', 'Usuario', 'Correo', 'Acción', 'Resultado']],
        body: datos,
        startY: startY,
        margin: 10,
        pageBreak: 'auto',
        styles: {
          fontSize: 8,
          cellPadding: 2,
          overflow: 'linebreak'
        },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 9
        },
        alternateRowStyles: {
          fillColor: [240, 240, 240]
        },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 15 },
          2: { cellWidth: 25 },
          3: { cellWidth: 35 },
          4: { cellWidth: 25 },
          5: { cellWidth: 15 }
        }
      });

      // Agregar número de página
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(
          `Página ${i} de ${pageCount}`,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      // Descargar
      doc.save(`bitacora-${new Date().getTime()}.pdf`);
    } catch (error) {
      console.error('Error al generar PDF:', error);
      alert('Error al generar el PDF');
    }
  }

  private crearCSV(eventos: BitacoraEvento[]): void {
    try {
      // Encabezados
      const encabezados = ['Fecha', 'Tipo Actor', 'Usuario', 'Correo', 'Acción', 'Módulo', 'Entidad', 'Resultado', 'Detalle', 'IP Origen'];

      // Datos
      const datos = eventos.map(evento => [
        evento.fecha_evento ? new Date(evento.fecha_evento).toLocaleString('es-ES') : '—',
        evento.tipo_actor,
        evento.nombre_completo || '—',
        evento.correo || '—',
        evento.accion,
        evento.modulo,
        evento.entidad_afectada,
        evento.resultado,
        evento.detalle || '—',
        evento.ip_origen || '—'
      ]);

      // Convertir a CSV
      let csv = encabezados.map(h => `"${h}"`).join(',') + '\n';
      datos.forEach(fila => {
        csv += fila.map(celda => `"${String(celda).replace(/"/g, '""')}"`).join(',') + '\n';
      });

      // Descargar
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `bitacora-${new Date().getTime()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error al generar CSV:', error);
      alert('Error al generar el CSV');
    }
  }

  private crearExcel(eventos: BitacoraEvento[]): void {
    try {
      // Preparar datos
      const datos = eventos.map(evento => ({
        'Fecha': evento.fecha_evento ? new Date(evento.fecha_evento).toLocaleString('es-ES') : '—',
        'Tipo Actor': evento.tipo_actor,
        'Usuario': evento.nombre_completo || '—',
        'Correo': evento.correo || '—',
        'Acción': evento.accion,
        'Módulo': evento.modulo,
        'Entidad': evento.entidad_afectada,
        'Resultado': evento.resultado,
        'Detalle': evento.detalle || '—',
        'IP Origen': evento.ip_origen || '—'
      }));

      // Crear libro de Excel
      const ws = XLSX.utils.json_to_sheet(datos);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Bitácora');

      // Ajustar ancho de columnas
      const maxWidth = 15;
      const colWidths: number[] = [];
      Object.keys(datos[0] || {}).forEach(() => {
        colWidths.push(maxWidth);
      });
      ws['!cols'] = colWidths.map(w => ({ wch: w }));

      // Descargar
      XLSX.writeFile(wb, `bitacora-${new Date().getTime()}.xlsx`);
    } catch (error) {
      console.error('Error al generar Excel:', error);
      alert('Error al generar el Excel');
    }
  }
}
