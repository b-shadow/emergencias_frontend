import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 transition-colors duration-300">
      <!-- HEADER -->
      <div class="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-40 transition-colors duration-300">
        <div class="max-w-7xl mx-auto px-6 py-4">
          <h1 class="text-3xl font-black bg-gradient-to-r from-sky-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Bienvenido, <span class="font-bold text-slate-900 dark:text-white">{{ userName }}</span>
          </p>
        </div>
      </div>

      <!-- MAIN CONTENT -->
      <div class="max-w-7xl mx-auto px-6 py-8">
        <!-- ROL BADGE -->
        <div class="mb-8 inline-block">
          <span class="px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-sky-100 to-cyan-100 dark:from-sky-900/30 dark:to-cyan-900/30 text-sky-800 dark:text-cyan-300 border border-sky-300 dark:border-sky-700">
            👤 {{ userRole }}
          </span>
        </div>

        <!-- STATS GRID -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <!-- Solicitudes Card -->
          <div class="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 cursor-pointer">
            <!-- Gradient Overlay -->
            <div class="absolute inset-0 bg-gradient-to-br from-sky-500/5 via-transparent to-blue-500/5 group-hover:from-sky-500/10 group-hover:to-blue-500/10 transition-all duration-500"></div>

            <!-- Animated Background Blur -->
            <div class="absolute -right-20 -top-20 w-40 h-40 rounded-full bg-gradient-to-br from-sky-400/20 to-cyan-400/20 blur-3xl group-hover:blur-2xl transition-all duration-500 group-hover:scale-150"></div>

            <div class="relative z-10 text-center">
              <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-sky-100 to-cyan-100 dark:from-sky-900/40 dark:to-cyan-900/40 mb-4 group-hover:scale-110 transition-transform duration-300">
                <span class="text-3xl">⚠️</span>
              </div>
              <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-2">Solicitudes</h3>
              <p class="text-5xl font-black bg-gradient-to-r from-sky-600 to-cyan-600 bg-clip-text text-transparent">{{ stats.solicitudes }}</p>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-2">Emergencias pendientes</p>
            </div>
          </div>

          <!-- Postulaciones Card -->
          <div class="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 cursor-pointer">
            <div class="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-sky-500/5 group-hover:from-blue-500/10 group-hover:to-sky-500/10 transition-all duration-500"></div>
            <div class="absolute -right-20 -top-20 w-40 h-40 rounded-full bg-gradient-to-br from-blue-400/20 to-sky-400/20 blur-3xl group-hover:blur-2xl transition-all duration-500 group-hover:scale-150"></div>

            <div class="relative z-10 text-center">
              <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-sky-100 dark:from-blue-900/40 dark:to-sky-900/40 mb-4 group-hover:scale-110 transition-transform duration-300">
                <span class="text-3xl">👍</span>
              </div>
              <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-2">Postulaciones</h3>
              <p class="text-5xl font-black bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">{{ stats.postulaciones }}</p>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-2">Talleres interesados</p>
            </div>
          </div>

          <!-- En Proceso Card -->
          <div class="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 cursor-pointer">
            <div class="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5 group-hover:from-cyan-500/10 group-hover:to-blue-500/10 transition-all duration-500"></div>
            <div class="absolute -right-20 -top-20 w-40 h-40 rounded-full bg-gradient-to-br from-cyan-400/20 to-blue-400/20 blur-3xl group-hover:blur-2xl transition-all duration-500 group-hover:scale-150"></div>

            <div class="relative z-10 text-center">
              <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-cyan-100 to-blue-100 dark:from-cyan-900/40 dark:to-blue-900/40 mb-4 group-hover:scale-110 transition-transform duration-300">
                <span class="text-3xl">🔧</span>
              </div>
              <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-2">En Proceso</h3>
              <p class="text-5xl font-black bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">{{ stats.enProceso }}</p>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-2">Servicios activos</p>
            </div>
          </div>

          <!-- Completadas Card -->
          <div class="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 cursor-pointer">
            <div class="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-cyan-500/5 group-hover:from-emerald-500/10 group-hover:to-cyan-500/10 transition-all duration-500"></div>
            <div class="absolute -right-20 -top-20 w-40 h-40 rounded-full bg-gradient-to-br from-emerald-400/20 to-cyan-400/20 blur-3xl group-hover:blur-2xl transition-all duration-500 group-hover:scale-150"></div>

            <div class="relative z-10 text-center">
              <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-emerald-100 to-cyan-100 dark:from-emerald-900/40 dark:to-cyan-900/40 mb-4 group-hover:scale-110 transition-transform duration-300">
                <span class="text-3xl">✅</span>
              </div>
              <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-2">Completadas</h3>
              <p class="text-5xl font-black bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">{{ stats.completadas }}</p>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-2">Servicios finalizados</p>
            </div>
          </div>
        </div>

        <!-- WELCOME MESSAGE -->
        <div class="mt-12 p-8 rounded-2xl bg-gradient-to-br from-sky-50 to-cyan-50 dark:from-sky-900/20 dark:to-cyan-900/20 border border-sky-200 dark:border-sky-800/50">
          <div class="flex items-start gap-4">
            <span class="text-4xl mt-1">🚀</span>
            <div>
              <h2 class="text-2xl font-bold text-sky-900 dark:text-cyan-100 mb-2">
                ¡Bienvenido al Sistema de Emergencias Vehiculares!
              </h2>
              <p class="text-sky-800 dark:text-cyan-200 leading-relaxed">
                Desde este dashboard puedes gestionar solicitudes de emergencia, ver postulaciones de talleres,
                monitorear servicios en proceso y revisar el historial de trabajos completados.
                Utiliza el menú lateral para navegar entre las diferentes secciones del sistema.
              </p>
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
  stats = {
    solicitudes: 0,
    postulaciones: 0,
    enProceso: 0,
    completadas: 0
  };

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.userName = user.nombre_completo;
      this.userRole = user.rol;
    }

    // Cargar estadísticas (aquí irían llamadas al backend)
    this.loadStats();
  }

  loadStats(): void {
    // TODO: Conectar con endpoints del backend para cargar estadísticas reales
    this.stats = {
      solicitudes: 0,
      postulaciones: 0,
      enProceso: 0,
      completadas: 0
    };
  }
}
