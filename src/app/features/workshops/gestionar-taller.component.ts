import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { WorkshopService, TallerAdminListItem, TallerAdminDetail, TallerActionResponse } from '@core/services/workshop.service';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-gestionar-taller',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="px-6 py-4">
      <!-- Header -->
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 text-transparent bg-clip-text mb-2">
            🏢 Gestionar Talleres
          </h1>
          <p class="text-gray-600 dark:text-slate-400">Administra talleres registrados - aprobación, edición y control de estado</p>
        </div>
      </div>

      <!-- Búsqueda y Filtros en una línea -->
      <div class="mb-6 p-4 bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-slate-700">
        <div class="flex flex-col md:flex-row gap-4 items-end">
          <!-- Búsqueda General -->
          <div class="flex-1 min-w-0">
            <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">🔍 Buscar por Nombre, NIT o Correo</label>
            <input type="text" [(ngModel)]="busquedaGeneral" (ngModelChange)="onBusquedaChange($event)" placeholder="Escribe para buscar..." class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>

          <!-- Filtro Estado Aprobación -->
          <div class="w-full md:w-48">
            <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Estado Aprobación</label>
            <select [(ngModel)]="filtroEstadoAprobacion" (ngModelChange)="onFiltroChange($event)" class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="">Todos</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="APROBADO">Aprobado</option>
              <option value="RECHAZADO">Rechazado</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="cargando" class="text-center py-8 text-gray-500">
        ⏳ Cargando talleres...
      </div>

      <!-- Error -->
      <div *ngIf="error" class="mb-4 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg border border-red-300 dark:border-red-700">
        ❌ {{ error }}
      </div>

      <!-- Éxito -->
      <div *ngIf="mensajeExito" class="mb-4 p-4 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 rounded-lg border border-green-300 dark:border-green-700">
        ✅ {{ mensajeExito }}
      </div>

      <!-- Tabla de Talleres -->
      <div *ngIf="!cargando && talleres.length > 0" class="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-slate-700">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-100 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
              <tr>
                <th class="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Nombre Taller</th>
                <th class="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">NIT</th>
                <th class="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Correo</th>
                <th class="px-4 py-3 text-center font-semibold text-gray-900 dark:text-white">Aprobación</th>
                <th class="px-4 py-3 text-center font-semibold text-gray-900 dark:text-white">Estado</th>
                <th class="px-4 py-3 text-center font-semibold text-gray-900 dark:text-white">Usuario</th>
                <th class="px-4 py-3 text-center font-semibold text-gray-900 dark:text-white">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let taller of talleres" class="border-b border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                <td class="px-4 py-3 text-gray-900 dark:text-white font-medium">{{ taller.nombre_taller }}</td>
                <td class="px-4 py-3 text-gray-600 dark:text-slate-400">{{ taller.nit || '-' }}</td>
                <td class="px-4 py-3 text-gray-600 dark:text-slate-400">{{ taller.correo }}</td>
                <td class="px-4 py-3 text-center">
                  <span [ngClass]="getEstadoAprobacionClass(taller.estado_aprobacion)" class="px-3 py-1 rounded-full text-xs font-medium">
                    {{ taller.estado_aprobacion }}
                  </span>
                </td>
                <td class="px-4 py-3 text-center">
                  <span [ngClass]="getEstadoOperativoClass(taller.estado_operativo)" class="px-3 py-1 rounded-full text-xs font-medium">
                    {{ taller.estado_operativo }}
                  </span>
                </td>
                <td class="px-4 py-3 text-center">
                  <span [ngClass]="taller.es_activo ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300'" class="px-3 py-1 rounded-full text-xs font-medium">
                    {{ taller.es_activo ? '✅ Activo' : '❌ Inactivo' }}
                  </span>
                </td>
                <td class="px-4 py-3 text-center">
                  <div class="flex gap-1 justify-center flex-wrap">
                    <button (click)="abrirDetalle(taller.id_taller)" class="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-medium transition-colors">
                      👁️
                    </button>
                    <button
                      *ngIf="taller.estado_aprobacion === 'PENDIENTE'"
                      (click)="abrirModalAprobar(taller.id_taller)"
                      class="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-xs font-medium transition-colors">
                      ✅
                    </button>
                    <button
                      *ngIf="taller.estado_aprobacion === 'PENDIENTE'"
                      (click)="abrirModalRechazar(taller.id_taller)"
                      class="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-medium transition-colors">
                      ❌
                    </button>
                    <button
                      *ngIf="taller.estado_aprobacion === 'APROBADO' && (taller.estado_operativo === 'NO_DISPONIBLE' || taller.estado_operativo === 'SUSPENDIDO')"
                      (click)="habilitarTaller(taller.id_taller)"
                      class="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-xs font-medium transition-colors">
                      🔓
                    </button>
                    <button
                      *ngIf="taller.estado_aprobacion === 'APROBADO' && taller.estado_operativo === 'DISPONIBLE'"
                      (click)="deshabilitarTaller(taller.id_taller)"
                      class="px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded text-xs font-medium transition-colors">
                      🔒
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Sin resultados -->
      <div *ngIf="!cargando && talleres.length === 0" class="text-center py-12 text-gray-500 dark:text-slate-400">
        📭 No hay talleres que coincidan con los filtros
      </div>

      <!-- Modal Detalle -->
      <div *ngIf="mostrarModalDetalle" class="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4 z-50">
        <div class="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div class="p-6">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Detalle del Taller</h2>
              <button (click)="mostrarModalDetalle = false" class="text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-white text-2xl">×</button>
            </div>

            <div *ngIf="tallerDetalle" class="space-y-4">
              <!-- Formulario de edición -->
              <form [formGroup]="formEditarTaller" (ngSubmit)="guardarCambios()" class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Nombre Taller</label>
                    <input type="text" formControlName="nombre_taller" class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white" />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Razón Social</label>
                    <input type="text" formControlName="razon_social" class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white" />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">NIT</label>
                    <input type="text" formControlName="nit" class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white" />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Teléfono</label>
                    <input type="text" formControlName="telefono" class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white" />
                  </div>
                  <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Dirección</label>
                    <input type="text" formControlName="direccion" class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white" />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Latitud</label>
                    <input type="number" formControlName="latitud" step="0.000001" class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white" />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Longitud</label>
                    <input type="number" formControlName="longitud" step="0.000001" class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white" />
                  </div>
                  <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Descripción</label>
                    <textarea formControlName="descripcion" rows="3" class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"></textarea>
                  </div>
                </div>

                <div class="flex gap-2 justify-end">
                  <button type="button" (click)="mostrarModalDetalle = false" class="px-4 py-2 bg-gray-300 dark:bg-slate-600 hover:bg-gray-400 dark:hover:bg-slate-500 text-gray-900 dark:text-white rounded-lg font-medium transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors">
                    💾 Guardar Cambios
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Rechazar -->
      <div *ngIf="mostrarModalRechazar" class="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4 z-50">
        <div class="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full">
          <div class="p-6">
            <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">Rechazar Taller</h2>
            <p class="text-gray-600 dark:text-slate-400 mb-4">¿Está seguro de que desea rechazar este taller? Puede ingresar un motivo (opcional).</p>

            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Motivo del Rechazo</label>
              <textarea
                [(ngModel)]="motivoRechazo"
                rows="3"
                placeholder="Ingrese motivo..."
                class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent">
              </textarea>
            </div>

            <div class="flex gap-2 justify-end">
              <button (click)="mostrarModalRechazar = false" class="px-4 py-2 bg-gray-300 dark:bg-slate-600 hover:bg-gray-400 dark:hover:bg-slate-500 text-gray-900 dark:text-white rounded-lg font-medium transition-colors">
                Cancelar
              </button>
              <button (click)="confirmarRechazo()" class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors">
                ❌ Rechazar
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Aprobar -->
      <div *ngIf="mostrarModalAprobar" class="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4 z-50">
        <div class="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full">
          <div class="p-6">
            <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">Aprobar Taller</h2>
            <p class="text-gray-600 dark:text-slate-400 mb-6">¿Está seguro de que desea aprobar este taller? Se activará el usuario y el taller podrá operar.</p>

            <div class="flex gap-2 justify-end">
              <button (click)="mostrarModalAprobar = false" class="px-4 py-2 bg-gray-300 dark:bg-slate-600 hover:bg-gray-400 dark:hover:bg-slate-500 text-gray-900 dark:text-white rounded-lg font-medium transition-colors">
                Cancelar
              </button>
              <button (click)="confirmarAprobar()" class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors">
                ✅ Aprobar
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Habilitar -->
      <div *ngIf="mostrarModalHabilitar" class="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4 z-50">
        <div class="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full">
          <div class="p-6">
            <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">Habilitar Taller</h2>
            <p class="text-gray-600 dark:text-slate-400 mb-6">¿Está seguro de que desea habilitar este taller? Podrá participar en solicitudes de emergencia.</p>

            <div class="flex gap-2 justify-end">
              <button (click)="mostrarModalHabilitar = false" class="px-4 py-2 bg-gray-300 dark:bg-slate-600 hover:bg-gray-400 dark:hover:bg-slate-500 text-gray-900 dark:text-white rounded-lg font-medium transition-colors">
                Cancelar
              </button>
              <button (click)="confirmarHabilitacion()" class="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors">
                🔓 Habilitar
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Deshabilitar -->
      <div *ngIf="mostrarModalDeshabilitar" class="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4 z-50">
        <div class="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full">
          <div class="p-6">
            <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">Deshabilitar Taller</h2>
            <p class="text-gray-600 dark:text-slate-400 mb-6">¿Está seguro de que desea deshabilitar este taller? Continuará siendo accesible bajo el estado SUSPENDIDO.</p>

            <div class="flex gap-2 justify-end">
              <button (click)="mostrarModalDeshabilitar = false" class="px-4 py-2 bg-gray-300 dark:bg-slate-600 hover:bg-gray-400 dark:hover:bg-slate-500 text-gray-900 dark:text-white rounded-lg font-medium transition-colors">
                Cancelar
              </button>
              <button (click)="confirmarDeshabilitacion()" class="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors">
                🔒 Deshabilitar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class GestionarTallerComponent implements OnInit, OnDestroy {
  // Data
  talleres: TallerAdminListItem[] = [];
  tallerDetalle: TallerAdminDetail | null = null;

  // Loading & Messages
  cargando = false;
  error: string | null = null;
  mensajeExito: string | null = null;

  // Filters
  busquedaGeneral: string = '';
  filtroEstadoAprobacion: string = '';

  // Subjects para búsqueda en tiempo real
  private busqueda$ = new Subject<string>();
  private filtro$ = new Subject<string>();

  // Modals
  mostrarModalDetalle = false;
  mostrarModalRechazar = false;
  mostrarModalAprobar = false;
  mostrarModalHabilitar = false;
  mostrarModalDeshabilitar = false;
  tallerId: string | null = null;

  // Form
  formEditarTaller: FormGroup;
  motivoRechazo: string = '';

  private destroy$ = new Subject<void>();

  constructor(
    private workshopService: WorkshopService,
    private fb: FormBuilder
  ) {
    this.formEditarTaller = this.fb.group({
      nombre_taller: [''],
      razon_social: [''],
      nit: [''],
      telefono: [''],
      direccion: [''],
      latitud: [''],
      longitud: [''],
      descripcion: ['']
    });
  }

  ngOnInit(): void {
    // Búsqueda en tiempo real con debounce
    this.busqueda$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.cargarTalleres();
      });

    // Filtro cambia inmediatamente
    this.filtro$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.cargarTalleres();
      });

    // Carga inicial
    this.cargarTalleres();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarTalleres(): void {
    this.cargando = true;
    this.error = null;
    this.mensajeExito = null;

    this.workshopService
      .listTalleresAdmin(
        this.filtroEstadoAprobacion || null,
        null, // sin filtro por estado operativo
        null, // sin filtro por es_activo
        this.busquedaGeneral || null, // búsqueda por nombre
        this.busquedaGeneral || null, // búsqueda por nit
        this.busquedaGeneral || null  // búsqueda por correo
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.talleres = data;
          this.cargando = false;
        },
        error: (err) => {
          this.error = err.error?.detail || 'Error al cargar talleres';
          this.cargando = false;
        }
      });
  }

  limpiarFiltros(): void {
    this.busquedaGeneral = '';
    this.filtroEstadoAprobacion = '';
    this.cargarTalleres();
  }

  onBusquedaChange(valor: string): void {
    this.busquedaGeneral = valor;
    this.busqueda$.next(valor);
  }

  onFiltroChange(valor: string): void {
    this.filtroEstadoAprobacion = valor;
    this.filtro$.next(valor);
  }

  abrirDetalle(tallerId: string): void {
    this.workshopService
      .getTallerAdminDetail(tallerId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (taller) => {
          this.tallerDetalle = taller;
          this.formEditarTaller.patchValue({
            nombre_taller: taller.nombre_taller,
            razon_social: taller.razon_social,
            nit: taller.nit,
            telefono: taller.telefono,
            direccion: taller.direccion,
            latitud: taller.latitud,
            longitud: taller.longitud,
            descripcion: taller.descripcion
          });
          this.mostrarModalDetalle = true;
        },
        error: (err) => {
          this.error = 'Error al cargar detalle del taller';
        }
      });
  }

  guardarCambios(): void {
    if (!this.tallerDetalle) return;

    this.workshopService
      .updateTallerAdmin(this.tallerDetalle.id_taller, this.formEditarTaller.value)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.mensajeExito = '✅ Cambios guardados correctamente';
          this.mostrarModalDetalle = false;
          this.cargarTalleres();
          setTimeout(() => this.mensajeExito = null, 3000);
        },
        error: (err) => {
          this.error = err.error?.detail || 'Error al guardar cambios';
        }
      });
  }

  abrirModalAprobar(tallerId: string): void {
    this.tallerId = tallerId;
    this.mostrarModalAprobar = true;
  }

  confirmarAprobar(): void {
    if (!this.tallerId) return;

    this.workshopService
      .aprobarTaller(this.tallerId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.mensajeExito = '✅ Taller aprobado correctamente';
          this.mostrarModalAprobar = false;
          this.cargarTalleres();
          setTimeout(() => this.mensajeExito = null, 3000);
        },
        error: (err) => {
          this.error = err.error?.detail || 'Error al aprobar taller';
        }
      });
  }

  abrirModalRechazar(tallerId: string): void {
    this.tallerId = tallerId;
    this.motivoRechazo = '';
    this.mostrarModalRechazar = true;
  }

  confirmarRechazo(): void {
    if (!this.tallerId) return;

    this.workshopService
      .rechazarTaller(this.tallerId, this.motivoRechazo || undefined)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.mensajeExito = '✅ Taller rechazado correctamente';
          this.mostrarModalRechazar = false;
          this.cargarTalleres();
          setTimeout(() => this.mensajeExito = null, 3000);
        },
        error: (err) => {
          this.error = err.error?.detail || 'Error al rechazar taller';
        }
      });
  }

  habilitarTaller(tallerId: string): void {
    this.tallerId = tallerId;
    this.mostrarModalHabilitar = true;
  }

  confirmarHabilitacion(): void {
    if (!this.tallerId) return;

    this.workshopService
      .habilitarTaller(this.tallerId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.mensajeExito = '✅ Taller habilitado correctamente';
          this.mostrarModalHabilitar = false;
          this.cargarTalleres();
          setTimeout(() => this.mensajeExito = null, 3000);
        },
        error: (err) => {
          this.error = err.error?.detail || 'Error al habilitar taller';
        }
      });
  }

  deshabilitarTaller(tallerId: string): void {
    this.tallerId = tallerId;
    this.mostrarModalDeshabilitar = true;
  }

  confirmarDeshabilitacion(): void {
    if (!this.tallerId) return;

    this.workshopService
      .deshabilitarTaller(this.tallerId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.mensajeExito = '✅ Taller deshabilitado correctamente';
          this.mostrarModalDeshabilitar = false;
          this.cargarTalleres();
          setTimeout(() => this.mensajeExito = null, 3000);
        },
        error: (err) => {
          this.error = err.error?.detail || 'Error al deshabilitar taller';
        }
      });
  }

  getEstadoAprobacionClass(estado: string): string {
    switch (estado) {
      case 'APROBADO':
        return 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200';
      case 'RECHAZADO':
        return 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200';
      case 'PENDIENTE':
      default:
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-200';
    }
  }

  getEstadoOperativoClass(estado: string): string {
    switch (estado) {
      case 'DISPONIBLE':
        return 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200';
      case 'SUSPENDIDO':
        return 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-200';
      case 'NO_DISPONIBLE':
      default:
        return 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200';
    }
  }
}
