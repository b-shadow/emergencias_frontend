import { ChangeDetectorRef, Component, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import {
  ColumnaReporteConsultaSistema,
  EstadisticasSistemaService,
  ReporteConsultaSistemaResponse,
} from '@core/services/estadisticas-sistema.service';

interface SpeechRecognitionResultLike {
  0: { transcript: string };
  isFinal: boolean;
  length: number;
}

interface SpeechRecognitionEventLike extends Event {
  results: {
    [index: number]: SpeechRecognitionResultLike;
    length: number;
  };
}

interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: Event & { error?: string }) => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;
type ReportCellValue = string | number | boolean | null;

@Component({
  selector: 'app-admin-estadisticas-sistema',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 text-slate-900 dark:text-white">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div class="flex items-start gap-4">
          <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/20">
            <span class="material-icons text-4xl">analytics</span>
          </div>
          <div>
            <h1 class="text-4xl font-black tracking-tight">Reportes del Sistema</h1>
            <p class="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Consulta reportes globales del SaaS con filtros naturales por empresa, actor o estado.
            </p>
          </div>
        </div>

        <div class="relative">
          <button
            type="button"
            (click)="toggleExportMenu($event)"
            [disabled]="!reporte || !reporte.filas.length"
            class="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-white px-4 py-3 text-sm font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-indigo-300 dark:hover:bg-slate-700"
          >
            <span class="material-icons text-base">ios_share</span>
            <span>Exportar</span>
            <span class="material-icons text-base">expand_more</span>
          </button>

          <div
            *ngIf="showExportMenu"
            (click)="$event.stopPropagation()"
            class="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800"
          >
            <button type="button" (click)="exportarCsv()" class="flex w-full items-center gap-2 px-4 py-3 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700">
              <span class="material-icons text-base">table_view</span>
              <span>Exportar CSV</span>
            </button>
            <button type="button" (click)="exportarPdf()" class="flex w-full items-center gap-2 px-4 py-3 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700">
              <span class="material-icons text-base">picture_as_pdf</span>
              <span>Exportar PDF</span>
            </button>
            <button type="button" (click)="exportarHtml()" class="flex w-full items-center gap-2 px-4 py-3 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700">
              <span class="material-icons text-base">language</span>
              <span>Exportar HTML</span>
            </button>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-6 xl:grid-cols-[2.1fr_0.9fr]">
        <section class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div class="mb-5 flex items-start gap-3">
            <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-slate-800 dark:text-indigo-400">
              <span class="material-icons">query_stats</span>
            </div>
            <div>
              <h2 class="text-2xl font-bold">Generar nuevo reporte</h2>
              <p class="text-sm text-slate-600 dark:text-slate-400">
                Pide información del sistema completo o de una empresa específica.
              </p>
            </div>
          </div>

          <div class="space-y-4">
            <div class="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/70 shadow-inner dark:border-slate-700 dark:bg-slate-950/60">
              <textarea
                [(ngModel)]="consulta"
                rows="4"
                maxlength="500"
                placeholder='Ejemplo: quiero ver todos los usuarios asociados a la empresa "Transformers"'
                class="min-h-[126px] w-full resize-none bg-transparent px-5 py-4 text-sm outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
              ></textarea>
              <div class="flex justify-end border-t border-slate-200 px-4 py-2 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
                {{ consulta.length }}/500
              </div>
            </div>

            <div class="flex flex-col gap-3 xl:flex-row xl:items-start">
              <div class="flex items-center gap-3 pt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                <span>Ejemplos:</span>
              </div>
              <div class="flex flex-wrap gap-2">
                <button
                  *ngFor="let ejemplo of ejemplosRapidos"
                  type="button"
                  (click)="usarEjemplo(ejemplo)"
                  class="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 transition hover:bg-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-indigo-300 dark:hover:bg-slate-700"
                >
                  {{ ejemplo.etiqueta }}
                </button>
              </div>
            </div>

            <div class="flex flex-wrap gap-3 pt-1">
              <button
                type="button"
                (click)="limpiarTodo()"
                class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <span class="material-icons text-base">delete</span>
                <span>Limpiar</span>
              </button>

              <button
                type="button"
                (click)="generarReporte()"
                [disabled]="cargando || !consulta.trim()"
                class="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:from-indigo-700 hover:to-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span class="material-icons text-base">play_arrow</span>
                <span>{{ cargando ? 'Generando reporte...' : 'Generar reporte' }}</span>
              </button>

              <button
                type="button"
                (click)="toggleEscucha()"
                class="inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition"
                [ngClass]="escuchando
                  ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'"
              >
                <span class="material-icons text-base">{{ escuchando ? 'stop_circle' : 'keyboard_voice' }}</span>
                <span>{{ escuchando ? 'Detener voz' : 'Grabar voz' }}</span>
              </button>
            </div>
          </div>

          <div *ngIf="estadoVoz" class="mt-4 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300">
            {{ estadoVoz }}
          </div>
          <div *ngIf="error" class="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            {{ error }}
          </div>
        </section>

        <aside class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div class="mb-5 flex items-start gap-3">
            <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-slate-800 dark:text-indigo-400">
              <span class="material-icons">lightbulb</span>
            </div>
            <div>
              <h2 class="text-2xl font-bold">Consejos</h2>
            </div>
          </div>

          <div class="space-y-5 pt-3">
            <div *ngFor="let consejo of consejos" class="flex items-start gap-3">
              <span class="material-icons mt-0.5 text-indigo-600 dark:text-indigo-400">check_circle</span>
              <p class="text-sm text-slate-700 dark:text-slate-300">{{ consejo }}</p>
            </div>
          </div>

          <div class="mt-10 flex justify-end">
            <div class="rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 p-4 text-indigo-500 shadow-inner dark:from-slate-800 dark:to-slate-800 dark:text-indigo-400">
              <span class="material-icons text-5xl">manage_search</span>
            </div>
          </div>
        </aside>
      </div>

      <section *ngIf="reporte" class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div class="mb-3 flex items-start gap-3">
              <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-slate-800 dark:text-indigo-400">
                <span class="material-icons">visibility</span>
              </div>
              <div>
                <h2 class="text-2xl font-bold">Campos del reporte</h2>
                <p class="text-sm text-slate-600 dark:text-slate-400">
                  Selecciona qué columnas quieres mantener visibles.
                </p>
              </div>
            </div>
          </div>

          <div class="flex flex-wrap gap-3">
            <button
              type="button"
              (click)="restablecerColumnas()"
              class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <span class="material-icons text-base">restart_alt</span>
              <span>Restablecer</span>
            </button>
            <button
              type="button"
              (click)="mostrarTodasLasColumnas()"
              class="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:from-indigo-700 hover:to-violet-700"
            >
              <span class="material-icons text-base">visibility</span>
              <span>Mostrar todo</span>
            </button>
          </div>
        </div>

        <div class="mt-6 flex flex-wrap gap-3">
          <label
            *ngFor="let columna of columnasConfigurables"
            class="inline-flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition"
            [ngClass]="columna.visible
              ? 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900/50 dark:bg-indigo-950/30 dark:text-indigo-300'
              : 'border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'"
          >
            <input
              type="checkbox"
              [checked]="columna.visible"
              (change)="toggleColumna(columna.key)"
              class="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span>{{ columna.label }}</span>
          </label>
        </div>
      </section>

      <section *ngIf="reporte" class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div class="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div class="mb-3 flex items-start gap-3">
              <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-slate-800 dark:text-indigo-400">
                <span class="material-icons">table_rows</span>
              </div>
              <div>
                <h2 class="text-2xl font-bold">Resultados del reporte</h2>
                <p class="text-sm text-slate-600 dark:text-slate-400">{{ reporte.descripcion || 'Resultado generado a partir de tu consulta.' }}</p>
              </div>
            </div>
            <div class="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              Consulta: “{{ reporte.consulta_original }}”
            </div>
          </div>
          <div class="text-sm font-semibold text-slate-600 dark:text-slate-300">
            {{ reporte.total_registros }} registro(s)
          </div>
        </div>

        <div *ngIf="reporte.mensaje" class="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
          {{ reporte.mensaje }}
        </div>

        <div *ngIf="!reporte.filas.length" class="rounded-2xl border border-dashed border-slate-200 px-6 py-12 text-center dark:border-slate-700">
          <span class="material-icons text-5xl text-slate-400 dark:text-slate-500">table_rows</span>
          <h3 class="mt-4 text-lg font-semibold">No hay resultados para mostrar</h3>
          <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Prueba afinando la consulta o combinando empresa, estado o actor.
          </p>
        </div>

        <div *ngIf="reporte.filas.length" class="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
          <div class="overflow-x-auto">
            <table class="min-w-full text-sm">
              <thead class="bg-slate-50 dark:bg-slate-800/80">
                <tr>
                  <th
                    *ngFor="let columna of columnasVisibles"
                    class="whitespace-nowrap px-4 py-4 text-left font-semibold text-slate-600 dark:text-slate-300"
                  >
                    {{ columna.label }}
                  </th>
                  <th class="px-4 py-4 text-right font-semibold text-slate-600 dark:text-slate-300">⋮</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  *ngFor="let fila of filasPaginadas"
                  class="border-t border-slate-100 transition hover:bg-slate-50/70 dark:border-slate-800 dark:hover:bg-slate-800/60"
                >
                  <td
                    *ngFor="let columna of columnasVisibles"
                    class="whitespace-nowrap px-4 py-4 text-slate-700 dark:text-slate-200"
                  >
                    <span>{{ formatearValor(fila[columna.key]) }}</span>
                  </td>
                  <td class="px-4 py-4 text-right text-slate-400 dark:text-slate-500">⋮</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="flex flex-col gap-4 border-t border-slate-200 px-4 py-4 text-sm dark:border-slate-700 lg:flex-row lg:items-center lg:justify-between">
            <div class="text-slate-600 dark:text-slate-400">
              Mostrando {{ rangoDesde }} a {{ rangoHasta }} de {{ reporte.total_registros }} registros
            </div>
            <div class="flex items-center gap-2">
              <button
                type="button"
                (click)="paginaAnterior()"
                [disabled]="paginaActual === 1"
                class="rounded-xl border border-slate-200 px-4 py-2 font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Anterior
              </button>
              <div class="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 font-semibold text-indigo-700 dark:border-indigo-900/50 dark:bg-indigo-950/30 dark:text-indigo-300">
                {{ paginaActual }}
              </div>
              <button
                type="button"
                (click)="paginaSiguiente()"
                [disabled]="paginaActual >= totalPaginas"
                class="rounded-xl border border-slate-200 px-4 py-2 font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  `,
})
export class AdminEstadisticasSistemaComponent implements OnDestroy {
  consulta = '';
  cargando = false;
  error: string | null = null;
  estadoVoz: string | null = null;
  escuchando = false;
  reporte: ReporteConsultaSistemaResponse | null = null;
  columnasConfigurables: Array<ColumnaReporteConsultaSistema & { visible: boolean }> = [];
  showExportMenu = false;
  paginaActual = 1;
  readonly pageSize = 8;
  readonly consejos = [
    'Pide el actor, empresa o estado que te interesa.',
    'Para SaaS, puedes filtrar por tenant o taller en la consulta.',
    'Usa nombres entre comillas para búsquedas más precisas.',
  ];
  readonly ejemplosRapidos = [
    { etiqueta: 'Usuarios globales', consulta: 'quiero ver todos los usuarios' },
    { etiqueta: 'Usuarios por empresa', consulta: 'quiero ver todos los usuarios asociados a la empresa "Transformers"' },
    { etiqueta: 'Clientes globales', consulta: 'quiero ver todos los clientes' },
    { etiqueta: 'Órdenes finalizadas', consulta: 'quiero ver todas las órdenes finalizadas' },
    { etiqueta: 'Bitácora error', consulta: 'quiero ver los eventos de bitácora con resultado error' },
  ];
  private recognition: SpeechRecognitionLike | null = null;

