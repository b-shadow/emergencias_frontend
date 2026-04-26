import { Routes } from '@angular/router';
import { RoleGuard } from '@core/guards/role.guard';
import { RolUsuario } from '@core/models/user.model';
import { NotificationsComponent } from './pages/notifications/notifications.component';
import { NotificationsTallerComponent } from './pages/notifications/notifications-taller.component';
import { NotificationsAdminComponent } from './pages/notifications/notifications-admin.component';
import { AuditLogComponent } from './pages/audit-log.component';
import { SpecialtiesComponent } from './pages/specialties.component';
import { ServicesCatalogComponent } from './pages/services-catalog.component';
import { EstadisticasTallerComponent } from './pages/estadisticas-taller.component';
import { BitacoraComponent } from './pages/admin/bitacora.component';
import { GestionServiciosComponent } from './pages/admin/gestion-servicios.component';
import { GestionEspecialidadesComponent } from './pages/admin/gestion-especialidades.component';
import { AdminEstadisticasSistemaComponent } from './pages/admin/admin-estadisticas-sistema.component';
import { GestionarTallerComponent } from './pages/admin/gestionar-taller.component';

export const notificationsAdminReportsRoutes: Routes = [
  {
    path: 'notifications',
    children: [
      {
        path: 'taller',
        component: NotificationsTallerComponent,
        canActivate: [RoleGuard],
        data: { roles: [RolUsuario.TALLER, RolUsuario.CLIENTE] },
      },
      {
        path: 'admin',
        component: NotificationsAdminComponent,
        canActivate: [RoleGuard],
        data: { roles: [RolUsuario.ADMINISTRADOR] },
      },
      { path: '', component: NotificationsComponent },
    ],
  },
  {
    path: 'workshops-management',
    component: GestionarTallerComponent,
    canActivate: [RoleGuard],
    data: { roles: [RolUsuario.ADMINISTRADOR] },
  },
  {
    path: 'audit-log',
    component: AuditLogComponent,
    canActivate: [RoleGuard],
    data: { roles: [RolUsuario.ADMINISTRADOR] },
  },
  {
    path: 'specialties',
    component: SpecialtiesComponent,
    canActivate: [RoleGuard],
    data: { roles: [RolUsuario.ADMINISTRADOR] },
  },
  {
    path: 'services-catalog',
    component: ServicesCatalogComponent,
    canActivate: [RoleGuard],
    data: { roles: [RolUsuario.ADMINISTRADOR] },
  },
  {
    path: 'bitacora',
    component: BitacoraComponent,
    canActivate: [RoleGuard],
    data: { roles: [RolUsuario.ADMINISTRADOR] },
  },
  {
    path: 'gestionar-especialidades',
    component: GestionEspecialidadesComponent,
    canActivate: [RoleGuard],
    data: { roles: [RolUsuario.ADMINISTRADOR] },
  },
  {
    path: 'gestionar-servicios',
    component: GestionServiciosComponent,
    canActivate: [RoleGuard],
    data: { roles: [RolUsuario.ADMINISTRADOR] },
  },
  {
    path: 'estadisticas-sistema',
    component: AdminEstadisticasSistemaComponent,
    canActivate: [RoleGuard],
    data: { roles: [RolUsuario.ADMINISTRADOR] },
  },
  {
    path: 'estadisticas',
    component: EstadisticasTallerComponent,
    canActivate: [RoleGuard],
    data: { roles: [RolUsuario.TALLER] },
  },
];
