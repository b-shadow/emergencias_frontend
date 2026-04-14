import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface LocationSelection {
  latitud: number;
  longitud: number;
  direccion?: string;
}

@Component({
  selector: 'app-location-picker',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  template: `
    <div class="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 my-5">
      <!-- Header -->
      <div class="mb-6 pb-4 border-b border-gray-200 dark:border-slate-600">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white">Selecciona la Ubicación del Taller</h2>
        <p class="text-sm text-gray-600 dark:text-slate-400 mt-1">Haz clic en el mapa o usa tu ubicación actual</p>
      </div>

      <!-- Button Group -->
      <div class="flex gap-3 mb-6 flex-wrap">
        <button
          type="button"
          (click)="useCurrentLocation()"
          [disabled]="isLoadingLocation"
          class="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-sky-600 via-cyan-600 to-blue-600 hover:shadow-lg hover:shadow-cyan-500/50 disabled:opacity-60 text-white rounded-lg transition"
        >
          <span *ngIf="!isLoadingLocation">📍</span>
          <span *ngIf="isLoadingLocation" class="animate-spin">⌛</span>
          {{ isLoadingLocation ? 'Obteniendo ubicación...' : 'Usar mi Ubicación Actual' }}
        </button>
      </div>

      <!-- Map Canvas -->
      <div class="relative w-full border-2 border-gray-300 dark:border-slate-600 rounded-lg overflow-hidden mb-6 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-700 dark:to-slate-600 cursor-crosshair" (click)="onMapClick($event)">
        <canvas
          #mapCanvas
          class="w-full block rounded-md"
          [width]="mapWidth"
          [height]="mapHeight"
        ></canvas>
        <div class="absolute top-2 left-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-lg text-sm shadow-md pointer-events-none">
          <p class="text-gray-700 dark:text-slate-200 font-medium">Haz clic en el mapa para seleccionar ubicación</p>
          <p *ngIf="selectedLocation" class="text-gray-600 dark:text-slate-400 mt-1">
            📍 Seleccionado: {{ selectedLocation.latitud.toFixed(4) }}, {{ selectedLocation.longitud.toFixed(4) }}
          </p>
        </div>
      </div>

      <!-- Coordinates Display and Edit -->
      <div class="mt-6 pt-6 border-t border-gray-200 dark:border-slate-600">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Coordenadas Seleccionadas</h3>
        <div class="flex gap-4 mb-4">
          <div class="flex-1">
            <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Latitud</label>
            <input
              type="number"
              [(ngModel)]="selectedLocation.latitud"
              (change)="onCoordinateChange()"
              step="0.0001"
              class="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-cyan-500 dark:bg-slate-700 dark:text-white"
            />
          </div>
          <div class="flex-1">
            <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Longitud</label>
            <input
              type="number"
              [(ngModel)]="selectedLocation.longitud"
              (change)="onCoordinateChange()"
              step="0.0001"
              class="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-cyan-500 dark:bg-slate-700 dark:text-white"
            />
          </div>
        </div>
      </div>

      <!-- Notes -->
      <div class="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded mt-6">
        <p class="text-sm text-gray-700 dark:text-slate-300"><strong class="font-semibold">📌 Nota:</strong> Las coordenadas se copiarán al formulario cuando las selecciones.</p>
        <p class="text-sm text-gray-600 dark:text-slate-400 mt-2">Puedes editar manualmente o usar el botón para obtener tu ubicación actual.</p>
      </div>
    </div>
  `,
})
export class LocationPickerComponent implements OnInit {
  @Output() locationSelected = new EventEmitter<LocationSelection>();

  selectedLocation: LocationSelection = {
    latitud: 4.7069, // Coordenada por defecto (Centro de Bogotá como ejemplo)
    longitud: -74.0113,
    direccion: ''
  };

  isLoadingLocation = false;
  mapWidth = 600;
  mapHeight = 400;
  private mapCanvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private markersMap: Map<string, { lat: number; lng: number }> = new Map();

  ngOnInit(): void {
    const canvas = document.querySelector('canvas.map-canvas') as HTMLCanvasElement;
    if (canvas) {
      this.mapCanvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.drawMap();
    }
  }

  private drawMap(): void {
    if (!this.ctx || !this.mapCanvas) return;

    // Limpiar
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, this.mapCanvas.width, this.mapCanvas.height);

    // Grid de referencia
    this.ctx.strokeStyle = '#e0e0e0';
    this.ctx.lineWidth = 1;
    for (let i = 0; i <= this.mapCanvas.width; i += 50) {
      this.ctx.beginPath();
      this.ctx.moveTo(i, 0);
      this.ctx.lineTo(i, this.mapCanvas.height);
      this.ctx.stroke();
    }
    for (let i = 0; i <= this.mapCanvas.height; i += 50) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, i);
      this.ctx.lineTo(this.mapCanvas.width, i);
      this.ctx.stroke();
    }

    // Marcador actual
    const { x, y } = this.latLngToPixels(this.selectedLocation.latitud, this.selectedLocation.longitud);
    this.ctx.fillStyle = '#d32f2f';
    this.ctx.beginPath();
    this.ctx.arc(x, y, 6, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = 'white';
    this.ctx.beginPath();
    this.ctx.arc(x, y, 3, 0, Math.PI * 2);
    this.ctx.fill();
  }

  onMapClick(event: MouseEvent): void {
    if (!this.mapCanvas) return;

    const rect = this.mapCanvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const { lat, lng } = this.pixelsToLatLng(x, y);
    this.selectedLocation = {
      latitud: lat,
      longitud: lng
    };

    this.onCoordinateChange();
    this.drawMap();
  }

  useCurrentLocation(): void {
    this.isLoadingLocation = true;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.selectedLocation = {
            latitud: position.coords.latitude,
            longitud: position.coords.longitude
          };
          this.isLoadingLocation = false;
          this.onCoordinateChange();
          this.drawMap();
        },
        (error) => {
          console.error('Error obteniendo geolocalización:', error);
          this.isLoadingLocation = false;
          alert('No se pudo obtener tu ubicación. Asegúrate de permitir acceso a ubicación.');
        }
      );
    } else {
      this.isLoadingLocation = false;
      alert('Tu navegador no soporta geolocalización.');
    }
  }

  onCoordinateChange(): void {
    this.drawMap();
    this.locationSelected.emit(this.selectedLocation);
  }

  private latLngToPixels(lat: number, lng: number): { x: number; y: number } {
    if (!this.mapCanvas) return { x: 0, y: 0 };
    // Conversión simple: mapea un rectángulo de 8°x8° alrededor de las coordenadas
    const centerLat = 4.7069;
    const centerLng = -74.0113;
    const range = 2; // 2 grados de rango

    const x = ((lng - (centerLng - range)) / (2 * range)) * this.mapCanvas.width;
    const y = ((centerLat + range - lat) / (2 * range)) * this.mapCanvas.height;

    return { x: Math.max(0, Math.min(this.mapCanvas.width, x)), y: Math.max(0, Math.min(this.mapCanvas.height, y)) };
  }

  private pixelsToLatLng(x: number, y: number): { lat: number; lng: number } {
    if (!this.mapCanvas) return { lat: 0, lng: 0 };
    // Conversión inversa
    const centerLat = 4.7069;
    const centerLng = -74.0113;
    const range = 2;

    const lng = centerLng - range + (x / this.mapCanvas.width) * (2 * range);
    const lat = centerLat + range - (y / this.mapCanvas.height) * (2 * range);

    return { lat, lng };
  }
}
