import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AuthService } from '@core/services/auth.service';
import { ThemeService } from '@core/services/theme.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div [class.dark]="isDarkMode" class="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center px-4">
      <div class="w-full max-w-md rounded-2xl border p-6 shadow-lg"
           [ngClass]="isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'">
        <div class="mb-6">
          <h1 class="text-2xl font-bold" [ngClass]="isDarkMode ? 'text-white' : 'text-slate-900'">
            Nueva contraseña
          </h1>
          <p class="text-sm mt-1" [ngClass]="isDarkMode ? 'text-slate-400' : 'text-slate-600'">
            Ingresa y confirma tu nueva contraseña.
          </p>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1" [ngClass]="isDarkMode ? 'text-slate-300' : 'text-slate-700'">
              Nueva contraseña
            </label>
            <input
              [type]="showPass1 ? 'text' : 'password'"
              formControlName="nueva_contrasena"
              class="w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-500"
              [ngClass]="isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'" />
            <button type="button" class="text-xs mt-1 text-cyan-600" (click)="showPass1 = !showPass1">
              {{ showPass1 ? 'Ocultar' : 'Mostrar' }}
            </button>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1" [ngClass]="isDarkMode ? 'text-slate-300' : 'text-slate-700'">
              Confirmar contraseña
            </label>
            <input
              [type]="showPass2 ? 'text' : 'password'"
              formControlName="confirmar_contrasena"
              class="w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-500"
              [ngClass]="isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'" />
            <button type="button" class="text-xs mt-1 text-cyan-600" (click)="showPass2 = !showPass2">
              {{ showPass2 ? 'Ocultar' : 'Mostrar' }}
            </button>
          </div>

          <p class="text-xs text-red-500" *ngIf="passwordMismatch">
            Las contraseñas no coinciden.
          </p>

          <button
            type="submit"
            [disabled]="form.invalid || loading || !token || passwordMismatch"
            class="w-full rounded-xl bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white font-semibold py-3 transition">
            {{ loading ? 'Actualizando...' : 'Actualizar contraseña' }}
          </button>
        </form>

        <div *ngIf="message" class="mt-4 p-3 rounded-xl text-sm"
             [ngClass]="messageType === 'ok'
                ? (isDarkMode ? 'bg-emerald-900 text-emerald-200' : 'bg-emerald-100 text-emerald-800')
                : (isDarkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800')">
          {{ message }}
        </div>

        <div class="mt-5 text-center">
          <a routerLink="/auth/login" class="text-sm font-medium text-cyan-600 hover:text-cyan-700">
            Ir a iniciar sesión
          </a>
        </div>
      </div>
    </div>
  `
})
export class ResetPasswordComponent implements OnInit, OnDestroy {
  form: FormGroup;
  loading = false;
  isDarkMode = false;
  message = '';
  messageType: 'ok' | 'error' = 'ok';
  token = '';
  showPass1 = false;
  showPass2 = false;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private themeService: ThemeService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.form = this.fb.group({
      nueva_contrasena: ['', [Validators.required, Validators.minLength(8)]],
      confirmar_contrasena: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  get passwordMismatch(): boolean {
    const pass = this.form.get('nueva_contrasena')?.value;
    const confirm = this.form.get('confirmar_contrasena')?.value;
    return !!pass && !!confirm && pass !== confirm;
  }

  ngOnInit(): void {
    this.themeService.darkMode$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isDark) => (this.isDarkMode = isDark));

    this.route.queryParamMap
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        this.token = params.get('token') || '';
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSubmit(): void {
    if (this.form.invalid || this.loading || !this.token || this.passwordMismatch) {
      return;
    }

    this.loading = true;
    this.message = '';

    this.authService
      .resetPassword({
        token: this.token,
        nueva_contrasena: this.form.value.nueva_contrasena,
        confirmar_contrasena: this.form.value.confirmar_contrasena,
      })
      .subscribe({
        next: (res: any) => {
          this.loading = false;
          this.messageType = 'ok';
          this.message = res?.mensaje || 'Contraseña actualizada correctamente.';
          setTimeout(() => this.router.navigate(['/auth/login']), 1300);
        },
        error: (err) => {
          this.loading = false;
          this.messageType = 'error';
          this.message = err?.error?.detail || 'No se pudo actualizar la contraseña.';
        },
      });
  }
}

