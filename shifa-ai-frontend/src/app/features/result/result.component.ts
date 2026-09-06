import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
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
import { VoiceInputButtonComponent } from '../../shared/components/voice-input-button/voice-input-button.component';
import { UserMenuComponent } from '../../shared/components/user-menu/user-menu.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { NormalizedHttpError } from '../../core/interceptors/error.interceptor';
import { LanguageService } from '../../core/services/language.service';
import { ResultService } from '../../core/services/result.service';
import { SymptomApiService } from '../../core/services/symptom-api.service';
import { extractResponseSummary } from '../../core/utils/response-summary';

@Component({
  selector: 'app-result',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatToolbarModule,
    BackButtonComponent,
    DisclaimerBannerComponent,
    LanguageSwitcherComponent,
    VoiceInputButtonComponent,
    UserMenuComponent,
  ],
  templateUrl: './result.component.html',
  styleUrl: './result.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResultComponent {
  private readonly router = inject(Router);
  private readonly symptomApiService = inject(SymptomApiService);
  private readonly dialog = inject(MatDialog);
  protected readonly resultService = inject(ResultService);
  protected readonly languageService = inject(LanguageService);

  protected readonly result = this.resultService.currentResult;

  protected readonly followUpControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(2)],
  });

  protected readonly followUpForm = new FormGroup({
    followUpText: this.followUpControl,
  });

  protected readonly followUpMessages = this.resultService.followUpMessages;
  protected readonly isSendingFollowUp = signal(false);

  constructor() {
    effect(() => {
      if (!this.result()) {
        this.router.navigate(['/']);
      }
    });
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

    this.resultService.addFollowUpMessage({ role: 'user', text: symptomText });
    this.followUpControl.reset('');
    this.isSendingFollowUp.set(true);

    this.symptomApiService
      .search({
        symptomText,
        language: this.languageService.currentLanguage(),
        mode: 'text',
        conversationId: this.resultService.conversationId() ?? undefined,
      })
      .pipe(finalize(() => this.isSendingFollowUp.set(false)))
      .subscribe({
        next: (result) => {
          if (result.conversationId) {
            this.resultService.setConversationId(result.conversationId);
          }
          const answer = extractResponseSummary(result, this.languageService.currentLanguage());
          this.resultService.addFollowUpMessage({ role: 'assistant', text: answer });
        },
        error: (error: NormalizedHttpError) => {
          this.resultService.addFollowUpMessage({ role: 'assistant', text: error.message });
        },
      });
  }

  protected onTranscriptRecognized(transcript: string): void {
    this.followUpControl.setValue(transcript);
  }

  protected startNewSearch(): void {
    const dialogRef = this.dialog.open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
      width: '360px',
      data: {
        title: 'Start a new search?',
        message: 'This ends the current conversation.',
        confirmText: 'Start New Search',
        cancelText: 'Cancel',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.resultService.startNewSearch();
        this.router.navigate(['/symptom-search']);
      }
    });
  }
}
