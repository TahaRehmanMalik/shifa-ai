import { Injectable, signal } from '@angular/core';
import { FollowUpMessage } from '../../core/models/conversation.model';
import { TriageResponse } from '../../core/models/triage.model';

@Injectable({ providedIn: 'root' })
export class TriageStateService {
  private readonly responseSignal = signal<TriageResponse | null>(null);
  private readonly conversationIdSignal = signal<string | null>(null);
  private readonly followUpMessagesSignal = signal<FollowUpMessage[]>([]);

  readonly response = this.responseSignal.asReadonly();
  readonly conversationId = this.conversationIdSignal.asReadonly();
  readonly followUpMessages = this.followUpMessagesSignal.asReadonly();

  setResponse(response: TriageResponse): void {
    this.restore(response, response.conversationId ?? null, []);
  }

  restore(response: TriageResponse, conversationId: string | null, followUpMessages: FollowUpMessage[]): void {
    this.responseSignal.set(response);
    this.conversationIdSignal.set(conversationId === null ? null : String(conversationId));
    this.followUpMessagesSignal.set(followUpMessages);
  }

  setConversationId(conversationId: string): void {
    this.conversationIdSignal.set(String(conversationId));
  }

  addFollowUpMessage(message: FollowUpMessage): void {
    this.followUpMessagesSignal.update((messages) => [...messages, message]);
  }

  clear(): void {
    this.responseSignal.set(null);
    this.conversationIdSignal.set(null);
    this.followUpMessagesSignal.set([]);
  }
}
