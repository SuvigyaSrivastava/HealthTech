import { faker } from '@faker-js/faker';
import type {
  Patient,
  VitalSign,
  LabResult,
  Medication,
  Appointment,
} from '../types/patient.types';
import type { RiskLevel } from '../types/common.types';

const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const allergies = ['Penicillin', 'Latex', 'Shellfish', 'Peanuts', 'Aspirin', 'NSAIDs'];
const chronicConditions = [
  'Hypertension',
  'Diabetes Type 2',
  'Asthma',
  'COPD',
  'Arthritis',
  'Heart Failure',
  'CKD',
];
const diagnoses = [
  'Hypertension',
  'Type 2 Diabetes',
  'Coronary Artery Disease',
  'Chronic Kidney Disease',
  'Heart Failure',
  'Asthma',
  'COPD',
  'Atrial Fibrillation',
];
const riskLevels: RiskLevel[] = ['low', 'medium', 'high', 'critical'];
const medicationNames = [
  'Metformin',
  'Lisinopril',
  'Atorvastatin',
  'Amlodipine',
  'Omeprazole',
  'Metoprolol',
  'Furosemide',
  'Warfarin',
];

function generateMockVitals(count: number): VitalSign[] {
  return Array.from({ length: count }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i * 7);
    return {
      id: crypto.randomUUID(),
      timestamp: date,
      bloodPressure: {
        systolic: faker.number.int({ min: 110, max: 165 }),
        diastolic: faker.number.int({ min: 70, max: 100 }),
      },
      heartRate: faker.number.int({ min: 58, max: 105 }),
      temperature: parseFloat(faker.number.float({ min: 36.4, max: 37.6 }).toFixed(1)),
      respiratoryRate: faker.number.int({ min: 12, max: 20 }),
      oxygenSaturation: faker.number.int({ min: 94, max: 100 }),
      weight: parseFloat(faker.number.float({ min: 55, max: 125 }).toFixed(1)),
      height: parseFloat(faker.number.float({ min: 150, max: 195 }).toFixed(1)),
      recordedBy: faker.person.fullName(),
    };
  });
}

function generateMockLabResults(count: number, creatinineRising = false): LabResult[] {
  return Array.from({ length: count }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const baseCreatinine = creatinineRising ? 1.0 + i * 0.08 : 0.9 + Math.random() * 0.3;
    const creatinineValue = parseFloat(baseCreatinine.toFixed(2));
    const glucose = parseFloat(faker.number.float({ min: 72, max: 145 }).toFixed(1));

    return {
      id: crypto.randomUUID(),
      testName: 'Comprehensive Metabolic Panel',
      testCode: 'CMP',
      date,
      results: [
        {
          parameter: 'Creatinine',
          value: creatinineValue,
          unit: 'mg/dL',
          referenceRange: { min: 0.7, max: 1.3 },
          isAbnormal: creatinineValue > 1.3,
        },
        {
          parameter: 'Glucose',
          value: glucose,
          unit: 'mg/dL',
          referenceRange: { min: 70, max: 100 },
          isAbnormal: glucose > 100,
        },
        {
          parameter: 'Sodium',
          value: faker.number.int({ min: 136, max: 145 }),
          unit: 'mEq/L',
          referenceRange: { min: 136, max: 145 },
          isAbnormal: false,
        },
        {
          parameter: 'Potassium',
          value: parseFloat(faker.number.float({ min: 3.5, max: 5.0 }).toFixed(1)),
          unit: 'mEq/L',
          referenceRange: { min: 3.5, max: 5.0 },
          isAbnormal: false,
        },
      ],
      orderedBy: faker.person.fullName(),
      notes: i === 0 ? 'Most recent panel' : undefined,
    };
  });
}

