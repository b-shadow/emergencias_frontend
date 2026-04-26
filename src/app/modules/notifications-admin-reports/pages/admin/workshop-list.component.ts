import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-workshop-list',
  standalone: true,
  imports: [RouterModule],
  template: `
    <div class="px-6 py-4">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">🏢 Gestión de Taller</h1>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Ver Perfil -->
        <div class="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 hover:shadow-lg transition">
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">👤 Mi Perfil</h2>
          <p class="text-gray-700 dark:text-slate-300 mb-4">
            Ver y administrar la información de tu taller, ubicación y descripción.
          </p>
          <button
            routerLink="/workshops/profile"
            class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
          >
            Ver Perfil
          </button>
        </div>

        <!-- Especialidades -->
        <div class="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 hover:shadow-lg transition">
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🔧 Especialidades</h2>
          <p class="text-gray-700 dark:text-slate-300 mb-4">
            Gestiona las especialidades que ofrece tu taller.
          </p>
          <button
            routerLink="/workshops/especialidades"
            class="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-2 px-4 rounded-lg transition"
          >
            Gestionar
          </button>
        </div>

        <!-- Servicios -->
        <div class="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 hover:shadow-lg transition">
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🛠️ Servicios</h2>
          <p class="text-gray-700 dark:text-slate-300 mb-4">
            Administra los servicios que ofrece tu taller.
          </p>
          <button
            routerLink="/workshops/servicios"
            class="bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2 px-4 rounded-lg transition"
          >
            Gestionar
          </button>
        </div>

        <!-- Asignaciones -->
        <div class="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 hover:shadow-lg transition">
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">📋 Asignaciones</h2>
          <p class="text-gray-700 dark:text-slate-300 mb-4">
            Ver las asignaciones de emergencias que has recibido.
          </p>
          <button
            disabled
            class="bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg cursor-not-allowed"
          >
            Próximamente
          </button>
        </div>
      </div>
    </div>
  `
})
export class WorkshopListComponent {}
