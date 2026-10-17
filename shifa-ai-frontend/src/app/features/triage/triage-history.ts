import { AppLanguage, HealthResponse } from '../../core/models/health-response.model';
import { ConversationMessage, FollowUpMessage } from '../../core/models/conversation.model';
import { TriageResponse } from '../../core/models/triage.model';
import { extractResponseSummary } from '../../core/utils/response-summary';

export interface RestoredTriageConversation {
  response: TriageResponse;
  followUpMessages: FollowUpMessage[];
}

function parseAssistantContent(content: string): unknown {
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

function isTriageResponse(candidate: unknown): candidate is TriageResponse {
  if (typeof candidate !== 'object' || candidate === null) {
    return false;
  }
  const response = candidate as TriageResponse;
  const hasAssessment = typeof response.triage === 'object' && response.triage !== null;
  return hasAssessment || response.origin === 'triage';
}

export function restoreTriageConversation(
  messages: ConversationMessage[],
  language: AppLanguage
): RestoredTriageConversation | null {
  const firstAssistantIndex = messages.findIndex((message) => message.role === 'assistant');
  if (firstAssistantIndex < 0) {
    return null;
  }

  const response = parseAssistantContent(messages[firstAssistantIndex].content);
  if (!isTriageResponse(response)) {
    return null;
  }

  const followUpMessages = messages.slice(firstAssistantIndex + 1).map((message): FollowUpMessage => {
    if (message.role === 'user') {
      return { role: 'user', text: message.content };
    }
    const parsed = parseAssistantContent(message.content);
    return {
      role: 'assistant',
      text: parsed ? extractResponseSummary(parsed as HealthResponse, language) : message.content,
    };
  });

  return { response, followUpMessages };
}
