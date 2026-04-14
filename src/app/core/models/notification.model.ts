/**
 * Modelo de Notificación
 */

export enum TipoNotificacion {
  SOLICITUD_CREADA = 'SOLICITUD_CREADA',
  SOLICITUD_ACEPTADA = 'SOLICITUD_ACEPTADA',
  SOLICITUD_RECHAZADA = 'SOLICITUD_RECHAZADA',
  TALLER_ASIGNADO = 'TALLER_ASIGNADO',
  SERVICIO_COMPLETADO = 'SERVICIO_COMPLETADO',
  PAGO_RECIBIDO = 'PAGO_RECIBIDO',
  SISTEMA = 'SISTEMA',
  GENERAL = 'GENERAL'
}

export enum CategoriaEvento {
  BATERIA_DESCARGADA = 'BATERIA_DESCARGADA',
  COLISION = 'COLISION',
  PINCHAZO_LLANTA = 'PINCHAZO_LLANTA',
  SOBRECALENTAMIENTO = 'SOBRECALENTAMIENTO',
  VEHICULO_INMOVILIZADO = 'VEHICULO_INMOVILIZADO',
  FALLA_ELECTRICA = 'FALLA_ELECTRICA',
  FALLA_MECANICA = 'FALLA_MECANICA',
  NO_ENTENDIBLE = 'NO_ENTENDIBLE',
  SIN_CLASIFICACION_CLARA = 'SIN_CLASIFICACION_CLARA'
}

export enum EstadoLecturaNotificacion {
  LEIDA = 'LEIDA',
  NO_LEIDA = 'NO_LEIDA'
}

export enum EstadoEnvioNotificacion {
  ENVIADA = 'ENVIADA',
  PENDIENTE = 'PENDIENTE',
  FALLIDA = 'FALLIDA'
}

export interface Notificacion {
  id_notificacion: string;
  id_usuario: string;
  id_usuario_destino?: string;
  tipo_usuario_destino?: string;
  nombre_usuario?: string;
  rol_usuario?: string;
  titulo: string;
  mensaje: string;
  tipo_notificacion: TipoNotificacion;
  categoria_evento?: CategoriaEvento;
  estado_lectura: EstadoLecturaNotificacion;
  estado_envio: EstadoEnvioNotificacion;
  fecha_envio: string;
  fecha_lectura?: string;
  referencia_id?: string;
  referencia_tipo?: string;
  datos_adicionales?: Record<string, any>;
}

export interface NotificacionListResponse {
  items: Notificacion[];
  total: number;
  limit: number;
  offset: number;
}

export interface NotificacionFiltros {
  limit?: number;
  offset?: number;
  tipo_notificacion?: string;
  categoria_evento?: string;
  estado_lectura?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  id_usuario_destino?: string;
  estado_envio?: string;
}

export interface MarcarComoLeidoRequest {
  id_notificacion: string;
}
