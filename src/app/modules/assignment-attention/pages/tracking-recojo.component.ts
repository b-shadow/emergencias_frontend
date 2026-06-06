import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { AsignacionesService } from '../services/asignaciones.service';
import { TrabajadoresService } from '../services/trabajadores.service';
import { RecojoTrackingMapComponent } from '../components/recojo-tracking-map.component';

@Component({
  selector: 'app-tracking-recojo',
  standalone: true,
  imports: [CommonModule, FormsModule, RecojoTrackingMapComponent],
  template: `
    <div class="px-6 py-4 space-y-5">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Tracking de Recojo</h1>
          <p class="text-sm text-gray-600 dark:text-slate-400">Asigna trabajador y monitorea distancia/ETA en tiempo real</p>
        </div>
        <button (click)="cargarBase()" class="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium">
          Actualizar
        </button>
      </div>

      <div *ngIf="asignaciones.length === 0" class="p-6 rounded-lg border border-dashed border-gray-300 dark:border-slate-700 text-gray-600 dark:text-slate-400">
        No hay asignaciones activas para seguimiento.
      </div>

      <div *ngFor="let a of asignaciones; let idx = index" class="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-4 shadow-sm space-y-3">
        <div class="flex items-center justify-between">
          <div>
            <div class="font-semibold text-gray-900 dark:text-white">{{ a.solicitud?.codigo_solicitud || a.id_solicitud }}</div>
            <div class="text-sm text-gray-600 dark:text-slate-400">Cliente: {{ a.solicitud?.cliente?.nombre || 'N/A' }}</div>
          </div>
          <span class="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            {{ a.tracking?.estado_orden || 'SIN_ORDEN' }}
          </span>
        </div>

        <div *ngIf="!a.tracking && trabajadores.length > 0" class="mt-3 flex flex-col md:flex-row gap-2 md:items-center">
          <select [(ngModel)]="seleccionTrabajador[idx]" class="px-3 py-2 rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm">
            <option value="">Selecciona trabajador</option>
            <option *ngFor="let t of trabajadores" [value]="t.id_trabajador">
              {{ t.id_trabajador.slice(0, 8) }} - {{ t.telefono || '-' }}
            </option>
          </select>
          <button
            (click)="asignar(a.id_asignacion, seleccionTrabajador[idx])"
            class="px-3 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium"
          >
            Asignar recojo
          </button>
        </div>

        <div *ngIf="a.tracking" class="text-sm text-gray-700 dark:text-slate-300">
          Distancia: <strong>{{ (a.tracking.distancia_metros || 0) | number:'1.0-0' }} m</strong> -
          ETA: <strong>{{ ((a.tracking.duracion_segundos || 0) / 60) | number:'1.0-0' }} min</strong>
        </div>

        <div *ngIf="a.tracking">
          <app-recojo-tracking-map
            [latitudActual]="a.tracking.latitud_actual"
            [longitudActual]="a.tracking.longitud_actual"
            [latitudDestino]="a.tracking.latitud_destino || a.solicitud?.latitud_cliente"
            [longitudDestino]="a.tracking.longitud_destino || a.solicitud?.longitud_cliente"
            [rutaGeojson]="a.tracking.ruta_geojson"
            [rutaRecorridaGeojson]="a.tracking.ruta_recorrida_geojson"
          />
        </div>
      </div>
    </div>
  `,
})
export class TrackingRecojoComponent implements OnInit, OnDestroy {
  asignaciones: any[] = [];
  trabajadores: any[] = [];
  seleccionTrabajador: Record<number, string> = {};
  private destroy$ = new Subject<void>();
  private socketsBySolicitud = new Map<string, WebSocket>();
  private heartbeatTimers: any[] = [];

  constructor(
    private asignacionesService: AsignacionesService,
    private trabajadoresService: TrabajadoresService,
  ) {}

