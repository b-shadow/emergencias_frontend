import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { OfflineCacheService } from '@core/services/offline-cache.service';

@Injectable({
  providedIn: 'root'
})
export class SolicitudesDisponiblesService {
  private apiUrl = `${environment.apiUrl}/solicitudes_emergencia`;
  private cacheKey = 'offline_solicitudes_disponibles';

  constructor(
    private http: HttpClient,
    private cache: OfflineCacheService,
  ) {}

  /**
   * CU-17: Lista solicitudes de emergencia disponibles para el taller
   * Filtra automáticamente por especialidades y ubicación del taller
   */
  listarSolicitudesDisponibles(
    skip: number = 0,
    limit: number = 10,
  ): Observable<any> {
    const params = {
      skip: skip.toString(),
      limit: limit.toString()
    };
    return this.http.get(`${this.apiUrl}/disponibles`, { params }).pipe(
      tap((rows) => this.cache.set(this.cacheKey, rows)),
      catchError(() => of(this.cache.get<any[]>(this.cacheKey) || [])),
    );
  }

  /**
   * CU-17: Obtiene el detalle completo de una solicitud disponible
   */
  obtenerDetalleDisponible(solicitudId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/disponibles/${solicitudId}`);
  }

  /**
   * CU-18: Crear postulación (taller se postula para atender una solicitud)
   */
  crearPostulacion(
    solicitudId: string,
    payload: {
      disponibilidad_inmediata: boolean;
      tiempo_estimado_llegada_minutos?: number;
      comentario_adicional?: string;
    }
  ): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/${solicitudId}/postulaciones`,
      payload
    );
  }
}
