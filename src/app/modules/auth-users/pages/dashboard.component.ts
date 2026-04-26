import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { RolUsuario } from '@core/models/user.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 transition-colors duration-300">
      <!-- HEADER -->
      <div class="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-40 transition-colors duration-300">
        <div class="max-w-7xl mx-auto px-6 py-4">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-3xl font-black bg-gradient-to-r from-sky-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent">
                {{ isTaller ? 'Panel del Taller' : 'Panel de Administración' }}
              </h1>
              <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Bienvenido, <span class="font-bold text-slate-900 dark:text-white">{{ userName }}</span>
              </p>
            </div>
            <span class="px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-sky-100 to-cyan-100 dark:from-sky-900/30 dark:to-cyan-900/30 text-sky-800 dark:text-cyan-300 border border-sky-300 dark:border-sky-700">
              👤 {{ userRole }}
            </span>
          </div>
        </div>
      </div>

      <!-- MAIN CONTENT -->
      <div class="max-w-7xl mx-auto px-6 py-8">
        <!-- BLOQUE PRINCIPAL -->
        <div class="mb-12 p-8 rounded-2xl bg-gradient-to-br from-sky-50 to-cyan-50 dark:from-sky-900/20 dark:to-cyan-900/20 border border-sky-200 dark:border-sky-800/50">
          <div class="flex items-start gap-4">
            <span class="text-4xl mt-1">{{ isTaller ? '🔧' : '⚙️' }}</span>
            <div>
              <h2 class="text-2xl font-bold text-sky-900 dark:text-cyan-100 mb-2">
                {{ isTaller ? 'Gestión del Taller' : 'Administración del Sistema' }}
              </h2>
              <p class="text-sky-800 dark:text-cyan-200 leading-relaxed">
                {{ isTaller
                  ? 'Panel del Taller - Desde este espacio puedes gestionar la información de tu taller, configurar tus especialidades y servicios, revisar oportunidades de atención, dar seguimiento a emergencias asignadas y consultar notificaciones y estadísticas de tu actividad.'
                  : 'Panel de Administración - Desde este espacio puedes gestionar usuarios, talleres, especialidades y servicios, así como supervisar notificaciones, bitácora y reportes generales del sistema.'
                }}
              </p>
            </div>
          </div>
        </div>

        <!-- SECCIONES DISPONIBLES -->
        <div class="mb-12">
          <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-6">Secciones Disponibles</h3>

          <!-- TALLER SECTIONS -->
          <div *ngIf="isTaller" class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- Mi Taller -->
            <div
              routerLink="/workshops/profile"
              class="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 cursor-pointer">
              <div class="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-cyan-500/5 group-hover:from-blue-500/10 group-hover:to-cyan-500/10 transition-all"></div>
              <div class="relative z-10">
                <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/40 mb-4 group-hover:scale-110 transition-transform">
                  <span class="text-2xl">🏢</span>
                </div>
                <h4 class="text-lg font-bold text-slate-900 dark:text-white mb-2">Mi Taller</h4>
                <p class="text-sm text-slate-600 dark:text-slate-300">
                  Administra información general, especialidades y servicios
                </p>
              </div>
            </div>

            <!-- Atención de Emergencias -->
            <div
              routerLink="/emergency-requests"
              class="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 cursor-pointer">
              <div class="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-orange-500/5 group-hover:from-red-500/10 group-hover:to-orange-500/10 transition-all"></div>
              <div class="relative z-10">
                <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/40 mb-4 group-hover:scale-110 transition-transform">
                  <span class="text-2xl">🚨</span>
                </div>
                <h4 class="text-lg font-bold text-slate-900 dark:text-white mb-2">Atención de Emergencias</h4>
                <p class="text-sm text-slate-600 dark:text-slate-300">
                  Solicitudes, postulaciones, asignaciones y resultados
                </p>
              </div>
            </div>

            <!-- Seguimiento -->
            <div
              routerLink="/estadisticas"
              class="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 cursor-pointer">
              <div class="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-emerald-500/5 group-hover:from-green-500/10 group-hover:to-emerald-500/10 transition-all"></div>
              <div class="relative z-10">
                <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/40 mb-4 group-hover:scale-110 transition-transform">
                  <span class="text-2xl">📊</span>
                </div>
                <h4 class="text-lg font-bold text-slate-900 dark:text-white mb-2">Seguimiento</h4>
                <p class="text-sm text-slate-600 dark:text-slate-300">
                  Notificaciones y estadísticas de tu actividad
                </p>
              </div>
            </div>
          </div>

          <!-- ADMIN SECTIONS -->
          <div *ngIf="!isTaller" class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Administración -->
            <div class="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 shadow-lg hover:shadow-2xl transition-all duration-300">
              <div class="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5 group-hover:from-purple-500/10 group-hover:to-pink-500/10 transition-all"></div>
              <div class="relative z-10">
                <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/40 mb-4">
                  <span class="text-2xl">⚙️</span>
                </div>
                <h4 class="text-lg font-bold text-slate-900 dark:text-white mb-4">Administración</h4>
                <div class="space-y-2">
                  <a routerLink="/users" class="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
                    <span class="text-lg">👥</span>
                    <span class="text-sm font-medium">Usuarios y Roles</span>
                  </a>
                  <a routerLink="/workshops-management" class="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
                    <span class="text-lg">🏢</span>
                    <span class="text-sm font-medium">Gestión de Talleres</span>
                  </a>
                  <a routerLink="/gestionar-especialidades" class="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
                    <span class="text-lg">🔧</span>
                    <span class="text-sm font-medium">Especialidades</span>
                  </a>
                  <a routerLink="/gestionar-servicios" class="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
                    <span class="text-lg">⚡</span>
                    <span class="text-sm font-medium">Servicios</span>
                  </a>
                </div>
              </div>
            </div>

            <!-- Supervisión -->
            <div class="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 shadow-lg hover:shadow-2xl transition-all duration-300">
              <div class="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-orange-500/5 group-hover:from-amber-500/10 group-hover:to-orange-500/10 transition-all"></div>
              <div class="relative z-10">
                <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/40 mb-4">
                  <span class="text-2xl">👁️</span>
                </div>
                <h4 class="text-lg font-bold text-slate-900 dark:text-white mb-4">Supervisión</h4>
                <div class="space-y-2">
                  <a routerLink="/notifications/admin" class="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
                    <span class="text-lg">🔔</span>
                    <span class="text-sm font-medium">Notificaciones</span>
                  </a>
                  <a routerLink="/bitacora" class="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
                    <span class="text-lg">📝</span>
                    <span class="text-sm font-medium">Bitácora</span>
                  </a>
                  <a routerLink="/estadisticas-sistema" class="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
                    <span class="text-lg">📊</span>
                    <span class="text-sm font-medium">Estadísticas</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- FLUJO RECOMENDADO -->
        <div class="p-8 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700">
          <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-6">Flujo Recomendado</h3>

          <div *ngIf="isTaller" class="space-y-4">
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm">1</div>
              <div>
                <h4 class="font-bold text-slate-900 dark:text-white">Completa la información de Mi Taller</h4>
                <p class="text-sm text-slate-600 dark:text-slate-400">Actualiza datos generales, ubicación y información de contacto</p>
              </div>
            </div>
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm">2</div>
              <div>
                <h4 class="font-bold text-slate-900 dark:text-white">Configura Especialidades y Servicios</h4>
                <p class="text-sm text-slate-600 dark:text-slate-400">Define qué especialidades ofreces y qué servicios puedes realizar</p>
              </div>
            </div>
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm">3</div>
              <div>
                <h4 class="font-bold text-slate-900 dark:text-white">Revisa Solicitudes Compatibles</h4>
                <p class="text-sm text-slate-600 dark:text-slate-400">Consulta y postúlate a emergencias que calces con tus capacidades</p>
              </div>
            </div>
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm">4</div>
              <div>
                <h4 class="font-bold text-slate-900 dark:text-white">Gestiona Postulaciones y Asignaciones Activas</h4>
                <p class="text-sm text-slate-600 dark:text-slate-400">Monitorea el estado de tus postulaciones y trabajos asignados</p>
              </div>
            </div>
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm">5</div>
              <div>
                <h4 class="font-bold text-slate-900 dark:text-white">Actualiza Estado y Registra Resultados</h4>
                <p class="text-sm text-slate-600 dark:text-slate-400">Documenta el resultado del servicio cuando sea completado</p>
              </div>
            </div>
          </div>

          <div *ngIf="!isTaller" class="space-y-4">
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold text-sm">1</div>
              <div>
                <h4 class="font-bold text-slate-900 dark:text-white">Revisa la Sección de Usuarios y Roles</h4>
                <p class="text-sm text-slate-600 dark:text-slate-400">Gestiona usuarios registrados, asigna roles y mantén la seguridad</p>
              </div>
            </div>
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold text-sm">2</div>
              <div>
                <h4 class="font-bold text-slate-900 dark:text-white">Supervisa la Gestión de Talleres</h4>
                <p class="text-sm text-slate-600 dark:text-slate-400">Revisa y aprueba nuevos talleres registrados en el sistema</p>
              </div>
            </div>
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold text-sm">3</div>
              <div>
                <h4 class="font-bold text-slate-900 dark:text-white">Mantén Actualizados Especialidades y Servicios</h4>
                <p class="text-sm text-slate-600 dark:text-slate-400">Crea y edita catálogos disponibles para los talleres</p>
              </div>
            </div>
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold text-sm">4</div>
              <div>
                <h4 class="font-bold text-slate-900 dark:text-white">Consulta Historial de Notificaciones y Bitácora</h4>
                <p class="text-sm text-slate-600 dark:text-slate-400">Revisa logs de eventos y actividades del sistema</p>
              </div>
            </div>
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold text-sm">5</div>
              <div>
                <h4 class="font-bold text-slate-900 dark:text-white">Revisa Estadísticas y Reportes</h4>
                <p class="text-sm text-slate-600 dark:text-slate-400">Analiza tendencias, incidentes frecuentes y rendimiento del sistema</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  userName: string = '';
  userRole: string = '';
  isTaller: boolean = false;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.userName = user.nombre_completo;
      this.userRole = user.rol;
      this.isTaller = user.rol === RolUsuario.TALLER;
    }
  }
}
