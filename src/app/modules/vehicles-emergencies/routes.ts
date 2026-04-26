import { Routes } from '@angular/router';
import { RoleGuard } from '@core/guards/role.guard';
import { RolUsuario } from '@core/models/user.model';
import { EmergencyRequestsComponent } from './pages/emergency-requests.component';
import { SolicitudDetalleComponent } from './components/solicitud-detalle/solicitud-detalle.component';

export const vehiclesEmergenciesRoutes: Routes = [
  {
    path: 'emergency-requests',
    canActivate: [RoleGuard],
    data: { roles: [RolUsuario.TALLER] },
    children: [
      { path: '', component: EmergencyRequestsComponent },
      { path: ':id', component: SolicitudDetalleComponent },
    ],
  },
];
