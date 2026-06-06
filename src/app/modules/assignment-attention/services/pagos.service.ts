import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PagosService {
  private apiUrl = `${environment.apiUrl}/pagos`;

  constructor(private http: HttpClient) {}

  obtenerResumen(idSolicitud: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/solicitudes/${idSolicitud}/resumen`);
  }

  registrarManual(idSolicitud: string, monto: number, observacion?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/solicitudes/${idSolicitud}/manual`, {
      monto,
      observacion: observacion || null,
    });
  }

  getPoliticaCancelacion(): Observable<any> {
    return this.http.get(`${this.apiUrl}/taller/politica-cancelacion`);
  }

  upsertPoliticaCancelacion(montoPenalidad: number, activa: boolean): Observable<any> {
    return this.http.put(`${this.apiUrl}/taller/politica-cancelacion`, {
      monto_penalidad: montoPenalidad,
      activa,
    });
  }
}
