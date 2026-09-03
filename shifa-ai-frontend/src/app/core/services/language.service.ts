import { Injectable, computed, signal } from '@angular/core';
import { AppLanguage } from '../models/health-response.model';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly currentLanguageSignal = signal<AppLanguage>('ur');

  readonly currentLanguage = this.currentLanguageSignal.asReadonly();

  readonly direction = computed<'rtl' | 'ltr'>(() =>
    this.currentLanguageSignal() === 'en' ? 'ltr' : 'rtl'
  );

  setLanguage(language: AppLanguage): void {
    this.currentLanguageSignal.set(language);
  }
}
