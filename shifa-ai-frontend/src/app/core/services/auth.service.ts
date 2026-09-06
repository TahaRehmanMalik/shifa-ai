import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SKIP_ERROR_NOTIFICATION } from '../interceptors/error.interceptor';
import { AuthUser } from '../models/auth-user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/auth`;

  private readonly currentUserSignal = signal<AuthUser | null>(null);
  readonly currentUser = this.currentUserSignal.asReadonly();

  private sessionCheckPromise: Promise<void> | null = null;

  checkSession(): Promise<void> {
    if (!this.sessionCheckPromise) {
      this.sessionCheckPromise = new Promise((resolve) => {
        this.http
          .get<{ user: AuthUser }>(`${this.baseUrl}/me`, {
            context: new HttpContext().set(SKIP_ERROR_NOTIFICATION, true),
          })
          .subscribe({
            next: (response) => {
              this.currentUserSignal.set(response.user);
              resolve();
            },
            error: () => {
              this.currentUserSignal.set(null);
              resolve();
            },
          });
      });
    }

    return this.sessionCheckPromise;
  }

  loginWithGoogle(idToken: string): Observable<{ user: AuthUser }> {
    return this.http
      .post<{ user: AuthUser }>(`${this.baseUrl}/google`, { idToken })
      .pipe(tap((response) => this.currentUserSignal.set(response.user)));
  }

  requestOtp(email: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.baseUrl}/otp/request`, { email });
  }

  verifyOtp(email: string, code: string): Observable<{ user: AuthUser }> {
    return this.http
      .post<{ user: AuthUser }>(`${this.baseUrl}/otp/verify`, { email, code })
      .pipe(tap((response) => this.currentUserSignal.set(response.user)));
  }

  logout(): Observable<{ success: boolean }> {
    return this.http
      .post<{ success: boolean }>(`${this.baseUrl}/logout`, {})
      .pipe(tap(() => this.currentUserSignal.set(null)));
  }
}
