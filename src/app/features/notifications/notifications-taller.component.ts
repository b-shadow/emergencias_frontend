import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, interval } from 'rxjs';
import { takeUntil, debounceTime, switchMap } from 'rxjs/operators';
import { NotificacionService } from '@core/services/notification.service';
import { Notificacion, NotificacionListResponse, NotificacionFiltros, EstadoLecturaNotificacion } from '@core/models/notification.model';

@Component({
  selector: 'app-notifications-taller',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="px-6 py-4">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 text-transparent bg-clip-text mb-2">
          🔔 Mis Notificaciones
        </h1>
        <p class="text-gray-600 dark:text-slate-400">Gestiona tus notificaciones y solicitudes</p>
        <button
          (click)="cargarNotificaciones()"
          class="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors flex items-center gap-2"
        >
          🔄 Refrescar Ahora
        </button>
      </div>

      <!-- Loading -->
      <div *ngIf="cargando" class="text-center py-8">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
        <p class="text-gray-500 dark:text-slate-400 mt-2">Cargando notificaciones...</p>
      </div>

      <!-- Error -->
      <div *ngIf="error && !cargando" class="mb-4 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg border border-red-300 dark:border-red-700">
        ❌ {{ error }}
      </div>

      <!-- Content -->
      <div *ngIf="!cargando && !error" class="space-y-4">
        <!-- Filtros -->
        <div class="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 p-6">
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">🔍 Filtros</h2>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <!-- Estado de Lectura -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Estado de Lectura</label>
              <select
                [(ngModel)]="filtros.estado_lectura"
                (change)="aplicarFiltros()"
                class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
              >
                <option value="">-- Todos --</option>
                <option value="NO_LEIDA">No Leída</option>
                <option value="LEIDA">Leída</option>
              </select>
            </div>

            <!-- Tipo de Notificación -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Tipo</label>
              <select
                [(ngModel)]="filtros.tipo_notificacion"
                (change)="aplicarFiltros()"
                class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
              >
                <option value="">-- Todos --</option>
                <option value="SOLICITUD_CREADA">Solicitud Creada</option>
                <option value="SOLICITUD_ACEPTADA">Solicitud Aceptada</option>
                <option value="SOLICITUD_RECHAZADA">Solicitud Rechazada</option>
                <option value="TALLER_ASIGNADO">Taller Asignado</option>
                <option value="SERVICIO_COMPLETADO">Servicio Completado</option>
                <option value="PAGO_RECIBIDO">Pago Recibido</option>
              </select>
            </div>

            <!-- Fecha Desde -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Desde</label>
              <input
                type="date"
                [(ngModel)]="filtros.fecha_desde"
                (change)="aplicarFiltros()"
                class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <!-- Fecha Hasta -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Hasta</label>
              <input
                type="date"
                [(ngModel)]="filtros.fecha_hasta"
                (change)="aplicarFiltros()"
                class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <!-- Limpiar Filtros -->
          <div class="mt-4">
            <button
              (click)="limpiarFiltros()"
              class="px-4 py-2 bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors"
            >
              ↻ Limpiar Filtros
            </button>
          </div>
        </div>

        <!-- Estadísticas -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-700 dark:to-purple-800 rounded-lg p-6 text-white shadow-md">
            <p class="text-sm font-medium opacity-90">Total de Notificaciones</p>
            <p class="text-3xl font-bold mt-2">{{ total }}</p>
          </div>
          <div class="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-700 dark:to-blue-800 rounded-lg p-6 text-white shadow-md">
            <p class="text-sm font-medium opacity-90">No Leídas</p>
            <p class="text-3xl font-bold mt-2">{{ contarNoLeidas() }}</p>
          </div>
          <div class="bg-gradient-to-br from-green-500 to-green-600 dark:from-green-700 dark:to-green-800 rounded-lg p-6 text-white shadow-md">
            <p class="text-sm font-medium opacity-90">Leídas</p>
            <p class="text-3xl font-bold mt-2">{{ contarLeidas() }}</p>
          </div>
        </div>

        <!-- Tabla de Notificaciones -->
        <div class="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
            <h2 class="text-xl font-bold text-gray-900 dark:text-white">📬 Notificaciones Recientes</h2>
          </div>

          <div *ngIf="notificaciones.length === 0" class="p-6 text-center">
            <p class="text-gray-500 dark:text-slate-400">No hay notificaciones para mostrar</p>
          </div>

          <table *ngIf="notificaciones.length > 0" class="w-full">
            <thead class="bg-gray-50 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600">
              <tr>
                <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Título</th>
                <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Tipo</th>
                <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Estado</th>
                <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Fecha</th>
                <th class="px-6 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-slate-700">
              <tr
                *ngFor="let notif of notificaciones"
                class="hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                [class.bg-blue-50]="notif.estado_lectura === 'NO_LEIDA'"
                [class.dark:bg-slate-800]="notif.estado_lectura === 'NO_LEIDA'"
              >
                <td class="px-6 py-4">
                  <div class="flex items-start gap-3">
                    <div
                      *ngIf="notif.estado_lectura === 'NO_LEIDA'"
                      class="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0"
                    ></div>
                    <div>
                      <p class="text-sm font-medium text-gray-900 dark:text-white">{{ notif.titulo }}</p>
                      <p class="text-xs text-gray-600 dark:text-slate-400 line-clamp-2">{{ notif.mensaje }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <span
                    class="px-3 py-1 rounded-full text-xs font-semibold"
                    [ngClass]="getTipoBadgeClass(notif.tipo_notificacion)"
                  >
                    {{ notif.tipo_notificacion }}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <span
                    class="px-3 py-1 rounded-full text-xs font-semibold"
                    [ngClass]="getEstadoBadgeClass(notif.estado_lectura)"
                  >
                    {{ notif.estado_lectura === 'LEIDA' ? '✓ Leída' : '○ No Leída' }}
                  </span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-700 dark:text-slate-300">
                  {{ notif.fecha_envio | date: 'short' }}
                </td>
                <td class="px-6 py-4 text-center">
                  <div class="flex justify-center gap-2">
                    <button
                      (click)="verDetalle(notif.id_notificacion)"
                      class="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded transition-colors"
                    >
                      Ver
                    </button>
                    <button
                      *ngIf="notif.estado_lectura === 'NO_LEIDA'"
                      (click)="marcarComoLeida(notif.id_notificacion)"
                      class="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors"
                    >
                      Marcar
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Paginación -->
        <div *ngIf="notificaciones.length > 0" class="flex justify-between items-center bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
          <div class="text-sm text-gray-700 dark:text-slate-300">
            Mostrando {{ filtros.offset! + 1 }} - {{ filtros.offset! + notificaciones.length }} de {{ total }}
          </div>
          <div class="flex gap-2">
            <button
              (click)="paginaAnterior()"
              [disabled]="filtros.offset === 0"
              class="px-4 py-2 bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors"
            >
              ← Anterior
            </button>
            <button
              (click)="paginaSiguiente()"
              [disabled]="(filtros.offset! + notificaciones.length) >= total"
              class="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              Siguiente →
            </button>
          </div>
        </div>

        <!-- Modal de Detalle -->
        <div
          *ngIf="notificacionSeleccionada"
          class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
          (click)="cerrarDetalle()"
        >
          <div
            class="bg-white dark:bg-slate-800 rounded-lg shadow-lg max-w-md w-full p-6"
            (click)="$event.stopPropagation()"
          >
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-bold text-gray-900 dark:text-white">Detalle de Notificación</h3>
              <button
                (click)="cerrarDetalle()"
                class="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>

            <div class="space-y-4">
              <div>
                <p class="text-xs text-gray-600 dark:text-slate-400 uppercase tracking-wide">Título</p>
                <p class="text-gray-900 dark:text-white font-semibold">{{ notificacionSeleccionada.titulo }}</p>
              </div>

              <div>
                <p class="text-xs text-gray-600 dark:text-slate-400 uppercase tracking-wide">Mensaje</p>
                <p class="text-gray-700 dark:text-slate-300">{{ notificacionSeleccionada.mensaje }}</p>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <p class="text-xs text-gray-600 dark:text-slate-400 uppercase tracking-wide">Tipo</p>
                  <p class="text-gray-900 dark:text-white font-semibold text-sm">{{ notificacionSeleccionada.tipo_notificacion }}</p>
                </div>
                <div>
                  <p class="text-xs text-gray-600 dark:text-slate-400 uppercase tracking-wide">Estado</p>
                  <p class="text-gray-900 dark:text-white font-semibold text-sm">{{ notificacionSeleccionada.estado_lectura }}</p>
                </div>
              </div>

              <div>
                <p class="text-xs text-gray-600 dark:text-slate-400 uppercase tracking-wide">Fecha</p>
                <p class="text-gray-700 dark:text-slate-300">{{ notificacionSeleccionada.fecha_envio | date: 'medium' }}</p>
              </div>
            </div>

            <div class="mt-6 flex gap-3">
              <button
                (click)="cerrarDetalle()"
                class="flex-1 px-4 py-2 bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors"
              >
                Cerrar
              </button>
              <button
                *ngIf="notificacionSeleccionada.estado_lectura === 'NO_LEIDA'"
                (click)="marcarComoLeida(notificacionSeleccionada.id_notificacion)"
                class="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                Marcar como Leída
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class NotificationsTallerComponent implements OnInit, OnDestroy {
  notificaciones: Notificacion[] = [];
  notificacionSeleccionada: Notificacion | null = null;
  total = 0;
  cargando = false;
  error: string | null = null;

  filtros: NotificacionFiltros = {
    limit: 10,
    offset: 0,
    estado_lectura: '',
    tipo_notificacion: '',
    fecha_desde: '',
    fecha_hasta: ''
  };

  private destroy$ = new Subject<void>();
  private filtrosChange$ = new Subject<void>();
  private actualizacionAutomatica$ = new Subject<void>();

  constructor(private notificacionService: NotificacionService) {}

  ngOnInit(): void {
    this.cargarNotificaciones();

    // Debounce cuando cambian los filtros
    this.filtrosChange$
      .pipe(
        debounceTime(300),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.filtros.offset = 0;
        this.cargarNotificaciones();
      });

    // Polling automático cada 5 segundos
    interval(5000)
      .pipe(
        switchMap(() => this.notificacionService.obtenerMisNotificaciones(this.filtros)),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response: NotificacionListResponse) => {
          this.notificaciones = response.items;
          this.total = response.total;
        },
        error: (err) => {
          console.error('Error en polling automático:', err);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarNotificaciones(): void {
    this.cargando = true;
    this.error = null;

    this.notificacionService
      .obtenerMisNotificaciones(this.filtros)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: NotificacionListResponse) => {
          this.notificaciones = response.items;
          this.total = response.total;
          this.cargando = false;
        },
        error: (err) => {
          this.error = 'Error al cargar las notificaciones';
          this.cargando = false;
          console.error(err);
        }
      });
  }

  aplicarFiltros(): void {
    this.filtrosChange$.next();
  }

  limpiarFiltros(): void {
    this.filtros = {
      limit: 10,
      offset: 0,
      estado_lectura: '',
      tipo_notificacion: '',
      fecha_desde: '',
      fecha_hasta: ''
    };
    this.cargarNotificaciones();
  }

  verDetalle(id: string): void {
    this.notificacionService
      .obtenerDetalleNotificacion(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (notif) => {
          this.notificacionSeleccionada = notif;
        }
      });
  }

  cerrarDetalle(): void {
    this.notificacionSeleccionada = null;
  }

  marcarComoLeida(id: string): void {
    this.notificacionService
      .marcarComoLeida(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.cargarNotificaciones();
          this.cerrarDetalle();
        }
      });
  }

  paginaAnterior(): void {
    if (this.filtros.offset! > 0) {
      this.filtros.offset = Math.max(0, this.filtros.offset! - this.filtros.limit!);
      this.cargarNotificaciones();
    }
  }

  paginaSiguiente(): void {
    if ((this.filtros.offset! + this.filtros.limit!) < this.total) {
      this.filtros.offset = this.filtros.offset! + this.filtros.limit!;
      this.cargarNotificaciones();
    }
  }

  contarNoLeidas(): number {
    return this.notificaciones.filter(n => n.estado_lectura === EstadoLecturaNotificacion.NO_LEIDA).length;
  }

  contarLeidas(): number {
    return this.notificaciones.filter(n => n.estado_lectura === EstadoLecturaNotificacion.LEIDA).length;
  }

  getTipoBadgeClass(tipo: string): string {
    const classes: Record<string, string> = {
      SOLICITUD_CREADA: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200',
      SOLICITUD_ACEPTADA: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200',
      SOLICITUD_RECHAZADA: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200',
      TALLER_ASIGNADO: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-200',
      SERVICIO_COMPLETADO: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-200',
      PAGO_RECIBIDO: 'bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-200'
    };
    return classes[tipo] || 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-200';
  }

  getEstadoBadgeClass(estado: string): string {
    return estado === EstadoLecturaNotificacion.LEIDA
      ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200'
      : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-200';
  }
}
