import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./features/home/home.routes').then((m) => m.HOME_ROUTES),
  },
  {
    path: 'symptom-search',
    loadChildren: () =>
      import('./features/symptom-search/symptom-search.routes').then((m) => m.SYMPTOM_SEARCH_ROUTES),
  },
  {
    path: 'disease-library',
    loadChildren: () =>
      import('./features/disease-library/disease-library.routes').then((m) => m.DISEASE_LIBRARY_ROUTES),
  },
  {
    path: 'result',
    loadChildren: () => import('./features/result/result.routes').then((m) => m.RESULT_ROUTES),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
