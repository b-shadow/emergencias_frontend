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
}

export interface TallerServicioCreate {
  id_servicio: string;
  disponible: boolean;
  observaciones?: string | null;
}

export interface TallerServicioUpdate {
  disponible: boolean;
  observaciones?: string | null;
}
