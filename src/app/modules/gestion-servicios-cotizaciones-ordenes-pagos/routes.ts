import { Routes } from '@angular/router';
import { RoleGuard } from '@core/guards/role.guard';
import { RolUsuario } from '@core/models/user.model';
import { RegistrarSeguroComponent } from './pages/registrar-seguro.component';

export const gestionServiciosCotizacionesOrdenesPagosRoutes: Routes = [
  {
    path: 'seguros/registro',
    component: RegistrarSeguroComponent,
    canActivate: [RoleGuard],
    data: { roles: [RolUsuario.CLIENTE, RolUsuario.ADMINISTRADOR] },
  },
];
