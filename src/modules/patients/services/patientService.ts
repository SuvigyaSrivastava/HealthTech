import { getMockPatients, getMockPatientById } from '../../../shared/utils/mockData';
import type { Patient, PatientFilters } from '../../../shared/types/patient.types';

export const patientService = {
  async getAll(filters?: PatientFilters): Promise<Patient[]> {
    await new Promise((r) => setTimeout(r, 200));
    let patients = getMockPatients();

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      patients = patients.filter(
        (p) =>
          p.personalInfo.firstName.toLowerCase().includes(q) ||
          p.personalInfo.lastName.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          p.medicalInfo.primaryDiagnosis.toLowerCase().includes(q)
      );
    }

    if (filters?.riskLevel) {
      patients = patients.filter((p) => p.riskProfile.overallRiskLevel === filters.riskLevel);
    }

    if (filters?.diagnosis) {
      const q = filters.diagnosis.toLowerCase();
      patients = patients.filter((p) =>
        p.medicalInfo.primaryDiagnosis.toLowerCase().includes(q) ||
        p.medicalInfo.chronicConditions.some((c: string) => c.toLowerCase().includes(q))
      );
    }

    return patients;
  },

  async getById(id: string): Promise<Patient> {
    await new Promise((r) => setTimeout(r, 100));
    const patient = getMockPatientById(id);
    if (!patient) throw new Error(`Patient ${id} not found`);
    return patient;
  },

  async getStats() {
    const patients = getMockPatients();
    const high = patients.filter((p) => p.riskProfile.overallRiskLevel === 'high' || p.riskProfile.overallRiskLevel === 'critical').length;
    const active = patients.filter((p) => p.metadata.isActive).length;
    return {
      total: patients.length,
      active,
      highRisk: high,
      critical: patients.filter((p) => p.riskProfile.overallRiskLevel === 'critical').length,
    };
  },
};
