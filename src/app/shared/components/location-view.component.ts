import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

declare var maplibregl: any;

@Component({
  selector: 'app-location-view',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="my-6 p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-slate-700">
      <!-- Header -->
      <div class="mb-6">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">📍 Ubicación del Taller</h3>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
          <span *ngIf="latitud">Latitud: {{ (latitud | number: '1.6-6') }} | </span>
          <span *ngIf="longitud">Longitud: {{ (longitud | number: '1.6-6') }}</span>
          <span *ngIf="!latitud && !longitud">No especificada</span>
        </p>
      </div>

      <!-- Map Container -->
      <div [style.height.px]="mapHeight" class="relative w-full rounded-lg border-2 border-gray-200 dark:border-slate-600 overflow-hidden">
        <div #mapElement style="width: 100%; height: 100%;"></div>
        <div *ngIf="isLoadingMap" class="absolute inset-0 flex flex-col items-center justify-center bg-white/90 dark:bg-slate-800/90 z-50">
          <svg class="animate-spin h-10 w-10 text-cyan-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p class="mt-3 text-gray-700 dark:text-gray-300 font-medium">Cargando mapa...</p>
        </div>
      </div>

      <!-- Info Box -->
      <div class="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500 rounded">
        <p class="text-sm text-blue-800 dark:text-blue-200">
          <strong>📌 Nota:</strong> Esta es la ubicación registrada de tu taller. No puedes editarla desde aquí.
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
export class LocationViewComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() latitud: number | null = -17.8139;
  @Input() longitud: number | null = -63.1621;
  @Input() mapHeight: number = 380;
  @ViewChild('mapElement') mapElementRef!: ElementRef<HTMLDivElement>;

  isLoadingMap = true;

  private map: any = null;
  private marker: any = null;
  private loadTimeout: any = null;

  constructor() {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    if (this.mapElementRef && this.latitud !== null && this.longitud !== null) {
      setTimeout(() => {
        this.loadMapLibreGL();
      }, 50);
    }
  }

  ngOnDestroy(): void {
    if (this.loadTimeout) {
      clearTimeout(this.loadTimeout);
    }
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

    const lat = this.latitud ?? -17.8139;
    const lng = this.longitud ?? -63.1621;

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
              source: 'osm'
            }
          ]
        },
        center: [lng, lat],
        zoom: 15,
        scrollZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        dragPan: false,
        dragRotate: false,
        touchZoom: false,
        touchPitch: false
      });

      // Timeout de seguridad: después de 4 segundos ocultar el spinner aunque no se dispare 'load'
      this.loadTimeout = setTimeout(() => {
        this.isLoadingMap = false;
        console.warn('Map loading timeout - ocultar spinner de todas formas');
      }, 4000);

      this.map.on('load', () => {
        clearTimeout(this.loadTimeout);
        this.addMarker(lat, lng);
        this.isLoadingMap = false;
      });

      this.map.on('error', (error: any) => {
        clearTimeout(this.loadTimeout);
        console.error('Map error:', error);
        this.isLoadingMap = false;
      });
    } catch (error) {
      clearTimeout(this.loadTimeout);
      console.error('Error initializing map:', error);
      this.isLoadingMap = false;
    }
  }

  private addMarker(lat: number, lng: number): void {
    if (!this.map) return;

    const el = document.createElement('div');
    el.style.width = '32px';
    el.style.height = '32px';
    el.style.backgroundImage = 'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27%2306b6d4%27%3E%3Cpath d=%27M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm0-13c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5z%27/%3E%3C/svg%3E")';
    el.style.backgroundSize = 'contain';

    this.marker = new maplibregl.Marker({ element: el })
      .setLngLat([lng, lat])
      .addTo(this.map);
  }
}
