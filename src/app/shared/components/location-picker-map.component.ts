import { Component, EventEmitter, OnInit, Output, ViewChild, ElementRef, AfterViewInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface LocationSelection {
  latitud: number;
  longitud: number;
}

declare var maplibregl: any;

@Component({
  selector: 'app-location-picker-map',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Fullscreen Mode -->
    <div *ngIf="isFullscreen" class="w-full h-full flex flex-col" style="position: relative;">
      <div class="flex-1 w-full overflow-hidden" style="position: relative;">
        <div #mapElement style="width: 100%; height: 100%; position: absolute; top: 0; left: 0; right: 0; bottom: 0;"></div>
        <div *ngIf="isLoadingMap" class="absolute inset-0 flex flex-col items-center justify-center bg-white/90 dark:bg-slate-800/90 z-50">
          <svg class="animate-spin h-10 w-10 text-cyan-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p class="mt-3 text-gray-700 dark:text-gray-300 font-medium">Cargando mapa...</p>
        </div>
      </div>
    </div>

    <!-- Normal Mode -->
    <div *ngIf="!isFullscreen" class="my-6 p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-slate-700">
      <!-- Header -->
      <div class="mb-6">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Ubicación del Taller</h2>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">Haz clic en el mapa o usa tu ubicación actual</p>
      </div>

      <!-- Use Current Location Button -->
      <div class="mb-6">
        <button
          (click)="useCurrentLocation()"
          [disabled]="isLoadingLocation"
          class="px-6 py-2 bg-gradient-to-r from-sky-600 via-cyan-600 to-blue-600 hover:shadow-lg hover:shadow-cyan-500/50 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <span *ngIf="!isLoadingLocation">📍 Usar mi Ubicación Actual</span>
          <span *ngIf="isLoadingLocation" class="flex items-center gap-2">
            <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Obteniendo ubicación...
          </span>
        </button>
      </div>

      <!-- Map Container -->
      <div [style.height.px]="mapHeight" class="relative w-full mb-6 rounded-lg border-2 border-gray-200 dark:border-slate-600 overflow-hidden">
        <div #mapElement style="width: 100%; height: 100%;"></div>
        <div *ngIf="isLoadingMap" class="absolute inset-0 flex flex-col items-center justify-center bg-white/90 dark:bg-slate-800/90 z-50">
          <svg class="animate-spin h-10 w-10 text-cyan-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p class="mt-3 text-gray-700 dark:text-gray-300 font-medium">Cargando mapa...</p>
        </div>
      </div>

      <!-- Coordinates Display -->
      <div *ngIf="selectedLocation" class="mt-6 pt-6 border-t border-gray-200 dark:border-slate-700">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Coordenadas Seleccionadas</h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Latitud</label>
            <input
              type="number"
              [(ngModel)]="selectedLocation.latitud"
              (change)="onCoordinateChange()"
              step="0.0001"
              class="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Longitud</label>
            <input
              type="number"
              [(ngModel)]="selectedLocation.longitud"
              (change)="onCoordinateChange()"
              step="0.0001"
              class="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition"
            />
          </div>
        </div>

        <div class="bg-gray-100 dark:bg-slate-700 p-4 rounded-lg font-mono text-sm text-gray-800 dark:text-gray-200">
          Latitud: {{ selectedLocation.latitud | number: '1.6-6' }}<br />
          Longitud: {{ selectedLocation.longitud | number: '1.6-6' }}
        </div>
      </div>

      <!-- Info Box -->
      <div class="mt-6 p-4 bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500 rounded">
        <p class="text-sm text-blue-800 dark:text-blue-200">
          <strong>Nota:</strong> Haz clic en el mapa para seleccionar una ubicación o arrastra el marcador.
        </p>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class LocationPickerMapComponent implements OnInit, AfterViewInit, OnDestroy {
  @Output() locationSelected = new EventEmitter<LocationSelection>();
  @ViewChild('mapElement') mapElementRef!: ElementRef<HTMLDivElement>;
  @Input() mapHeight: number = 400;
  @Input() isFullscreen: boolean = false;

  selectedLocation: LocationSelection | null = null;
  isLoadingLocation = false;
  isLoadingMap = true;

  private map: any = null;
  private marker: any = null;

  private defaultLat = -17.8139;
  private defaultLng = -63.1621;

  constructor() {}

  ngOnInit(): void {
    setTimeout(() => {
      this.tryGetUserLocation();
    }, 500);
  }

  ngAfterViewInit(): void {
    if (this.mapElementRef) {
      setTimeout(() => {
        this.loadMapLibreGL();
      }, 50);
    }
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  private loadMapLibreGL(): void {
    // Cargar CSS de MapLibre GL
    const link = document.createElement('link');
    link.href = 'https://unpkg.com/maplibre-gl@3.6.0/dist/maplibre-gl.css';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    // Cargar JS de MapLibre GL
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/maplibre-gl@3.6.0/dist/maplibre-gl.js';
    script.async = true;

    script.onload = () => {
      this.initializeMap();
    };

    script.onerror = () => {
      console.error('Error loading MapLibre GL');
      this.isLoadingMap = false;
    };

    document.head.appendChild(script);
  }

  private initializeMap(): void {
    if (!this.mapElementRef?.nativeElement) {
      console.error('Map container not found');
      return;
    }

    try {
      this.map = new maplibregl.Map({
        container: this.mapElementRef.nativeElement,
        style: {
          version: 8,
          sources: {
            'osm': {
              type: 'raster',
              tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
              tileSize: 256,
              attribution: '© OpenStreetMap contributors'
            }
          },
          layers: [
            {
              id: 'osm',
              type: 'raster',
              source: 'osm',
              minzoom: 0,
              maxzoom: 19
            }
          ]
        },
        center: [this.defaultLng, this.defaultLat],
        zoom: 15
      });

      this.map.on('load', () => {
        this.addMarkerAndListeners();
        this.isLoadingMap = false;
      });

      // Timeout de seguridad
      setTimeout(() => {
        if (this.isLoadingMap) {
          this.addMarkerAndListeners();
          this.isLoadingMap = false;
        }
      }, 5000);

    } catch (error) {
      console.error('Error initializing map:', error);
      this.isLoadingMap = false;
    }
  }

  private addMarkerAndListeners(): void {
    // Crear marcador personalizado
    const markerEl = document.createElement('div');
    markerEl.style.width = '32px';
    markerEl.style.height = '40px';
    markerEl.style.cursor = 'grab';
    markerEl.innerHTML = `
      <svg viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 0C9.4 0 4 5.4 4 12c0 8 12 28 12 28s12-20 12-28c0-6.6-5.4-12-12-12z" fill="#06b6d4" stroke="#fff" stroke-width="2"/>
        <circle cx="16" cy="12" r="5" fill="#fff"/>
      </svg>
    `;

    this.marker = new maplibregl.Marker({
      element: markerEl,
      draggable: true
    })
      .setLngLat([this.defaultLng, this.defaultLat])
      .addTo(this.map);

    // Click en el mapa
    this.map.on('click', (e: any) => {
      const { lng, lat } = e.lngLat;
      this.setLocation(lat, lng);
    });

    // Drag del marcador
    this.marker.on('dragend', () => {
      const { lng, lat } = this.marker.getLngLat();
      this.setLocation(lat, lng);
    });
  }

  useCurrentLocation(): void {
    this.isLoadingLocation = true;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          this.setLocation(latitude, longitude, true);
          this.isLoadingLocation = false;
        },
        (error) => {
          console.error('Error getting location:', error);
          this.isLoadingLocation = false;
        }
      );
    } else {
      console.error('Geolocation not supported');
      this.isLoadingLocation = false;
    }
  }

  private setLocation(lat: number, lng: number, emit: boolean = true): void {
    this.selectedLocation = { latitud: lat, longitud: lng };

    if (this.marker) {
      this.marker.setLngLat([lng, lat]);
    }

    if (this.map) {
      this.map.flyTo({ center: [lng, lat], zoom: 15 });
    }

    if (emit) {
      this.locationSelected.emit(this.selectedLocation);
    }

    console.log('Location updated:', lat, lng);
  }

  onCoordinateChange(): void {
    if (this.selectedLocation) {
      if (this.marker) {
        this.marker.setLngLat([this.selectedLocation.longitud, this.selectedLocation.latitud]);
      }
      if (this.map) {
        this.map.flyTo({
          center: [this.selectedLocation.longitud, this.selectedLocation.latitud],
          zoom: 15
        });
      }
      this.locationSelected.emit(this.selectedLocation);
    }
  }

  private tryGetUserLocation(): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          this.defaultLat = latitude;
          this.defaultLng = longitude;
          this.setLocation(latitude, longitude, false);
        },
        (error) => {
          console.log('Location access denied, using default location');
        }
      );
    }
  }
}
