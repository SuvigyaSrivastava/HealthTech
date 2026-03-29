import React, { useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  AlertTriangle,
  Phone,
  Mail,
  Droplets,
  Calendar,
  Pill,
  FlaskConical,
  Activity,
  Brain,
  FileText,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { patientService } from '../services/patientService';
import { secondBrainService } from '../../second-brain/services/secondBrainService';
import { RISK_COLORS, RISK_BORDER_COLORS, ROUTES } from '../../../shared/constants/routes';
import { formatDate, calculateAge, cn } from '../../../shared/utils/formatters';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { RiskAlert, LabChange, VitalChange, DetectedPattern, PatientInsights } from '../../../shared/types/secondBrain.types';

type Tab = 'overview' | 'labs' | 'medications' | 'second-brain' | 'history';

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <Activity size={15} /> },
  { id: 'history', label: 'Medical History', icon: <Calendar size={15} /> },
  { id: 'labs', label: 'Lab Results', icon: <FlaskConical size={15} /> },
  { id: 'medications', label: 'Medications', icon: <Pill size={15} /> },
  { id: 'second-brain', label: '🧠 Second Brain', icon: <Brain size={15} /> },
];

// ─── Sub Components ─────────────────────────────────────────────────────

const TrendIcon: React.FC<{ trend: 'rising' | 'falling' | 'stable' }> = ({ trend }) => {
  if (trend === 'rising') return <TrendingUp size={14} className="text-red-500" />;
  if (trend === 'falling') return <TrendingDown size={14} className="text-green-500" />;
  return <Minus size={14} className="text-gray-400" />;
};

