import { Component } from '@angular/core';

@Component({
  selector: 'app-services-catalog',
  standalone: true,
  imports: [],
  template: `
    <div class="px-6 py-4">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Catálogo de Servicios</h1>
      <div class="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-slate-700">
        <p class="text-gray-700 dark:text-slate-300">Gestiona los servicios disponibles en el sistema.</p>
      </div>
    </div>
  `
})
export class ServicesCatalogComponent {}
