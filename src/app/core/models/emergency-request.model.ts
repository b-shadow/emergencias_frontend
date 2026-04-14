export enum EstadoSolicitud {
  REGISTRADA = 'REGISTRADA',
  EN_BUSQUEDA = 'EN_BUSQUEDA',
  EN_ESPERA_RESPUESTAS = 'EN_ESPERA_RESPUESTAS',
  TALLER_SELECCIONADO = 'TALLER_SELECCIONADO',
  EN_CAMINO = 'EN_CAMINO',
  EN_PROCESO = 'EN_PROCESO',
  ATENDIDA = 'ATENDIDA',
  CANCELADA = 'CANCELADA'
}

export interface EmergencyRequest {
  id_solicitud: string;
  id_cliente: string;
  descripcion: string;
  ubicacion: string;
  estado: EstadoSolicitud;
  fecha_creacion: string;
  fecha_actualizacion: string;
  taller_seleccionado?: string;
}
