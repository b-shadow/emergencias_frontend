import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor() {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = 'Ocurrió un error inesperado';

        if (error.error instanceof ErrorEvent) {
          errorMessage = `Error: ${error.error.message}`;
        } else {
          if (error.status === 0) {
            errorMessage = 'No se pudo conectar con el servidor';
          } else if (error.status === 400) {
            errorMessage = error.error?.detail || 'Solicitud inválida';
          } else if (error.status === 401) {
            errorMessage = 'No autenticado';
          } else if (error.status === 403) {
            errorMessage = 'Acceso denegado';
          } else if (error.status === 404) {
            errorMessage = 'Recurso no encontrado';
          } else if (error.status === 422) {
            // Mostrar errores de validación detallados
            if (error.error?.detail && Array.isArray(error.error.detail)) {
              const errors = error.error.detail.map((e: any) => `${e.loc?.join('.')}: ${e.msg}`).join('\n');
              errorMessage = `Errores de validación:\n${errors}`;
            } else if (error.error?.detail) {
              errorMessage = error.error.detail;
            } else if (error.error?.message) {
              errorMessage = error.error.message;
            } else {
              errorMessage = 'Datos inválidos - Por favor verifica los campos';
            }
          } else if (error.status === 500) {
            errorMessage = 'Error del servidor';
          }
        }

        return throwError(() => new Error(errorMessage));
      })
    );
  }
}
