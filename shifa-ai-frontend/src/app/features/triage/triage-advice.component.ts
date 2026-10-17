import { ChangeDetectionStrategy, Component, Input, computed, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { HealthResponse, LocalizedField } from '../../core/models/health-response.model';
import { LanguageService } from '../../core/services/language.service';
import { localizedText } from '../../core/utils/localized-text';
import { TRIAGE_TEXT } from './triage-text';

@Component({
  selector: 'app-triage-advice',
  standalone: true,
  imports: [MatCardModule],
  templateUrl: './triage-advice.component.html',
  styleUrl: './triage-advice.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TriageAdviceComponent {
  private readonly languageService = inject(LanguageService);

  protected readonly advice = signal<HealthResponse>({ source: 'database', response_type: 'health_query' });

  @Input({ required: true, alias: 'advice' })
  set adviceInput(value: HealthResponse) {
    this.advice.set(value);
  }

  protected readonly copy = computed(() => TRIAGE_TEXT[this.languageService.currentLanguage()]);

  protected text(field: LocalizedField): string {
    return localizedText(this.advice(), field, this.languageService.currentLanguage());
  }
}
