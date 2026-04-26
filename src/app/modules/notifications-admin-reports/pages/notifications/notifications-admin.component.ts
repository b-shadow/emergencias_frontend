import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, interval } from 'rxjs';
import { takeUntil, debounceTime, switchMap } from 'rxjs/operators';
import { NotificacionService } from '@core/services/notification.service';
import { Notificacion, NotificacionListResponse, NotificacionFiltros, EstadoLecturaNotificacion } from '@core/models/notification.model';

@Component({
  selector: 'app-notifications-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="px-6 py-4">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-4xl font-bold bg-gradient-to-r from-red-600 to-orange-600 dark:from-red-400 dark:to-orange-400 text-transparent bg-clip-text mb-2">
          📨 Historial de Notificaciones del Sistema
        </h1>
        <p class="text-gray-600 dark:text-slate-400">Supervisión completa de todas las notificaciones enviadas por el sistema</p>
        <button
          (click)="cargarNotificaciones()"
          class="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors flex items-center gap-2"
        >
          🔄 Refrescar Ahora
        </button>
      </div>

      <!-- Loading -->
      <div *ngIf="cargando" class="text-center py-8">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
        <p class="text-gray-500 dark:text-slate-400 mt-2">Cargando notificaciones...</p>
      </div>

      <!-- Error -->
      <div *ngIf="error && !cargando" class="mb-4 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg border border-red-300 dark:border-red-700">
        ❌ {{ error }}
      </div>

      <!-- Content -->
      <div *ngIf="!cargando && !error" class="space-y-4">
        <!-- Estadísticas -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-700 dark:to-blue-800 rounded-lg p-6 text-white shadow-md">
            <p class="text-sm font-medium opacity-90">Total Enviadas</p>
            <p class="text-3xl font-bold mt-2">{{ contarPorEstado('ENVIADA') }}</p>
          </div>
          <div class="bg-gradient-to-br from-yellow-500 to-yellow-600 dark:from-yellow-700 dark:to-yellow-800 rounded-lg p-6 text-white shadow-md">
            <p class="text-sm font-medium opacity-90">Pendientes</p>
            <p class="text-3xl font-bold mt-2">{{ contarPorEstado('PENDIENTE') }}</p>
          </div>
          <div class="bg-gradient-to-br from-red-500 to-red-600 dark:from-red-700 dark:to-red-800 rounded-lg p-6 text-white shadow-md">
            <p class="text-sm font-medium opacity-90">Fallidas</p>
            <p class="text-3xl font-bold mt-2">{{ contarPorEstado('FALLIDA') }}</p>
          </div>
          <div class="bg-gradient-to-br from-green-500 to-green-600 dark:from-green-700 dark:to-green-800 rounded-lg p-6 text-white shadow-md">
            <p class="text-sm font-medium opacity-90">Total</p>
            <p class="text-3xl font-bold mt-2">{{ total }}</p>
          </div>
        </div>

        <!-- Filtros -->
        <div class="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 p-6">
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">🔍 Filtros Avanzados</h2>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <!-- Tipo de Notificación -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Tipo de Notificación</label>
              <select
                [(ngModel)]="filtros.tipo_notificacion"
                (change)="aplicarFiltros()"
                class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500"
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

            <!-- Estado de Envío -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Estado de Envío</label>
              <select
                [(ngModel)]="filtros.estado_envio"
                (change)="aplicarFiltros()"
                class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500"
              >
                <option value="">-- Todos --</option>
                <option value="ENVIADA">Enviada</option>
                <option value="PENDIENTE">Pendiente</option>
                <option value="FALLIDA">Fallida</option>
              </select>
            </div>

            <!-- Estado de Lectura -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Estado de Lectura</label>
              <select
                [(ngModel)]="filtros.estado_lectura"
                (change)="aplicarFiltros()"
                class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500"
              >
                <option value="">-- Todos --</option>
                <option value="NO_LEIDA">No Leída</option>
                <option value="LEIDA">Leída</option>
              </select>
            </div>

            <!-- Fecha Desde -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Desde</label>
              <input
                type="date"
                [(ngModel)]="filtros.fecha_desde"
                (change)="aplicarFiltros()"
                class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500"
              />
            </div>

            <!-- Fecha Hasta -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Hasta</label>
              <input
                type="date"
                [(ngModel)]="filtros.fecha_hasta"
                (change)="aplicarFiltros()"
                class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500"
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

        <!-- Tabla de Notificaciones -->
        <div class="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
            <h2 class="text-xl font-bold text-gray-900 dark:text-white">📋 Listado de Notificaciones</h2>
          </div>

          <div *ngIf="notificaciones.length === 0" class="p-6 text-center">
            <p class="text-gray-500 dark:text-slate-400">No hay notificaciones para mostrar</p>
          </div>

          <div *ngIf="notificaciones.length > 0" class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600">
                <tr>
                  <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Usuario Destino</th>
                  <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Rol</th>
                  <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Fecha Recibido</th>
                  <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Fecha Leído</th>
                  <th class="px-6 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-slate-700">
                <tr
                  *ngFor="let notif of notificaciones"
                  class="hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <td class="px-6 py-4">
                    <div>
                      <p class="text-sm font-medium text-gray-900 dark:text-white">{{ notif.nombre_usuario || notif.id_usuario_destino }}</p>
                      <p class="text-xs text-gray-600 dark:text-slate-400">{{ notif.tipo_usuario_destino }}</p>
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <span
                      class="px-3 py-1 rounded-full text-xs font-semibold"
                      [ngClass]="getRolBadgeClass(notif.rol_usuario)"
                    >
                      {{ notif.rol_usuario || 'N/A' }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-700 dark:text-slate-300">
                    {{ notif.fecha_envio | date: 'short' }}
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-700 dark:text-slate-300">
                    {{ notif.fecha_lectura ? (notif.fecha_lectura | date: 'short') : '-' }}
                  </td>
                  <td class="px-6 py-4 text-center">
                    <button
                      (click)="verDetalle(notif.id_notificacion)"
                      class="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
                    >
                      Ver
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
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
              class="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
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
            class="bg-white dark:bg-slate-800 rounded-lg shadow-lg max-w-2xl w-full p-6"
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

            <div class="space-y-4 max-h-96 overflow-y-auto">
              <!-- Usuario y Rol -->
              <div class="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-slate-700 p-4 rounded">
                <div>
                  <p class="text-xs text-gray-600 dark:text-slate-400 uppercase tracking-wide">Usuario Destino</p>
                  <p class="text-gray-900 dark:text-white font-semibold">{{ notificacionSeleccionada.nombre_usuario || notificacionSeleccionada.id_usuario_destino }}</p>
                </div>
                <div>
                  <p class="text-xs text-gray-600 dark:text-slate-400 uppercase tracking-wide">Rol</p>
                  <p class="text-gray-900 dark:text-white font-semibold">{{ notificacionSeleccionada.rol_usuario || 'N/A' }}</p>
                </div>
              </div>

              <!-- Título -->
              <div>
                <p class="text-xs text-gray-600 dark:text-slate-400 uppercase tracking-wide">Título</p>
                <p class="text-gray-900 dark:text-white font-semibold">{{ notificacionSeleccionada.titulo }}</p>
              </div>

              <!-- Mensaje -->
              <div>
                <p class="text-xs text-gray-600 dark:text-slate-400 uppercase tracking-wide">Mensaje</p>
                <p class="text-gray-700 dark:text-slate-300 text-sm">{{ notificacionSeleccionada.mensaje }}</p>
              </div>

              <!-- Tipo y Categoría -->
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <p class="text-xs text-gray-600 dark:text-slate-400 uppercase tracking-wide">Tipo Notificación</p>
                  <p class="text-gray-900 dark:text-white font-semibold text-sm">{{ notificacionSeleccionada.tipo_notificacion }}</p>
                </div>
                <div>
                  <p class="text-xs text-gray-600 dark:text-slate-400 uppercase tracking-wide">Categoría</p>
                  <p class="text-gray-900 dark:text-white font-semibold text-sm">{{ notificacionSeleccionada.categoria_evento || 'N/A' }}</p>
                </div>
              </div>

              <!-- Estado Envío y Lectura -->
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <p class="text-xs text-gray-600 dark:text-slate-400 uppercase tracking-wide">Estado Envío</p>
                  <p
                    class="px-3 py-1 rounded-full text-xs font-semibold inline-block"
                    [ngClass]="getEstadoEnvioBadgeClass(notificacionSeleccionada.estado_envio)"
                  >
                    {{ notificacionSeleccionada.estado_envio }}
                  </p>
                </div>
                <div>
                  <p class="text-xs text-gray-600 dark:text-slate-400 uppercase tracking-wide">Estado Lectura</p>
                  <p
                    class="px-3 py-1 rounded-full text-xs font-semibold inline-block"
                    [ngClass]="getEstadoLecturaBadgeClass(notificacionSeleccionada.estado_lectura)"
                  >
                    {{ notificacionSeleccionada.estado_lectura === 'LEIDA' ? '✓ Leída' : '○ No Leída' }}
                  </p>
                </div>
              </div>

              <!-- Fechas -->
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <p class="text-xs text-gray-600 dark:text-slate-400 uppercase tracking-wide">Fecha Envío</p>
                  <p class="text-gray-700 dark:text-slate-300 text-sm">{{ notificacionSeleccionada.fecha_envio | date: 'medium' }}</p>
                </div>
                <div>
                  <p class="text-xs text-gray-600 dark:text-slate-400 uppercase tracking-wide">Fecha Lectura</p>
                  <p class="text-gray-700 dark:text-slate-300 text-sm">
                    {{ notificacionSeleccionada.fecha_lectura ? (notificacionSeleccionada.fecha_lectura | date: 'medium') : '-' }}
                  </p>
                </div>
              </div>
            </div>

            <div class="mt-6">
              <button
                (click)="cerrarDetalle()"
                class="w-full px-4 py-2 bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class NotificationsAdminComponent implements OnInit, OnDestroy {
  notificaciones: Notificacion[] = [];
  notificacionSeleccionada: Notificacion | null = null;
  total = 0;
  cargando = false;
  error: string | null = null;

  filtros: NotificacionFiltros = {
    limit: 15,
    offset: 0,
    tipo_notificacion: '',
    estado_lectura: '',
    estado_envio: '',
    fecha_desde: '',
    fecha_hasta: ''
  };

  private destroy$ = new Subject<void>();
  private filtrosChange$ = new Subject<void>();

  constructor(private notificacionService: NotificacionService, private cdr: ChangeDetectorRef) {}

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
        switchMap(() => this.notificacionService.obtenerTodasNotificaciones(this.filtros)),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response: NotificacionListResponse) => {
          this.notificaciones = response.items;
          this.total = response.total;
          this.cdr.markForCheck();
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
      .obtenerTodasNotificaciones(this.filtros)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: NotificacionListResponse) => {
          this.notificaciones = response.items;
          this.total = response.total;
          this.cargando = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.error = 'Error al cargar las notificaciones';
          this.cargando = false;
          this.cdr.markForCheck();
          console.error(err);
        }
      });
  }

  aplicarFiltros(): void {
    this.filtrosChange$.next();
  }

  limpiarFiltros(): void {
    this.filtros = {
      limit: 15,
      offset: 0,
      tipo_notificacion: '',
      estado_lectura: '',
      estado_envio: '',
      fecha_desde: '',
      fecha_hasta: ''
    };
    this.cargarNotificaciones();
  }

  verDetalle(id: string): void {
    this.notificacionService
      .obtenerDetalleNotificacionAdmin(id)
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

  contarPorEstado(estado: string): number {
    return this.notificaciones.filter(n => n.estado_envio === estado).length;
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

  getEstadoEnvioBadgeClass(estado: string): string {
    const classes: Record<string, string> = {
      ENVIADA: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200',
      PENDIENTE: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-200',
      FALLIDA: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200'
    };
    return classes[estado] || 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-200';
  }

  getEstadoLecturaBadgeClass(estado: string): string {
    return estado === EstadoLecturaNotificacion.LEIDA
      ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200'
      : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-200';
  }

  getRolBadgeClass(rol: string | undefined): string {
    if (!rol) return 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-200';

    const classes: Record<string, string> = {
      CLIENTE: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200',
      TALLER: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-200',
      ADMINISTRADOR: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200'
    };
    return classes[rol] || 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-200';
  }
}
