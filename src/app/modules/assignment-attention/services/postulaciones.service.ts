import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PostulacionesService {
  private apiUrl = `${environment.apiUrl}/postulaciones`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene las postulaciones del taller actual (para CU-18, CU-19: Ver mis postulaciones)
   */
  obtenerMisPostulaciones(): Observable<any> {
    return this.http.get(`${this.apiUrl}/mis-postulaciones`);
  }

  /**
   * CU-18: Crear postulación (taller se postula a una emergencia)
   */
  crearPostulacion(
    solicitudId: number | string,
    datos: { tiempo_estimado_llegada: number; disponibilidad?: boolean; mensaje_propuesta?: string }
  ): Observable<any> {
    const payload: any = {
      tiempo_estimado_llegada_min: datos.tiempo_estimado_llegada
    };

    // Agregar mensaje si está presente
    if (datos.mensaje_propuesta) {
      payload.mensaje_propuesta = datos.mensaje_propuesta;
    }

    return this.http.post(
      `${this.apiUrl}/solicitud/${solicitudId}`,
      payload
    );
  }

  /**
   * Obtiene el detalle de una postulación específica
   */
  obtenerDetallePostulacion(postulacionId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${postulacionId}`);
  }

  /**
   * CU-19: Retira una postulación (taller se arrepiente)
   * Solo si está en estado POSTULADA
   */
  retirarPostulacion(postulacionId: number | string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/${postulacionId}/withdraw`,
      {}
    );
  }
}
