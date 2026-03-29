import type { Patient } from './patient.types';
import type { RiskLevel } from './common.types';

export interface TimelineEvent {
  id: string;
  type: 'diagnosis' | 'medication' | 'procedure' | 'lab' | 'admission' | 'vital';
  date: Date;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  relatedData: unknown;
  icon: string;
  color: string;
}

export interface PatientTimeline {
  patientId: string;
  events: TimelineEvent[];
  keyMilestones: TimelineEvent[];
  generatedAt: Date;
}

export interface VitalChange {
  type: string;
  parameter: string;
  previousValue: number;
  currentValue: number;
  change: number;
  percentChange: number;
  severity: 'info' | 'warning' | 'critical';
  date: Date;
}

export interface MedicationChange {
  type: 'added' | 'removed' | 'modified';
  medication: string;
  date: Date;
  description: string;
}

export interface LabChange {
  testType: string;
  parameter: string;
  values: number[];
  trend: 'rising' | 'falling' | 'stable';
  severity: 'info' | 'warning' | 'critical';
  description: string;
}

export interface RecentChanges {
  newDiagnoses: string[];
  medicationChanges: MedicationChange[];
  vitalChanges: VitalChange[];
  labChanges: LabChange[];
  summary: string;
  generatedAt: Date;
}

export interface RiskScore {
  score: number;
  level: RiskLevel;
  factors: Array<{
    category: string;
    factor: string;
    score: number;
    weight: number;
    description: string;
  }>;
  calculatedAt: Date;
  confidence: number;
}

export interface RiskAlert {
  id: string;
  type: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  recommendation?: string;
  data?: unknown;
  detectedAt: Date;
}

export interface DetectedPattern {
  type: string;
  name: string;
  description: string;
  confidence: number;
  relevance: 'low' | 'medium' | 'high';
  actionable: boolean;
  recommendation?: string;
}

export interface PatientInsights {
  patientId: string;
  timeline: PatientTimeline;
  recentChanges: RecentChanges;
  riskAlerts: RiskAlert[];
  riskScore: RiskScore;
  patterns: DetectedPattern[];
  summary: string;
  generatedAt: Date;
  patient?: Patient;
}
