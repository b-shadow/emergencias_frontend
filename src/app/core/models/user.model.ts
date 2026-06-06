export enum RolUsuario {
  CLIENTE = 'CLIENTE',
  TALLER = 'TALLER',
  TRABAJADOR = 'TRABAJADOR',
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

export interface SubscriptionPlan {
  id_plan: string;
  codigo_plan: string;
  nombre_plan: string;
  descripcion?: string | null;
  precio_bs: number;
  duracion_dias: number;
  precio_mensual_usd: number;
  stripe_price_id?: string | null;
}

export interface TallerRegisterCheckoutRequest extends TallerRegisterRequest {
  id_plan: string;
  frontend_base_url?: string | null;
}

export interface TallerRegisterCheckoutResponse {
  checkout_url: string;
  checkout_token: string;
  estado: string;
}

export interface TallerRegisterCheckoutValidationResponse {
  estado: string;
  mensaje: string;
  correo?: string | null;
}

export interface SubscriptionHistoryItem {
  id_subscription: string;
  id_plan: string;
  nombre_plan: string;
  codigo_plan: string;
  estado: string;
  fecha_inicio: string;
  fecha_fin: string;
  fecha_creacion: string;
}

export interface SubscriptionManagementResponse {
  id_taller: string;
  plan_actual?: string | null;
  codigo_plan_actual?: string | null;
  estado_suscripcion?: string | null;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  dias_restantes?: number | null;
  historial: SubscriptionHistoryItem[];
}

export interface SubscriptionRenewCheckoutRequest {
  id_plan: string;
  frontend_base_url?: string | null;
}
