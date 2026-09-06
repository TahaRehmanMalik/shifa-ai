import { AppLanguage, HealthResponse } from '../models/health-response.model';

export function extractResponseSummary(result: HealthResponse, language: AppLanguage): string {
  const isEnglish = language === 'en';

  switch (result.response_type) {
    case 'medicine_info':
      return (isEnglish ? result.medicine_summary_en : result.medicine_summary_ur) ?? '';
    case 'off_topic':
    case 'unsafe_request':
      return (isEnglish ? result.message_en : result.message_ur) ?? '';
    case 'health_query':
    default:
      return (isEnglish ? result.root_cause_en : result.root_cause_ur) ?? '';
  }
}
