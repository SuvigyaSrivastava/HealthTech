import type { Patient } from './patient.types';

export type ChatIntent =
  | 'navigation'
  | 'query_patients'
  | 'query_analytics'
  | 'action_request'
  | 'help'
  | 'second_brain_query'
  | 'general';

export interface Entity {
  type: 'patient_name' | 'patient_id' | 'diagnosis' | 'date' | 'risk_level';
  value: string;
  confidence: number;
}

export interface ChatAction {
  type: 'navigate' | 'search' | 'filter' | 'execute';
  payload: Record<string, unknown>;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    intent?: ChatIntent;
    entities?: Entity[];
    action?: ChatAction;
    confidence?: number;
  };
}

export interface ChatContext {
  currentPage: string;
  selectedPatient: Patient | null;
  recentQueries: string[];
  sessionData: Record<string, unknown>;
}
