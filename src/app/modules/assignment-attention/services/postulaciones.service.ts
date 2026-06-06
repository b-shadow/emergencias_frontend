import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { of, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { OfflineCacheService } from '@core/services/offline-cache.service';

export interface CotizacionPayload {
  servicios: {
    id_taller_servicio: string;
    precio_servicio: number;
    nombre_servicio?: string | null;
    categoria_tarifa?: string | null;
    incluido_en_solicitud?: boolean;
  }[];
  costo_ida?: number;
  tipo_pintura?: string | null;
  detalle?: string | null;
}

export interface CotizacionResponse {
  id_cotizacion: string;
  id_postulacion: string;
  id_taller_servicio: string;
  precio_servicio: number;
  costo_ida: number;
  precio_total_estimado: number;
  servicios?: {
    id_taller_servicio: string;
    precio_servicio: number;
    nombre_servicio?: string | null;
    categoria_tarifa?: string | null;
    incluido_en_solicitud?: boolean;
  }[];
  tiempo_estimado_llegada_min?: number | null;
  estado_cotizacion: 'PENDIENTE' | 'ACEPTADA_CLIENTE' | 'RECHAZADA_CLIENTE' | 'EXPIRADA';
  tipo_pintura?: string | null;
  detalle?: string | null;
  fecha_creacion: string;
  fecha_respuesta_cliente?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class PostulacionesService {
  private apiUrl = `${environment.apiUrl}/postulaciones`;
  private readonly cacheMisPostulaciones = 'cache_taller_mis_postulaciones';
  private readonly cacheCotizacionPrefix = 'cache_postulacion_cotizacion_';

  constructor(
    private http: HttpClient,
    private offlineCache: OfflineCacheService,
  ) {}

  /**
   * Obtiene las postulaciones del taller actual (para CU-18, CU-19: Ver mis postulaciones)
   */
  obtenerMisPostulaciones(): Observable<any> {
    return this.http.get(`${this.apiUrl}/mis-postulaciones`).pipe(
      tap((data) => this.offlineCache.set(this.cacheMisPostulaciones, data)),
      catchError((err) => {
        const cached = this.offlineCache.get<any>(this.cacheMisPostulaciones);
        if (cached) return of(cached);
        return throwError(() => err);
      }),
    );
  }

  /**
   * CU-18: Crear postulación (taller se postula a una emergencia)
   */
  crearPostulacion(
    solicitudId: number | string,
    datos: { tiempo_estimado_llegada: number; disponibilidad?: boolean; mensaje_propuesta?: string }
  ): Observable<any> {
    const payload: any = {
      tiempo_estimado_llegada_min: datos.tiempo_estimado_llegada
    };

    // Agregar mensaje si está presente
    if (datos.mensaje_propuesta) {
      payload.mensaje_propuesta = datos.mensaje_propuesta;
    }

    return this.http.post(
      `${this.apiUrl}/solicitud/${solicitudId}`,
      payload
    );
  }

  /**
   * Obtiene el detalle de una postulación específica
   */
  obtenerDetallePostulacion(postulacionId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${postulacionId}`);
  }

  /**
   * CU-19: Retira una postulación (taller se arrepiente)
   * Solo si está en estado POSTULADA
   */
  retirarPostulacion(postulacionId: number | string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/${postulacionId}/withdraw`,
      {}
    );
  }

  crearOActualizarCotizacion(
    postulacionId: string,
    payload: CotizacionPayload
  ): Observable<CotizacionResponse> {
    return this.http.post<CotizacionResponse>(
      `${this.apiUrl}/${postulacionId}/cotizacion`,
      payload
    );
  }

  obtenerCotizacion(postulacionId: string): Observable<CotizacionResponse> {
    const cacheKey = `${this.cacheCotizacionPrefix}${postulacionId}`;
    return this.http
      .get<CotizacionResponse>(`${this.apiUrl}/${postulacionId}/cotizacion`)
      .pipe(
        tap((data) => this.offlineCache.set(cacheKey, data)),
        catchError((err) => {
          const cached = this.offlineCache.get<CotizacionResponse>(cacheKey);
          if (cached) return of(cached);
          return throwError(() => err);
        }),
      );
  }

  decidirCotizacion(postulacionId: string, aceptar: boolean): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/${postulacionId}/cotizacion/decision`,
      { aceptar }
    );
  }
}
