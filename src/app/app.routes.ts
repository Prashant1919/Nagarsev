import { Routes } from '@angular/router';
import { authGuard, publicGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/login.component').then((m) => m.LoginComponent),
    canActivate: [publicGuard],
    title: 'Login — Nagarsevak Dashboard',
  },
  {
    path: '',
    loadComponent: () =>
      import('./layout/shell/shell.component').then((m) => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent
          ),
        title: 'Dashboard — Nagarsevak',
      },
      {
        path: 'scheduler',
        loadComponent: () =>
          import('./features/scheduler/scheduler.component').then(
            (m) => m.SchedulerComponent
          ),
        title: 'Daily Schedule — Nagarsevak',
      },
      {
        path: 'records',
        loadComponent: () =>
          import('./features/records/records.component').then(
            (m) => m.RecordsComponent
          ),
        title: 'Citizen Records — Nagarsevak',
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
