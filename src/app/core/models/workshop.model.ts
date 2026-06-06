export enum EstadoAprobacionTaller {
  PENDIENTE = 'PENDIENTE',
  APROBADO = 'APROBADO',
  RECHAZADO = 'RECHAZADO'
}

export enum EstadoOperativoTaller {
  DISPONIBLE = 'DISPONIBLE',
  NO_DISPONIBLE = 'NO_DISPONIBLE',
  SUSPENDIDO = 'SUSPENDIDO'
}

export interface TallerPerfil {
  id_taller: string;
  id_tenant: string;
  id_usuario: string;
  nombre_taller: string;
  razon_social: string | null;
  nit: string | null;
  telefono: string | null;
  direccion: string | null;
  latitud: number | null;
  longitud: number | null;
  descripcion: string | null;
  estado_aprobacion: EstadoAprobacionTaller;
  estado_operativo: EstadoOperativoTaller;
  fecha_registro: string;
  fecha_aprobacion: string | null;
  correo: string;
  plan_actual?: string | null;
  fecha_fin_plan?: string | null;
  dias_restantes_plan?: number | null;
}

export interface TenantTallerContext {
  id_tenant: string;
  nombre_tenant: string;
  slug_tenant: string;
  es_activo: boolean;
  fecha_creacion: string;
}

export interface TallerPerfilUpdate {
  nombre_taller?: string;
  razon_social?: string;
  nit?: string;
  telefono?: string;
  direccion?: string;
  latitud?: number | null;
  longitud?: number | null;
  descripcion?: string;
}
