import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';

export interface TiempoRespuesta {
  minimo: number;
  maximo: number;
  promedio: number;
  mediana: number;
}

export interface IncidenteFrequente {
  tipo_incidente: string;
  cantidad: number;
  porcentaje: number;
}

export interface TallerActividad {
  nombre_taller: string;
  solicitudes_atendidas: number;
  servicios_realizados: number;
  calificacion_promedio?: number | null;
}

export interface ZonaEmergencia {
  zona: string;
  cantidad_emergencias: number;
  talleres_disponibles: number;
}

export interface EstadisticasGeneralesResponse {
  fecha_inicio: string;
  fecha_fin: string;
  total_emergencias: number;
  total_solicitudes_atendidas: number;
  total_servicios_realizados: number;
  talleres_activos: number;
  clientes_activos: number;
  incidentes_frecuentes: IncidenteFrequente[];
  talleres_top: TallerActividad[];
  zonas_criticas: ZonaEmergencia[];
  tiempo_respuesta: TiempoRespuesta | null;
  solicitudes_completadas: number;
  solicitudes_pendientes: number;
  solicitudes_canceladas: number;
  mensaje_vacio: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class EstadisticasSistemaService {
  private apiUrl = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene las estadísticas generales del sistema
   */
  obtenerEstadisticasSistema(
    fechaInicio?: string,
    fechaFin?: string
  ): Observable<EstadisticasGeneralesResponse> {
    let params = new HttpParams();

    if (fechaInicio) {
      params = params.set('fecha_inicio', fechaInicio);
    }
    if (fechaFin) {
      params = params.set('fecha_fin', fechaFin);
    }

    return this.http.get<EstadisticasGeneralesResponse>(
      `${this.apiUrl}/estadisticas-sistema`,
      { params }
    );
  }
}
