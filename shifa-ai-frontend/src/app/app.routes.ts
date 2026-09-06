import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    loadChildren: () => import('./features/home/home.routes').then((m) => m.HOME_ROUTES),
  },
  {
    path: 'login',
    loadChildren: () => import('./features/login/login.routes').then((m) => m.LOGIN_ROUTES),
  },
  {
    path: 'symptom-search',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/symptom-search/symptom-search.routes').then((m) => m.SYMPTOM_SEARCH_ROUTES),
  },
  {
    path: 'disease-library',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/disease-library/disease-library.routes').then((m) => m.DISEASE_LIBRARY_ROUTES),
  },
  {
    path: 'result',
    canActivate: [authGuard],
    loadChildren: () => import('./features/result/result.routes').then((m) => m.RESULT_ROUTES),
  },
  {
    path: 'history',
    canActivate: [authGuard],
    loadChildren: () => import('./features/history/history.routes').then((m) => m.HISTORY_ROUTES),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