function generateMockMedications(count: number): Medication[] {
  return Array.from({ length: count }, () => ({
    id: crypto.randomUUID(),
    name: faker.helpers.arrayElement(medicationNames),
    dosage: `${faker.number.int({ min: 5, max: 50 })}mg`,
    frequency: faker.helpers.arrayElement(['Once daily', 'Twice daily', 'Three times daily', 'As needed']),
    startDate: faker.date.past({ years: 2 }),
    prescribedBy: `Dr. ${faker.person.lastName()}`,
    purpose: faker.helpers.arrayElement(['Blood pressure', 'Blood sugar', 'Cholesterol', 'Pain relief']),
  }));
}

function generateMockAppointments(count: number): Appointment[] {
  return Array.from({ length: count }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + (i === 0 ? 3 : -i * 30));
    return {
      id: crypto.randomUUID(),
      scheduledAt: date,
      provider: `Dr. ${faker.person.lastName()}`,
      type: faker.helpers.arrayElement(['Follow-up', 'Check-up', 'Specialist Consultation', 'Lab Review']),
      status: i === 0 ? 'scheduled' : 'completed',
    };
  });
}

export function generateMockPatients(count: number): Patient[] {
  return Array.from({ length: count }, (_, i) => {
    const riskLevel = faker.helpers.arrayElement(riskLevels);
    const creatinineRising = riskLevel === 'high' || riskLevel === 'critical';
    const conditions = faker.helpers.arrayElements(chronicConditions, { min: 0, max: 3 });

    return {
      id: `PAT-${(10000 + i).toString()}`,
      personalInfo: {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        dateOfBirth: faker.date.birthdate({ min: 18, max: 88, mode: 'age' }),
        gender: faker.helpers.arrayElement(['male', 'female', 'other'] as const),
        contactNumber: faker.phone.number({ style: 'national' }),
        email: faker.internet.email(),
        address: {
          street: faker.location.streetAddress(),
          city: faker.location.city(),
          state: faker.location.state({ abbreviated: true }),
          zipCode: faker.location.zipCode(),
          country: 'USA',
        },
        emergencyContact: {
          name: faker.person.fullName(),
          relationship: faker.helpers.arrayElement(['Spouse', 'Parent', 'Sibling', 'Friend']),
          phone: faker.phone.number({ style: 'national' }),
        },
      },
      medicalInfo: {
        bloodType: faker.helpers.arrayElement(bloodTypes),
        allergies: faker.helpers.arrayElements(allergies, { min: 0, max: 2 }),
        chronicConditions: conditions,
        currentMedications: generateMockMedications(faker.number.int({ min: 1, max: 5 })),
        primaryDiagnosis: faker.helpers.arrayElement(diagnoses),
        diagnosisDate: faker.date.past({ years: 3 }),
      },
      clinicalData: {
        vitals: generateMockVitals(10),
        labResults: generateMockLabResults(8, creatinineRising),
        prescriptions: [],
        procedures: [],
        appointments: generateMockAppointments(4),
        admissions: [],
      },
      riskProfile: {
        overallRiskLevel: riskLevel,
        riskFactors: [],
        riskScore:
          riskLevel === 'critical'
            ? faker.number.int({ min: 70, max: 100 })
            : riskLevel === 'high'
            ? faker.number.int({ min: 50, max: 69 })
            : riskLevel === 'medium'
            ? faker.number.int({ min: 30, max: 49 })
            : faker.number.int({ min: 0, max: 29 }),
        lastAssessment: new Date(),
      },
      metadata: {
        createdAt: faker.date.past({ years: 2 }),
        updatedAt: new Date(),
        createdBy: 'system',
        lastModifiedBy: 'system',
        isActive: true,
      },
    };
  });
}

// Singleton: generate once and cache
let _cachedPatients: Patient[] | null = null;

export function getMockPatients(): Patient[] {
  if (!_cachedPatients) {
    _cachedPatients = generateMockPatients(120);
  }
  return _cachedPatients;
}

export function getMockPatientById(id: string): Patient | undefined {
  return getMockPatients().find((p) => p.id === id);
}
