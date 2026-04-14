import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Usuario, RolUsuario } from '@core/models/user.model';
import { environment } from '@environments/environment';

export interface UsuarioCreate {
  correo: string;
  contrasena: string;
  nombre_completo: string;
  rol: RolUsuario;
}

export interface UsuarioRolUpdate {
  rol: RolUsuario;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/usuarios`;

  constructor(private http: HttpClient) {}

  /**
   * Lista todos los usuarios (solo admin)
   */
  listUsers(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.apiUrl);
  }

  /**
   * Obtiene detalles de un usuario específico
   */
  getUser(usuarioId: string): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/${usuarioId}`);
  }

  /**
   * Crea un nuevo usuario (solo admin)
   */
  createUser(data: UsuarioCreate): Observable<Usuario> {
    return this.http.post<Usuario>(this.apiUrl, data);
  }

  /**
   * Cambia el rol de un usuario (solo admin)
   */
  changeUserRole(usuarioId: string, nuevoRol: RolUsuario): Observable<Usuario> {
    return this.http.patch<Usuario>(
      `${this.apiUrl}/${usuarioId}/rol`,
      { rol: nuevoRol }
    );
  }

  /**
   * Elimina un usuario (solo admin)
   */
  deleteUser(usuarioId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${usuarioId}`);
  }
}
