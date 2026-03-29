import React, { useState } from 'react';
import { getMockPatients } from '../../../shared/utils/mockData';
import { calculateAge } from '../../../shared/utils/formatters';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  CartesianGrid,
} from 'recharts';
import { Download } from 'lucide-react';

const GRAD: React.CSSProperties = { background: 'linear-gradient(135deg, #524CDE, #AD6FD8)' };

const patients = getMockPatients();

const ageGroups = ['18–30', '31–45', '46–60', '61–75', '76+'].map((label) => {
  const parts = label.split('–').map(Number);
  const min = parts[0];
  const max = parts[1] || 200;
  return {
    label,
    count: patients.filter((p) => {
      const age = calculateAge(p.personalInfo.dateOfBirth);
      return age >= min && age <= max;
    }).length,
  };
});

const genderData = ['male', 'female', 'other'].map((g) => ({
  name: g.charAt(0).toUpperCase() + g.slice(1),
  value: patients.filter((p) => p.personalInfo.gender === g).length,
}));

const diagnosisMap: Record<string, number> = {};
patients.forEach((p) => {
  const dx = p.medicalInfo.primaryDiagnosis;
  diagnosisMap[dx] = (diagnosisMap[dx] || 0) + 1;
});
const topDiagnoses = Object.entries(diagnosisMap)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 6)
  .map(([name, count]) => ({ name, count }));

const riskDistribution = ['low', 'medium', 'high', 'critical'].map((level) => ({
  name: level.charAt(0).toUpperCase() + level.slice(1),
  value: patients.filter((p) => p.riskProfile.overallRiskLevel === level).length,
}));

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
const visitTrend = months.map((month) => ({
  month,
  current: Math.floor(Math.random() * 40) + 60,
  previous: Math.floor(Math.random() * 40) + 50,
}));

const RISK_COLORS_PIE = ['#10b981', '#f59e0b', '#ef4444', '#dc2626'];
const GENDER_COLORS = ['#524CDE', '#AD6FD8', '#94a3b8'];

const tooltipStyle = { border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 12, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' };

const ChartCard: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className = '' }) => (
  <div className={`bg-white rounded-2xl shadow-sm p-6 border border-gray-100 ${className}`}>
    <p className="font-semibold text-gray-800 mb-5">{title}</p>
    {children}
  </div>
);

export const AnalyticsPage: React.FC = () => {
  const [dateRange, setDateRange] = useState('30');

  const stats = {
    total: patients.length,
    new: Math.round(patients.length * 0.08),
    high: patients.filter((p) => ['high', 'critical'].includes(p.riskProfile.overallRiskLevel)).length,
    avgRisk: Math.round(patients.reduce((s, p) => s + p.riskProfile.riskScore, 0) / patients.length),
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
          <p className="text-sm text-gray-400 mt-0.5">Population health metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:border-transparent text-gray-700 shadow-sm"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-all bg-white shadow-sm">
            <Download size={13} />
            Export
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total patients', value: stats.total },
          { label: 'New this period', value: stats.new },
          { label: 'High risk', value: stats.high },
          { label: 'Avg risk score', value: `${stats.avgRisk}/100` },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={GRAD} />
            <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
            <p className="text-xs text-gray-400 font-medium mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Age distribution">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={ageGroups} barSize={28}>
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#f8f9fc' }} />
              <Bar dataKey="count" fill="#524CDE" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Gender breakdown">
          <div className="flex items-center gap-6">
            <ResponsiveContainer width="55%" height={180}>
              <PieChart>
                <Pie
                  data={genderData}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  strokeWidth={0}
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {genderData.map((_, i) => <Cell key={i} fill={GENDER_COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2.5">
              {genderData.map((item, i) => (
                <div key={item.name} className="flex items-center gap-2 text-sm">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: GENDER_COLORS[i] }} />
                  <span className="text-gray-600">{item.name}</span>
                  <span className="font-semibold text-gray-800 ml-auto">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard title="Top diagnoses" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topDiagnoses} layout="vertical" barSize={16}>
              <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} width={130} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#f8f9fc' }} />
              <Bar dataKey="count" fill="#AD6FD8" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Risk distribution">
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={riskDistribution} dataKey="value" cx="50%" cy="50%" outerRadius={65} strokeWidth={0}>
                {riskDistribution.map((_, i) => <Cell key={i} fill={RISK_COLORS_PIE[i]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-3 space-y-2">
            {riskDistribution.map((item, i) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: RISK_COLORS_PIE[i] }} />
                  <span className="text-gray-500">{item.name}</span>
                </div>
                <span className="font-semibold text-gray-700">{item.value}</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* Visit trend */}
      <ChartCard title="Visit trend — current vs previous period">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={visitTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="current" stroke="#524CDE" strokeWidth={2} dot={false} name="Current" />
            <Line type="monotone" dataKey="previous" stroke="#9ca3af" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="Previous" />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
};