  constructor(
    private estadisticasService: EstadisticasSistemaService,
    private cdr: ChangeDetectorRef,
  ) {}

  get columnasVisibles(): Array<ColumnaReporteConsultaSistema & { visible: boolean }> {
    return this.columnasConfigurables.filter((columna) => columna.visible);
  }

  get totalPaginas(): number {
    if (!this.reporte?.filas.length) {
      return 1;
    }
    return Math.max(1, Math.ceil(this.reporte.filas.length / this.pageSize));
  }

  get filasPaginadas(): Record<string, ReportCellValue>[] {
    if (!this.reporte?.filas.length) {
      return [];
    }
    const inicio = (this.paginaActual - 1) * this.pageSize;
    return this.reporte.filas.slice(inicio, inicio + this.pageSize);
  }

  get rangoDesde(): number {
    if (!this.reporte?.filas.length) {
      return 0;
    }
    return (this.paginaActual - 1) * this.pageSize + 1;
  }

  get rangoHasta(): number {
    if (!this.reporte?.filas.length) {
      return 0;
    }
    return Math.min(this.paginaActual * this.pageSize, this.reporte.filas.length);
  }

  generarReporte(): void {
    const consulta = this.consulta.trim();
    if (!consulta) {
      this.error = 'Escribe o dicta una consulta antes de generar el reporte.';
      return;
    }

    this.cargando = true;
    this.error = null;
    this.showExportMenu = false;

    this.estadisticasService
      .generarReporteConsulta(consulta)
      .pipe(finalize(() => {
        this.cargando = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (respuesta) => {
          this.reporte = respuesta;
          this.paginaActual = 1;
          this.columnasConfigurables = (respuesta.columnas || []).map((columna) => ({
            ...columna,
            visible: true,
          }));
          if (!respuesta.columnas.length && respuesta.filas.length) {
            this.columnasConfigurables = Object.keys(respuesta.filas[0]).map((key) => ({
              key,
              label: this.formatearEtiquetaColumna(key),
              visible: true,
            }));
          }
        },
        error: () => {
          this.error = 'No pudimos generar el reporte. Intenta nuevamente.';
        },
      });
  }

  usarEjemplo(ejemplo: { etiqueta: string; consulta: string }): void {
    this.consulta = ejemplo.consulta;
    this.error = null;
  }

  limpiarTodo(): void {
    this.consulta = '';
    this.estadoVoz = null;
    this.error = null;
    this.reporte = null;
    this.columnasConfigurables = [];
    this.showExportMenu = false;
    this.paginaActual = 1;
  }

  toggleColumna(key: string): void {
    this.columnasConfigurables = this.columnasConfigurables.map((columna) =>
      columna.key === key ? { ...columna, visible: !columna.visible } : columna
    );
  }

  mostrarTodasLasColumnas(): void {
    this.columnasConfigurables = this.columnasConfigurables.map((columna) => ({
      ...columna,
      visible: true,
    }));
  }

  restablecerColumnas(): void {
    this.mostrarTodasLasColumnas();
  }

  toggleEscucha(): void {
    if (this.escuchando) {
      this.detenerEscucha();
      return;
    }

    const constructor = this.getSpeechRecognitionConstructor();
    if (!constructor) {
      this.estadoVoz = 'Tu navegador no soporta grabación por voz en esta pantalla. Puedes escribir la consulta manualmente.';
      return;
    }

    this.error = null;
    this.estadoVoz = 'Escuchando... vuelve a tocar el micrófono para detener y transcribir.';

    const recognition = new constructor();
    recognition.lang = 'es-ES';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let texto = '';
      for (let i = 0; i < event.results.length; i += 1) {
        texto += `${event.results[i][0].transcript} `;
      }
      this.consulta = texto.trim();
      this.cdr.markForCheck();
    };

    recognition.onerror = (event) => {
      this.estadoVoz = event.error
        ? `No pudimos transcribir el audio: ${event.error}.`
        : 'No pudimos transcribir el audio.';
      this.escuchando = false;
      this.cdr.markForCheck();
    };

    recognition.onend = () => {
      if (this.escuchando) {
        this.estadoVoz = 'Grabación detenida. Ya puedes revisar la transcripción o generar el reporte.';
      }
      this.escuchando = false;
      this.cdr.markForCheck();
    };

    this.recognition = recognition;
    this.escuchando = true;
    recognition.start();
  }