const RiskAlertCard: React.FC<{ alert: RiskAlert }> = ({ alert }) => {
  const styles = {
    info: 'border-blue-400 bg-blue-50',
    warning: 'border-yellow-400 bg-yellow-50',
    critical: 'border-red-500 bg-red-50',
  };
  return (
    <div className={cn('border-l-4 rounded-lg p-4', styles[alert.severity])}>
      <div className="flex items-start gap-3">
        <AlertTriangle size={16} className={alert.severity === 'critical' ? 'text-red-500' : 'text-yellow-500'} />
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900">{alert.title}</h4>
          <p className="text-sm text-gray-600 mt-1">{alert.description}</p>
          {alert.recommendation && (
            <div className="mt-2 p-2 bg-white rounded border text-sm">
              <span className="font-medium">Recommendation: </span>
              {alert.recommendation}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const LabChangeCard: React.FC<{ change: LabChange }> = ({ change }) => {
  const styles = {
    info: 'border-blue-300 bg-blue-50',
    warning: 'border-yellow-300 bg-yellow-50',
    critical: 'border-red-300 bg-red-50',
  };
  const chartData = change.values.map((v, i) => ({ i, value: v }));
  return (
    <div className={cn('border-l-4 p-4 rounded-lg', styles[change.severity])}>
      <div className="flex items-center gap-2 mb-1">
        <TrendIcon trend={change.trend} />
        <span className="font-medium text-sm">{change.parameter}</span>
      </div>
      <p className="text-xs text-gray-600 mb-2">{change.description}</p>
      <ResponsiveContainer width="100%" height={50}>
        <LineChart data={chartData}>
          <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={1.5} dot={false} />
          <Tooltip formatter={(v) => [Number(v).toFixed(2)]} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

const VitalChangeCard: React.FC<{ change: VitalChange }> = ({ change }) => (
  <div className="border border-gray-200 rounded-lg p-3 bg-white">
    <div className="flex items-center justify-between">
      <span className="font-medium text-sm">{change.parameter}</span>
      <span className={cn('text-xs px-2 py-0.5 rounded-full', change.severity === 'warning' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700')}>
        {change.severity}
      </span>
    </div>
    <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
      <span>{change.previousValue}</span>
      <span>→</span>
      <span className="font-semibold">{change.currentValue}</span>
      <span className={cn('text-xs', change.change > 0 ? 'text-red-500' : 'text-green-500')}>
        ({change.change > 0 ? '+' : ''}{change.change.toFixed(1)})
      </span>
    </div>
  </div>
);

const PatternCard: React.FC<{ pattern: DetectedPattern }> = ({ pattern }) => (
  <div className="border border-purple-200 bg-purple-50 rounded-lg p-4">
    <div className="flex items-start justify-between mb-1">
      <h4 className="font-semibold text-purple-900">{pattern.name}</h4>
      <span className="text-xs text-purple-600">{(pattern.confidence * 100).toFixed(0)}% confidence</span>
    </div>
    <p className="text-sm text-purple-700">{pattern.description}</p>
    {pattern.recommendation && (
      <div className="mt-2 p-2 bg-white rounded border border-purple-200 text-sm text-purple-800">
        💡 {pattern.recommendation}
      </div>
    )}
  </div>
);

const SecondBrainTab: React.FC<{ insights: PatientInsights }> = ({ insights }) => (
  <div className="space-y-6">
    {/* Summary */}
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-5 border border-purple-100">
      <h3 className="text-lg font-bold text-gray-800 mb-1">🧠 Second Brain Analysis</h3>
      <p className="text-gray-700">{insights.summary}</p>
      <p className="text-xs text-gray-500 mt-2">Generated just now</p>
    </div>

    {/* Risk score */}
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
      <h4 className="font-semibold mb-3">Risk Score</h4>
      <div className="flex items-center gap-4">
        <div className="relative w-20 h-20">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
            <circle
              cx="18" cy="18" r="15.9" fill="none"
              stroke={insights.riskScore.level === 'critical' ? '#dc2626' : insights.riskScore.level === 'high' ? '#ef4444' : insights.riskScore.level === 'medium' ? '#f59e0b' : '#10b981'}
              strokeWidth="3"
              strokeDasharray={`${insights.riskScore.score} 100`}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-lg font-bold">
            {insights.riskScore.score}
          </span>
        </div>
        <div>
          <span className={cn('text-sm font-semibold px-3 py-1 rounded-full capitalize', RISK_COLORS[insights.riskScore.level])}>
            {insights.riskScore.level} risk
          </span>
          <p className="text-xs text-gray-500 mt-1">Confidence: {(insights.riskScore.confidence * 100).toFixed(0)}%</p>
        </div>
      </div>
      {insights.riskScore.factors.length > 0 && (
        <div className="mt-4 space-y-2">
          {insights.riskScore.factors.map((f, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <span className="text-gray-400">•</span>
              <span className="text-gray-700">{f.description}</span>
              <span className="ml-auto text-xs font-medium text-gray-500">+{f.score}</span>
            </div>
          ))}
        </div>
      )}
    </div>

    {/* Risk Alerts */}
    {insights.riskAlerts.length > 0 && (
      <div>
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <AlertTriangle size={16} className="text-red-500" />
          🚨 Risk Alerts ({insights.riskAlerts.length})
        </h4>
        <div className="space-y-3">
          {insights.riskAlerts.map((alert) => (
            <RiskAlertCard key={alert.id} alert={alert} />
          ))}
        </div>
      </div>
    )}

    {/* Recent Changes */}
    <div>
      <h4 className="font-semibold mb-3">📈 What Changed Recently?</h4>
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-3">
        <p className="text-sm text-blue-800">{insights.recentChanges.summary}</p>
      </div>
      {insights.recentChanges.labChanges.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-600 mb-2">Lab Trends</p>
          <div className="space-y-2">
            {insights.recentChanges.labChanges.map((c, i) => (
              <LabChangeCard key={i} change={c} />
            ))}
          </div>
        </div>
      )}
      {insights.recentChanges.vitalChanges.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-600 mb-2">Vital Changes</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {insights.recentChanges.vitalChanges.map((c, i) => (
              <VitalChangeCard key={i} change={c} />
            ))}
          </div>
        </div>
      )}
    </div>

    {/* Patterns */}
    {insights.patterns.length > 0 && (
      <div>
        <h4 className="font-semibold mb-3">🔍 Detected Patterns</h4>
        <div className="space-y-3">
          {insights.patterns.map((p, i) => (
            <PatternCard key={i} pattern={p} />
          ))}
        </div>
      </div>
    )}

    {/* Timeline */}
    <div>
      <h4 className="font-semibold mb-3">📅 Medical Timeline</h4>
      <div className="relative border-l-2 border-gray-200 pl-6 space-y-4">
        {insights.timeline.events.slice(0, 10).map((event) => {
          const dotColor = event.severity === 'critical' ? 'bg-red-500' : event.severity === 'warning' ? 'bg-yellow-500' : 'bg-blue-400';
          return (
            <div key={event.id} className="relative">
              <div className={cn('absolute -left-[29px] w-4 h-4 rounded-full border-2 border-white', dotColor)} />
              <div className="bg-white rounded-lg border border-gray-100 p-3 hover:shadow-sm transition-shadow">
                <p className="text-xs text-gray-400">{formatDate(event.date)}</p>
                <p className="font-medium text-sm mt-0.5">{event.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{event.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────
export const PatientDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>(
    (searchParams.get('tab') as Tab) || 'overview'
  );

  const { data: patient, isLoading: patientLoading } = useQuery({
    queryKey: ['patient', id],
    queryFn: () => patientService.getById(id!),
    enabled: !!id,
  });

  const { data: insights, isLoading: insightsLoading } = useQuery({
    queryKey: ['second-brain', id],
    queryFn: () => secondBrainService.analyze(patient!),
    enabled: !!patient && activeTab === 'second-brain',
    staleTime: 15 * 60 * 1000,
  });

  if (patientLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-blue-500" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Patient not found</p>
        <Link to={ROUTES.PATIENTS} className="text-blue-600 hover:underline mt-2 block">← Back to Patients</Link>
      </div>
    );
  }

  const age = calculateAge(patient.personalInfo.dateOfBirth);
  const latestVitals = patient.clinicalData.vitals[0];
  const latestLabs = patient.clinicalData.labResults[0];

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Back */}
      <Link to={ROUTES.PATIENTS} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={16} />
        Back to Patients
      </Link>

      {/* Header */}
      <div className={cn('bg-white rounded-xl border-l-4 shadow-sm p-6', RISK_BORDER_COLORS[patient.riskProfile.overallRiskLevel])}>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
              {patient.personalInfo.firstName[0]}{patient.personalInfo.lastName[0]}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {patient.personalInfo.firstName} {patient.personalInfo.lastName}
              </h2>
              <p className="text-gray-500 text-sm">{patient.id}</p>
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                <span>{age} years old</span>
                <span className="capitalize">{patient.personalInfo.gender}</span>
                <span className="flex items-center gap-1">
                  <Droplets size={13} className="text-red-400" />
                  {patient.medicalInfo.bloodType}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={cn('text-sm px-3 py-1 rounded-full font-semibold capitalize', RISK_COLORS[patient.riskProfile.overallRiskLevel])}>
              {patient.riskProfile.overallRiskLevel} Risk
            </span>
            <span className="text-sm text-gray-500">Score: {patient.riskProfile.riskScore}/100</span>
          </div>
        </div>

        {/* Contact info */}
        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-100 text-sm text-gray-600">
          <span className="flex items-center gap-1"><Phone size={13} />{patient.personalInfo.contactNumber}</span>
          <span className="flex items-center gap-1"><Mail size={13} />{patient.personalInfo.email}</span>
          <span className="flex items-center gap-1"><Calendar size={13} />DOB: {formatDate(patient.personalInfo.dateOfBirth)}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
              activeTab === tab.id
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {latestVitals && (
                <>
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Blood Pressure</p>
                    <p className="text-xl font-bold text-gray-900">{latestVitals.bloodPressure.systolic}/{latestVitals.bloodPressure.diastolic}</p>
                    <p className="text-xs text-gray-400">mmHg</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Heart Rate</p>
                    <p className="text-xl font-bold text-gray-900">{latestVitals.heartRate}</p>
                    <p className="text-xs text-gray-400">bpm</p>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">O₂ Saturation</p>
                    <p className="text-xl font-bold text-gray-900">{latestVitals.oxygenSaturation}%</p>
                    <p className="text-xs text-gray-400">SpO₂</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Temperature</p>
                    <p className="text-xl font-bold text-gray-900">{latestVitals.temperature}°C</p>
                    <p className="text-xs text-gray-400">Body temp</p>
                  </div>
                </>
              )}
            </div>

            {/* Primary diagnosis & conditions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-700 mb-3">Primary Diagnosis</h4>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <p className="font-medium text-orange-900">{patient.medicalInfo.primaryDiagnosis}</p>
                  <p className="text-xs text-orange-600 mt-1">Diagnosed: {formatDate(patient.medicalInfo.diagnosisDate)}</p>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-700 mb-3">Chronic Conditions</h4>
                <div className="flex flex-wrap gap-2">
                  {patient.medicalInfo.chronicConditions.length > 0
                    ? patient.medicalInfo.chronicConditions.map((c) => (
                        <span key={c} className="bg-gray-100 text-gray-700 text-xs rounded-full px-2.5 py-1">{c}</span>
                      ))
                    : <p className="text-sm text-gray-400">None recorded</p>
                  }
                </div>
              </div>
            </div>

            {/* Allergies */}
            {patient.medicalInfo.allergies.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Allergies</h4>
                <div className="flex flex-wrap gap-2">
                  {patient.medicalInfo.allergies.map((a) => (
                    <span key={a} className="bg-red-50 text-red-700 border border-red-200 text-xs rounded-full px-2.5 py-1">⚠ {a}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Second Brain */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-100">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-purple-800 flex items-center gap-2">
                  <Brain size={16} />
                  Second Brain Quick View
                </h4>
                <button
                  onClick={() => setActiveTab('second-brain')}
                  className="text-xs text-purple-600 hover:underline"
                >
                  Full Analysis →
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Risk Score: <strong>{patient.riskProfile.riskScore}/100</strong> ({patient.riskProfile.overallRiskLevel} risk)
              </p>
            </div>
          </div>
        )}

        {activeTab === 'labs' && (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-700">Lab Results</h4>
            {patient.clinicalData.labResults.length === 0 ? (
              <p className="text-gray-400">No lab results recorded</p>
            ) : (
              patient.clinicalData.labResults.map((lab) => (
                <div key={lab.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-medium text-gray-800">{lab.testName}</h5>
                    <span className="text-xs text-gray-500">{formatDate(lab.date)}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {lab.results.map((r) => (
                      <div key={r.parameter} className={cn('rounded p-2 text-sm', r.isAbnormal ? 'bg-red-50' : 'bg-gray-50')}>
                        <p className="text-xs text-gray-500">{r.parameter}</p>
                        <p className={cn('font-bold', r.isAbnormal ? 'text-red-600' : 'text-gray-800')}>
                          {r.value} {r.unit}
                        </p>
                        <p className="text-xs text-gray-400">Ref: {r.referenceRange.min}-{r.referenceRange.max}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'medications' && (
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-700">Current Medications</h4>
            {patient.medicalInfo.currentMedications.length === 0 ? (
              <p className="text-gray-400">No medications recorded</p>
            ) : (
              patient.medicalInfo.currentMedications.map((med) => (
                <div key={med.id} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Pill size={16} className="text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{med.name}</p>
                    <p className="text-sm text-gray-500">{med.dosage} — {med.frequency}</p>
                    <p className="text-xs text-gray-400 mt-0.5">For: {med.purpose} • By: {med.prescribedBy}</p>
                    <p className="text-xs text-gray-400">Started: {formatDate(med.startDate)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-700">Medical History</h4>
            <div className="space-y-3">
              <div className="border-l-2 border-orange-400 pl-4">
                <p className="text-xs text-gray-400">Diagnosis</p>
                <p className="font-medium">{patient.medicalInfo.primaryDiagnosis}</p>
                <p className="text-xs text-gray-500">{formatDate(patient.medicalInfo.diagnosisDate)}</p>
              </div>
              {patient.clinicalData.appointments.map((appt) => (
                <div key={appt.id} className="border-l-2 border-blue-400 pl-4">
                  <p className="text-xs text-gray-400">Appointment</p>
                  <p className="font-medium">{appt.type}</p>
                  <p className="text-xs text-gray-500">{formatDate(appt.scheduledAt)} — {appt.provider}</p>
                  <span className={cn('text-xs font-medium', appt.status === 'completed' ? 'text-green-600' : appt.status === 'scheduled' ? 'text-blue-600' : 'text-gray-400')}>
                    {appt.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'second-brain' && (
          <>
            {insightsLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 size={28} className="animate-spin text-purple-500" />
                <p className="ml-3 text-gray-500">Analyzing patient data...</p>
              </div>
            ) : insights ? (
              <SecondBrainTab insights={insights} />
            ) : (
              <p className="text-gray-400 text-center py-10">Click on Second Brain tab to analyze</p>
            )}
          </>
        )}
      </div>
    </div>
  );
};
