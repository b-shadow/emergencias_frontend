import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SolicitudesDisponiblesComponent } from '@features/workshops/components/solicitudes-disponibles/solicitudes-disponibles.component';

@Component({
  selector: 'app-emergency-requests',
  standalone: true,
  imports: [CommonModule, SolicitudesDisponiblesComponent],
  template: `<app-solicitudes-disponibles></app-solicitudes-disponibles>`
})
export class EmergencyRequestsComponent {}
