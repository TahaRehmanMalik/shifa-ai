import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { BackButtonComponent } from '../../shared/components/back-button/back-button.component';
import { LanguageSwitcherComponent } from '../../shared/components/language-switcher/language-switcher.component';
import { LoadingIndicatorComponent } from '../../shared/components/loading-indicator/loading-indicator.component';
import { VoiceInputButtonComponent } from '../../shared/components/voice-input-button/voice-input-button.component';
import { NormalizedHttpError } from '../../core/interceptors/error.interceptor';
import { LanguageService } from '../../core/services/language.service';
import { ResultService } from '../../core/services/result.service';
import { SymptomApiService } from '../../core/services/symptom-api.service';

@Component({
  selector: 'app-symptom-search',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatToolbarModule,
    BackButtonComponent,
    LanguageSwitcherComponent,
    LoadingIndicatorComponent,
    VoiceInputButtonComponent,
  ],
  templateUrl: './symptom-search.component.html',
  styleUrl: './symptom-search.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SymptomSearchComponent {
  private readonly symptomApiService = inject(SymptomApiService);
  private readonly resultService = inject(ResultService);
  private readonly router = inject(Router);
  protected readonly languageService = inject(LanguageService);

  protected readonly symptomTextControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(3)],
  });

  protected readonly symptomForm = new FormGroup({
    symptomText: this.symptomTextControl,
  });

  protected readonly isSubmitting = signal(false);
  protected readonly submissionError = signal<string | null>(null);

  protected onTranscriptRecognized(transcript: string): void {
    this.symptomTextControl.setValue(transcript);
  }

  protected onSubmit(): void {
    if (this.symptomForm.invalid || this.isSubmitting()) {
      this.symptomForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.submissionError.set(null);

    this.symptomApiService
      .search({
        symptomText: this.symptomTextControl.value,
        language: this.languageService.currentLanguage(),
        mode: 'text',
      })
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (result) => {
          this.resultService.setResult(result);
          this.router.navigate(['/result']);
        },
        error: (error: NormalizedHttpError) => {
          this.submissionError.set(error.message);
        },
      });
  }
}
