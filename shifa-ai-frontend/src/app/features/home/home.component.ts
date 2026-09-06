import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink } from '@angular/router';
import { LanguageSwitcherComponent } from '../../shared/components/language-switcher/language-switcher.component';
import { UserMenuComponent } from '../../shared/components/user-menu/user-menu.component';
import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [MatCardModule, MatIconModule, MatToolbarModule, RouterLink, LanguageSwitcherComponent, UserMenuComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  protected readonly languageService = inject(LanguageService);

  protected readonly titleByLanguage: Record<string, string> = {
    en: 'Shifa AI',
    ur: 'شفا اے آئی',
    pa: 'شفا اے آئی',
  };

  protected readonly subtitleByLanguage: Record<string, string> = {
    en: 'Understand your symptoms with confidence',
    ur: 'اپنی علامات کو اعتماد کے ساتھ سمجھیں',
    pa: 'اپنی علامات نوں اعتماد نال سمجھو',
  };
}
