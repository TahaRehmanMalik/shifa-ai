import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { BackButtonComponent } from '../../shared/components/back-button/back-button.component';
import { DisclaimerBannerComponent } from '../../shared/components/disclaimer-banner/disclaimer-banner.component';
import { LanguageSwitcherComponent } from '../../shared/components/language-switcher/language-switcher.component';
import { TriageBadgeComponent } from '../../shared/components/triage-badge/triage-badge.component';
import { UserMenuComponent } from '../../shared/components/user-menu/user-menu.component';
import { VoiceInputButtonComponent } from '../../shared/components/voice-input-button/voice-input-button.component';
import { NormalizedHttpError } from '../../core/interceptors/error.interceptor';
import { HealthResponse, PunjabiTranslation } from '../../core/models/health-response.model';
import { TriageResponse } from '../../core/models/triage.model';
import { LanguageService } from '../../core/services/language.service';
import { SymptomApiService } from '../../core/services/symptom-api.service';
import { localizedText, needsPunjabiTranslation } from '../../core/utils/localized-text';
import { extractResponseSummary } from '../../core/utils/response-summary';
import { TriageAdviceComponent } from './triage-advice.component';
import { TriageStateService } from './triage-state.service';
import { TRIAGE_TEXT } from './triage-text';

interface AppliedPunjabiTranslation {
  source: HealthResponse;
  fields: PunjabiTranslation;
}

function asAdvice(candidate: TriageResponse | HealthResponse | null | undefined): HealthResponse | null {
  if (!candidate) {
    return null;
  }
  return candidate.response_type === 'health_query' || candidate.response_type === 'medicine_info'
    ? (candidate as HealthResponse)
    : null;
}

@Component({
  selector: 'app-triage-result',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatToolbarModule,
    BackButtonComponent,
    DisclaimerBannerComponent,
    LanguageSwitcherComponent,
    TriageAdviceComponent,
    TriageBadgeComponent,
    UserMenuComponent,
    VoiceInputButtonComponent,
  ],
  templateUrl: './triage-result.component.html',
  styleUrl: './triage-result.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TriageResultComponent {
  private readonly router = inject(Router);
  private readonly symptomApiService = inject(SymptomApiService);
  private readonly triageStateService = inject(TriageStateService);
  protected readonly languageService = inject(LanguageService);

  protected readonly response = this.triageStateService.response;
  protected readonly copy = computed(() => TRIAGE_TEXT[this.languageService.currentLanguage()]);
  protected readonly assessment = computed(() => this.response()?.triage ?? null);
  protected readonly isBlocked = computed(() => !this.assessment());

  protected readonly assessmentMessage = computed(() => this.pickEnglishOrUrdu('message'));
  protected readonly assessmentAction = computed(() => this.pickEnglishOrUrdu('action'));
  protected readonly blockedMessage = computed(() => {
    const response = this.response();
    return response
      ? localizedText(response as HealthResponse, 'message', this.languageService.currentLanguage())
      : '';
  });

  private readonly baseAdvice = computed<HealthResponse | null>(() => {
    const level = this.assessment()?.level;
    if (this.isBlocked() || level === 'emergency') {
      return null;
    }
    return level === 'urgent' ? asAdvice(this.response()?.supporting_advice) : asAdvice(this.response());
  });

  private readonly appliedPunjabiTranslation = signal<AppliedPunjabiTranslation | null>(null);

  protected readonly advice = computed<HealthResponse | null>(() => {
    const base = this.baseAdvice();
    const translation = this.appliedPunjabiTranslation();
    return base && translation?.source === base ? { ...base, ...translation.fields } : base;
  });

  protected readonly disclaimer = computed(() => {
    const advice = this.advice();
    return {
      en: advice?.disclaimer_en || TRIAGE_TEXT.en.disclaimer,
      ur: advice?.disclaimer_ur || TRIAGE_TEXT.ur.disclaimer,
      pa: advice?.disclaimer_pa || TRIAGE_TEXT.pa.disclaimer,
    };
  });

  protected readonly allowsFollowUp = computed(() => {
    const level = this.assessment()?.level;
    return !this.isBlocked() && (level === 'soon' || level === 'self_care');
  });

  protected readonly followUpControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(2)],
  });

  protected readonly followUpForm = new FormGroup({
    followUpText: this.followUpControl,
  });

  protected readonly followUpMessages = this.triageStateService.followUpMessages;
  protected readonly isSendingFollowUp = signal(false);
  protected readonly isTranslatingToPunjabi = signal(false);
  protected readonly punjabiTranslationFailed = signal(false);

  private punjabiTranslationAttemptedFor: HealthResponse | null = null;

  constructor() {
    effect(() => {
      if (!this.response()) {
        this.router.navigate(['/triage']);
      }
    });

    effect(
      () => {
        const base = this.baseAdvice();
        if (this.languageService.currentLanguage() === 'pa' && base) {
          this.translateToPunjabiIfNeeded(base);
        }
      },
      { allowSignalWrites: true }
    );
  }

  protected sendFollowUp(): void {
    if (this.followUpControl.invalid || this.isSendingFollowUp()) {
      this.followUpControl.markAsTouched();
      return;
    }

    const symptomText = this.followUpControl.value.trim();
    if (!symptomText) {
      return;
    }

    this.triageStateService.addFollowUpMessage({ role: 'user', text: symptomText });
    this.followUpControl.reset('');
    this.isSendingFollowUp.set(true);

    this.symptomApiService
      .search({
        symptomText,
        language: this.languageService.currentLanguage(),
        mode: 'text',
        conversationId: this.triageStateService.conversationId() ?? undefined,
      })
      .pipe(finalize(() => this.isSendingFollowUp.set(false)))
      .subscribe({
        next: (result) => {
          if (result.conversationId) {
            this.triageStateService.setConversationId(result.conversationId);
          }
          const answer = extractResponseSummary(result, this.languageService.currentLanguage());
          this.triageStateService.addFollowUpMessage({ role: 'assistant', text: answer });
        },
        error: (error: NormalizedHttpError) => {
          this.triageStateService.addFollowUpMessage({ role: 'assistant', text: error.message });
        },
      });
  }

  protected onTranscriptRecognized(transcript: string): void {
    this.followUpControl.setValue(transcript);
  }

  protected startNewCheck(): void {
    this.triageStateService.clear();
    this.router.navigate(['/triage']);
  }

  private pickEnglishOrUrdu(field: 'message' | 'action'): string {
    const assessment = this.assessment();
    if (!assessment) {
      return '';
    }
    return this.languageService.currentLanguage() === 'en' ? assessment[`${field}_en`] : assessment[`${field}_ur`];
  }

  private translateToPunjabiIfNeeded(advice: HealthResponse): void {
    if (!needsPunjabiTranslation(advice) || this.punjabiTranslationAttemptedFor === advice) {
      return;
    }

    this.punjabiTranslationAttemptedFor = advice;
    this.punjabiTranslationFailed.set(false);
    this.isTranslatingToPunjabi.set(true);

    this.symptomApiService
      .translateToPunjabi(advice)
      .pipe(finalize(() => this.isTranslatingToPunjabi.set(false)))
      .subscribe({
        next: (fields) => this.appliedPunjabiTranslation.set({ source: advice, fields }),
        error: () => this.punjabiTranslationFailed.set(true),
      });
  }
}
