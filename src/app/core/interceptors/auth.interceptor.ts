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
import { AuthService } from '@core/services/auth.service';
import { Router } from '@angular/router';
import { environment } from '@environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService, private router: Router) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authService.getToken();

    const isAbsoluteUrl = /^https?:\/\//i.test(request.url);
    const apiOrigin = new URL(environment.apiUrl, window.location.origin).origin;
    const requestOrigin = isAbsoluteUrl ? new URL(request.url).origin : window.location.origin;
    const isBackendRequest = requestOrigin === apiOrigin || request.url.startsWith(environment.apiUrl);
    const isExternalRequest = isAbsoluteUrl && !isBackendRequest;

    if (token && !isExternalRequest) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.authService.logout().subscribe(() => {
            this.router.navigate(['/auth/login']);
          });
        }
        return throwError(() => error);
      })
    );
  }
}
