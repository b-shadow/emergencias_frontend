import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { WorkshopService } from '@core/services/workshop.service';
import { ThemeService } from '@core/services/theme.service';
import { TallerPerfil, TallerPerfilUpdate } from '@core/models/workshop.model';
import { LocationPickerMapComponent, LocationSelection } from '@shared/components/location-picker-map.component';

@Component({
  selector: 'app-editar-perfil',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, LocationPickerMapComponent],
  template: `
    <div [class.dark]="isDarkMode" class="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-sky-50 to-cyan-50 text-slate-900 transition-colors duration-300 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 dark:text-white">
      <!-- FONDO CON BLOBS AZULES/CELESTES -->
      <div class="pointer-events-none absolute inset-0 overflow-hidden">
        <div class="absolute left-[-120px] top-[-120px] h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl dark:bg-cyan-500/20"></div>
        <div class="absolute right-[-120px] top-[120px] h-80 w-80 rounded-full bg-sky-400/20 blur-3xl dark:bg-sky-500/20"></div>
        <div class="absolute bottom-[-120px] left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-blue-400/10 blur-3xl dark:bg-blue-500/10"></div>
      </div>

      <!-- CONTENIDO -->
      <main class="relative z-10 min-h-screen px-4 py-8 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-3xl">
          <!-- Header con Título -->
          <div class="mb-8 text-center">
            <h1 class="text-4xl font-black tracking-tight">
              <span class="bg-gradient-to-r from-sky-500 via-cyan-500 to-blue-500 bg-clip-text text-transparent">
                Editar Perfil
              </span>
            </h1>
            <p class="mt-2 text-lg" [class]="isDarkMode ? 'text-slate-400' : 'text-slate-600'">
              Actualiza la información de tu taller
            </p>
          </div>

          <!-- Alert: Success -->
          <div
            *ngIf="successMessage"
            class="mb-6 overflow-hidden rounded-2xl border shadow-lg backdrop-blur-2xl"
            [class]="isDarkMode ? 'border-green-500/30 bg-green-500/10' : 'border-green-300/60 bg-green-50/80'"
          >
            <div class="px-6 py-4 flex items-center gap-3">
              <span class="text-3xl">✓</span>
              <div>
                <p class="font-bold" [class]="isDarkMode ? 'text-green-400' : 'text-green-700'">
                  ¡Listo!
                </p>
                <p class="text-sm" [class]="isDarkMode ? 'text-green-300' : 'text-green-600'">
                  {{ successMessage }}
                </p>
              </div>
            </div>
          </div>

          <!-- Alert: Error -->
          <div
            *ngIf="error"
            class="mb-6 overflow-hidden rounded-2xl border shadow-lg backdrop-blur-2xl"
            [class]="isDarkMode ? 'border-red-500/30 bg-red-500/10' : 'border-red-300/60 bg-red-50/80'"
          >
            <div class="px-6 py-4 flex items-center gap-3">
              <span class="text-3xl">⚠</span>
              <div>
                <p class="font-bold" [class]="isDarkMode ? 'text-red-400' : 'text-red-700'">
                  Error
                </p>
                <p class="text-sm" [class]="isDarkMode ? 'text-red-300' : 'text-red-600'">
                  {{ error }}
                </p>
              </div>
            </div>
          </div>

          <!-- Alert: Not Approved -->
          <div
            *ngIf="!isApproved && !loading"
            class="mb-6 overflow-hidden rounded-2xl border shadow-lg backdrop-blur-2xl"
            [class]="isDarkMode ? 'border-blue-500/30 bg-blue-500/10' : 'border-blue-300/60 bg-blue-50/80'"
          >
            <div class="px-6 py-4 flex items-center gap-3">
              <span class="text-3xl">🔒</span>
              <div>
                <p class="font-bold" [class]="isDarkMode ? 'text-blue-400' : 'text-blue-700'">
                  Taller no aprobado
                </p>
                <p class="text-sm" [class]="isDarkMode ? 'text-blue-300' : 'text-blue-600'">
                  Tu taller no está aprobado aún. Contacta al administrador para más información.
                </p>
              </div>
            </div>
          </div>

          <!-- FORM CARD -->
          <div class="overflow-hidden rounded-3xl border shadow-2xl backdrop-blur-2xl transition-all duration-300 hover:shadow-3xl" [class]="isDarkMode ? 'border-white/15 bg-gradient-to-br from-white/8 to-white/5' : 'border-white/80 bg-gradient-to-br from-white/95 via-white/90 to-white/85 shadow-[0_20px_60px_rgba(15,23,42,0.12)]'">
            <!-- HEADER CARD -->
            <div class="relative overflow-hidden border-b bg-gradient-to-br from-sky-600 via-cyan-600 to-blue-600 px-8 py-10 text-white" [class]="isDarkMode ? 'border-white/10' : 'border-white/40'">
              <div class="absolute -right-20 -top-16 h-40 w-40 rounded-full bg-white/15 blur-3xl"></div>
              <div class="absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-white/10 blur-2xl"></div>
              <div class="relative z-10">
                <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-white/20 text-4xl shadow-lg backdrop-blur">
                  🔧
                </div>
                <h2 class="text-3xl font-black tracking-tight">Información Técnica</h2>
                <p class="mt-2 text-white/90 font-medium">Detalles generales de tu taller</p>
              </div>
            </div>

            <!-- FORM BODY -->
            <form
              *ngIf="editForm"
              [formGroup]="editForm"
              (ngSubmit)="onSubmit()"
              class="p-8"
            >
              <div class="space-y-6">
                <!-- Row 1: Nombre y Razón Social -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <!-- Nombre del Taller -->
                  <div>
                    <label for="nombre_taller" class="block text-sm font-semibold mb-2.5" [class]="isDarkMode ? 'text-slate-300' : 'text-slate-700'">
                      🏢 Nombre del Taller *
                    </label>
                    <input
                      id="nombre_taller"
                      type="text"
                      formControlName="nombre_taller"
                      placeholder="Mi Taller Automotriz"
                      class="w-full px-5 py-3.5 border-2 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 font-medium"
                      [class]="isDarkMode ? 'bg-white/10 border-white/20 text-white placeholder-slate-400 focus:bg-white/15' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-500 focus:bg-cyan-50'"
                      [disabled]="!isApproved"
                    />
                    <p
                      *ngIf="editForm.get('nombre_taller')?.invalid && editForm.get('nombre_taller')?.touched"
                      class="text-red-500 text-xs mt-2 font-medium"
                    >
                      El nombre debe tener entre 2 y 255 caracteres
                    </p>
                  </div>

                  <!-- Razón Social -->
                  <div>
                    <label for="razon_social" class="block text-sm font-semibold mb-2.5" [class]="isDarkMode ? 'text-slate-300' : 'text-slate-700'">
                      📋 Razón Social
                    </label>
                    <input
                      id="razon_social"
                      type="text"
                      formControlName="razon_social"
                      placeholder="Razón social registrada"
                      class="w-full px-5 py-3.5 border-2 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 font-medium"
                      [class]="isDarkMode ? 'bg-white/10 border-white/20 text-white placeholder-slate-400 focus:bg-white/15' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-500 focus:bg-cyan-50'"
                      [disabled]="!isApproved"
                    />
                  </div>
                </div>

                <!-- Row 2: NIT y Teléfono -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <!-- NIT -->
                  <div>
                    <label for="nit" class="block text-sm font-semibold mb-2.5" [class]="isDarkMode ? 'text-slate-300' : 'text-slate-700'">
                      🔢 NIT
                    </label>
                    <input
                      id="nit"
                      type="text"
                      formControlName="nit"
                      placeholder="Número de identificación"
                      class="w-full px-5 py-3.5 border-2 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 font-medium"
                      [class]="isDarkMode ? 'bg-white/10 border-white/20 text-white placeholder-slate-400 focus:bg-white/15' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-500 focus:bg-cyan-50'"
                      [disabled]="!isApproved"
                    />
                  </div>

                  <!-- Teléfono -->
                  <div>
                    <label for="telefono" class="block text-sm font-semibold mb-2.5" [class]="isDarkMode ? 'text-slate-300' : 'text-slate-700'">
                      📱 Teléfono
                    </label>
                    <input
                      id="telefono"
                      type="tel"
                      formControlName="telefono"
                      placeholder="+57 310 123 4567"
                      class="w-full px-5 py-3.5 border-2 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 font-medium"
                      [class]="isDarkMode ? 'bg-white/10 border-white/20 text-white placeholder-slate-400 focus:bg-white/15' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-500 focus:bg-cyan-50'"
                      [disabled]="!isApproved"
                    />
                  </div>
                </div>

                <!-- Row 3: Dirección (Full Width) -->
                <div>
                  <label for="direccion" class="block text-sm font-semibold mb-2.5" [class]="isDarkMode ? 'text-slate-300' : 'text-slate-700'">
                    📍 Dirección
                  </label>
                  <input
                    id="direccion"
                    type="text"
                    formControlName="direccion"
                    placeholder="Calle, número, ciudad"
                    class="w-full px-5 py-3.5 border-2 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 font-medium"
                    [class]="isDarkMode ? 'bg-white/10 border-white/20 text-white placeholder-slate-400 focus:bg-white/15' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-500 focus:bg-cyan-50'"
                    [disabled]="!isApproved"
                  />
                </div>

                <!-- Row 4: Latitud y Longitud -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <!-- Latitud -->
                  <div>
                    <label for="latitud" class="block text-sm font-semibold mb-2.5" [class]="isDarkMode ? 'text-slate-300' : 'text-slate-700'">
                      🗺️ Latitud
                    </label>
                    <input
                      id="latitud"
                      type="number"
                      step="0.00001"
                      formControlName="latitud"
                      placeholder="4.7110"
                      class="w-full px-5 py-3.5 border-2 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 font-medium"
                      [class]="isDarkMode ? 'bg-white/10 border-white/20 text-white placeholder-slate-400 focus:bg-white/15' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-500 focus:bg-cyan-50'"
                      [disabled]="!isApproved"
                    />
                  </div>

                  <!-- Longitud -->
                  <div>
                    <label for="longitud" class="block text-sm font-semibold mb-2.5" [class]="isDarkMode ? 'text-slate-300' : 'text-slate-700'">
                      🧭 Longitud
                    </label>
                    <input
                      id="longitud"
                      type="number"
                      step="0.00001"
                      formControlName="longitud"
                      placeholder="-74.0721"
                      class="w-full px-5 py-3.5 border-2 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 font-medium"
                      [class]="isDarkMode ? 'bg-white/10 border-white/20 text-white placeholder-slate-400 focus:bg-white/15' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-500 focus:bg-cyan-50'"
                      [disabled]="!isApproved"
                    />
                  </div>
                </div>

                <!-- Row 5: Descripción (Full Width) -->
                <div>
                  <label for="descripcion" class="block text-sm font-semibold mb-2.5" [class]="isDarkMode ? 'text-slate-300' : 'text-slate-700'">
                    ✍️ Descripción
                  </label>
                  <textarea
                    id="descripcion"
                    formControlName="descripcion"
                    rows="4"
                    placeholder="Cuéntanos sobre tu taller, especialidades y servicios..."
                    class="w-full px-5 py-3.5 border-2 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 font-medium resize-none"
                    [class]="isDarkMode ? 'bg-white/10 border-white/20 text-white placeholder-slate-400 focus:bg-white/15' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-500 focus:bg-cyan-50'"
                    [disabled]="!isApproved"
                  ></textarea>
                </div>

                <!-- LOCATION PICKER MAP -->
                <div *ngIf="isApproved" class="md:col-span-2">
                  <label class="block text-sm font-semibold mb-2.5" [class]="isDarkMode ? 'text-slate-300' : 'text-slate-700'">
                    🗺️ Ubicación del Taller
                  </label>
                  <app-location-picker-map
                    [mapHeight]="350"
                    (locationSelected)="onLocationSelected($event)"
                  ></app-location-picker-map>
                </div>
              </div>

              <!-- BOTONES -->
              <div class="mt-8 flex gap-4 border-t pt-6" [class]="isDarkMode ? 'border-white/10' : 'border-slate-200'">
                <button
                  type="submit"
                  [disabled]="!editForm.valid || !isApproved || saving"
                  class="flex-1 rounded-2xl bg-gradient-to-r from-sky-600 via-cyan-600 to-blue-600 px-6 py-4 font-bold text-white shadow-lg shadow-cyan-500/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-cyan-500/40 disabled:opacity-60 disabled:scale-100 disabled:shadow-none active:scale-95 text-lg flex items-center justify-center gap-2"
                >
                  <span *ngIf="!saving" class="text-xl">💾</span>
                  <span *ngIf="saving" class="animate-spin">⏳</span>
                  {{ saving ? 'Guardando...' : 'Guardar Cambios' }}
                </button>
                <button
                  type="button"
                  (click)="onCancel()"
                  class="flex-1 rounded-2xl border-2 px-6 py-4 font-bold transition-all duration-300 hover:scale-[1.02] active:scale-95"
                  [class]="isDarkMode ? 'border-white/30 text-white hover:bg-white/10' : 'border-slate-300 text-slate-900 hover:bg-slate-100'"
                >
                  ❌ Cancelar
                </button>
              </div>
            </form>

            <!-- LOADING STATE -->
            <div *ngIf="loading" class="flex justify-center items-center p-20">
              <div class="flex flex-col items-center gap-4">
                <div class="animate-spin rounded-full h-16 w-16 border-4 border-sky-200 border-t-sky-600"></div>
                <p [class]="isDarkMode ? 'text-slate-300' : 'text-slate-600'" class="font-medium">
                  Cargando perfil...
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  `
})
export class EditarPerfilComponent implements OnInit, OnDestroy {
  editForm: FormGroup | null = null;
  loading = true;
  saving = false;
  error: string | null = null;
  successMessage: string | null = null;
  isApproved = false;
  isDarkMode = false;
  private destroy$ = new Subject<void>();

