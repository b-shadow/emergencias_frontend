import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SegurosClienteService, VehiculoSeguroItem } from '../services/seguros-cliente.service';

@Component({
  selector: 'app-registrar-seguro',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="px-6 py-4 space-y-6">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Registrar Seguro</h1>
        <p class="text-sm text-gray-600 dark:text-slate-400">CU38 - Registro de seguros por parte del usuario</p>
      </div>

      <div *ngIf="error" class="p-3 rounded border border-red-300 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200 dark:border-red-700">{{ error }}</div>
      <div *ngIf="ok" class="p-3 rounded border border-green-300 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200 dark:border-green-700">{{ ok }}</div>

      <div class="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 p-5 space-y-3">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Nuevo registro</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input [(ngModel)]="form.placa" placeholder="Placa *" class="px-3 py-2 rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white" />
          <input [(ngModel)]="form.marca" placeholder="Marca" class="px-3 py-2 rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white" />
          <input [(ngModel)]="form.modelo" placeholder="Modelo" class="px-3 py-2 rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white" />
          <input [(ngModel)]="form.anio" type="number" min="1900" max="2100" placeholder="Año" class="px-3 py-2 rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white" />
          <input [(ngModel)]="form.color" placeholder="Color" class="px-3 py-2 rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white" />
          <input [(ngModel)]="form.tipo_combustible" placeholder="Tipo combustible" class="px-3 py-2 rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white" />
          <select [(ngModel)]="form.tipo_seguro" class="px-3 py-2 rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white">
            <option value="SIN_SEGURO">SIN_SEGURO</option>
            <option value="BASICO">BASICO</option>
            <option value="TODO_RIESGO">TODO_RIESGO</option>
          </select>
          <input [(ngModel)]="form.aseguradora" placeholder="Aseguradora" class="px-3 py-2 rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white" />
        </div>
        <textarea [(ngModel)]="form.observaciones" rows="3" placeholder="Observaciones" class="w-full px-3 py-2 rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"></textarea>
        <div class="flex justify-end">
          <button (click)="registrar()" [disabled]="guardando" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-60">{{ guardando ? 'Guardando...' : 'Registrar seguro' }}</button>
        </div>
      </div>

      <div class="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 p-5">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Mis registros</h2>
          <button (click)="cargar()" class="px-3 py-1 bg-slate-700 text-white rounded">Actualizar</button>
        </div>
        <div *ngIf="cargando" class="text-sm text-gray-500 dark:text-slate-400">Cargando...</div>
        <div *ngIf="!cargando && vehiculos.length === 0" class="text-sm text-gray-500 dark:text-slate-400">Aún no tienes registros.</div>
        <div *ngIf="!cargando && vehiculos.length > 0" class="space-y-2">
          <div *ngFor="let v of vehiculos" class="p-3 rounded border border-gray-200 dark:border-slate-700">
            <p class="font-semibold text-gray-900 dark:text-white">{{ v.placa }} - {{ v.marca || '-' }} {{ v.modelo || '' }}</p>
            <p class="text-sm text-gray-600 dark:text-slate-400">Seguro: {{ v.tipo_seguro }} | Aseguradora: {{ v.aseguradora || '-' }}</p>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class RegistrarSeguroComponent implements OnInit {
  vehiculos: VehiculoSeguroItem[] = [];
  cargando = false;
  guardando = false;
  error = '';
  ok = '';

  form = {
    placa: '',
    marca: '',
    modelo: '',
    anio: null as number | null,
    color: '',
    tipo_combustible: '',
    tipo_seguro: 'SIN_SEGURO' as 'SIN_SEGURO' | 'BASICO' | 'TODO_RIESGO',
    aseguradora: '',
    observaciones: '',
  };

  constructor(private segurosService: SegurosClienteService) {}

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.cargando = true;
    this.segurosService.listarMisVehiculos().subscribe({
      next: (data) => { this.vehiculos = data || []; this.cargando = false; },
      error: () => { this.error = 'No se pudieron cargar tus registros'; this.cargando = false; },
    });
  }

  registrar(): void {
    this.error = '';
    this.ok = '';
    if (!this.form.placa.trim()) {
      this.error = 'La placa es obligatoria';
      return;
    }
    this.guardando = true;
    this.segurosService.registrarSeguro({
      placa: this.form.placa.trim(),
      marca: this.form.marca || null,
      modelo: this.form.modelo || null,
      anio: this.form.anio,
      color: this.form.color || null,
      tipo_combustible: this.form.tipo_combustible || null,
      tipo_seguro: this.form.tipo_seguro,
      aseguradora: this.form.aseguradora || null,
      observaciones: this.form.observaciones || null,
    }).subscribe({
      next: () => {
        this.guardando = false;
        this.ok = 'Seguro registrado correctamente';
        this.form = {
          placa: '', marca: '', modelo: '', anio: null, color: '', tipo_combustible: '',
          tipo_seguro: 'SIN_SEGURO', aseguradora: '', observaciones: '',
        };
        this.cargar();
      },
      error: (err) => {
        this.guardando = false;
        this.error = err?.error?.detail || 'No se pudo registrar el seguro';
      },
    });
  }
}
