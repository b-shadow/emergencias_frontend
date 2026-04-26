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
  reporte: ReporteFiltradoSistema | null;
  mensaje_vacio: string | null;
}

export interface FiltroReporteSistemaAplicado {
  fecha_inicio: string;
  fecha_fin: string;
  agrupar_por: string;
  nivel_urgencia?: string | null;
  categoria_incidente?: string | null;
  estado_solicitud?: string | null;
  id_taller?: string | null;
}

export interface ReporteTablaSistemaItem {
  grupo: string;
  total_solicitudes: number;
  solicitudes_atendidas: number;
  solicitudes_canceladas: number;
  servicios_completados: number;
  tasa_completacion: number;
}

export interface ReporteGraficosSistema {
  categorias: string[];
  serie_total_solicitudes: number[];
  serie_solicitudes_atendidas: number[];
  serie_solicitudes_canceladas: number[];
  serie_servicios_completados: number[];
}

export interface ReporteFiltradoSistema {
  filtros_aplicados: FiltroReporteSistemaAplicado;
  tabla: ReporteTablaSistemaItem[];
  graficos: ReporteGraficosSistema;
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
    fechaFin?: string,
    agruparPor?: string,
    nivelUrgencia?: string,
    categoriaIncidente?: string,
    estadoSolicitud?: string,
    idTaller?: string
  ): Observable<EstadisticasGeneralesResponse> {
    let params = new HttpParams();

    if (fechaInicio) {
      params = params.set('fecha_inicio', fechaInicio);
    }
    if (fechaFin) {
      params = params.set('fecha_fin', fechaFin);
    }
    if (agruparPor) {
      params = params.set('agrupar_por', agruparPor);
    }
    if (nivelUrgencia) {
      params = params.set('nivel_urgencia', nivelUrgencia);
    }
    if (categoriaIncidente) {
      params = params.set('categoria_incidente', categoriaIncidente);
    }
    if (estadoSolicitud) {
      params = params.set('estado_solicitud', estadoSolicitud);
    }
    if (idTaller) {
      params = params.set('id_taller', idTaller);
    }

    return this.http.get<EstadisticasGeneralesResponse>(
      `${this.apiUrl}/estadisticas-sistema`,
      { params }
    );
  }
}
