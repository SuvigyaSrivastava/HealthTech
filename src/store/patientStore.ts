import { create } from 'zustand';
import type { Patient, PatientFilters } from '../shared/types/patient.types';
import type { ViewMode } from '../shared/types/common.types';

interface PatientStore {
  patients: Patient[];
  selectedPatient: Patient | null;
  viewMode: ViewMode;
  filters: PatientFilters;
  isLoading: boolean;
  setPatients: (patients: Patient[]) => void;
  selectPatient: (patient: Patient | null) => void;
  toggleViewMode: () => void;
  updateFilters: (filters: Partial<PatientFilters>) => void;
  resetFilters: () => void;
}

const defaultFilters: PatientFilters = {
  search: '',
  riskLevel: '',
  diagnosis: '',
};

export const usePatientStore = create<PatientStore>((set) => ({
  patients: [],
  selectedPatient: null,
  viewMode: (localStorage.getItem('patientViewMode') as ViewMode) || 'grid',
  filters: defaultFilters,
  isLoading: false,

  setPatients: (patients) => set({ patients }),
  selectPatient: (patient) => set({ selectedPatient: patient }),

  toggleViewMode: () =>
    set((state) => {
      const newMode = state.viewMode === 'grid' ? 'list' : 'grid';
      localStorage.setItem('patientViewMode', newMode);
      return { viewMode: newMode };
    }),

  updateFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),

  resetFilters: () => set({ filters: defaultFilters }),
}));
