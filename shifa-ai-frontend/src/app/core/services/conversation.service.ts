import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ConversationMessage, ConversationSummary } from '../models/conversation.model';

@Injectable({ providedIn: 'root' })
export class ConversationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  listConversations(): Observable<ConversationSummary[]> {
    return this.http
      .get<{ conversations: ConversationSummary[] }>(`${this.baseUrl}/conversations`)
      .pipe(map((response) => response.conversations));
  }

  getMessages(conversationId: number): Observable<ConversationMessage[]> {
    return this.http
      .get<{ conversationId: number; messages: ConversationMessage[] }>(
        `${this.baseUrl}/conversations/${conversationId}/messages`
      )
      .pipe(map((response) => response.messages));
  }
}