  ngOnInit(): void {
    this.cargarBase();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.socketsBySolicitud.forEach((s) => s.close());
    this.heartbeatTimers.forEach((t) => clearInterval(t));
    this.socketsBySolicitud.clear();
  }

  cargarBase(): void {
    this.trabajadoresService.listarTrabajadores().subscribe((t) => (this.trabajadores = t || []));
    this.asignacionesService.obtenerAsignacionesActivas().subscribe((rows) => {
      this.asignaciones = Array.isArray(rows) ? rows : [];
      this.refrescarTracking();
    });
  }

  refrescarTracking(): void {
    const solicitudesConTracking = new Set<string>();
    this.asignaciones.forEach((a) => {
      const idSolicitud = a?.id_solicitud || a?.solicitud?.id_solicitud;
      if (!idSolicitud) return;
      this.trabajadoresService.getTrackingBySolicitud(idSolicitud).subscribe({
        next: (trk) => {
          a.tracking = trk
            ? {
                ...trk,
                ruta_geojson:
                  typeof trk.ruta_geojson === 'string'
                    ? JSON.parse(trk.ruta_geojson)
                    : trk.ruta_geojson || null,
                ruta_recorrida_geojson:
                  typeof trk.ruta_recorrida_geojson === 'string'
                    ? JSON.parse(trk.ruta_recorrida_geojson)
                    : trk.ruta_recorrida_geojson || null,
              }
            : null;
          if (a.tracking) {
            solicitudesConTracking.add(idSolicitud);
            this.ensureSocketForSolicitud(a, idSolicitud);
          }
        },
        error: () => {
          a.tracking = null;
          this.closeSocketForSolicitud(idSolicitud);
        },
      });
    });
    this.cleanupStaleSockets(solicitudesConTracking);
  }

  private ensureSocketForSolicitud(a: any, idSolicitud: string): void {
    if (this.socketsBySolicitud.has(idSolicitud)) return;
    const wsUrl = this.toWsUrl(`/api/v1/trabajadores/ws/solicitudes/${idSolicitud}`);
    const ws = new WebSocket(wsUrl);
    this.socketsBySolicitud.set(idSolicitud, ws);

    ws.onmessage = (ev) => {
      try {
        const payload = JSON.parse(ev.data);
        a.tracking = {
          ...payload,
          ruta_geojson:
            typeof payload.ruta_geojson === 'string'
              ? JSON.parse(payload.ruta_geojson)
              : payload.ruta_geojson || null,
          ruta_recorrida_geojson:
            typeof payload.ruta_recorrida_geojson === 'string'
              ? JSON.parse(payload.ruta_recorrida_geojson)
              : payload.ruta_recorrida_geojson || null,
        };
      } catch {
        a.tracking = null;
      }
    };

    ws.onclose = () => {
      this.socketsBySolicitud.delete(idSolicitud);
    };

    const hb = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) ws.send('ping');
    }, 10000);
    this.heartbeatTimers.push(hb);
  }

  private closeSocketForSolicitud(idSolicitud: string): void {
    const ws = this.socketsBySolicitud.get(idSolicitud);
    if (ws) {
      ws.close();
      this.socketsBySolicitud.delete(idSolicitud);
    }
  }

  private cleanupStaleSockets(validIds: Set<string>): void {
    for (const id of this.socketsBySolicitud.keys()) {
      if (!validIds.has(id)) {
        this.closeSocketForSolicitud(id);
      }
    }
  }

  private toWsUrl(path: string): string {
    const base = window.location.hostname === 'localhost'
      ? 'ws://localhost:8000'
      : 'wss://emergencias-backend.onrender.com';
    return `${base}${path}`;
  }

  asignar(idAsignacion: string, idTrabajador: string): void {
    if (!idTrabajador) return;
    this.trabajadoresService.asignarOrdenRecojo(idAsignacion, idTrabajador).subscribe(() => {
      this.refrescarTracking();
    });
  }
}