  detenerEscucha(): void {
    if (this.recognition) {
      this.recognition.stop();
    }
    this.escuchando = false;
    this.estadoVoz = 'Grabación detenida. Revisa la transcripción antes de generar el reporte.';
  }

  toggleExportMenu(event: Event): void {
    event.stopPropagation();
    if (!this.reporte?.filas.length) {
      return;
    }
    this.showExportMenu = !this.showExportMenu;
  }

  exportarCsv(): void {
    if (!this.reporte?.filas.length) {
      return;
    }
    const columnas = this.columnasVisibles;
    const encabezados = columnas.map((columna) => columna.label);
    let csv = `${encabezados.map((h) => `"${h}"`).join(',')}\n`;

    for (const fila of this.reporte.filas) {
      csv += `${columnas
        .map((columna) => `"${this.formatearValor(fila[columna.key]).replace(/"/g, '""')}"`)
        .join(',')}\n`;
    }

    this.descargarArchivo(csv, 'text/csv;charset=utf-8;', `reporte-sistema-${Date.now()}.csv`);
    this.showExportMenu = false;
  }

  exportarHtml(): void {
    if (!this.reporte?.filas.length) {
      return;
    }
    const columnas = this.columnasVisibles;
    const encabezados = columnas.map((columna) => `<th>${this.escapeHtml(columna.label)}</th>`).join('');
    const filas = this.reporte.filas
      .map(
        (fila) => `<tr>${columnas
          .map((columna) => `<td>${this.escapeHtml(this.formatearValor(fila[columna.key]))}</td>`)
          .join('')}</tr>`
      )
      .join('');

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Reporte del Sistema</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; }
    th { background: #eef2ff; }
  </style>
</head>
<body>
  <h1>${this.escapeHtml(this.reporte.titulo)}</h1>
  <p>${this.escapeHtml(this.reporte.descripcion || '')}</p>
  <p><strong>Consulta:</strong> ${this.escapeHtml(this.reporte.consulta_original)}</p>
  <table>
    <thead><tr>${encabezados}</tr></thead>
    <tbody>${filas}</tbody>
  </table>
</body>
</html>`;
    this.descargarArchivo(html, 'text/html;charset=utf-8;', `reporte-sistema-${Date.now()}.html`);
    this.showExportMenu = false;
  }

  exportarPdf(): void {
    if (!this.reporte?.filas.length) {
      return;
    }

    const columnas = this.columnasVisibles;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const fecha = new Date().toLocaleString('es-BO');

    doc.setFontSize(18);
    doc.text(this.reporte.titulo || 'Reporte del Sistema', 40, 40);
    doc.setFontSize(10);
    doc.text(`Consulta: ${this.reporte.consulta_original}`, 40, 58);
    doc.text(`Generado: ${fecha}`, 40, 72);

    (doc as any).autoTable({
      startY: 90,
      head: [columnas.map((columna) => columna.label)],
      body: this.reporte.filas.map((fila) =>
        columnas.map((columna) => this.formatearValor(fila[columna.key]))
      ),
      styles: {
        fontSize: 8,
        cellPadding: 6,
        overflow: 'linebreak',
      },
      headStyles: {
        fillColor: [79, 70, 229],
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      margin: { left: 30, right: 30 },
    });

    doc.save(`reporte-sistema-${Date.now()}.pdf`);
    this.showExportMenu = false;
  }

  paginaAnterior(): void {
    if (this.paginaActual > 1) {
      this.paginaActual -= 1;
    }
  }

  paginaSiguiente(): void {
    if (this.paginaActual < this.totalPaginas) {
      this.paginaActual += 1;
    }
  }

  formatearValor(valor: ReportCellValue | undefined): string {
    if (valor === null || valor === undefined || valor === '') {
      return '—';
    }
    if (typeof valor === 'boolean') {
      return valor ? 'Sí' : 'No';
    }
    return String(valor);
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.showExportMenu = false;
  }

  ngOnDestroy(): void {
    this.detenerEscucha();
    this.recognition = null;
  }

  private getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
    const browserWindow = window as unknown as {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    return browserWindow.SpeechRecognition || browserWindow.webkitSpeechRecognition || null;
  }

  private formatearEtiquetaColumna(key: string): string {
    return key
      .split('_')
      .map((fragmento) => fragmento.charAt(0).toUpperCase() + fragmento.slice(1))
      .join(' ');
  }

  private descargarArchivo(contenido: string, tipo: string, nombre: string): void {
    const blob = new Blob([contenido], { type: tipo });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', nombre);
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
}
