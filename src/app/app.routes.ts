import { Routes } from '@angular/router';
import { LayoutComponent } from '@core/layout/layout.component';
import { AuthGuard } from '@core/guards/auth.guard';
import {
  aiAutomationRoutes,
  assignmentAttentionRoutes,
  authPublicRoutes,
  authUsersProtectedRoutes,
  gestionServiciosCotizacionesOrdenesPagosRoutes,
  notificationsAdminReportsRoutes,
  vehiclesEmergenciesRoutes,
} from './modules';

export const routes: Routes = [
  {
    path: 'auth',
    children: authPublicRoutes,
  },
  { path: 'reset-password', redirectTo: 'auth/reset-password', pathMatch: 'full' },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [AuthGuard],
    children: [
      ...authUsersProtectedRoutes,
      ...vehiclesEmergenciesRoutes,
      ...assignmentAttentionRoutes,
      ...aiAutomationRoutes,
      ...notificationsAdminReportsRoutes,
      ...gestionServiciosCotizacionesOrdenesPagosRoutes,
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: 'auth/login' },
];
