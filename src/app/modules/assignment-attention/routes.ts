import { Routes } from '@angular/router';
import { RoleGuard } from '@core/guards/role.guard';
import { RolUsuario } from '@core/models/user.model';
import { ApplicationsComponent } from './pages/applications.component';
import { AssignmentsComponent } from './pages/assignments.component';
import { ServiceResultsComponent } from './pages/service-results.component';
import { TrackingRecojoComponent } from './pages/tracking-recojo.component';
import { WorkersComponent } from './pages/workers.component';

export const assignmentAttentionRoutes: Routes = [
  {
    path: 'applications',
    component: ApplicationsComponent,
    canActivate: [RoleGuard],
    data: { roles: [RolUsuario.TALLER] },
  },
  {
    path: 'assignments',
    component: AssignmentsComponent,
    canActivate: [RoleGuard],
    data: { roles: [RolUsuario.TALLER] },
  },
  {
    path: 'service-results',
    component: ServiceResultsComponent,
    canActivate: [RoleGuard],
    data: { roles: [RolUsuario.TALLER] },
  },
  {
    path: 'tracking-recojo',
    component: TrackingRecojoComponent,
    canActivate: [RoleGuard],
    data: { roles: [RolUsuario.TALLER] },
  },
  {
    path: 'workers',
    component: WorkersComponent,
    canActivate: [RoleGuard],
    data: { roles: [RolUsuario.TALLER] },
  },
];
