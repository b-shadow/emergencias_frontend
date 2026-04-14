import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { Notificacion, NotificacionListResponse, NotificacionFiltros, MarcarComoLeidoRequest } from '@core/models/notification.model';

@Injectable({
  providedIn: 'root'
})
export class NotificacionService {
  private apiUrl = `${environment.apiUrl}/notificaciones`;
  private apiUrlAdmin = `${environment.apiUrl}/admin/notificaciones`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene las notificaciones del usuario actual
   */
  obtenerMisNotificaciones(filtros: NotificacionFiltros): Observable<NotificacionListResponse> {
    let params = new HttpParams();

    if (filtros.limit) params = params.set('limit', filtros.limit.toString());
    if (filtros.offset) params = params.set('offset', filtros.offset.toString());
    if (filtros.tipo_notificacion) params = params.set('tipo_notificacion', filtros.tipo_notificacion);
    if (filtros.categoria_evento) params = params.set('categoria_evento', filtros.categoria_evento);
    if (filtros.estado_lectura) params = params.set('estado_lectura', filtros.estado_lectura);
    if (filtros.fecha_desde) params = params.set('fecha_desde', filtros.fecha_desde);
    if (filtros.fecha_hasta) params = params.set('fecha_hasta', filtros.fecha_hasta);

    return this.http.get<NotificacionListResponse>(`${this.apiUrl}/mias`, { params });
  }

  /**
   * Obtiene el detalle de una notificación específica
   */
  obtenerDetalleNotificacion(id: string): Observable<Notificacion> {
    return this.http.get<Notificacion>(`${this.apiUrl}/mias/${id}`);
  }

  /**
   * Marca una notificación como leída
   */
  marcarComoLeida(id: string): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/mias/${id}/leer`, {});
  }

  /**
   * Obtiene todas las notificaciones (solo administrador)
   */
  obtenerTodasNotificaciones(filtros: NotificacionFiltros): Observable<NotificacionListResponse> {
    let params = new HttpParams();

    if (filtros.limit) params = params.set('limit', filtros.limit.toString());
    if (filtros.offset) params = params.set('offset', filtros.offset.toString());
    if (filtros.tipo_notificacion) params = params.set('tipo_notificacion', filtros.tipo_notificacion);
    if (filtros.categoria_evento) params = params.set('categoria_evento', filtros.categoria_evento);
    if (filtros.estado_lectura) params = params.set('estado_lectura', filtros.estado_lectura);
    if (filtros.estado_envio) params = params.set('estado_envio', filtros.estado_envio);
    if (filtros.fecha_desde) params = params.set('fecha_desde', filtros.fecha_desde);
    if (filtros.fecha_hasta) params = params.set('fecha_hasta', filtros.fecha_hasta);
    if (filtros.id_usuario_destino) params = params.set('id_usuario_destino', filtros.id_usuario_destino);

    return this.http.get<NotificacionListResponse>(`${this.apiUrl}/admin/historial`, { params });
  }

  /**
   * Obtiene el detalle de una notificación (solo administrador)
   */
  obtenerDetalleNotificacionAdmin(id: string): Observable<Notificacion> {
    return this.http.get<Notificacion>(`${this.apiUrl}/admin/${id}`);
  }

  /**
   * Obtiene el estado del servicio de notificaciones
   */
  obtenerEstado(): Observable<any> {
    return this.http.get(`${this.apiUrl}/estado`);
  }
}
