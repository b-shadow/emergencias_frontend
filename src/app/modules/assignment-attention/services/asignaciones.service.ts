import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { OfflineCacheService } from '@core/services/offline-cache.service';

enum EstadoAsignacion {
  ASIGNADA = 'ASIGNADA',
  EN_CAMINO = 'EN_CAMINO',
  EN_PROCESO = 'EN_PROCESO',
  COMPLETADA = 'COMPLETADA',
  CANCELADA = 'CANCELADA'
}

@Injectable({
  providedIn: 'root'
})
export class AsignacionesService {
  private apiUrl = `${environment.apiUrl}/asignaciones`;
  private cacheKey = 'offline_asignaciones_activas';

  constructor(
    private http: HttpClient,
    private cache: OfflineCacheService,
  ) {}

  /**
   * Obtiene todas las asignaciones activas del taller (CU-20)
   */
  obtenerAsignacionesActivas(): Observable<any> {
    return this.http.get(`${this.apiUrl}/activas`).pipe(
      tap((rows) => this.cache.set(this.cacheKey, rows)),
      catchError(() => of(this.cache.get<any[]>(this.cacheKey) || [])),
    );
  }

  /**
   * Obtiene el detalle de una asignación específica
   */
  obtenerDetalle(asignacionId: number | string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${asignacionId}`);
  }

  /**
   * CU-20: Actualiza el estado de una asignación
   * Estados permitidos según transición:
   * - ASIGNADA -> EN_CAMINO | CANCELADA
   * - EN_CAMINO -> EN_PROCESO | CANCELADA
   * - EN_PROCESO -> ATENDIDA | CANCELADA
   * - ATENDIDA -> (final)
   * - CANCELADA -> (final)
   */
  actualizarEstadoAtencion(
    asignacionId: number | string,
    nuevoEstado: string,
    datos?: any
  ): Observable<any> {
    return this.http.patch(
      `${this.apiUrl}/${asignacionId}/estado`,
      {
        nuevo_estado: nuevoEstado,
        comentario: datos?.nota
      }
    );
  }

  /**
   * Obtiene los servicios disponibles del taller para una asignación
   */
  obtenerServiciosTaller(asignacionId: string | number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${asignacionId}/servicios`);
  }

  /**
   * Guarda los servicios realizados en una asignación
   */
  guardarServiciosRealizados(asignacionId: string | number, servicios: any[]): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/${asignacionId}/servicios-realizados`,
      servicios
    );
  }

  /**
   * Obtiene los servicios ya realizados en una asignación
   */
  obtenerServiciosRealizados(asignacionId: string | number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${asignacionId}/servicios-realizados`);
  }

  EstadoAsignacion = EstadoAsignacion;
}
