import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '@environments/environment';
import {
  Usuario,
  TokenResponse,
  LoginRequest,
  ClienteRegisterRequest,
  TallerRegisterRequest,
  TallerRegisterResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  RolUsuario
} from '@core/models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<Usuario | null>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();
  private tokenSubject = new BehaviorSubject<string | null>(this.getTokenFromStorage());
  public token$ = this.tokenSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  login(credentials: LoginRequest): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${this.apiUrl}/auth/login`, credentials)
      .pipe(
        tap(response => this.handleAuthResponse(response))
      );
  }

  registrarCliente(data: ClienteRegisterRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register`, data);
  }

  registrarTaller(data: TallerRegisterRequest): Observable<TallerRegisterResponse> {
    return this.http.post<TallerRegisterResponse>(`${this.apiUrl}/auth/register-taller`, data);
  }

  forgotPassword(data: ForgotPasswordRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/forgot-password`, data);
  }

  resetPassword(data: ResetPasswordRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/reset-password`, data);
  }

  refreshToken(refreshToken: string): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${this.apiUrl}/auth/refresh`, { refresh_token: refreshToken })
      .pipe(
        tap(response => this.handleAuthResponse(response))
      );
  }

  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/logout`, {})
      .pipe(
        tap(() => this.clearAuth())
      );
  }

  private handleAuthResponse(response: TokenResponse): void {
    this.setToken(response.access_token);
    localStorage.setItem('refreshToken', response.refresh_token);
    localStorage.setItem('userRole', response.rol);
    localStorage.setItem('userName', response.nombre_completo);
    localStorage.setItem('userId', response.id_usuario);

    // Guardar usuario completo para que getCurrentUser() funcione correctamente
    const user: Usuario = {
      id_usuario: response.id_usuario,
      correo: '', // No viene en el response
      nombre_completo: response.nombre_completo,
      rol: response.rol as RolUsuario,
      es_activo: true,
      fecha_creacion: new Date().toISOString(),
      fecha_actualizacion: new Date().toISOString()
    };
    this.setCurrentUser(user);
  }

  private clearAuth(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userName');
    this.currentUserSubject.next(null);
    this.tokenSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  setToken(token: string): void {
    localStorage.setItem('accessToken', token);
    this.tokenSubject.next(token);
  }

  getToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  private getTokenFromStorage(): string | null {
    return localStorage.getItem('accessToken');
  }

  private getUserFromStorage(): Usuario | null {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
  }

  setCurrentUser(user: Usuario): void {
    localStorage.setItem('currentUser', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  getCurrentUser(): Usuario | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getUserRole(): RolUsuario | null {
    const role = localStorage.getItem('userRole');
    return role as RolUsuario | null;
  }

  isTaller(): boolean {
    return this.getUserRole() === RolUsuario.TALLER;
  }

  isAdmin(): boolean {
    return this.getUserRole() === RolUsuario.ADMINISTRADOR;
  }

  isCliente(): boolean {
    return this.getUserRole() === RolUsuario.CLIENTE;
  }
}
