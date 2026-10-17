import { AppLanguage, HealthResponse, ResponseType } from './health-response.model';

export type TriageLevel = 'emergency' | 'urgent' | 'soon' | 'self_care';

export type TriageAgeGroup = 'infant' | 'child' | 'adult' | 'elderly';

export type TriageSex = 'male' | 'female' | 'other';

export type TriageRedFlagId =
  | 'chest_pain'
  | 'breathing_difficulty'
  | 'confusion'
  | 'fainting'
  | 'seizure'
  | 'severe_bleeding'
  | 'stiff_neck_with_fever'
  | 'blood_in_vomit_or_stool'
  | 'stroke_signs'
  | 'infant_not_feeding'
  | 'severe_dehydration'
  | 'pregnancy_with_bleeding_or_severe_pain'
  | 'suicidal_thoughts';

export type TriageConditionId = 'diabetes' | 'heart_disease' | 'hypertension';

export interface TriageRequest {
  ageGroup: TriageAgeGroup;
  sex: TriageSex;
  isPregnant?: boolean;
  mainComplaint: string;
  durationDays: number;
  severity: number;
  redFlags: TriageRedFlagId[];
  conditions: TriageConditionId[];
  otherConditions?: string;
  language: AppLanguage;
}

export interface TriageReason {
  id: string;
  label_en: string;
  label_ur: string;
}

export interface TriageAssessment {
  level: TriageLevel;
  reasons: TriageReason[];
  escalate: boolean;
  message_en: string;
  message_ur: string;
  action_en: string;
  action_ur: string;
}

export type TriageResponseType = ResponseType | 'triage_escalation' | 'triage_result';

export interface TriageResponse extends Omit<HealthResponse, 'response_type'> {
  response_type: TriageResponseType;
  triage?: TriageAssessment;
  supporting_advice?: HealthResponse | null;
  origin?: 'triage';
}
