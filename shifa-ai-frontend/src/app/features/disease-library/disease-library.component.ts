import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { BackButtonComponent } from '../../shared/components/back-button/back-button.component';
import { LanguageSwitcherComponent } from '../../shared/components/language-switcher/language-switcher.component';
import { LoadingIndicatorComponent } from '../../shared/components/loading-indicator/loading-indicator.component';
import { UserMenuComponent } from '../../shared/components/user-menu/user-menu.component';
import { DiseaseSummary } from '../../core/models/health-response.model';
import { LanguageService } from '../../core/services/language.service';
import { ResultService } from '../../core/services/result.service';
import { SymptomApiService } from '../../core/services/symptom-api.service';

@Component({
  selector: 'app-disease-library',
  standalone: true,
  imports: [
    MatIconModule,
    MatListModule,
    MatToolbarModule,
    BackButtonComponent,
    LanguageSwitcherComponent,
    LoadingIndicatorComponent,
    UserMenuComponent,
  ],
  templateUrl: './disease-library.component.html',
  styleUrl: './disease-library.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiseaseLibraryComponent {
  private readonly symptomApiService = inject(SymptomApiService);
  private readonly resultService = inject(ResultService);
  private readonly router = inject(Router);
  protected readonly languageService = inject(LanguageService);

  protected readonly diseases = signal<DiseaseSummary[]>([]);
  protected readonly isLoading = signal(true);

  constructor() {
    this.symptomApiService
      .getDiseases()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe((diseases) => this.diseases.set(diseases));
  }

  protected displayName(disease: DiseaseSummary): string {
    const language = this.languageService.currentLanguage();
    if (language === 'en') {
      return disease.name_en;
    }
    if (language === 'ur') {
      return disease.name_ur;
    }
    return disease.name_pa ?? disease.name_en;
  }

  protected onDiseaseSelected(disease: DiseaseSummary): void {
    this.symptomApiService.getDiseaseById(disease.id).subscribe((result) => {
      this.resultService.setResult(result);
      this.router.navigate(['/result']);
    });
  }
}
