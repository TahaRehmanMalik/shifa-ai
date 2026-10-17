import { Routes } from '@angular/router';
import { TriageFormComponent } from './triage-form.component';
import { TriageResultComponent } from './triage-result.component';

export const TRIAGE_ROUTES: Routes = [
  { path: '', component: TriageFormComponent },
  { path: 'result', component: TriageResultComponent },
];
