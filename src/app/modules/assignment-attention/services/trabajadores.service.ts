import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

export interface TenantTallerContext {
  id_tenant: string;
  nombre_tenant: string;
  slug_tenant: string;
  es_activo: boolean;
  fecha_creacion: string;
}

export interface TrabajadorItem {
  id_trabajador: string;
  id_usuario: string;
  id_taller: string;
  nombre_completo?: string | null;
  correo?: string | null;
  telefono?: string | null;
  licencia_conducir?: string | null;
  es_activo: boolean;
  fecha_registro: string;
}

export interface TrabajadorCreatePayload {
  correo: string;
  contrasena: string;
  nombre_completo: string;
  telefono?: string | null;
  licencia_conducir?: string | null;
}

export interface TrabajadorUpdatePayload {
  nombre_completo: string;
  telefono?: string | null;
  licencia_conducir?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class TrabajadoresService {
  private apiUrl = `${environment.apiUrl}/trabajadores`;

  constructor(private http: HttpClient) {}

  listarTrabajadores(): Observable<TrabajadorItem[]> {
    return this.http.get<TrabajadorItem[]>(this.apiUrl);
  }

  crearTrabajador(payload: TrabajadorCreatePayload): Observable<TrabajadorItem> {
    return this.http.post<TrabajadorItem>(this.apiUrl, payload);
  }

  actualizarTrabajador(idTrabajador: string, payload: TrabajadorUpdatePayload): Observable<TrabajadorItem> {
    return this.http.patch<TrabajadorItem>(`${this.apiUrl}/${idTrabajador}`, payload);
  }

  cambiarEstadoTrabajador(idTrabajador: string, esActivo: boolean): Observable<TrabajadorItem> {
    return this.http.patch<TrabajadorItem>(`${this.apiUrl}/${idTrabajador}/estado`, { es_activo: esActivo });
  }

  asignarOrdenRecojo(idAsignacion: string, idTrabajador: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/asignaciones/${idAsignacion}/orden-recojo`, {
      id_trabajador: idTrabajador,
    });
  }

  getTrackingBySolicitud(idSolicitud: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/solicitudes/${idSolicitud}/tracking`).pipe(
      catchError((error) => {
        if (error?.status === 404) {
          return of(null);
        }
        return throwError(() => error);
      })
    );
  }

  getMiTenant(): Observable<TenantTallerContext> {
    return this.http.get<TenantTallerContext>(`${this.apiUrl}/me/tenant`);
  }
}
