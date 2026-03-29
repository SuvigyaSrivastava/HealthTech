import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  LayoutGrid,
  List,
  Search,
  Filter,
  ChevronUp,
  ChevronDown,
  Brain,
  Eye,
  Loader2,
} from 'lucide-react';
import { patientService } from '../services/patientService';
import { usePatientStore } from '../../../store/patientStore';
import { useDebounce } from '../../../shared/hooks/useDebounce';
import { RISK_COLORS, RISK_BORDER_COLORS } from '../../../shared/constants/routes';
import { formatDate, calculateAge, cn } from '../../../shared/utils/formatters';
import type { Patient, PatientFilters } from '../../../shared/types/patient.types';

const GRAD: React.CSSProperties = { background: 'linear-gradient(135deg, #524CDE, #AD6FD8)' };

type SortField = 'name' | 'age' | 'risk' | 'diagnosis';
type SortDir = 'asc' | 'desc';

const RISK_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

const RiskBadge: React.FC<{ level: Patient['riskProfile']['overallRiskLevel'] }> = ({ level }) => (
  <span
    data-testid="risk-badge"
    className={cn('text-xs px-2.5 py-1 rounded-full font-medium capitalize', RISK_COLORS[level])}
  >
    {level === 'high' ? 'High' : level === 'critical' ? 'Critical' : level === 'medium' ? 'Medium' : 'Low'}
  </span>
);

