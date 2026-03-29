export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  PATIENTS: '/patients',
  PATIENT_DETAILS: '/patients/:id',
  ANALYTICS: '/analytics',
  SECOND_BRAIN: '/second-brain',
  SETTINGS: '/settings',
} as const;

export const AUTH_ERRORS: Record<string, string> = {
  'auth/user-not-found': 'No account found with this email',
  'auth/wrong-password': 'Incorrect password',
  'auth/too-many-requests': 'Too many failed attempts. Try again later',
  'auth/network-request-failed': 'Network error. Check your connection',
  'auth/invalid-email': 'Invalid email format',
  'auth/invalid-credential': 'Invalid email or password',
  'auth/popup-closed-by-user': 'Sign-in popup was closed',
};

import type { RiskLevel } from '../types/common.types';

export const RISK_COLORS: Record<RiskLevel, string> = {
  low: 'text-green-600 bg-green-100',
  medium: 'text-yellow-600 bg-yellow-100',
  high: 'text-red-500 bg-red-100',
  critical: 'text-red-700 bg-red-200',
};

export const RISK_BORDER_COLORS: Record<RiskLevel, string> = {
  low: 'border-green-500',
  medium: 'border-yellow-500',
  high: 'border-red-500',
  critical: 'border-red-700',
};

export const DEMO_CREDENTIALS = {
  email: 'demo@healthtech.com',
  password: 'demo1234',
};
