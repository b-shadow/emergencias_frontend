import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { BitacoraListResponse, BitacoraFiltros } from '@core/models/bitacora.model';

@Injectable({
  providedIn: 'root'
})
export class BitacoraService {
  private apiUrl = `${environment.apiUrl}/bitacora`;

  constructor(private http: HttpClient) {}

  /**
   * Consulta registros de bitácora con filtros opcionales
   */
  consultarBitacora(filtros: BitacoraFiltros): Observable<BitacoraListResponse> {
    let params = new HttpParams();

    if (filtros.pagina) params = params.set('pagina', filtros.pagina.toString());
    if (filtros.por_pagina) params = params.set('por_pagina', filtros.por_pagina.toString());
    if (filtros.tipo_actor) params = params.set('tipo_actor', filtros.tipo_actor);
    if (filtros.accion) params = params.set('accion', filtros.accion);
    if (filtros.modulo) params = params.set('modulo', filtros.modulo);
    if (filtros.resultado) params = params.set('resultado', filtros.resultado);
    if (filtros.fecha_inicio) params = params.set('fecha_inicio', filtros.fecha_inicio);
    if (filtros.fecha_fin) params = params.set('fecha_fin', filtros.fecha_fin);
    if (filtros.id_actor) params = params.set('id_actor', filtros.id_actor);

    return this.http.get<BitacoraListResponse>(this.apiUrl, { params });
  }

  /**
   * Obtiene la lista de acciones registradas
   */
  obtenerAcciones(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/opciones/acciones`);
  }

  /**
   * Obtiene todos los registros de bitácora sin paginación para exportación
   */
  consultarBitacoraCompleta(filtros: BitacoraFiltros): Observable<BitacoraListResponse> {
    let params = new HttpParams();

    // No incluir paginación para obtener todos los registros
    params = params.set('pagina', '1');
    params = params.set('por_pagina', '10000'); // Máximo permitido

    if (filtros.tipo_actor) params = params.set('tipo_actor', filtros.tipo_actor);
    if (filtros.accion) params = params.set('accion', filtros.accion);
    if (filtros.modulo) params = params.set('modulo', filtros.modulo);
    if (filtros.resultado) params = params.set('resultado', filtros.resultado);
    if (filtros.fecha_inicio) params = params.set('fecha_inicio', filtros.fecha_inicio);
    if (filtros.fecha_fin) params = params.set('fecha_fin', filtros.fecha_fin);
    if (filtros.id_actor) params = params.set('id_actor', filtros.id_actor);

    return this.http.get<BitacoraListResponse>(this.apiUrl, { params });
  }

  /**
   * Obtiene la lista de módulos registrados
   */
  obtenerModulos(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/opciones/modulos`);
  }
}
