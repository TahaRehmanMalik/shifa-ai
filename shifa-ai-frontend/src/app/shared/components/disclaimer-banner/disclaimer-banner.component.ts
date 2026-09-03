import { ChangeDetectionStrategy, Component, Input, computed, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-disclaimer-banner',
  standalone: true,
  imports: [MatCardModule, MatIconModule],
  templateUrl: './disclaimer-banner.component.html',
  styleUrl: './disclaimer-banner.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DisclaimerBannerComponent {
  private readonly languageService = inject(LanguageService);

  private readonly disclaimerEnSignal = signal('');
  private readonly disclaimerUrSignal = signal('');

  @Input({ required: true })
  set disclaimerEn(value: string) {
    this.disclaimerEnSignal.set(value);
  }

  @Input({ required: true })
  set disclaimerUr(value: string) {
    this.disclaimerUrSignal.set(value);
  }

  readonly disclaimerText = computed(() =>
    this.languageService.currentLanguage() === 'en' ? this.disclaimerEnSignal() : this.disclaimerUrSignal()
  );
}
