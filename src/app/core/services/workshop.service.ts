import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { TallerPerfil, TallerPerfilUpdate } from '@core/models/workshop.model';
export {
  Especialidad,
  TallerEspecialidad,
  TallerEspecialidadCreate,
  Servicio,
  TallerServicio,
  TallerServicioCreate,
  TallerServicioUpdate,
} from '@core/models/especialidad-servicio.model';
import {
  Especialidad,
  TallerEspecialidad,
  TallerEspecialidadCreate,
  Servicio,
  TallerServicio,
  TallerServicioCreate,
  TallerServicioUpdate,
} from '@core/models/especialidad-servicio.model';

// ============================================================================
// INTERFACES ADMINISTRATIVAS
// ============================================================================

export interface TallerAdminListItem {
  id_taller: string;
  id_usuario: string;
  nombre_taller: string;
  razon_social: string | null;
  nit: string | null;
  telefono: string | null;
  correo: string;
  estado_aprobacion: string;
  estado_operativo: string;
  es_activo: boolean;
  fecha_registro: string;
  fecha_aprobacion: string | null;
}

export interface TallerAdminDetail extends TallerAdminListItem {
  direccion: string | null;
  latitud: number | null;
  longitud: number | null;
  descripcion: string | null;
}

export interface TallerAdminUpdate {
  nombre_taller?: string;
  razon_social?: string;
  nit?: string;
  telefono?: string;
  direccion?: string;
  latitud?: number;
  longitud?: number;
  descripcion?: string;
}

export interface TallerActionResponse {
  mensaje: string;
  id_taller: string;
  estado_aprobacion: string;
  estado_operativo: string;
  es_activo: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class WorkshopService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene el perfil propio del taller autenticado
   */
  getMyProfile(): Observable<TallerPerfil> {
    return this.http.get<TallerPerfil>(`${this.apiUrl}/talleres/me`);
  }

  /**
   * Actualiza el perfil propio del taller autenticado
   */
  updateMyProfile(data: TallerPerfilUpdate): Observable<TallerPerfil> {
    return this.http.patch<TallerPerfil>(`${this.apiUrl}/talleres/me`, data);
  }

  // =========================================================================
  // MÉTODOS ADMINISTRATIVOS
  // =========================================================================

  /**
   * Lista talleres con filtros administrativos
   * Solo accesible por admin
   */
  listTalleresAdmin(
    estadoAprobacion?: string | null,
    estadoOperativo?: string | null,
    esActivo?: boolean | null,
    nombreTaller?: string | null,
    nit?: string | null,
    correo?: string | null
  ): Observable<TallerAdminListItem[]> {
    let params = new URLSearchParams();

    if (estadoAprobacion) params.set('estado_aprobacion', estadoAprobacion);
    if (estadoOperativo) params.set('estado_operativo', estadoOperativo);
    if (esActivo !== null && esActivo !== undefined) params.set('es_activo', String(esActivo));
    if (nombreTaller) params.set('nombre_taller', nombreTaller);
    if (nit) params.set('nit', nit);
    if (correo) params.set('correo', correo);

    const queryString = params.toString();
    const url = queryString ? `${this.apiUrl}/talleres/admin?${queryString}` : `${this.apiUrl}/talleres/admin`;

    return this.http.get<TallerAdminListItem[]>(url);
  }

  /**
   * Obtiene detalle administrativo de un taller
   * Solo accesible por admin
   */
  getTallerAdminDetail(tallerId: string): Observable<TallerAdminDetail> {
    return this.http.get<TallerAdminDetail>(`${this.apiUrl}/talleres/admin/${tallerId}`);
  }

  /**
   * Actualiza información del taller (admin)
   * Solo accesible por admin
   */
  updateTallerAdmin(tallerId: string, data: TallerAdminUpdate): Observable<TallerAdminDetail> {
    return this.http.patch<TallerAdminDetail>(`${this.apiUrl}/talleres/admin/${tallerId}`, data);
  }

  /**
   * Aprueba un taller pendiente
   * Solo accesible por admin
   */
  aprobarTaller(tallerId: string): Observable<TallerActionResponse> {
    return this.http.post<TallerActionResponse>(`${this.apiUrl}/talleres/${tallerId}/aprobar`, {});
  }

  /**
   * Rechaza un taller pendiente
   * Solo accesible por admin
   */
  rechazarTaller(tallerId: string, motivo?: string): Observable<TallerActionResponse> {
    return this.http.post<TallerActionResponse>(`${this.apiUrl}/talleres/${tallerId}/rechazar`, { motivo });
  }

  /**
   * Habilita un taller aprobado
   * Solo accesible por admin
   */
  habilitarTaller(tallerId: string): Observable<TallerActionResponse> {
    return this.http.post<TallerActionResponse>(`${this.apiUrl}/talleres/${tallerId}/habilitar`, {});
  }

  /**
   * Deshabilita un taller aprobado
   * Solo accesible por admin
   */
  deshabilitarTaller(tallerId: string): Observable<TallerActionResponse> {
    return this.http.post<TallerActionResponse>(`${this.apiUrl}/talleres/${tallerId}/deshabilitar`, {});
  }

  // =========================================================================
  // ESPECIALIDADES DEL TALLER
  // =========================================================================

  /**
   * Obtiene todas las especialidades disponibles (master data)
   */
  getAllEspecialidades(): Observable<Especialidad[]> {
    return this.http.get<Especialidad[]>(`${this.apiUrl}/talleres/especialidades/disponibles`);
  }

  /**
   * Obtiene especialidades del taller actual
   */
  getMisEspecialidades(): Observable<TallerEspecialidad[]> {
    return this.http.get<TallerEspecialidad[]>(`${this.apiUrl}/talleres/me/especialidades`);
  }

  /**
   * Agrega una especialidad al taller
   */
  agregarEspecialidad(payload: TallerEspecialidadCreate): Observable<TallerEspecialidad> {
    return this.http.post<TallerEspecialidad>(`${this.apiUrl}/talleres/me/especialidades`, payload);
  }

  /**
   * Remueve una especialidad del taller
   */
  removerEspecialidad(especialidadId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/talleres/me/especialidades/${especialidadId}`);
  }

  // =========================================================================
  // SERVICIOS DEL TALLER
  // =========================================================================

  /**
   * Obtiene todos los servicios disponibles (master data)
   */
  getAllServicios(): Observable<Servicio[]> {
    return this.http.get<Servicio[]>(`${this.apiUrl}/talleres/servicios/disponibles`);
  }

  /**
   * Obtiene servicios del taller actual
   */
  getMisServicios(): Observable<TallerServicio[]> {
    return this.http.get<TallerServicio[]>(`${this.apiUrl}/talleres/me/servicios`);
  }

  /**
   * Agrega un servicio al taller
   */
  agregarServicio(payload: TallerServicioCreate): Observable<TallerServicio> {
    return this.http.post<TallerServicio>(`${this.apiUrl}/talleres/me/servicios`, payload);
  }

  /**
   * Remueve un servicio del taller
   */
  removerServicio(servicioId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/talleres/me/servicios/${servicioId}`);
  }

  /**
   * Actualiza disponibilidad de un servicio
   */
  actualizarServicio(servicioId: string, payload: TallerServicioUpdate): Observable<TallerServicio> {
    return this.http.patch<TallerServicio>(`${this.apiUrl}/talleres/me/servicios/${servicioId}`, payload);
  }
}