const PatientCard: React.FC<{ patient: Patient }> = React.memo(({ patient }) => {
  const age = calculateAge(patient.personalInfo.dateOfBirth);
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all duration-200 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={GRAD} />
      <div className="flex items-start justify-between mb-4 mt-1">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 shadow-sm"
            style={GRAD}
          >
            {patient.personalInfo.firstName[0]}{patient.personalInfo.lastName[0]}
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">
              {patient.personalInfo.firstName} {patient.personalInfo.lastName}
            </p>
            <p className="text-xs text-gray-400">{patient.id}</p>
          </div>
        </div>
        <RiskBadge level={patient.riskProfile.overallRiskLevel} />
      </div>

      <div className="space-y-1 text-xs text-gray-500 mb-4">
        <p>Age {age} · <span className="capitalize">{patient.personalInfo.gender}</span></p>
        <p className="truncate text-gray-700 font-medium">{patient.medicalInfo.primaryDiagnosis}</p>
        <p>Last visit {formatDate(patient.clinicalData.appointments[0]?.scheduledAt ?? patient.metadata.updatedAt)}</p>
      </div>

      {patient.medicalInfo.allergies.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {patient.medicalInfo.allergies.slice(0, 2).map((a) => (
            <span key={a} className="text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5">
              {a}
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2 pt-3 border-t border-gray-100">
        <Link
          to={`/patients/${patient.id}`}
          className="flex-1 text-center text-xs py-2 rounded-xl font-medium transition-all flex items-center justify-center gap-1.5 text-white shadow-sm"
          style={GRAD}
        >
          <Eye size={11} />
          View
        </Link>
        <Link
          to={`/patients/${patient.id}?tab=second-brain`}
          className="flex-1 text-center text-xs py-2 text-gray-600 border border-gray-200 hover:border-indigo-200 hover:text-indigo-700 hover:bg-indigo-50 rounded-xl transition-all flex items-center justify-center gap-1.5"
        >
          <Brain size={11} />
          Insights
        </Link>
      </div>
    </div>
  );
});

const PatientRow: React.FC<{ patient: Patient }> = ({ patient }) => {
  const age = calculateAge(patient.personalInfo.dateOfBirth);
  return (
    <tr className="hover:bg-indigo-50/30 transition-colors">
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
            style={GRAD}
          >
            {patient.personalInfo.firstName[0]}{patient.personalInfo.lastName[0]}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {patient.personalInfo.firstName} {patient.personalInfo.lastName}
            </p>
            <p className="text-xs text-gray-400">{patient.id}</p>
          </div>
        </div>
      </td>
      <td className="px-5 py-3.5 text-sm text-gray-600">{age}</td>
      <td className="px-5 py-3.5 text-sm text-gray-600 capitalize">{patient.personalInfo.gender}</td>
      <td className="px-5 py-3.5 text-sm text-gray-600 max-w-[180px] truncate">{patient.medicalInfo.primaryDiagnosis}</td>
      <td className="px-5 py-3.5"><RiskBadge level={patient.riskProfile.overallRiskLevel} /></td>
      <td className="px-5 py-3.5 text-xs text-gray-400">{formatDate(patient.metadata.updatedAt)}</td>
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-1">
          <Link to={`/patients/${patient.id}`} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="View">
            <Eye size={14} />
          </Link>
          <Link to={`/patients/${patient.id}?tab=second-brain`} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors" title="Insights">
            <Brain size={14} />
          </Link>
        </div>
      </td>
    </tr>
  );
};

export const PatientsPage: React.FC = () => {
  const { viewMode, toggleViewMode, filters, updateFilters } = usePatientStore();
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const debouncedSearch = useDebounce(filters.search ?? '', 300);

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ['patients', { ...filters, search: debouncedSearch }],
    queryFn: () => patientService.getAll({ ...filters, search: debouncedSearch }),
    staleTime: 5 * 60 * 1000,
  });

  const sortedPatients = useMemo(() => {
    const arr = [...patients];
    arr.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'name') comparison = a.personalInfo.lastName.localeCompare(b.personalInfo.lastName);
      else if (sortField === 'age') comparison = calculateAge(a.personalInfo.dateOfBirth) - calculateAge(b.personalInfo.dateOfBirth);
      else if (sortField === 'risk') comparison = RISK_ORDER[a.riskProfile.overallRiskLevel] - RISK_ORDER[b.riskProfile.overallRiskLevel];
      else if (sortField === 'diagnosis') comparison = a.medicalInfo.primaryDiagnosis.localeCompare(b.medicalInfo.primaryDiagnosis);
      return sortDir === 'asc' ? comparison : -comparison;
    });
    return arr;
  }, [patients, sortField, sortDir]);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('asc'); }
  };

  const SortIcon: React.FC<{ field: SortField }> = ({ field }) => {
    if (sortField !== field) return <ChevronUp size={11} className="text-gray-300" />;
    return sortDir === 'asc' ? <ChevronUp size={11} style={{ color: '#524CDE' }} /> : <ChevronDown size={11} style={{ color: '#524CDE' }} />;
  };

  return (
    <div className="space-y-5 max-w-7xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Patients</h2>
          <p className="text-sm text-gray-400 mt-0.5">{sortedPatients.length} patients</p>
        </div>
        <button
          onClick={() => toggleViewMode()}
          className="p-2 bg-white border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition-colors shadow-sm"
          aria-label="Toggle view"
        >
          {viewMode === 'grid' ? <List size={16} /> : <LayoutGrid size={16} />}
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, ID or diagnosis..."
            value={filters.search ?? ''}
            onChange={(e) => updateFilters({ search: e.target.value })}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-transparent bg-white shadow-sm"
            style={{ '--tw-ring-color': '#524CDE' } as React.CSSProperties}
          />
        </div>
        <select
          value={filters.riskLevel ?? ''}
          onChange={(e) => updateFilters({ riskLevel: e.target.value as PatientFilters['riskLevel'] })}
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-transparent bg-white text-gray-700 shadow-sm"
        >
          <option value="">All risk levels</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
        <select
          value={filters.diagnosis ?? ''}
          onChange={(e) => updateFilters({ diagnosis: e.target.value })}
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-transparent bg-white text-gray-700 shadow-sm"
        >
          <option value="">All diagnoses</option>
          <option value="Hypertension">Hypertension</option>
          <option value="Diabetes">Diabetes</option>
          <option value="Coronary">Coronary Artery Disease</option>
          <option value="Kidney">Kidney Disease</option>
          <option value="Heart Failure">Heart Failure</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin" style={{ color: '#524CDE' }} />
        </div>
      ) : sortedPatients.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Filter size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">No patients found</p>
          <p className="text-xs mt-1">Try adjusting the filters</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedPatients.map((p) => <PatientCard key={p.id} patient={p} />)}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-100">
                <tr>
                  {[
                    { label: 'Patient', field: 'name' as SortField },
                    { label: 'Age', field: 'age' as SortField },
                    { label: 'Gender', field: null },
                    { label: 'Diagnosis', field: 'diagnosis' as SortField },
                    { label: 'Risk', field: 'risk' as SortField },
                    { label: 'Updated', field: null },
                    { label: '', field: null },
                  ].map(({ label, field }) => (
                    <th
                      key={label}
                      className={cn(
                        'px-5 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide',
                        field && 'cursor-pointer hover:text-gray-700 select-none'
                      )}
                      onClick={() => field && handleSort(field)}
                    >
                      <div className="flex items-center gap-1">{label}{field && <SortIcon field={field} />}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sortedPatients.map((p) => <PatientRow key={p.id} patient={p} />)}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
