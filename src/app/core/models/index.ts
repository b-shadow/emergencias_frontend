export interface Cliente {
  id_cliente: string;
  id_usuario: string;
  nombre: string;
  apellido: string;
  telefono?: string;
  ci?: string;
  direccion?: string;
  foto_perfil_url?: string;
  fecha_registro: string;
}

export interface Taller {
  id_taller: string;
  id_usuario: string;
  nombre_taller: string;
  telefono?: string;
  direccion?: string;
  logo_url?: string;
  fecha_registro: string;
  calificacion_promedio?: number;
  estado_aprobacion: string;
}

export * from './workshop.model';

export interface Vehiculo {
  id_vehiculo: string;
  id_cliente: string;
  marca: string;
  modelo: string;
  anio: number;
  placa: string;
  vin?: string;
}

export interface Especialidad {
  id_especialidad: string;
  nombre_especialidad: string;
  descripcion?: string;
}

export interface Servicio {
  id_servicio: string;
  nombre_servicio: string;
  descripcion?: string;
}

export interface Postulacion {
  id_postulacion: string;
  id_solicitud: string;
  id_taller: string;
  fecha_postulacion: string;
  estado: string;
}

export interface Asignacion {
  id_asignacion: string;
  id_solicitud: string;
  id_taller: string;
  id_mecanico?: string;
  estado: string;
  fecha_asignacion: string;
}

export interface Notificacion {
  id_notificacion: string;
  id_usuario: string;
  titulo: string;
  mensaje: string;
  tipo: string;
  categoria: string;
  estado_lectura: string;
  fecha_envio: string;
}

export interface RegistroAuditoria {
  id_bitacora: string;
  tipo_actor: string;
  id_actor?: string;
  accion: string;
  modulo: string;
  entidad_afectada: string;
  id_entidad_afectada?: string;
  resultado: string;
  detalle?: string;
  ip_origen?: string;
  fecha_evento: string;
}

export * from './notification.model';

