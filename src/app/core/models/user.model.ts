export enum RolUsuario {
  CLIENTE = 'CLIENTE',
  TALLER = 'TALLER',
  ADMINISTRADOR = 'ADMINISTRADOR'
}

export interface Usuario {
  id_usuario: string;
  correo: string;
  nombre_completo: string;
  rol: RolUsuario;
  es_activo: boolean;
  fecha_creacion: string;
  fecha_actualizacion: string;
  ultimo_acceso?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  rol: string;
  id_usuario: string;
  nombre_completo: string;
}

export interface LoginRequest {
  correo: string;
  contrasena: string;
  client_type: string;
}

export interface ForgotPasswordRequest {
  correo: string;
}

export interface ResetPasswordRequest {
  token: string;
  nueva_contrasena: string;
  confirmar_contrasena: string;
}

export interface ClienteRegisterRequest {
  correo: string;
  contrasena: string;
  confirmar_contrasena: string;
  nombre: string;
  apellido: string;
}

export interface TallerRegisterRequest {
  correo: string;
  contrasena: string;
  confirmar_contrasena: string;
  nombre_taller: string;
  razon_social?: string | null;
  nit?: string | null;
  telefono: string;
  direccion: string;
  latitud?: number | null;
  longitud?: number | null;
  descripcion?: string | null;
}

export interface TallerRegisterResponse {
  mensaje: string;
  correo: string;
  estado: string;
  nota: string;
}
