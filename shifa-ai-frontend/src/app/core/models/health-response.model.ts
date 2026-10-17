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
  condition_pa?: string | null;
  root_cause_en?: string;
  root_cause_ur?: string;
  root_cause_pa?: string | null;
  diet_plan_en?: string;
  diet_plan_ur?: string;
  diet_plan_pa?: string | null;
  medicine_class_en?: string;
  medicine_class_ur?: string;
  medicine_class_pa?: string | null;
  citations?: string[];
  // medicine_info fields
  medicine_summary_en?: string;
  medicine_summary_ur?: string;
  medicine_summary_pa?: string | null;
  // health_query / medicine_info
  disclaimer_en?: string;
  disclaimer_ur?: string;
  disclaimer_pa?: string | null;
  // off_topic / unsafe_request fields
  message_en?: string;
  message_ur?: string;
  message_pa?: string | null;
}

export type LocalizedField =
  | 'condition'
  | 'root_cause'
  | 'diet_plan'
  | 'medicine_class'
  | 'medicine_summary'
  | 'disclaimer'
  | 'message';

export type PunjabiTranslation = Partial<Pick<HealthResponse, `${LocalizedField}_pa`>>;

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
