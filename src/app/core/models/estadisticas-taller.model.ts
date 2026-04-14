export interface EstadisticaDiagnostico {
  diagnostico: string;
  cantidad: number;
  porcentaje: number;
  requiere_seguimiento: number;
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
  diagnosticos: EstadisticaDiagnostico[];
  total_diagnosticos_con_seguimiento: number;
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
