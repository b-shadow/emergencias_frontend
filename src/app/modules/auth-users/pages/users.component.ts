import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '@core/services/user.service';
import { AuthService } from '@core/services/auth.service';
import { Usuario, RolUsuario } from '@core/models/user.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="px-6 py-4">
      <!-- Header -->
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-4xl font-bold bg-gradient-to-r from-sky-600 to-cyan-600 dark:from-sky-400 dark:to-cyan-400 text-transparent bg-clip-text mb-2">
            👥 Gestionar Usuarios
          </h1>
          <p class="text-gray-600 dark:text-slate-400">Administra usuarios del sistema - crear, editar y gestionar roles</p>
        </div>
        <button
          (click)="toggleCreateForm()"
          type="button"
          class="px-6 py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 shadow-lg shadow-sky-500/30 hover:shadow-sky-600/40 transition-all duration-300 hover:scale-105 active:scale-95 whitespace-nowrap"
        >
          <span class="text-lg">➕</span> Nuevo Usuario
        </button>
      </div>

      <!-- Create Form -->
      <div
        *ngIf="showCreateForm"
        class="mb-6 p-6 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-lg shadow-lg border border-sky-200 dark:border-slate-700"
      >
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">Crear Nuevo Usuario</h2>
        <form [formGroup]="createUserForm" (ngSubmit)="onSubmitCreateUser()">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <!-- Email -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">📧 Correo Electrónico</label>
              <input
                type="email"
                formControlName="correo"
                class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                placeholder="usuario@email.com"
              />
              <div
                *ngIf="createUserForm.get('correo')?.hasError('required') && createUserForm.get('correo')?.touched"
                class="text-red-500 text-sm mt-1"
              >
                El correo es requerido
              </div>
            </div>

            <!-- Password -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">🔐 Contraseña</label>
              <input
                type="password"
                formControlName="contrasena"
                class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                placeholder="Mínimo 8 caracteres"
              />
              <div
                *ngIf="createUserForm.get('contrasena')?.hasError('required') && createUserForm.get('contrasena')?.touched"
                class="text-red-500 text-sm mt-1"
              >
                La contraseña es requerida
              </div>
            </div>

            <!-- Full Name -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">👤 Nombre Completo</label>
              <input
                type="text"
                formControlName="nombre_completo"
                class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                placeholder="Juan Pérez"
              />
              <div
                *ngIf="createUserForm.get('nombre_completo')?.hasError('required') && createUserForm.get('nombre_completo')?.touched"
                class="text-red-500 text-sm mt-1"
              >
                El nombre completo es requerido
              </div>
            </div>

            <!-- Role -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">🎯 Rol</label>
              <select
                formControlName="rol"
                class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              >
                <option value="">Selecciona un rol</option>
                <option [value]="RolUsuario.CLIENTE">Cliente</option>
                <option [value]="RolUsuario.TALLER">Taller</option>
                <option [value]="RolUsuario.ADMINISTRADOR">Administrador</option>
              </select>
              <div
                *ngIf="createUserForm.get('rol')?.hasError('required') && createUserForm.get('rol')?.touched"
                class="text-red-500 text-sm mt-1"
              >
                El rol es requerido
              </div>
            </div>
          </div>

          <!-- Form Actions -->
          <div class="flex gap-3">
            <button
              type="submit"
              [disabled]="!createUserForm.valid || isCreatingUser"
              class="px-6 py-2 rounded-lg font-semibold text-white bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              {{ isCreatingUser ? '⏳ Creando...' : '✅ Crear Usuario' }}
            </button>
            <button
              type="button"
              (click)="toggleCreateForm()"
              class="px-6 py-2 rounded-lg font-semibold text-gray-700 dark:text-slate-300 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 transition-all duration-300"
            >
              ✖️ Cancelar
            </button>
          </div>

          <!-- Error Message -->
          <div
            *ngIf="createUserError"
            class="mt-4 p-4 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
          >
            ⚠️ {{ createUserError }}
          </div>
        </form>
      </div>

      <!-- Success Message -->
      <div
        *ngIf="successMessage"
        class="mb-6 p-4 rounded-lg bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 animate-pulse"
      >
        ✅ {{ successMessage }}
      </div>

      <!-- Loading -->
      <div *ngIf="isLoading" class="text-center py-12">
        <div class="inline-block space-y-2">
          <div class="text-4xl">⏳</div>
          <p class="text-gray-600 dark:text-slate-400 font-semibold">Cargando usuarios...</p>
        </div>
      </div>

      <!-- Users Table -->
      <div
        *ngIf="!isLoading"
        class="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 overflow-hidden"
      >
        <!-- Table Header -->
        <div *ngIf="usuarios.length > 0" class="min-h-[200px]">
          <!-- Desktop Table -->
          <div class="hidden md:block overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gradient-to-r from-sky-50 to-cyan-50 dark:from-sky-900/30 dark:to-cyan-900/30 border-b border-gray-200 dark:border-slate-700">
                <tr>
                  <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-slate-300">Correo</th>
                  <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-slate-300">Nombre</th>
                  <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-slate-300">Rol</th>
                  <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-slate-300">Estado</th>
                  <th class="px-6 py-3 text-center text-sm font-semibold text-gray-700 dark:text-slate-300">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  *ngFor="let usuario of usuarios"
                  class="border-b border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition"
                >
                  <td class="px-6 py-4 text-sm text-gray-900 dark:text-white font-medium">{{ usuario.correo }}</td>
                  <td class="px-6 py-4 text-sm text-gray-700 dark:text-slate-300">{{ usuario.nombre_completo }}</td>
                  <td class="px-6 py-4 text-sm">
                    <span
                      [ngClass]="{
                        'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300': usuario.rol === RolUsuario.CLIENTE,
                        'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300': usuario.rol === RolUsuario.TALLER,
                        'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300': usuario.rol === RolUsuario.ADMINISTRADOR
                      }"
                      class="px-3 py-1 rounded-full text-xs font-bold"
                    >
                      {{ usuario.rol }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-sm">
                    <span
                      [ngClass]="usuario.es_activo ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'"
                      class="px-3 py-1 rounded-full text-xs font-bold"
                    >
                      {{ usuario.es_activo ? '✅ Activo' : '❌ Inactivo' }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-sm">
                    <div class="flex gap-2 justify-center">
                      <button
                        *ngIf="usuario.id_usuario !== currentUserId"
                        (click)="openChangeRoleModal(usuario)"
                        class="px-3 py-1 rounded-lg bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300 hover:bg-sky-200 dark:hover:bg-sky-900 font-semibold text-xs transition"
                        title="Cambiar rol"
                      >
                        🔄 Rol
                      </button>
                      <button
                        *ngIf="usuario.id_usuario !== currentUserId"
                        (click)="openDeleteConfirm(usuario)"
                        class="px-3 py-1 rounded-lg bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900 font-semibold text-xs transition"
                        title="Eliminar usuario"
                      >
                        🗑️ Eliminar
                      </button>
                      <span
                        *ngIf="usuario.id_usuario === currentUserId"
                        class="px-3 py-1 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400 text-xs"
                      >
                        👤 Eres tú
                      </span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Mobile Card View -->
          <div class="md:hidden space-y-3 p-4">
            <div
              *ngFor="let usuario of usuarios"
              class="p-4 rounded-lg bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600"
            >
              <div class="flex justify-between items-start mb-3">
                <div>
                  <p class="font-semibold text-gray-900 dark:text-white">{{ usuario.nombre_completo }}</p>
                  <p class="text-xs text-gray-600 dark:text-slate-400">{{ usuario.correo }}</p>
                </div>
                <span
                  [ngClass]="{
                    'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300': usuario.rol === RolUsuario.CLIENTE,
                    'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300': usuario.rol === RolUsuario.TALLER,
                    'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300': usuario.rol === RolUsuario.ADMINISTRADOR
                  }"
                  class="px-2 py-1 rounded-full text-xs font-bold"
                >
                  {{ usuario.rol }}
                </span>
              </div>
              <div class="flex gap-2">
                <button
                  *ngIf="usuario.id_usuario !== currentUserId"
                  (click)="openChangeRoleModal(usuario)"
                  class="flex-1 px-3 py-2 rounded-lg bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300 font-semibold text-xs transition"
                >
                  🔄 Rol
                </button>
                <button
                  *ngIf="usuario.id_usuario !== currentUserId"
                  (click)="openDeleteConfirm(usuario)"
                  class="flex-1 px-3 py-2 rounded-lg bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 font-semibold text-xs transition"
                >
                  🗑️ Eliminar
                </button>
                <span
                  *ngIf="usuario.id_usuario === currentUserId"
                  class="flex-1 px-3 py-2 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400 text-xs flex items-center justify-center font-semibold"
                >
                  👤 Eres tú
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="!isLoading && usuarios.length === 0" class="py-12 text-center">
          <div class="text-5xl mb-4">👥</div>
          <p class="text-gray-600 dark:text-slate-400 font-semibold mb-2">No hay usuarios registrados</p>
          <p class="text-sm text-gray-500 dark:text-slate-500">Crea un nuevo usuario para empezar</p>
        </div>
      </div>
    </div>

    <!-- Change Role Modal -->
    <div
      *ngIf="showChangeRoleModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      (click)="closeChangeRoleModal()"
    >
      <div
        class="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 max-w-sm w-full"
        (click)="$event.stopPropagation()"
      >
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">Cambiar Rol</h2>
        <p class="text-gray-600 dark:text-slate-400 mb-4">Usuario: <span class="font-semibold">{{ selectedUser?.nombre_completo }}</span></p>
        <p class="text-gray-600 dark:text-slate-400 mb-6">Rol actual: <span class="font-bold text-purple-600 dark:text-purple-400">{{ selectedUser?.rol }}</span></p>

        <select
          [(ngModel)]="selectedNewRole"
          class="w-full mb-6 px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
        >
          <option value="">Selecciona un nuevo rol</option>
          <option [value]="RolUsuario.CLIENTE" *ngIf="selectedUser?.rol !== RolUsuario.CLIENTE">Cliente</option>
          <option [value]="RolUsuario.TALLER" *ngIf="selectedUser?.rol !== RolUsuario.TALLER">Taller</option>
          <option [value]="RolUsuario.ADMINISTRADOR" *ngIf="selectedUser?.rol !== RolUsuario.ADMINISTRADOR">Administrador</option>
        </select>

        <div *ngIf="changeRoleError" class="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 mb-4 text-sm">
          ⚠️ {{ changeRoleError }}
        </div>

        <div class="flex gap-3">
          <button
            (click)="submitChangeRole()"
            [disabled]="!selectedNewRole || isChangingRole"
            class="flex-1 px-4 py-2 rounded-lg font-semibold text-white bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {{ isChangingRole ? '⏳ Cambiando...' : '✅ Cambiar' }}
          </button>
          <button
            (click)="closeChangeRoleModal()"
            class="flex-1 px-4 py-2 rounded-lg font-semibold text-gray-700 dark:text-slate-300 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 transition-all"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div
      *ngIf="showDeleteConfirm"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      (click)="closeDeleteConfirm()"
    >
      <div
        class="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 max-w-sm w-full"
        (click)="$event.stopPropagation()"
      >
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">⚠️ Eliminar Usuario</h2>
        <p class="text-gray-600 dark:text-slate-400 mb-2">¿Estás seguro de que deseas eliminar a:</p>
        <p class="text-lg font-semibold text-red-600 dark:text-red-400 mb-6">{{ selectedUser?.nombre_completo }}</p>

        <div *ngIf="deleteError" class="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 mb-4 text-sm">
          ⚠️ {{ deleteError }}
        </div>

        <div class="flex gap-3">
          <button
            (click)="submitDelete()"
            [disabled]="isDeletingUser"
            class="flex-1 px-4 py-2 rounded-lg font-semibold text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {{ isDeletingUser ? '⏳ Eliminando...' : '🗑️ Eliminar' }}
          </button>
          <button
            (click)="closeDeleteConfirm()"
            class="flex-1 px-4 py-2 rounded-lg font-semibold text-gray-700 dark:text-slate-300 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 transition-all"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  `
})
export class UsersComponent implements OnInit, OnDestroy {
  usuarios: Usuario[] = [];
  isLoading = false;
  isCreatingUser = false;
  isChangingRole = false;
  isDeletingUser = false;
  showCreateForm = false;
  showChangeRoleModal = false;
  showDeleteConfirm = false;

  createUserError = '';
  successMessage = '';
  changeRoleError = '';
  deleteError = '';

  selectedUser: Usuario | null = null;
  selectedNewRole: RolUsuario | '' = '';
  currentUserId: string | null = null;

  createUserForm: FormGroup;
  RolUsuario = RolUsuario;

  private destroy$ = new Subject<void>();

  constructor(
    private userService: UserService,
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    this.createUserForm = this.formBuilder.group({
      correo: ['', [Validators.required, Validators.email]],
      contrasena: ['', [Validators.required, Validators.minLength(8)]],
      nombre_completo: ['', [Validators.required]],
      rol: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // Obtener ID del usuario actual
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.currentUserId = currentUser.id_usuario;
    }

    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadUsers(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    this.userService
      .listUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (usuarios) => {
          this.usuarios = usuarios;
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('❌ Error loading users:', error);
          this.isLoading = false;
          this.cdr.markForCheck();
        }
      });
  }

  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    this.createUserError = '';
    if (!this.showCreateForm) {
      this.createUserForm.reset();
    }
  }

  onSubmitCreateUser(): void {
    if (!this.createUserForm.valid) {
      return;
    }

    this.isCreatingUser = true;
    this.createUserError = '';
    this.successMessage = '';
    this.cdr.markForCheck();

    this.userService
      .createUser(this.createUserForm.value)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (usuario) => {
          this.usuarios.unshift(usuario);
          this.isCreatingUser = false;
          this.successMessage = `✅ Usuario ${usuario.nombre_completo} creado exitosamente`;
          this.createUserForm.reset();
          this.showCreateForm = false;
          this.cdr.markForCheck();

          // Clear success message after 3 seconds
          setTimeout(() => {
            this.successMessage = '';
            this.cdr.markForCheck();
          }, 3000);
        },
        error: (error) => {
          this.isCreatingUser = false;
          this.createUserError = error.error?.detail || 'Error al crear usuario';
          this.cdr.markForCheck();
        }
      });
  }

  openChangeRoleModal(usuario: Usuario): void {
    this.selectedUser = usuario;
    this.selectedNewRole = '';
    this.changeRoleError = '';
    this.showChangeRoleModal = true;
  }

  closeChangeRoleModal(): void {
    this.showChangeRoleModal = false;
    this.selectedUser = null;
    this.selectedNewRole = '';
    this.changeRoleError = '';
  }

  submitChangeRole(): void {
    if (!this.selectedUser || !this.selectedNewRole) {
      return;
    }

    this.isChangingRole = true;
    this.changeRoleError = '';
    this.cdr.markForCheck();

    this.userService
      .changeUserRole(this.selectedUser.id_usuario, this.selectedNewRole)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (usuarioActualizado) => {
          const index = this.usuarios.findIndex(u => u.id_usuario === usuarioActualizado.id_usuario);
          if (index >= 0) {
            this.usuarios[index] = usuarioActualizado;
          }
          this.isChangingRole = false;
          this.successMessage = `✅ Rol de ${usuarioActualizado.nombre_completo} actualizado a ${usuarioActualizado.rol}`;
          this.closeChangeRoleModal();
          this.cdr.markForCheck();

          // Clear success message after 3 seconds
          setTimeout(() => {
            this.successMessage = '';
            this.cdr.markForCheck();
          }, 3000);
        },
        error: (error) => {
          this.isChangingRole = false;
          this.changeRoleError = error.error?.detail || 'Error al cambiar rol';
          this.cdr.markForCheck();
        }
      });
  }

  openDeleteConfirm(usuario: Usuario): void {
    this.selectedUser = usuario;
    this.deleteError = '';
    this.showDeleteConfirm = true;
  }

  closeDeleteConfirm(): void {
    this.showDeleteConfirm = false;
    this.selectedUser = null;
    this.deleteError = '';
  }

  submitDelete(): void {
    if (!this.selectedUser) {
      return;
    }

    this.isDeletingUser = true;
    this.deleteError = '';
    this.cdr.markForCheck();

    this.userService
      .deleteUser(this.selectedUser.id_usuario)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.usuarios = this.usuarios.filter(u => u.id_usuario !== this.selectedUser!.id_usuario);
          this.isDeletingUser = false;
          this.successMessage = `✅ Usuario ${this.selectedUser!.nombre_completo} eliminado exitosamente`;
          this.closeDeleteConfirm();
          this.cdr.markForCheck();

          // Clear success message after 3 seconds
          setTimeout(() => {
            this.successMessage = '';
            this.cdr.markForCheck();
          }, 3000);
        },
        error: (error) => {
          this.isDeletingUser = false;
          this.deleteError = error.error?.detail || 'Error al eliminar usuario';
          this.cdr.markForCheck();
        }
      });
  }
}

