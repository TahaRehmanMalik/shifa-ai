import { AppLanguage, HealthResponse, LocalizedField } from '../models/health-response.model';

export function localizedText(result: HealthResponse, field: LocalizedField, language: AppLanguage): string {
  const urduText = result[`${field}_ur`] ?? '';

  if (language === 'en') {
    return result[`${field}_en`] ?? '';
  }
  if (language === 'pa') {
    return result[`${field}_pa`] || urduText;
  }
  return urduText;
}

export function needsPunjabiTranslation(result: HealthResponse): boolean {
  switch (result.response_type) {
    case 'health_query':
      return !result.condition_pa && !result.root_cause_pa && !result.diet_plan_pa;
    case 'medicine_info':
      return !result.medicine_summary_pa;
    default:
      return false;
  }
}
