import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, throwError } from 'rxjs';

export interface NormalizedHttpError {
  message: string;
  status: number;
}

export const SKIP_ERROR_NOTIFICATION = new HttpContextToken<boolean>(() => false);

function extractBackendMessage(error: HttpErrorResponse): string | null {
  const backendError = error.error;
  return backendError && typeof backendError === 'object' && typeof backendError.error === 'string'
    ? backendError.error
    : null;
}

function buildUserMessage(error: HttpErrorResponse): string {
  if (error.status === 0) {
    return 'Unable to reach the server. Please check your connection and try again.';
  }
  if (error.status >= 500) {
    return 'The server encountered a problem. Please try again shortly.';
  }
  if (error.status === 404) {
    return extractBackendMessage(error) ?? 'The requested information could not be found.';
  }
  if (error.status === 400 || error.status === 401) {
    return extractBackendMessage(error) ?? 'The request could not be processed. Please check your input.';
  }
  return 'Something went wrong. Please try again.';
}

export const errorInterceptor: HttpInterceptorFn = (request, next) => {
  const snackBar = inject(MatSnackBar);

  return next(request).pipe(
    catchError((error: unknown) => {
      const httpError = error instanceof HttpErrorResponse ? error : new HttpErrorResponse({ error });
      const normalizedError: NormalizedHttpError = {
        message: buildUserMessage(httpError),
        status: httpError.status,
      };

      if (!request.context.get(SKIP_ERROR_NOTIFICATION)) {
        snackBar.open(normalizedError.message, 'Dismiss', { duration: 5000 });
      }

      return throwError(() => normalizedError);
    })
  );
};
