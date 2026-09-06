import { Injectable, computed, signal } from '@angular/core';
import { FollowUpMessage } from '../models/conversation.model';
import { HealthResponse, ResponseType } from '../models/health-response.model';

@Injectable({ providedIn: 'root' })
export class ResultService {
  private readonly currentResultSignal = signal<HealthResponse | null>(null);
  private readonly conversationIdSignal = signal<string | null>(null);
  private readonly followUpMessagesSignal = signal<FollowUpMessage[]>([]);

  readonly currentResult = this.currentResultSignal.asReadonly();
  readonly conversationId = this.conversationIdSignal.asReadonly();
  readonly followUpMessages = this.followUpMessagesSignal.asReadonly();
  readonly responseType = computed<ResponseType | null>(() => this.currentResultSignal()?.response_type ?? null);

  setResult(result: HealthResponse): void {
    this.currentResultSignal.set(result);
    if (result.conversationId) {
      this.conversationIdSignal.set(result.conversationId);
    }
  }

  setConversationId(conversationId: string): void {
    this.conversationIdSignal.set(conversationId);
  }

  addFollowUpMessage(message: FollowUpMessage): void {
    this.followUpMessagesSignal.update((messages) => [...messages, message]);
  }

  setFollowUpMessages(messages: FollowUpMessage[]): void {
    this.followUpMessagesSignal.set(messages);
  }

  clearResult(): void {
    this.currentResultSignal.set(null);
  }

  startNewSearch(): void {
    this.currentResultSignal.set(null);
    this.conversationIdSignal.set(null);
    this.followUpMessagesSignal.set([]);
  }
}
