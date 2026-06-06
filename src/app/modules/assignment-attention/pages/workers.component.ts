import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { NotificationComponent } from '@shared/components/notification.component';
import {
  TrabajadorItem,
  TrabajadoresService,
} from '@modules/assignment-attention/services/trabajadores.service';

@Component({
  selector: 'app-workers',
  standalone: true,
  imports: [CommonModule, FormsModule, NotificationComponent],
  template: `
    <div class="px-6 py-5 space-y-6">
      <app-notification
        [type]="notificationType"
        [title]="notificationTitle"
        [message]="notificationMessage"
        [isVisible]="showNotification"
        (close)="onNotificationClose()"
      ></app-notification>

      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div class="flex items-start gap-4">
          <div class="h-16 w-16 rounded-2xl bg-gradient-to-br from-cyan-100 to-sky-100 border border-sky-200/70 text-sky-600 flex items-center justify-center text-3xl">
            👥
          </div>
          <div>
            <h1 class="text-5xl font-black tracking-tight text-slate-900 dark:text-white">Trabajadores</h1>
            <p class="text-2xl md:text-lg text-slate-600 dark:text-slate-400 mt-1">Gestiona el equipo de recojo de tu taller</p>
            <p *ngIf="tenantLabel" class="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-xl bg-sky-50 text-sky-700 text-sm border border-sky-100">
              🏬 Tenant: {{ tenantLabel }}
            </p>
          </div>
        </div>

        <button
          (click)="cargar()"
          class="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-700 hover:to-sky-700 text-white font-semibold shadow"
        >
          + Actualizar datos
        </button>
      </div>

      <section class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
        <div class="flex items-start gap-4 mb-5">
          <div class="h-14 w-14 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center text-2xl">🧑‍🔧</div>
          <div>
            <h2 class="text-4xl md:text-3xl font-black text-slate-900 dark:text-white">Nuevo trabajador</h2>
            <p class="text-slate-600 dark:text-slate-400 mt-1">Completa los datos para agregar un nuevo miembro al equipo.</p>
          </div>
        </div>

        <div class="border-t border-slate-200 dark:border-slate-700 pt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <label class="block">
            <span class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Nombre completo</span>
            <input [(ngModel)]="form.nombre_completo" placeholder="Ej. Juan Pérez García" class="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
          </label>

          <label class="block">
            <span class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Correo electrónico</span>
            <input [(ngModel)]="form.correo" placeholder="Ej. juan@correo.com" autocomplete="off" autocapitalize="off" spellcheck="false" name="worker_email_create" class="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
          </label>

          <label class="block">
            <span class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Contraseña</span>
            <input [(ngModel)]="form.contrasena" type="password" placeholder="Mínimo 6 caracteres" autocomplete="new-password" autocapitalize="off" spellcheck="false" name="worker_password_create" class="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
          </label>

          <label class="block">
            <span class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Teléfono</span>
            <input [(ngModel)]="form.telefono" placeholder="Ej. 987 654 321" class="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
          </label>

          <label class="block md:col-span-1">
            <span class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Licencia</span>
            <input [(ngModel)]="form.licencia_conducir" placeholder="Ej. A1, A2B, AIIIC" class="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
          </label>
        </div>

        <div class="mt-6">
          <button (click)="crear()" [disabled]="guardando" class="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-700 hover:to-sky-700 disabled:opacity-60 text-white font-semibold">
            {{ guardando ? 'Guardando...' : 'Crear trabajador' }}
          </button>
        </div>
      </section>

      <section class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-5">
          <div class="flex items-start gap-4">
            <div class="h-14 w-14 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center text-2xl">📋</div>
            <div>
              <h2 class="text-4xl md:text-3xl font-black text-slate-900 dark:text-white">Listado de trabajadores</h2>
              <p class="text-slate-600 dark:text-slate-400 mt-1">Consulta y administra los trabajadores registrados.</p>
            </div>
          </div>

          <div class="flex gap-3 w-full lg:w-auto">
            <input [(ngModel)]="filtro" placeholder="Buscar por nombre o correo..." class="w-full lg:w-96 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
            <button class="px-5 py-3 rounded-xl border border-slate-300 text-sky-700 bg-sky-50 hover:bg-sky-100 font-semibold">Filtros</button>
          </div>
        </div>

        <div *ngIf="cargando" class="text-sm text-slate-500 dark:text-slate-400">Cargando...</div>
        <div *ngIf="!cargando && trabajadoresFiltrados.length === 0" class="text-sm text-slate-500 dark:text-slate-400">Aún no tienes trabajadores registrados.</div>

        <div *ngIf="!cargando && trabajadoresFiltrados.length > 0" class="space-y-3">
          <article *ngFor="let t of trabajadoresFiltrados" class="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <div class="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
              <div class="flex items-center gap-4 min-w-0">
                <div class="h-16 w-16 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-2xl font-bold shrink-0">
                  {{ getInitials(t.nombre_completo) }}
                </div>
                <div class="min-w-0">
                  <div class="text-3xl md:text-2xl font-black text-slate-900 dark:text-white truncate">{{ t.nombre_completo || 'Sin nombre' }}</div>
                  <div class="text-slate-600 dark:text-slate-400 truncate">{{ t.correo || '-' }}</div>
                  <div class="text-slate-600 dark:text-slate-400">📞 {{ t.telefono || '-' }}</div>
                </div>
              </div>

              <div class="flex-1 xl:border-l xl:border-slate-200 xl:pl-6">
                <div class="text-sm text-slate-500">Licencia</div>
                <div class="text-slate-900 dark:text-white font-semibold">{{ t.licencia_conducir || '-' }}</div>
                <span class="inline-flex mt-2 px-3 py-1 rounded-full text-xs font-semibold"
                  [ngClass]="t.es_activo ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'">
                  {{ t.es_activo ? 'Activo' : 'Inactivo' }}
                </span>
              </div>

              <div class="flex items-center gap-2">
                <button (click)="abrirModalEdicion(t)" class="px-4 py-2 rounded-xl border border-sky-300 text-sky-700 bg-white hover:bg-sky-50 text-sm font-semibold">Editar</button>
                <button (click)="cambiarEstado(t)" class="px-4 py-2 rounded-xl text-sm font-semibold"
                  [ngClass]="t.es_activo ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'">
                  {{ t.es_activo ? 'Desactivar' : 'Activar' }}
                </button>
              </div>
            </div>
          </article>

          <div class="pt-4 mt-2 border-t border-slate-200 dark:border-slate-700 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-slate-600 dark:text-slate-400">
            <span>Mostrando {{ trabajadoresFiltrados.length }} de {{ trabajadores.length }} trabajador(es)</span>
            <div class="flex items-center gap-2">
              <button class="h-10 w-10 rounded-xl border border-slate-300 text-slate-600">‹</button>
              <button class="h-10 w-10 rounded-xl bg-sky-600 text-white font-semibold">1</button>
              <button class="h-10 w-10 rounded-xl border border-slate-300 text-slate-600">›</button>
            </div>
            <button class="px-4 py-2 rounded-xl border border-slate-300 bg-white dark:bg-slate-700">10 por página</button>
          </div>
        </div>
      </section>

      <div *ngIf="mostrarModalEdicion" class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div class="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Editar trabajador</h3>
            <button (click)="cerrarModalEdicion()" class="text-slate-500 dark:text-slate-400 text-xl">x</button>
          </div>
          <div class="grid grid-cols-1 gap-3">
            <input [(ngModel)]="editForm.nombre_completo" placeholder="Nombre completo" class="px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
            <input [(ngModel)]="editForm.telefono" placeholder="Telefono" class="px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
            <input [(ngModel)]="editForm.licencia_conducir" placeholder="Licencia" class="px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
          </div>
          <div class="mt-4 flex justify-end gap-2">
            <button (click)="cerrarModalEdicion()" class="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-600 text-slate-900 dark:text-white">Cancelar</button>
            <button (click)="guardarEdicion()" [disabled]="guardandoEdicion" class="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-700 hover:to-sky-700 text-white disabled:opacity-60">
              {{ guardandoEdicion ? 'Guardando...' : 'Guardar' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class WorkersComponent implements OnInit {
  trabajadores: TrabajadorItem[] = [];
  cargando = true;
  guardando = false;
  tenantLabel = '';
  showNotification = false;
  notificationType: 'success' | 'error' | 'info' | 'warning' = 'info';
  notificationTitle = '';
  notificationMessage = '';

  form = {
    nombre_completo: '',
    correo: '',
    contrasena: '',
    telefono: '',
    licencia_conducir: '',
  };
  filtro = '';
  mostrarModalEdicion = false;
  guardandoEdicion = false;
  trabajadorEditando: TrabajadorItem | null = null;
  editForm = {
    nombre_completo: '',
    telefono: '',
    licencia_conducir: '',
  };

  constructor(private trabajadoresService: TrabajadoresService) {}

  ngOnInit(): void {
    this.trabajadoresService.getMiTenant().subscribe({
      next: (ctx) => {
        this.tenantLabel = ctx?.slug_tenant || ctx?.nombre_tenant || '';
      },
      error: () => {
        this.tenantLabel = '';
      },
    });
    queueMicrotask(() => this.cargar());
  }

  get trabajadoresFiltrados(): TrabajadorItem[] {
    const term = this.filtro.trim().toLowerCase();
    if (!term) return this.trabajadores;
    return this.trabajadores.filter((t) =>
      (t.nombre_completo || '').toLowerCase().includes(term) ||
      (t.correo || '').toLowerCase().includes(term)
    );
  }

  getInitials(nombre?: string | null): string {
    const parts = (nombre || '').trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'TR';
    return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
  }

  cargar(): void {
    this.cargando = true;
    this.trabajadoresService.listarTrabajadores().subscribe({
      next: (data) => {
        this.trabajadores = data || [];
        this.cargando = false;
      },
      error: () => {
        this.showToast('error', 'Error', 'No se pudo cargar el listado de trabajadores');
        this.cargando = false;
      },
    });
  }

  abrirModalEdicion(t: TrabajadorItem): void {
    this.trabajadorEditando = t;
    this.editForm = {
      nombre_completo: t.nombre_completo || '',
      telefono: t.telefono || '',
      licencia_conducir: t.licencia_conducir || '',
    };
    this.mostrarModalEdicion = true;
  }

  cerrarModalEdicion(): void {
    this.mostrarModalEdicion = false;
    this.trabajadorEditando = null;
  }

  guardarEdicion(): void {
    if (!this.trabajadorEditando) return;
    if (!this.editForm.nombre_completo.trim()) {
      this.showToast('warning', 'Campo requerido', 'El nombre completo es obligatorio');
      return;
    }
    this.guardandoEdicion = true;
    this.trabajadoresService
      .actualizarTrabajador(this.trabajadorEditando.id_trabajador, {
        nombre_completo: this.editForm.nombre_completo.trim(),
        telefono: this.editForm.telefono || null,
        licencia_conducir: this.editForm.licencia_conducir || null,
      })
      .subscribe({
        next: () => {
          this.guardandoEdicion = false;
          this.mostrarModalEdicion = false;
          this.showToast('success', 'Actualizado', 'Datos del trabajador actualizados');
          this.cargar();
        },
        error: (err) => {
          this.guardandoEdicion = false;
          this.showToast('error', 'No se pudo actualizar', err?.error?.detail || 'Error al actualizar trabajador');
        },
      });
  }

  cambiarEstado(t: TrabajadorItem): void {
    this.trabajadoresService.cambiarEstadoTrabajador(t.id_trabajador, !t.es_activo).subscribe({
      next: () => {
        this.showToast('success', 'Estado actualizado', `Trabajador ${!t.es_activo ? 'activado' : 'desactivado'} correctamente`);
        this.cargar();
      },
      error: (err) => {
        this.showToast('error', 'No se pudo actualizar', err?.error?.detail || 'Error al cambiar estado');
      },
    });
  }

  crear(): void {
    if (!this.form.nombre_completo || !this.form.correo || !this.form.contrasena) {
      this.showToast('warning', 'Campos requeridos', 'Completa nombre, correo y contrasena');
      return;
    }
    this.guardando = true;
    this.trabajadoresService.crearTrabajador(this.form).subscribe({
      next: () => {
        this.guardando = false;
        this.showToast('success', 'Trabajador creado', 'El trabajador se creo correctamente');
        this.form = {
          nombre_completo: '',
          correo: '',
          contrasena: '',
          telefono: '',
          licencia_conducir: '',
        };
        this.cargar();
      },
      error: (err) => {
        this.guardando = false;
        this.showToast('error', 'No se pudo crear', err?.error?.detail || 'Error al crear trabajador');
      },
    });
  }

  onNotificationClose(): void {
    this.showNotification = false;
  }

  private showToast(
    type: 'success' | 'error' | 'info' | 'warning',
    title: string,
    message: string
  ): void {
    this.notificationType = type;
    this.notificationTitle = title;
    this.notificationMessage = message;
    this.showNotification = true;
  }
}


