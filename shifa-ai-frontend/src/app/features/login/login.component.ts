import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LanguageSwitcherComponent } from '../../shared/components/language-switcher/language-switcher.component';
import { NormalizedHttpError } from '../../core/interceptors/error.interceptor';
import { AppLanguage } from '../../core/models/health-response.model';
import { AuthService } from '../../core/services/auth.service';
import { LanguageService } from '../../core/services/language.service';

declare const google: any;

interface LoginCopy {
  title: string;
  continueWithGoogle: string;
  orDivider: string;
  emailLabel: string;
  emailRequiredError: string;
  emailInvalidError: string;
  sendCode: string;
  otpSentNotice: string;
  otpLabel: string;
  otpRequiredError: string;
  otpInvalidError: string;
  verify: string;
  changeEmail: string;
  googleErrorFallback: string;
}

const LOGIN_COPY: Record<AppLanguage, LoginCopy> = {
  en: {
    title: 'Sign in to Shifa AI',
    continueWithGoogle: 'Continue with Google',
    orDivider: 'or',
    emailLabel: 'Email address',
    emailRequiredError: 'Email is required',
    emailInvalidError: 'Enter a valid email address',
    sendCode: 'Send code',
    otpSentNotice: 'We sent a 6-digit code to your email.',
    otpLabel: '6-digit code',
    otpRequiredError: 'Enter the code sent to your email',
    otpInvalidError: 'Enter the 6-digit code',
    verify: 'Verify',
    changeEmail: 'Use a different email',
    googleErrorFallback: 'Google sign-in failed. Please try again.',
  },
  ur: {
    title: 'شفا اے آئی میں سائن ان کریں',
    continueWithGoogle: 'گوگل کے ساتھ جاری رکھیں',
    orDivider: 'یا',
    emailLabel: 'ای میل ایڈریس',
    emailRequiredError: 'ای میل درکار ہے',
    emailInvalidError: 'براہ کرم درست ای میل ایڈریس درج کریں',
    sendCode: 'کوڈ بھیجیں',
    otpSentNotice: 'ہم نے آپ کے ای میل پر 6 ہندسوں کا کوڈ بھیج دیا ہے۔',
    otpLabel: '6 ہندسوں کا کوڈ',
    otpRequiredError: 'اپنے ای میل پر بھیجا گیا کوڈ درج کریں',
    otpInvalidError: '6 ہندسوں کا کوڈ درج کریں',
    verify: 'تصدیق کریں',
    changeEmail: 'دوسرا ای میل استعمال کریں',
    googleErrorFallback: 'گوگل سائن ان ناکام ہوگیا۔ براہ کرم دوبارہ کوشش کریں۔',
  },
  pa: {
    title: 'شفا اے آئی وچ سائن ان کرو',
    continueWithGoogle: 'گوگل نال جاری رکھو',
    orDivider: 'یا',
    emailLabel: 'ای میل ایڈریس',
    emailRequiredError: 'ای میل ضروری اے',
    emailInvalidError: 'براہ مہربانی درست ای میل ایڈریس پاؤ',
    sendCode: 'کوڈ بھیجو',
    otpSentNotice: 'اسیں تہاڈے ای میل تے 6 ہندسیاں دا کوڈ بھیج دتا اے۔',
    otpLabel: '6 ہندسیاں دا کوڈ',
    otpRequiredError: 'اپنے ای میل تے آیا کوڈ پاؤ',
    otpInvalidError: '6 ہندسیاں دا کوڈ پاؤ',
    verify: 'تصدیق کرو',
    changeEmail: 'دوجا ای میل استعمال کرو',
    googleErrorFallback: 'گوگل سائن ان ناکام ہو گیا۔ براہ مہربانی دوبارہ کوشش کرو۔',
  },
};

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    LanguageSwitcherComponent,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent implements AfterViewInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly languageService = inject(LanguageService);

  @ViewChild('googleButton') private readonly googleButtonRef!: ElementRef<HTMLDivElement>;

  protected readonly copy = LOGIN_COPY;

  protected readonly otpRequested = signal(false);
  protected readonly isRequestingOtp = signal(false);
  protected readonly isVerifyingOtp = signal(false);
  protected readonly googleError = signal<string | null>(null);

  protected readonly emailControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.email],
  });

  protected readonly otpControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.pattern(/^\d{6}$/)],
  });

  protected readonly emailForm = new FormGroup({
    email: this.emailControl,
  });

  protected readonly otpForm = new FormGroup({
    otp: this.otpControl,
  });

  ngAfterViewInit(): void {
    this.loadGoogleScript().then(() => this.renderGoogleButton());
  }

  protected requestOtp(): void {
    if (this.emailControl.invalid || this.isRequestingOtp()) {
      this.emailControl.markAsTouched();
      return;
    }

    this.isRequestingOtp.set(true);

    this.authService
      .requestOtp(this.emailControl.value)
      .pipe(finalize(() => this.isRequestingOtp.set(false)))
      .subscribe({
        next: () => {
          this.otpRequested.set(true);
          this.otpControl.reset('');
        },
        error: (error: NormalizedHttpError) => {
          this.emailControl.setErrors({ server: error.message });
          this.emailControl.markAsTouched();
        },
      });
  }

  protected verifyOtp(): void {
    if (this.otpControl.invalid || this.isVerifyingOtp()) {
      this.otpControl.markAsTouched();
      return;
    }

    this.isVerifyingOtp.set(true);

    this.authService
      .verifyOtp(this.emailControl.value, this.otpControl.value)
      .pipe(finalize(() => this.isVerifyingOtp.set(false)))
      .subscribe({
        next: () => this.router.navigateByUrl('/'),
        error: (error: NormalizedHttpError) => {
          this.otpControl.setErrors({ server: error.message });
          this.otpControl.markAsTouched();
        },
      });
  }

  protected changeEmail(): void {
    this.otpRequested.set(false);
    this.otpControl.reset('');
  }

  private loadGoogleScript(): Promise<void> {
    if (typeof google !== 'undefined') {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      document.head.appendChild(script);
    });
  }

  private renderGoogleButton(): void {
    google.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: (response: { credential: string }) => this.handleGoogleCredential(response.credential),
    });

    google.accounts.id.renderButton(this.googleButtonRef.nativeElement, {
      theme: 'outline',
      size: 'large',
      width: 320,
    });
  }

  private handleGoogleCredential(idToken: string): void {
    this.googleError.set(null);

    this.authService.loginWithGoogle(idToken).subscribe({
      next: () => this.router.navigateByUrl('/'),
      error: (error: NormalizedHttpError) => {
        this.googleError.set(error.message || LOGIN_COPY[this.languageService.currentLanguage()].googleErrorFallback);
      },
    });
  }
}
