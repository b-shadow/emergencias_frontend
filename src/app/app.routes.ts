import { Routes } from '@angular/router';
import { LayoutComponent } from '@core/layout/layout.component';
import { LoginComponent } from '@features/auth/login.component';
import { RegisterTallerComponent } from '@features/auth/register-taller.component';
import { ForgotPasswordComponent } from '@features/auth/forgot-password.component';
import { ResetPasswordComponent } from '@features/auth/reset-password.component';
import { DashboardComponent } from '@features/dashboard/dashboard.component';
import { VerPerfilComponent } from '@features/workshops/ver-perfil.component';
import { EditarPerfilComponent } from '@features/workshops/editar-perfil.component';
import { MisEspecialidadesComponent } from '@features/workshops/mis-especialidades.component';
import { MisServiciosComponent } from '@features/workshops/mis-servicios.component';
import { GestionarTallerComponent } from '@features/workshops/gestionar-taller.component';
import { EmergencyRequestsComponent } from '@features/emergency-requests/emergency-requests.component';
import { SolicitudDetalleComponent } from '@features/workshops/components/solicitud-detalle/solicitud-detalle.component';
import { ApplicationsComponent } from '@features/applications/applications.component';
import { AssignmentsComponent } from '@features/assignments/assignments.component';
import { NotificationsComponent } from '@features/notifications/notifications.component';
import { NotificationsTallerComponent } from '@features/notifications/notifications-taller.component';
import { NotificationsAdminComponent } from '@features/notifications/notifications-admin.component';
import { AuditLogComponent } from '@features/audit-log/audit-log.component';
import { UsersComponent } from '@features/users/users.component';
import { SpecialtiesComponent } from '@features/specialties/specialties.component';
import { ServicesCatalogComponent } from '@features/services-catalog/services-catalog.component';
import { EstadisticasTallerComponent } from '@features/taller/estadisticas-taller.component';
import { BitacoraComponent } from '@features/administrador/bitacora.component';
import { GestionServiciosComponent } from '@features/administrador/gestion-servicios.component';
import { GestionEspecialidadesComponent } from '@features/administrador/gestion-especialidades.component';
import { AdminEstadisticasSistemaComponent } from '@features/admin/admin-estadisticas-sistema.component';
import { ServiceResultsComponent } from '@features/service-results/service-results.component';
import { AuthGuard } from '@core/guards/auth.guard';
import { RoleGuard } from '@core/guards/role.guard';
import { RolUsuario } from '@core/models/user.model';

export const routes: Routes = [
  {
    path: 'auth',
    children: [
      { path: 'login', component: LoginComponent },
      { path: 'register-taller', component: RegisterTallerComponent },
      { path: 'forgot-password', component: ForgotPasswordComponent },
      { path: 'reset-password', component: ResetPasswordComponent },
      { path: '', redirectTo: 'login', pathMatch: 'full' }
    ]
  },
  { path: 'reset-password', redirectTo: 'auth/reset-password', pathMatch: 'full' },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      {
        path: 'workshops',
        children: [
          {
            path: 'profile',
            component: VerPerfilComponent,
            canActivate: [RoleGuard],
            data: { roles: [RolUsuario.TALLER] }
          },
          {
            path: 'edit',
            component: EditarPerfilComponent,
            canActivate: [RoleGuard],
            data: { roles: [RolUsuario.TALLER] }
          },
          {
            path: 'especialidades',
            component: MisEspecialidadesComponent,
            canActivate: [RoleGuard],
            data: { roles: [RolUsuario.TALLER] }
          },
          {
            path: 'servicios',
            component: MisServiciosComponent,
            canActivate: [RoleGuard],
            data: { roles: [RolUsuario.TALLER] }
          }
        ]
      },
      {
        path: 'emergency-requests',
        canActivate: [RoleGuard],
        data: { roles: [RolUsuario.TALLER] },
        children: [
          { path: '', component: EmergencyRequestsComponent },
          { path: ':id', component: SolicitudDetalleComponent }
        ]
      },
      {
        path: 'applications',
        component: ApplicationsComponent,
        canActivate: [RoleGuard],
        data: { roles: [RolUsuario.TALLER] }
      },
      {
        path: 'assignments',
        component: AssignmentsComponent,
        canActivate: [RoleGuard],
        data: { roles: [RolUsuario.TALLER] }
      },
      {
        path: 'service-results',
        component: ServiceResultsComponent,
        canActivate: [RoleGuard],
        data: { roles: [RolUsuario.TALLER] }
      },
      {
        path: 'estadisticas',
        component: EstadisticasTallerComponent,
        canActivate: [RoleGuard],
        data: { roles: [RolUsuario.TALLER] }
      },
      {
        path: 'notifications',
        children: [
          {
            path: 'taller',
            component: NotificationsTallerComponent,
            canActivate: [RoleGuard],
            data: { roles: [RolUsuario.TALLER, RolUsuario.CLIENTE] }
          },
          {
            path: 'admin',
            component: NotificationsAdminComponent,
            canActivate: [RoleGuard],
            data: { roles: [RolUsuario.ADMINISTRADOR] }
          },
          { path: '', component: NotificationsComponent }
        ]
      },
      {
        path: 'audit-log',
        component: AuditLogComponent,
        canActivate: [RoleGuard],
        data: { roles: [RolUsuario.ADMINISTRADOR] }
      },
      {
        path: 'users',
        component: UsersComponent,
        canActivate: [RoleGuard],
        data: { roles: [RolUsuario.ADMINISTRADOR] }
      },
      {
        path: 'specialties',
        component: SpecialtiesComponent,
        canActivate: [RoleGuard],
        data: { roles: [RolUsuario.ADMINISTRADOR] }
      },
      {
        path: 'services-catalog',
        component: ServicesCatalogComponent,
        canActivate: [RoleGuard],
        data: { roles: [RolUsuario.ADMINISTRADOR] }
      },
      {
        path: 'workshops-management',
        component: GestionarTallerComponent,
        canActivate: [RoleGuard],
        data: { roles: [RolUsuario.ADMINISTRADOR] }
      },
      {
        path: 'bitacora',
        component: BitacoraComponent,
        canActivate: [RoleGuard],
        data: { roles: [RolUsuario.ADMINISTRADOR] }
      },
      {
        path: 'gestionar-especialidades',
        component: GestionEspecialidadesComponent,
        canActivate: [RoleGuard],
        data: { roles: [RolUsuario.ADMINISTRADOR] }
      },
      {
        path: 'gestionar-servicios',
        component: GestionServiciosComponent,
        canActivate: [RoleGuard],
        data: { roles: [RolUsuario.ADMINISTRADOR] }
      },
      {
        path: 'estadisticas-sistema',
        component: AdminEstadisticasSistemaComponent,
        canActivate: [RoleGuard],
        data: { roles: [RolUsuario.ADMINISTRADOR] }
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'auth/login' }
];
