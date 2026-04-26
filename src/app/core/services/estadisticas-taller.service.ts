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
  diagnosticos: EstadisticaProblema[];
  total_diagnosticos_con_seguimiento: number;
  dias_mayor_demanda: EstadisticaDemacruzada[];
  horas_mayor_demanda: EstadisticaDemacruzada[];
  tiempo_promedio_atencion: EstadisticaTiempoAtencion;
}

export interface FiltroReporteTallerAplicado {
  fecha_inicio: string;
  fecha_fin: string;
  agrupar_por: string;
  nivel_urgencia?: string | null;
  categoria_incidente?: string | null;
  estado_solicitud?: string | null;
  estado_asignacion?: string | null;
  estado_resultado?: string | null;
}

export interface ReporteTablaTallerItem {
  grupo: string;
  total_solicitudes: number;
  solicitudes_atendidas: number;
  solicitudes_canceladas: number;
  servicios_completados: number;
  tasa_completacion: number;
}

export interface ReporteGraficosTaller {
  categorias: string[];
  serie_total_solicitudes: number[];
  serie_solicitudes_atendidas: number[];
  serie_solicitudes_canceladas: number[];
  serie_servicios_completados: number[];
}

export interface ReporteFiltradoTaller {
  filtros_aplicados: FiltroReporteTallerAplicado;
  tabla: ReporteTablaTallerItem[];
  graficos: ReporteGraficosTaller;
}

export interface OpcionesFiltrosTaller {
  urgencias: string[];
  categorias_incidente: string[];
  estados_solicitud: string[];
  estados_asignacion: string[];
  estados_resultado: string[];
}

export interface EstadisticasTallerResponse {
  id_taller: string;
  nombre_taller: string;
  estadisticas: EstadisticaGeneralTaller | null;
  reporte: ReporteFiltradoTaller | null;
  opciones_filtros?: OpcionesFiltrosTaller | null;
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
    fechaFin?: string,
    agruparPor?: string,
    nivelUrgencia?: string,
    categoriaIncidente?: string,
    estadoSolicitud?: string,
    estadoAsignacion?: string,
    estadoResultado?: string
  ): Observable<EstadisticasTallerResponse> {
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
    if (estadoAsignacion) {
      params = params.set('estado_asignacion', estadoAsignacion);
    }
    if (estadoResultado) {
      params = params.set('estado_resultado', estadoResultado);
    }

    return this.http.get<EstadisticasTallerResponse>(
      `${this.apiUrl}/mis-estadisticas`,
      { params }
    );
  }
}