  constructor(
    private workshopService: WorkshopService,
    private themeService: ThemeService,
    private formBuilder: FormBuilder,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.themeService.darkMode$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isDark: boolean) => {
        this.isDarkMode = isDark;
      });
    this.loadProfileData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadProfileData(): void {
    this.loading = true;
    this.error = null;

    this.workshopService
      .getMyProfile()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (profile) => {
          this.isApproved = profile.estado_aprobacion === 'APROBADO';
          this.initializeForm(profile);
          this.loading = false;
        },
        error: (err) => {
          this.loading = false;
          this.error = err.error?.detail || 'Error al cargar el perfil del taller';
          console.error('Error loading profile:', err);
        }
      });
  }

  private initializeForm(profile: TallerPerfil): void {
    this.editForm = this.formBuilder.group({
      nombre_taller: [
        profile.nombre_taller || '',
        [Validators.required, Validators.minLength(2), Validators.maxLength(255)]
      ],
      razon_social: [profile.razon_social || '', [Validators.maxLength(255)]],
      nit: [profile.nit || '', [Validators.maxLength(50)]],
      telefono: [profile.telefono || '', [Validators.maxLength(30)]],
      direccion: [profile.direccion || '', [Validators.maxLength(500)]],
      latitud: [profile.latitud || null],
      longitud: [profile.longitud || null],
      descripcion: [profile.descripcion || '', [Validators.maxLength(1000)]]
    });
  }

  onSubmit(): void {
    if (!this.editForm || !this.editForm.valid || !this.isApproved) {
      return;
    }

    this.saving = true;
    this.error = null;
    this.successMessage = null;

    const updateData: TallerPerfilUpdate = this.editForm.getRawValue();

    this.workshopService
      .updateMyProfile(updateData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.saving = false;
          this.successMessage = 'Perfil actualizado correctamente';

          // Redirigir después de 2 segundos
          setTimeout(() => {
            this.router.navigate(['/workshops/profile']);
          }, 2000);
        },
        error: (err) => {
          this.saving = false;
          this.error = err.error?.detail || 'Error al actualizar el perfil del taller';
          console.error('Error updating profile:', err);
        }
      });
  }

  onLocationSelected(location: LocationSelection): void {
    if (this.editForm && location) {
      this.editForm.patchValue({
        latitud: location.latitud,
        longitud: location.longitud
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/workshops/profile']);
  }
}
