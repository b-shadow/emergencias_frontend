export interface BitacoraEvento {
  id_bitacora: string;
  tipo_actor: 'CLIENTE' | 'TALLER' | 'ADMINISTRADOR' | 'SISTEMA';
  id_actor: string | null;
  nombre_completo: string | null;
  correo: string | null;
  accion: string;
  modulo: string;
  entidad_afectada: string;
  id_entidad_afectada: string | null;
  resultado: 'EXITO' | 'ERROR' | 'ADVERTENCIA';
  detalle: string | null;
  ip_origen: string | null;
  fecha_evento: string; // ISO 8601 datetime
}

export interface BitacoraListResponse {
  total: number;
  pagina: number;
  por_pagina: number;
  registros: BitacoraEvento[];
}

export interface BitacoraFiltros {
  pagina?: number;
  por_pagina?: number;
  tipo_actor?: string;
  accion?: string;
  modulo?: string;
  resultado?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  id_actor?: string;
}
