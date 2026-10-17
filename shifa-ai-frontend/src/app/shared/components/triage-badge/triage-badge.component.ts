import { ChangeDetectionStrategy, Component, Input, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { AppLanguage } from '../../../core/models/health-response.model';
import { TriageLevel, TriageReason } from '../../../core/models/triage.model';
import { LanguageService } from '../../../core/services/language.service';

const LEVEL_ICONS: Record<TriageLevel, string> = {
  emergency: 'emergency',
  urgent: 'priority_high',
  soon: 'schedule',
  self_care: 'home',
};

const LEVEL_LABELS: Record<AppLanguage, Record<TriageLevel, string>> = {
  en: {
    emergency: 'Emergency',
    urgent: 'Urgent: see a doctor today',
    soon: 'See a doctor soon',
    self_care: 'Self care at home',
  },
  ur: {
    emergency: 'ایمرجنسی',
    urgent: 'فوری: آج ہی ڈاکٹر کو دکھائیں',
    soon: 'جلد ڈاکٹر کو دکھائیں',
    self_care: 'گھر پر دیکھ بھال',
  },
  pa: {
    emergency: 'ایمرجنسی',
    urgent: 'فوری: اج ای ڈاکٹر نوں وکھاؤ',
    soon: 'چھیتی ڈاکٹر نوں وکھاؤ',
    self_care: 'گھر وچ دیکھ بھال',
  },
};

const FLAGGED_BECAUSE: Record<AppLanguage, string> = {
  en: 'Flagged because:',
  ur: 'اس وجہ سے نشاندہی کی گئی:',
  pa: 'ایس وجہ توں نشان لایا گیا:',
};

@Component({
  selector: 'app-triage-badge',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './triage-badge.component.html',
  styleUrl: './triage-badge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TriageBadgeComponent {
  private readonly languageService = inject(LanguageService);

  protected readonly level = signal<TriageLevel>('self_care');
  private readonly reasonsSignal = signal<TriageReason[]>([]);

  @Input({ required: true, alias: 'level' })
  set levelInput(value: TriageLevel) {
    this.level.set(value);
  }

  @Input()
  set reasons(value: TriageReason[] | null | undefined) {
    this.reasonsSignal.set(value ?? []);
  }

  protected readonly icon = computed(() => LEVEL_ICONS[this.level()]);
  protected readonly levelLabel = computed(() => LEVEL_LABELS[this.languageService.currentLanguage()][this.level()]);
  protected readonly flaggedBecause = computed(() => FLAGGED_BECAUSE[this.languageService.currentLanguage()]);
  protected readonly reasonLabels = computed(() => {
    const isEnglish = this.languageService.currentLanguage() === 'en';
    return this.reasonsSignal().map((reason) => (isEnglish ? reason.label_en : reason.label_ur));
  });
}
