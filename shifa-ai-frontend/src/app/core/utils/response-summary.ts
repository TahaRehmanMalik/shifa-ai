import { AppLanguage, HealthResponse } from '../models/health-response.model';
import { localizedText } from './localized-text';

export function extractResponseSummary(result: HealthResponse, language: AppLanguage): string {
  switch (result.response_type) {
    case 'medicine_info':
      return localizedText(result, 'medicine_summary', language);
    case 'off_topic':
    case 'unsafe_request':
      return localizedText(result, 'message', language);
    case 'health_query':
    default:
      return localizedText(result, 'root_cause', language);
  }
}
