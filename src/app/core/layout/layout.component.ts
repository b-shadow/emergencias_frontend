import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { ThemeService } from '@core/services/theme.service';
import { RolUsuario } from '@core/models/user.model';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    ConfirmDialogComponent
  ],
  template: `
    <div class="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <!-- Top Bar -->
      <div class="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 sticky top-0 z-40 h-16">
        <div class="h-16 px-4 flex items-center justify-between gap-4">
          <!-- Left: Menu Toggle -->
          <button
            (click)="toggleSidebar()"
            type="button"
            class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition text-xl"
            title="Abrir menú"
          >
            ☰
          </button>

          <!-- Center: Logo/Title + Workshop Name -->
          <div class="flex-1 text-center px-4">
            <h1 class="text-lg font-bold text-gray-900 dark:text-white">
              🚚 {{ workshopName }}
            </h1>
          </div>

          <!-- Right: Theme Toggle Button -->
          <button
            (click)="toggleTheme()"
            type="button"
            class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition text-xl"
            [title]="isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
          >
            {{ isDarkMode ? '☀️' : '🌙' }}
          </button>
        </div>
      </div>

      <!-- Main Content -->
      <div class="flex flex-1 overflow-hidden">
        <!-- Sidebar - Fixed Height with Logout at Bottom -->
        <div
          class="transition-all duration-300 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 flex flex-col fixed left-0 top-16 bottom-0 z-30"
          [style.width]="isSidebarOpen ? '256px' : '0px'"
          [style.overflow]="isSidebarOpen ? 'visible' : 'hidden'"
        >
          <!-- Nav Content with Scroll -->
          <nav class="flex-1 p-4 space-y-2 overflow-y-auto">
            <!-- Taller Section -->
            <div *ngIf="isTaller()">
              <h3 class="text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wider px-3 py-2">
                Taller
              </h3>
              <a routerLink="/dashboard" routerLinkActive="active" class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition" (click)="closeSidebarOnMobile()">
                <span class="text-lg">📊</span>
                <span>Dashboard</span>
              </a>

              <a routerLink="/emergency-requests" routerLinkActive="active" class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition" (click)="closeSidebarOnMobile()">
                <span class="text-lg">⚠️</span>
                <span>Solicitudes Compatibles</span>
              </a>

              <a routerLink="/applications" routerLinkActive="active" class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition" (click)="closeSidebarOnMobile()">
                <span class="text-lg">📮</span>
                <span>Mis Postulaciones</span>
              </a>

              <a routerLink="/assignments" routerLinkActive="active" class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition" (click)="closeSidebarOnMobile()">
                <span class="text-lg">🔧</span>
                <span>Atención Asignada</span>
              </a>

              <a routerLink="/estadisticas" routerLinkActive="active" class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition" (click)="closeSidebarOnMobile()">
                <span class="text-lg">📈</span>
                <span>Estadísticas</span>
              </a>

              <a routerLink="/workshops" routerLinkActive="active" class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition" (click)="closeSidebarOnMobile()">
                <span class="text-lg">🏢</span>
                <span>Mi Taller</span>
              </a>

              <a routerLink="/workshops/especialidades" routerLinkActive="active" class="flex items-center gap-3 px-3 py-2 pl-10 rounded-lg text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition" (click)="closeSidebarOnMobile()">
                <span class="text-lg">🔧</span>
                <span>Especialidades</span>
              </a>

              <a routerLink="/workshops/servicios" routerLinkActive="active" class="flex items-center gap-3 px-3 py-2 pl-10 rounded-lg text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition" (click)="closeSidebarOnMobile()">
                <span class="text-lg">🛠️</span>
                <span>Servicios</span>
              </a>
            </div>

            <!-- Admin Section -->
            <div *ngIf="isAdmin()">
              <h3 class="text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wider px-3 py-2">
                Administrador
              </h3>

              <a routerLink="/dashboard" routerLinkActive="active" class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition" (click)="closeSidebarOnMobile()">
                <span class="text-lg">📊</span>
                <span>Dashboard</span>
              </a>

              <a routerLink="/users" routerLinkActive="active" class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition" (click)="closeSidebarOnMobile()">
                <span class="text-lg">👥</span>
                <span>Usuarios</span>
              </a>

              <a routerLink="/workshops" routerLinkActive="active" class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition" (click)="closeSidebarOnMobile()">
                <span class="text-lg">🏭</span>
                <span>Talleres</span>
              </a>

              <a routerLink="/workshops-management" routerLinkActive="active" class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition" (click)="closeSidebarOnMobile()">
                <span class="text-lg">🏢</span>
                <span>Gestionar Talleres</span>
              </a>

              <a routerLink="/gestionar-especialidades" routerLinkActive="active" class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition" (click)="closeSidebarOnMobile()">
                <span class="text-lg">🏷️</span>
                <span>Especialidades</span>
              </a>

              <a routerLink="/gestionar-servicios" routerLinkActive="active" class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition" (click)="closeSidebarOnMobile()">
                <span class="text-lg">📦</span>
                <span>Servicios</span>
              </a>

              <a routerLink="/bitacora" routerLinkActive="active" class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition" (click)="closeSidebarOnMobile()">
                <span class="text-lg">📋</span>
                <span>Bitácora</span>
              </a>
            </div>

            <!-- Common Section -->
            <div class="border-t border-gray-200 dark:border-slate-700 pt-4">
              <a [routerLink]="notificationsRoute" routerLinkActive="active" class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition" (click)="closeSidebarOnMobile()">
                <span class="text-lg">🔔</span>
                <span>Notificaciones</span>
              </a>
            </div>
          </nav>

          <!-- Logout Button - Fixed at Bottom -->
          <div class="p-4 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex-shrink-0">
            <button
              (click)="logoutWithConfirm()"
              type="button"
              class="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg shadow-red-500/30 hover:shadow-red-600/40 transition-all duration-300 hover:scale-105 active:scale-95 whitespace-nowrap"
            >
              <span class="text-lg">🚪</span>
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>

        <!-- Content Area - Adjust margin when sidebar is open -->
        <div class="flex-1 overflow-auto" [style.margin-left]="isSidebarOpen ? '256px' : '0px'">
          <div class="p-6">
            <router-outlet></router-outlet>
          </div>
        </div>
      </div>

      <!-- Confirm Dialog -->
      <app-confirm-dialog
        [isOpen]="showLogoutDialog"
        title="Cerrar Sesión"
        message="¿Estás seguro de que deseas cerrar sesión?"
        confirmText="Cerrar Sesión"
        cancelText="Cancelar"
        [isDanger]="true"
        (confirm)="onLogoutConfirmed()"
        (cancel)="onLogoutCancelled()"
      ></app-confirm-dialog>
    </div>
  `
})
export class LayoutComponent implements OnInit {
  isSidebarOpen = true;
  showLogoutDialog = false;
  isDarkMode = false;
  workshopName = 'Taller Mecánico';

