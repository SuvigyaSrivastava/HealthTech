import type { Address, EmergencyContact, RiskLevel } from './common.types';

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthUser {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  role: 'admin' | 'doctor' | 'nurse' | 'staff';
  permissions: string[];
  lastLogin: Date;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  sessionExpiry: Date | null;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: Date;
  endDate?: Date;
  prescribedBy: string;
  purpose: string;
  sideEffects?: string[];
}

export interface VitalSign {
  id: string;
  timestamp: Date;
  bloodPressure: { systolic: number; diastolic: number };
  heartRate: number;
  temperature: number;
  respiratoryRate: number;
  oxygenSaturation: number;
  weight: number;
  height: number;
  recordedBy: string;
}

export interface LabResult {
  id: string;
  testName: string;
  testCode: string;
  date: Date;
  results: Array<{
    parameter: string;
    value: number;
    unit: string;
    referenceRange: { min: number; max: number };
    isAbnormal: boolean;
  }>;
  orderedBy: string;
  notes?: string;
}

export interface Prescription {
  id: string;
  medication: Medication;
  prescribedAt: Date;
  prescribedBy: string;
  notes?: string;
}

export interface Procedure {
  id: string;
  name: string;
  date: Date;
  performedBy: string;
  notes?: string;
  outcome?: string;
}

export interface Appointment {
  id: string;
  scheduledAt: Date;
  provider: string;
  type: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
}

export interface Admission {
  id: string;
  admittedAt: Date;
  dischargedAt?: Date;
  reason: string;
  ward?: string;
  notes?: string;
}

export interface RiskFactor {
  category: 'demographic' | 'medical_history' | 'clinical_data' | 'behavioral';
  factor: string;
  score: number;
  weight: number;
  description: string;
}

export interface Patient {
  id: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    gender: 'male' | 'female' | 'other';
    contactNumber: string;
    email: string;
    address: Address;
    emergencyContact: EmergencyContact;
    photoURL?: string;
  };
  medicalInfo: {
    bloodType: string;
    allergies: string[];
    chronicConditions: string[];
    currentMedications: Medication[];
    primaryDiagnosis: string;
    diagnosisDate: Date;
  };
  clinicalData: {
    vitals: VitalSign[];
    labResults: LabResult[];
    prescriptions: Prescription[];
    procedures: Procedure[];
    appointments: Appointment[];
    admissions: Admission[];
  };
  riskProfile: {
    overallRiskLevel: RiskLevel;
    riskFactors: RiskFactor[];
    riskScore: number;
    lastAssessment: Date;
  };
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    lastModifiedBy: string;
    isActive: boolean;
  };
}

export interface PatientFilters {
  search?: string;
  riskLevel?: RiskLevel | '';
  diagnosis?: string;
  dateFrom?: Date;
  dateTo?: Date;
}
