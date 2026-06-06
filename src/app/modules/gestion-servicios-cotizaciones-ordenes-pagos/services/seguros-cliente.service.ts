import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';

export interface VehiculoSeguroItem {
  id_vehiculo: string;
  placa: string;
  marca?: string | null;
  modelo?: string | null;
  tipo_seguro: 'SIN_SEGURO' | 'BASICO' | 'TODO_RIESGO' | string;
  aseguradora?: string | null;
  observaciones?: string | null;
}

export interface RegistrarSeguroPayload {
  placa: string;
  marca?: string | null;
  modelo?: string | null;
  anio?: number | null;
  color?: string | null;
  tipo_combustible?: string | null;
  tipo_seguro: 'SIN_SEGURO' | 'BASICO' | 'TODO_RIESGO' | string;
  aseguradora?: string | null;
  observaciones?: string | null;
}

@Injectable({ providedIn: 'root' })
export class SegurosClienteService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  listarMisVehiculos(): Observable<VehiculoSeguroItem[]> {
    return this.http.get<VehiculoSeguroItem[]>(`${this.apiUrl}/clientes/me/vehiculos`);
  }

  registrarSeguro(payload: RegistrarSeguroPayload): Observable<VehiculoSeguroItem> {
    return this.http.post<VehiculoSeguroItem>(`${this.apiUrl}/clientes/me/vehiculos`, payload);
  }

  actualizarSeguro(idVehiculo: string, payload: Partial<RegistrarSeguroPayload>): Observable<VehiculoSeguroItem> {
    return this.http.patch<VehiculoSeguroItem>(`${this.apiUrl}/clientes/me/vehiculos/${idVehiculo}`, payload);
  }
}
