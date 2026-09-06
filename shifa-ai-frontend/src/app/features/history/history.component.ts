import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { BackButtonComponent } from '../../shared/components/back-button/back-button.component';
import { LanguageSwitcherComponent } from '../../shared/components/language-switcher/language-switcher.component';
import { LoadingIndicatorComponent } from '../../shared/components/loading-indicator/loading-indicator.component';
import { UserMenuComponent } from '../../shared/components/user-menu/user-menu.component';
import { ConversationMessage, ConversationSummary } from '../../core/models/conversation.model';
import { HealthResponse } from '../../core/models/health-response.model';
import { ConversationService } from '../../core/services/conversation.service';
import { LanguageService } from '../../core/services/language.service';
import { ResultService } from '../../core/services/result.service';
import { extractResponseSummary } from '../../core/utils/response-summary';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [
    DatePipe,
    MatIconModule,
    MatListModule,
    MatToolbarModule,
    BackButtonComponent,
    LanguageSwitcherComponent,
    LoadingIndicatorComponent,
    UserMenuComponent,
  ],
  templateUrl: './history.component.html',
  styleUrl: './history.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistoryComponent {
  private readonly conversationService = inject(ConversationService);
  private readonly resultService = inject(ResultService);
  private readonly router = inject(Router);
  protected readonly languageService = inject(LanguageService);

  protected readonly conversations = signal<ConversationSummary[]>([]);
  protected readonly isLoading = signal(true);

  constructor() {
    this.conversationService
      .listConversations()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe((conversations) => this.conversations.set(conversations));
  }

  protected openConversation(conversation: ConversationSummary): void {
    this.conversationService.getMessages(conversation.id).subscribe((messages) => {
      const lastAssistantMessage = [...messages].reverse().find((message) => message.role === 'assistant');
      if (!lastAssistantMessage) {
        return;
      }

      const result = JSON.parse(lastAssistantMessage.content) as HealthResponse;
      this.resultService.setResult(result);
      this.resultService.setConversationId(String(conversation.id));
      this.resultService.setFollowUpMessages(this.buildFollowUpMessages(messages));
      this.router.navigate(['/result']);
    });
  }

  private buildFollowUpMessages(messages: ConversationMessage[]) {
    const firstAssistantIndex = messages.findIndex((message) => message.role === 'assistant');
    const followUpSourceMessages = firstAssistantIndex >= 0 ? messages.slice(firstAssistantIndex + 1) : [];

    return followUpSourceMessages.map((message) => {
      if (message.role === 'user') {
        return { role: 'user' as const, text: message.content };
      }

      const parsedResult = JSON.parse(message.content) as HealthResponse;
      return {
        role: 'assistant' as const,
        text: extractResponseSummary(parsedResult, this.languageService.currentLanguage()),
      };
    });
  }
}
