import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Brain, AlertTriangle, CheckCircle2, TrendingUp, Loader2, Search } from 'lucide-react';
import { getMockPatients } from '../../../shared/utils/mockData';
import { secondBrainService } from '../services/secondBrainService';
import { RISK_COLORS } from '../../../shared/constants/routes';
import { cn } from '../../../shared/utils/formatters';
import type { PatientInsights } from '../../../shared/types/secondBrain.types';
import type { Patient } from '../../../shared/types/patient.types';

const GRAD: React.CSSProperties = { background: 'linear-gradient(135deg, #524CDE, #AD6FD8)' };

const patients = getMockPatients().slice(0, 20);

const InsightSummaryCard: React.FC<{
  patient: Patient;
  insights: PatientInsights | null;
  isLoading: boolean;
}> = ({ patient, insights, isLoading }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all duration-200 relative overflow-hidden">
    <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={GRAD} />
    <div className="flex items-start gap-3 mb-4 mt-1">
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 shadow-sm"
        style={GRAD}
      >
        {patient.personalInfo.firstName[0]}{patient.personalInfo.lastName[0]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-gray-900 truncate">
          {patient.personalInfo.firstName} {patient.personalInfo.lastName}
        </p>
        <p className="text-xs text-gray-400 truncate">{patient.medicalInfo.primaryDiagnosis}</p>
      </div>
      <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0', RISK_COLORS[patient.riskProfile.overallRiskLevel])}>
        {patient.riskProfile.overallRiskLevel}
      </span>
    </div>

    {isLoading ? (
      <div className="flex items-center gap-2 text-gray-400 text-xs py-2">
        <Loader2 size={12} className="animate-spin" style={{ color: '#524CDE' }} />
        Analyzing...
      </div>
    ) : insights ? (
      <div>
        <p className="text-xs text-gray-500 mb-3 leading-relaxed">{insights.summary}</p>
        <div className="flex items-center gap-1.5 flex-wrap">
          {insights.riskAlerts.length > 0 && (
            <span className="text-xs text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full flex items-center gap-1">
              <AlertTriangle size={9} />
              {insights.riskAlerts.length} alert{insights.riskAlerts.length > 1 ? 's' : ''}
            </span>
          )}
          {insights.patterns.length > 0 && (
            <span className="text-xs text-gray-500 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full">
              {insights.patterns.length} pattern{insights.patterns.length > 1 ? 's' : ''}
            </span>
          )}
          {insights.riskAlerts.length === 0 && (
            <span className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle2 size={9} />
              Stable
            </span>
          )}
        </div>
      </div>
    ) : (
      <p className="text-xs text-gray-400 py-1">Click to analyze</p>
    )}

    <Link
      to={`/patients/${patient.id}?tab=second-brain`}
      className="mt-4 block text-center text-xs py-2 rounded-xl font-medium transition-all text-white shadow-sm"
      style={GRAD}
    >
      Full analysis
    </Link>
  </div>
);

export const SecondBrainPage: React.FC = () => {
  const [analyzedInsights, setAnalyzedInsights] = useState<Map<string, PatientInsights>>(new Map());
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isAnalyzingAll, setIsAnalyzingAll] = useState(false);

  const filteredPatients = patients.filter((p) =>
    searchQuery
      ? `${p.personalInfo.firstName} ${p.personalInfo.lastName} ${p.id}`.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  const highRiskPatients = filteredPatients.filter((p) =>
    ['high', 'critical'].includes(p.riskProfile.overallRiskLevel)
  );

  const analyzePatient = async (patient: Patient) => {
    if (loadingIds.has(patient.id)) return;
    setLoadingIds((prev) => new Set(prev).add(patient.id));
    try {
      const insights = await secondBrainService.analyze(patient);
      setAnalyzedInsights((prev) => new Map(prev).set(patient.id, insights));
    } finally {
      setLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(patient.id);
        return next;
      });
    }
  };

  const analyzeAll = async () => {
    setIsAnalyzingAll(true);
    for (const patient of highRiskPatients.slice(0, 10)) {
      await analyzePatient(patient);
    }
    setIsAnalyzingAll(false);
  };

  const totalAlerts = Array.from(analyzedInsights.values()).reduce(
    (sum, ins) => sum + ins.riskAlerts.length, 0
  );

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white" style={GRAD}>
              <Brain size={18} />
            </div>
            Second Brain
          </h2>
          <p className="text-sm text-gray-400 mt-0.5 ml-11.5">
            Risk detection, trend analysis, and pattern recognition across your patient population.
          </p>
        </div>
        <button
          onClick={analyzeAll}
          disabled={isAnalyzingAll}
          className="flex items-center gap-2 px-5 py-2.5 text-white text-sm font-medium rounded-xl disabled:opacity-60 transition-all shadow-sm hover:shadow-md hover:-translate-y-px"
          style={GRAD}
        >
          {isAnalyzingAll ? <Loader2 size={13} className="animate-spin" /> : <TrendingUp size={13} />}
          Analyze high-risk patients
        </button>
      </div>

      {/* Stats — only shown after analysis */}
      {analyzedInsights.size > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { value: analyzedInsights.size, label: 'Patients analyzed', color: 'text-gray-900' },
            { value: totalAlerts, label: 'Risk alerts', color: 'text-red-600' },
            {
              value: Array.from(analyzedInsights.values()).filter((ins) => ins.riskAlerts.length === 0).length,
              label: 'Stable patients',
              color: 'text-emerald-600',
            },
          ].map(({ value, label, color }) => (
            <div key={label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={GRAD} />
              <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
              <p className="text-xs text-gray-400 font-medium mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Feature explainer */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <p className="font-semibold text-gray-800 mb-4">What this module does</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: 'Timeline', desc: 'Chronological view of medical events per patient' },
            { title: 'Change detection', desc: 'Flags significant shifts in labs and vitals' },
            { title: 'Risk flags', desc: 'Detects kidney decline, glucose issues, and more' },
            { title: 'Patterns', desc: 'Identifies comorbidity clusters and care gaps' },
          ].map((item) => (
            <div key={item.title} className="p-4 rounded-xl" style={{ backgroundColor: '#EEF0FD' }}>
              <p className="font-semibold text-sm" style={{ color: '#524CDE' }}>{item.title}</p>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Search + Patient grid */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search patients..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-transparent bg-white shadow-sm"
              style={{ '--tw-ring-color': '#524CDE' } as React.CSSProperties}
            />
          </div>
          <span className="text-xs text-gray-400 font-medium">{filteredPatients.length} patients</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredPatients.map((patient) => (
            <div key={patient.id} onClick={() => analyzePatient(patient)} className="cursor-pointer">
              <InsightSummaryCard
                patient={patient}
                insights={analyzedInsights.get(patient.id) || null}
                isLoading={loadingIds.has(patient.id)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
