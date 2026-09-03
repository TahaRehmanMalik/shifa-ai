import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { ConfirmDialogComponent, ConfirmDialogData } from '../confirm-dialog/confirm-dialog.component';
import { AppLanguage } from '../../../core/models/health-response.model';
import { LanguageService } from '../../../core/services/language.service';
import { ResultService } from '../../../core/services/result.service';

const GO_BACK_DIALOG_TEXT: Record<AppLanguage, ConfirmDialogData> = {
  en: {
    title: 'Go back?',
    message: 'Your current session will be closed when you go back.',
    confirmText: 'Go Back',
    cancelText: 'Cancel',
  },
  ur: {
    title: 'واپس جائیں؟',
    message: 'واپس جانے پر آپ کی موجودہ سیشن بند ہو جائے گی۔',
    confirmText: 'واپس جائیں',
    cancelText: 'منسوخ کریں',
  },
  pa: {
    title: 'واپس جاؤ؟',
    message: 'واپس جان تے تہاڈی موجودہ سیشن بند ہو جاسی۔',
    confirmText: 'واپس جاؤ',
    cancelText: 'منسوخ کرو',
  },
};

@Component({
  selector: 'app-back-button',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './back-button.component.html',
  styleUrl: './back-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BackButtonComponent {
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly resultService = inject(ResultService);
  private readonly languageService = inject(LanguageService);

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
      startWith(this.router.url)
    ),
    { initialValue: this.router.url }
  );

  protected readonly isDashboard = () => this.currentUrl() === '/';

  protected goBack(): void {
    if (this.currentUrl().startsWith('/result')) {
      const dialogRef = this.dialog.open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
        width: '360px',
        data: GO_BACK_DIALOG_TEXT[this.languageService.currentLanguage()],
      });

      dialogRef.afterClosed().subscribe((confirmed) => {
        if (confirmed) {
          this.resultService.startNewSearch();
          this.router.navigate(['/']);
        }
      });
      return;
    }

    this.router.navigate(['/']);
  }
}
