export type ConversationMessageRole = 'user' | 'assistant';

export interface ConversationSummary {
  id: number;
  preview: string | null;
  created_at: string;
}

export interface ConversationMessage {
  id: number;
  role: ConversationMessageRole;
  content: string;
  created_at: string;
}

export interface FollowUpMessage {
  role: ConversationMessageRole;
  text: string;
}
