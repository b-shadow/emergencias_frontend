import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '@environments/environment';
import { OfflineCacheService } from '@core/services/offline-cache.service';

export interface EstadisticaProblema {
  categoria: string;
  cantidad: number;
  porcentaje: number;
}

export interface KPIFrecuente {
  nombre: string;
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

export interface KPIIncidenteTipo {
  tipo: string;
  cantidad: number;
}

export interface KPICancelacionTipo {
  motivo: string;
  cantidad: number;
}

export interface KPIEficienciaServicio {
  servicio: string;
  categoria_tarifa: string;
  total: number;
  completados: number;
  tasa_completacion: number;
}

export interface EstadisticaGeneralTaller {
  fecha_inicio: string;
  fecha_fin: string;
  total_solicitudes_atendidas: number;
  total_solicitudes_canceladas: number;
  solicitudes_recibidas: number;
  solicitudes_aceptadas: number;
  tasa_aceptacion: number;
  total_servicios_completados: number;
  tasa_completacion: number;
  calificacion_promedio?: number | null;
  total_pagos_confirmados: number;
  monto_total_pagado: number;
  monto_promedio_pago: number;
  cumplimiento_eta_pct: number;
  diagnosticos: EstadisticaProblema[];
  total_diagnosticos_con_seguimiento: number;
  dias_mayor_demanda: EstadisticaDemacruzada[];
  horas_mayor_demanda: EstadisticaDemacruzada[];
  tiempo_promedio_atencion: EstadisticaTiempoAtencion;
  tiempo_promedio_asignacion_minutos: number;
  tiempo_promedio_llegada_minutos: number;
  incidentes_por_tipo: KPIIncidenteTipo[];
  zona_mas_incidentes?: string | null;
  cancelaciones_por_tipo: KPICancelacionTipo[];
  eficiencia_por_servicio: KPIEficienciaServicio[];
  servicios_mas_realizados: KPIFrecuente[];
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

export interface ColumnaReporteTaller {
  key: string;
  label: string;
}

export interface ReporteConsultaTallerResponse {
  consulta_original: string;
  tipo_reporte: string;
  titulo: string;
  descripcion?: string | null;
  columnas: ColumnaReporteTaller[];
  filas: Record<string, string | number | boolean | null>[];
  total_registros: number;
  mensaje?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class EstadisticasTallerService {
  private apiUrl = `${environment.apiUrl}/estadisticas-taller`;
  private cacheKey = 'offline_estadisticas_taller_mis_estadisticas';

  constructor(
    private http: HttpClient,
    private cache: OfflineCacheService,
  ) {}

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
    ).pipe(
      tap((data) => this.cache.set(this.cacheKey, data)),
      catchError(() => {
        const cached = this.cache.get<EstadisticasTallerResponse>(this.cacheKey);
        return of(
          cached || {
            id_taller: '',
            nombre_taller: '',
            estadisticas: null,
            reporte: null,
            mensaje_vacio: 'Sin conexion y sin cache disponible',
          }
        );
      }),
    );
  }

  generarReporteConsulta(consulta: string): Observable<ReporteConsultaTallerResponse> {
    return this.http.post<ReporteConsultaTallerResponse>(
      `${this.apiUrl}/reportes-consulta`,
      { consulta }
    );
  }
}
