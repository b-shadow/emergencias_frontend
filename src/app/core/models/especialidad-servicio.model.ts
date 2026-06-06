// ============================================================================
// ESPECIALIDADES
// ============================================================================

export interface Especialidad {
  id_especialidad: string;
  nombre_especialidad: string;
  descripcion: string | null;
  estado: string; // ACTIVA | INACTIVA
}

export interface TallerEspecialidad {
  id_taller_especialidad: string;
  id_especialidad: string;
  nombre_especialidad: string;
  descripcion: string | null;
  estado: string; // ACTIVA | INACTIVA
}

export interface TallerEspecialidadCreate {
  id_especialidad: string;
}

// ============================================================================
// SERVICIOS
// ============================================================================

export interface Servicio {
  id_servicio: string;
  nombre_servicio: string;
  descripcion: string | null;
  estado: string; // ACTIVO | INACTIVO
}

export interface TallerServicio {
  id_taller_servicio: string;
  id_servicio: string;
  nombre_servicio: string;
  descripcion: string | null;
  estado: string; // ACTIVO | INACTIVO
  disponible: boolean;
  observaciones: string | null;
  categoria_tarifa?: 'MECANICO' | 'ELECTRONICO' | 'CHAPERIO';
  precio_base?: number;
  tipo_pintura_chaperio?: string | null;
}

export interface TallerServicioCreate {
  id_servicio: string;
  disponible: boolean;
  observaciones?: string | null;
  categoria_tarifa?: 'MECANICO' | 'ELECTRONICO' | 'CHAPERIO';
  precio_base?: number;
  tipo_pintura_chaperio?: string | null;
}

export interface TallerServicioUpdate {
  disponible: boolean;
  observaciones?: string | null;
  categoria_tarifa?: 'MECANICO' | 'ELECTRONICO' | 'CHAPERIO';
  precio_base?: number;
  tipo_pintura_chaperio?: string | null;
}

export interface SolicitudServicioTaller {
  id_solicitud_servicio_taller: string;
  id_taller: string;
  nombre_taller?: string | null;
  nombre_servicio: string;
  descripcion?: string | null;
  estado: 'EN_ESPERA' | 'APROBADO' | 'RECHAZADO';
  motivo_rechazo?: string | null;
  id_servicio_creado?: string | null;
  fecha_solicitud: string;
  fecha_resolucion?: string | null;
}

export interface SolicitudServicioTallerCreate {
  nombre_servicio: string;
  descripcion?: string | null;
}

export interface SolicitudServicioTallerRechazo {
  motivo_rechazo?: string | null;
}