  isTaller = this.authService.isTaller.bind(this.authService);
  isAdmin = this.authService.isAdmin.bind(this.authService);

  get notificationsRoute(): string {
    return this.isAdmin() ? '/notifications/admin' : '/notifications';
  }

  constructor(
    private authService: AuthService,
    private themeService: ThemeService,
    private router: Router
  ) {
    // Initialize dark mode from service
    this.isDarkMode = this.themeService.isDarkMode();
  }

  ngOnInit(): void {
    // Get user information from localStorage and AuthService
    const storedUserName = localStorage.getItem('userName');
    const userRole = localStorage.getItem('userRole');
    const currentUser = this.authService.getCurrentUser();

    console.log('Stored User Name:', storedUserName);
    console.log('User Role:', userRole);
    console.log('Current User:', currentUser);

    // Try to get name from various sources
    if (storedUserName) {
      this.workshopName = storedUserName;
    } else if (currentUser?.nombre_completo) {
      this.workshopName = currentUser.nombre_completo;
    } else if (userRole === RolUsuario.ADMINISTRADOR) {
      this.workshopName = 'Panel Administrador';
    } else {
      this.workshopName = 'Mi Cuenta';
    }

    console.log('Final Workshop Name:', this.workshopName);

    // Subscribe to theme changes
    this.themeService.darkMode$.subscribe((isDark: boolean) => {
      this.isDarkMode = isDark;
      console.log('Theme changed to:', isDark ? 'Dark' : 'Light');
    });
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  toggleTheme(): void {
    this.themeService.toggleDarkMode();
  }

  closeSidebarOnMobile(): void {
    // Close sidebar on mobile devices after clicking a link
    if (window.innerWidth < 768) {
      this.isSidebarOpen = false;
    }
  }

  logoutWithConfirm(): void {
    this.showLogoutDialog = true;
  }

  onLogoutConfirmed(): void {
    this.showLogoutDialog = false;
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/auth/login']);
      },
      error: () => {
        this.router.navigate(['/auth/login']);
      }
    });
  }

  onLogoutCancelled(): void {
    this.showLogoutDialog = false;
  }
}
