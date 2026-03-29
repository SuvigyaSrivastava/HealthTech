import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Users, Activity, AlertTriangle, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { patientService } from '../../patients/services/patientService';
import { getMockPatients } from '../../../shared/utils/mockData';
import { ROUTES, RISK_COLORS } from '../../../shared/constants/routes';
import { calculateAge } from '../../../shared/utils/formatters';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const GRAD: React.CSSProperties = { background: 'linear-gradient(135deg, #524CDE, #AD6FD8)' };

const StatCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: number;
}> = ({ title, value, subtitle, icon, trend }) => (
  <div className="bg-white rounded-2xl shadow-sm p-5 relative overflow-hidden border border-gray-100">
    <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={GRAD} />
    <div className="flex items-start justify-between mt-1">
      <div>
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{title}</p>
        <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        {trend !== undefined && (
          <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            <span>{Math.abs(trend)}% vs last month</span>
          </div>
        )}
      </div>
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-sm"
        style={GRAD}
      >
        {icon}
      </div>
    </div>
  </div>
);

const RISK_PIE_COLORS = ['#10b981', '#f59e0b', '#ef4444', '#dc2626'];

export const DashboardPage: React.FC = () => {
  const { data: stats, refetch, isFetching } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: patientService.getStats,
    refetchInterval: 30000,
  });

  const patients = getMockPatients();
  const recentPatients = patients.slice(0, 5);

  const visitData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return { day: d.toLocaleDateString('en', { weekday: 'short' }), visits: Math.floor(Math.random() * 30) + 15 };
  });

  const riskDistribution = ['low', 'medium', 'high', 'critical'].map((level, i) => ({
    name: level.charAt(0).toUpperCase() + level.slice(1),
    value: patients.filter((p) => p.riskProfile.overallRiskLevel === level).length,
    color: RISK_PIE_COLORS[i],
  }));

  const criticalPatients = patients.filter((p) => p.riskProfile.overallRiskLevel === 'critical').slice(0, 3);

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Overview</h2>
          <p className="text-sm text-gray-400 mt-0.5">Updated just now</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-all shadow-sm"
        >
          <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Patients" value={stats?.total ?? 120} subtitle="Registered" icon={<Users size={18} />} trend={5.2} />
        <StatCard title="Active Cases" value={stats?.active ?? 98} icon={<Activity size={18} />} trend={2.1} />
        <StatCard title="High Risk" value={stats?.highRisk ?? 24} subtitle="Close monitoring" icon={<AlertTriangle size={18} />} trend={-1.5} />
        <StatCard title="Critical Alerts" value={stats?.critical ?? 8} subtitle="Immediate attention" icon={<AlertTriangle size={18} />} trend={3.0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <p className="font-semibold text-gray-800 mb-5">Visits — last 7 days</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={visitData}>
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 12, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }} cursor={{ stroke: '#e5e7eb' }} />
              <Line type="monotone" dataKey="visits" stroke="#524CDE" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <p className="font-semibold text-gray-800 mb-4">Risk distribution</p>
          <ResponsiveContainer width="100%" height={130}>
            <PieChart>
              <Pie data={riskDistribution} dataKey="value" cx="50%" cy="50%" outerRadius={55} strokeWidth={0}>
                {riskDistribution.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-3 space-y-2">
            {riskDistribution.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-gray-500">{item.name}</span>
                </div>
                <span className="font-semibold text-gray-700">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <p className="font-semibold text-gray-800">Recent patients</p>
            <Link to={ROUTES.PATIENTS} className="text-xs font-medium hover:underline" style={{ color: '#524CDE' }}>View all</Link>
          </div>
          <div className="space-y-1">
            {recentPatients.map((patient) => (
              <Link key={patient.id} to={`/patients/${patient.id}`} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
                  style={GRAD}
                >
                  {patient.personalInfo.firstName[0]}{patient.personalInfo.lastName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{patient.personalInfo.firstName} {patient.personalInfo.lastName}</p>
                  <p className="text-xs text-gray-400 truncate">{patient.medicalInfo.primaryDiagnosis}</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${RISK_COLORS[patient.riskProfile.overallRiskLevel]}`}>
                  {patient.riskProfile.overallRiskLevel}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <p className="font-semibold text-gray-800">Critical alerts</p>
            {criticalPatients.length > 0 && <span className="text-xs text-red-600 font-semibold">{criticalPatients.length} active</span>}
          </div>
          {criticalPatients.length === 0 ? (
            <div className="py-8 text-center text-gray-400"><p className="text-sm">No critical alerts</p></div>
          ) : (
            <div className="space-y-2.5">
              {criticalPatients.map((patient) => (
                <Link key={patient.id} to={`/patients/${patient.id}`} className="flex items-start gap-3 p-3.5 border border-red-100 bg-red-50 rounded-xl hover:bg-red-100 transition-colors">
                  <AlertTriangle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{patient.personalInfo.firstName} {patient.personalInfo.lastName}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{patient.medicalInfo.primaryDiagnosis} · score {patient.riskProfile.riskScore}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
