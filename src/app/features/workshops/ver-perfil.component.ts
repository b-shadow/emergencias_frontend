import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { WorkshopService } from '@core/services/workshop.service';
import { TallerPerfil } from '@core/models/workshop.model';
import { LocationViewComponent } from '@shared/components/location-view.component';

@Component({
  selector: 'app-ver-perfil',
  standalone: true,
  imports: [CommonModule, RouterModule, LocationViewComponent],
  template: `
    <div class="px-6 py-4">
      <!-- Header -->
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Mi Perfil de Taller</h1>
        <button
          *ngIf="taller"
          routerLink="/workshops/edit"
          class="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition"
        >
          Editar Perfil
        </button>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="flex justify-center items-center p-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>

      <!-- Error State -->
      <div
        *ngIf="error && !loading"
        class="p-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded"
      >
        <p class="font-semibold">Error al cargar el perfil</p>
        <p class="text-sm">{{ error }}</p>
        <button
          (click)="loadProfile()"
          class="mt-3 bg-red-700 hover:bg-red-800 text-white py-2 px-4 rounded text-sm"
        >
          Reintentar
        </button>
      </div>

      <!-- Profile Content -->
      <div *ngIf="taller && !loading" class="space-y-6">
        <!-- Status Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p class="text-sm text-blue-600 dark:text-blue-300 font-semibold">Estado de Aprobación</p>
            <p class="text-lg font-bold mt-2">
              <span
                [ngClass]="{
                  'text-green-600 dark:text-green-400': taller.estado_aprobacion === 'APROBADO',
                  'text-yellow-600 dark:text-yellow-400': taller.estado_aprobacion === 'PENDIENTE',
                  'text-red-600 dark:text-red-400': taller.estado_aprobacion === 'RECHAZADO'
                }"
              >
                {{ taller.estado_aprobacion }}
              </span>
            </p>
          </div>

          <div class="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p class="text-sm text-green-600 dark:text-green-300 font-semibold">Estado Operativo</p>
            <p class="text-lg font-bold mt-2">
              <span
                [ngClass]="{
                  'text-green-600 dark:text-green-400': taller.estado_operativo === 'DISPONIBLE',
                  'text-orange-600 dark:text-orange-400': taller.estado_operativo === 'NO_DISPONIBLE',
                  'text-red-600 dark:text-red-400': taller.estado_operativo === 'SUSPENDIDO'
                }"
              >
                {{ taller.estado_operativo }}
              </span>
            </p>
          </div>
        </div>

        <!-- Main Profile Card -->
        <div class="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 p-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Nombre Taller -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">Nombre del Taller</label>
              <p class="text-gray-900 dark:text-white text-lg">{{ taller.nombre_taller }}</p>
            </div>

            <!-- Email -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">Correo</label>
              <p class="text-gray-900 dark:text-white text-lg">{{ taller.correo }}</p>
            </div>

            <!-- Razón Social -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">Razón Social</label>
              <p class="text-gray-900 dark:text-white text-lg">{{ taller.razon_social || 'No especificada' }}</p>
            </div>

            <!-- NIT -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">NIT</label>
              <p class="text-gray-900 dark:text-white text-lg">{{ taller.nit || 'No especificado' }}</p>
            </div>

            <!-- Teléfono -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">Teléfono</label>
              <p class="text-gray-900 dark:text-white text-lg">{{ taller.telefono || 'No especificado' }}</p>
            </div>

            <!-- Dirección -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">Dirección</label>
              <p class="text-gray-900 dark:text-white text-lg">{{ taller.direccion || 'No especificada' }}</p>
            </div>

            <!-- Latitud -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">Latitud</label>
              <p class="text-gray-900 dark:text-white text-lg">{{ taller.latitud || 'No especificada' }}</p>
            </div>

            <!-- Longitud -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">Longitud</label>
              <p class="text-gray-900 dark:text-white text-lg">{{ taller.longitud || 'No especificada' }}</p>
            </div>

            <!-- Descripción (Full Width) -->
            <div class="md:col-span-2">
              <label class="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">Descripción</label>
              <p class="text-gray-900 dark:text-white text-lg">
                {{ taller.descripcion || 'No especificada' }}
              </p>
            </div>

            <!-- Fechas (Full Width) -->
            <div class="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-gray-200 dark:border-slate-700 pt-6">
              <div>
                <label class="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">Fecha de Registro</label>
                <p class="text-gray-600 dark:text-slate-400">{{ taller.fecha_registro | date: 'dd/MM/yyyy HH:mm' }}</p>
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">Fecha de Aprobación</label>
                <p class="text-gray-600 dark:text-slate-400">
                  {{ taller.fecha_aprobacion ? (taller.fecha_aprobacion | date: 'dd/MM/yyyy HH:mm') : 'Pendiente' }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Location Map -->
        <app-location-view
          *ngIf="taller && taller.latitud && taller.longitud"
          [latitud]="taller.latitud"
          [longitud]="taller.longitud"
          [mapHeight]="380"
        ></app-location-view>

        <!-- Info Message -->
        <div
          *ngIf="taller.estado_aprobacion !== 'APROBADO'"
          class="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200 rounded-lg"
        >
          <p class="font-semibold">Nota</p>
          <p class="text-sm mt-1">
            Tu taller no está aprobado aún. Algunas funciones estarán limitadas hasta que sea aprobado por un administrador.
          </p>
        </div>
      </div>
    </div>
  `
})
export class VerPerfilComponent implements OnInit, OnDestroy {
  taller: TallerPerfil | null = null;
  loading = true;
  error: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(private workshopService: WorkshopService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadProfile(): void {
    this.loading = true;
    this.error = null;

    this.workshopService
      .getMyProfile()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.taller = data;
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.loading = false;
          this.error = err.error?.detail || 'Error al cargar el perfil del taller';
          this.cdr.markForCheck();
          console.error('Error loading workshop profile:', err);
        }
      });
  }
}
