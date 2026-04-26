import { Routes } from '@angular/router';
import { RoleGuard } from '@core/guards/role.guard';
import { RolUsuario } from '@core/models/user.model';
import { LoginComponent } from './pages/login.component';
import { RegisterTallerComponent } from './pages/register-taller.component';
import { ForgotPasswordComponent } from './pages/forgot-password.component';
import { ResetPasswordComponent } from './pages/reset-password.component';
import { DashboardComponent } from '@modules/auth-users/pages/dashboard.component';
import { VerPerfilComponent } from './pages/workshop-profile/ver-perfil.component';
import { EditarPerfilComponent } from './pages/workshop-profile/editar-perfil.component';
import { MisEspecialidadesComponent } from './pages/workshop-profile/mis-especialidades.component';
import { MisServiciosComponent } from './pages/workshop-profile/mis-servicios.component';
import { UsersComponent } from './pages/users.component';

export const authPublicRoutes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register-taller', component: RegisterTallerComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
];

export const authUsersProtectedRoutes: Routes = [
  { path: 'dashboard', component: DashboardComponent },
  {
    path: 'workshops',
    children: [
      {
        path: 'profile',
        component: VerPerfilComponent,
        canActivate: [RoleGuard],
        data: { roles: [RolUsuario.TALLER] },
      },
      {
        path: 'edit',
        component: EditarPerfilComponent,
        canActivate: [RoleGuard],
        data: { roles: [RolUsuario.TALLER] },
      },
      {
        path: 'especialidades',
        component: MisEspecialidadesComponent,
        canActivate: [RoleGuard],
        data: { roles: [RolUsuario.TALLER] },
      },
      {
        path: 'servicios',
        component: MisServiciosComponent,
        canActivate: [RoleGuard],
        data: { roles: [RolUsuario.TALLER] },
      },
    ],
  },
  {
    path: 'users',
    component: UsersComponent,
    canActivate: [RoleGuard],
    data: { roles: [RolUsuario.ADMINISTRADOR] },
  },
];

