import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';

export interface EstadisticaProblema {
  categoria: string;
  cantidad: number;
  porcentaje: number;
}

export interface EstadisticaDemacruzada {
  periodo: string;
  cantidad: number;
}

export interface EstadisticaTiempoAtencion {
  tiempo_promedio_minutos: number;
  tiempo_minimo_minutos: number;
  tiempo_maximo_minutos: number;
}

export interface EstadisticaGeneralTaller {
  fecha_inicio: string;
  fecha_fin: string;
  total_solicitudes_atendidas: number;
  total_solicitudes_canceladas: number;
  total_servicios_completados: number;
  tasa_completacion: number;
  problemas_frecuentes: EstadisticaProblema[];
  dias_mayor_demanda: EstadisticaDemacruzada[];
  horas_mayor_demanda: EstadisticaDemacruzada[];
  tiempo_promedio_atencion: EstadisticaTiempoAtencion;
}

export interface EstadisticasTallerResponse {
  id_taller: string;
  nombre_taller: string;
  estadisticas: EstadisticaGeneralTaller | null;
  mensaje_vacio?: string;
}

@Injectable({
  providedIn: 'root'
})
export class EstadisticasTallerService {
  private apiUrl = `${environment.apiUrl}/estadisticas-taller`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene las estadísticas del taller autenticado
   */
  obtenerMisEstadisticas(
    fechaInicio?: string,
    fechaFin?: string
  ): Observable<EstadisticasTallerResponse> {
    let params = new HttpParams();

    if (fechaInicio) {
      params = params.set('fecha_inicio', fechaInicio);
    }
    if (fechaFin) {
      params = params.set('fecha_fin', fechaFin);
    }

    return this.http.get<EstadisticasTallerResponse>(
      `${this.apiUrl}/mis-estadisticas`,
      { params }
    );
  }
}
