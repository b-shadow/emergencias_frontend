import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

declare var maplibregl: any;

@Component({
  selector: 'app-recojo-tracking-map',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative w-full h-64 rounded-lg overflow-hidden border border-gray-200 dark:border-slate-600">
      <div #mapEl class="w-full h-full"></div>
      <div *ngIf="isLoading" class="absolute inset-0 bg-white/80 dark:bg-slate-900/70 flex items-center justify-center text-sm text-gray-700 dark:text-slate-200">
        Cargando mapa...
      </div>
    </div>
  `
})
export class RecojoTrackingMapComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() latitudActual: number | null = null;
  @Input() longitudActual: number | null = null;
  @Input() latitudDestino: number | null = null;
  @Input() longitudDestino: number | null = null;
  @Input() rutaGeojson: any | null = null;
  @Input() rutaRecorridaGeojson: any | null = null;
  @ViewChild('mapEl') mapEl?: ElementRef<HTMLDivElement>;

  isLoading = true;
  private map: any = null;
  private workerMarker: any = null;
  private destinoMarker: any = null;
  private ready = false;

  ngAfterViewInit(): void {
    this.loadMapLibre();
  }

  ngOnChanges(_changes: SimpleChanges): void {
    if (this.ready) {
      this.renderData();
    }
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  private loadMapLibre(): void {
    if ((window as any).maplibregl) {
      this.initializeMap();
      return;
    }

    if (!document.querySelector('link[href*="maplibre-gl.css"]')) {
      const css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = 'https://unpkg.com/maplibre-gl@3.6.0/dist/maplibre-gl.css';
      document.head.appendChild(css);
    }

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/maplibre-gl@3.6.0/dist/maplibre-gl.js';
    script.async = true;
    script.onload = () => this.initializeMap();
    script.onerror = () => {
      this.isLoading = false;
    };
    document.head.appendChild(script);
  }

  private initializeMap(): void {
    if (!this.mapEl?.nativeElement) {
      this.isLoading = false;
      return;
    }

    const lng = this.longitudActual ?? this.longitudDestino ?? -63.1621;
    const lat = this.latitudActual ?? this.latitudDestino ?? -17.8139;

    this.map = new maplibregl.Map({
      container: this.mapEl.nativeElement,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors'
          }
        },
        layers: [{ id: 'osm', type: 'raster', source: 'osm' }]
      },
      center: [lng, lat],
      zoom: 13
    });

    this.map.on('load', () => {
      this.ready = true;
      this.isLoading = false;
      this.renderData();
    });
  }

  private renderData(): void {
    if (!this.map || !this.ready) return;

    if (this.workerMarker) this.workerMarker.remove();
    if (this.destinoMarker) this.destinoMarker.remove();

    if (typeof this.longitudActual === 'number' && typeof this.latitudActual === 'number') {
      this.workerMarker = new maplibregl.Marker({ color: '#2563eb' })
        .setLngLat([this.longitudActual, this.latitudActual])
        .setPopup(new maplibregl.Popup().setText('Trabajador'))
        .addTo(this.map);
    }

    if (typeof this.longitudDestino === 'number' && typeof this.latitudDestino === 'number') {
      this.destinoMarker = new maplibregl.Marker({ color: '#dc2626' })
        .setLngLat([this.longitudDestino, this.latitudDestino])
        .setPopup(new maplibregl.Popup().setText('Cliente'))
        .addTo(this.map);
    }

    this.removeLayerAndSource('ruta-recomendada-linea', 'ruta-recomendada');
    this.removeLayerAndSource('ruta-recorrida-linea', 'ruta-recorrida');

    const route = this.normalizeRoute(this.rutaGeojson);
    if (route) {
      this.map.addSource('ruta-recomendada', { type: 'geojson', data: route });
      this.map.addLayer({
        id: 'ruta-recomendada-linea',
        type: 'line',
        source: 'ruta-recomendada',
        paint: {
          'line-color': '#16a34a',
          'line-width': 5,
          'line-opacity': 0.9
        }
      });
    }
    const routeDone = this.normalizeRoute(this.rutaRecorridaGeojson);
    if (routeDone) {
      this.map.addSource('ruta-recorrida', { type: 'geojson', data: routeDone });
      this.map.addLayer({
        id: 'ruta-recorrida-linea',
        type: 'line',
        source: 'ruta-recorrida',
        paint: {
          'line-color': '#6b7280',
          'line-width': 4,
          'line-opacity': 0.85
        }
      });
    }

    const bounds = new maplibregl.LngLatBounds();
    let hasPoints = false;
    if (this.workerMarker) {
      bounds.extend(this.workerMarker.getLngLat());
      hasPoints = true;
    }
    if (this.destinoMarker) {
      bounds.extend(this.destinoMarker.getLngLat());
      hasPoints = true;
    }
    if (hasPoints) {
      this.map.fitBounds(bounds, { padding: 50, maxZoom: 15 });
    }
  }

  private removeLayerAndSource(layerId: string, sourceId: string): void {
    if (this.map.getLayer(layerId)) this.map.removeLayer(layerId);
    if (this.map.getSource(sourceId)) this.map.removeSource(sourceId);
  }

  private normalizeRoute(raw: any): any | null {
    if (!raw) return null;
    if (raw.type === 'Feature') return raw;
    if (raw.type === 'FeatureCollection') return raw;
    if (raw.type === 'LineString') return { type: 'Feature', geometry: raw, properties: {} };
    return null;
  }
}
