export type AppLanguage = 'en' | 'ur' | 'pa';

export type ResultSource = 'database' | 'ai' | 'blocked';

export type ResponseType = 'health_query' | 'medicine_info' | 'off_topic' | 'unsafe_request';

export interface HealthResponse {
  source: ResultSource;
  provider?: string;
  groundedInSearch?: boolean;
  conversationId?: string;
  response_type: ResponseType;
  // health_query fields
  condition_en?: string;
  condition_ur?: string;
  root_cause_en?: string;
  root_cause_ur?: string;
  diet_plan_en?: string;
  diet_plan_ur?: string;
  medicine_class_en?: string;
  medicine_class_ur?: string;
  citations?: string[];
  // medicine_info fields
  medicine_summary_en?: string;
  medicine_summary_ur?: string;
  // health_query / medicine_info
  disclaimer_en?: string;
  disclaimer_ur?: string;
  // off_topic / unsafe_request fields
  message_en?: string;
  message_ur?: string;
}

export interface DiseaseSummary {
  id: string;
  name_en: string;
  name_ur: string;
  name_pa: string | null;
}

export interface SymptomSearchRequest {
  symptomText: string;
  language: AppLanguage;
  mode?: 'text' | 'voice';
  conversationId?: string;
}
