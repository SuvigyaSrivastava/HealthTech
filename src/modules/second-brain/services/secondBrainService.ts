import type { Patient } from '../../../shared/types/patient.types';
import type {
  TimelineEvent,
  PatientTimeline,
  RecentChanges,
  VitalChange,
  LabChange,
  RiskAlert,
  DetectedPattern,
  PatientInsights,
  RiskScore,
} from '../../../shared/types/secondBrain.types';
import type { LabResult } from '../../../shared/types/patient.types';

// ─── Timeline Generator ────────────────────────────────────────────────
class TimelineGenerator {
  generate(patient: Patient): PatientTimeline {
    const events: TimelineEvent[] = [];

    // Primary diagnosis
    events.push({
      id: crypto.randomUUID(),
      type: 'diagnosis',
      date: patient.medicalInfo.diagnosisDate,
      title: patient.medicalInfo.primaryDiagnosis,
      description: `Primary diagnosis: ${patient.medicalInfo.primaryDiagnosis}`,
      severity: 'warning',
      relatedData: null,
      icon: 'stethoscope',
      color: 'red',
    });

    // Medications
    for (const med of patient.medicalInfo.currentMedications) {
      events.push({
        id: crypto.randomUUID(),
        type: 'medication',
        date: med.startDate,
        title: `Started ${med.name}`,
        description: `${med.dosage} ${med.frequency} — ${med.purpose}`,
        severity: 'info',
        relatedData: med,
        icon: 'pill',
        color: 'blue',
      });
    }

    // Significant labs (abnormal)
    for (const lab of patient.clinicalData.labResults) {
      if (lab.results.some((r) => r.isAbnormal)) {
        const abnormals = lab.results.filter((r) => r.isAbnormal);
        events.push({
          id: crypto.randomUUID(),
          type: 'lab',
          date: lab.date,
          title: `Abnormal ${lab.testName}`,
          description: abnormals.map((r) => `${r.parameter}: ${r.value} ${r.unit}`).join(', '),
          severity: this.assessLabSeverity(lab),
          relatedData: lab,
          icon: 'flask',
          color: 'purple',
        });
      }
    }

    // Procedures
    for (const proc of patient.clinicalData.procedures) {
      events.push({
        id: crypto.randomUUID(),
        type: 'procedure',
        date: proc.date,
        title: proc.name,
        description: proc.notes || `Performed by ${proc.performedBy}`,
        severity: 'info',
        relatedData: proc,
        icon: 'activity',
        color: 'green',
      });
    }

    // Admissions
    for (const admission of patient.clinicalData.admissions) {
      events.push({
        id: crypto.randomUUID(),
        type: 'admission',
        date: admission.admittedAt,
        title: 'Hospital Admission',
        description: admission.reason,
        severity: 'critical',
        relatedData: admission,
        icon: 'hospital',
        color: 'orange',
      });
    }

    events.sort((a, b) => b.date.getTime() - a.date.getTime());
    const keyMilestones = events.filter(
      (e) => e.severity === 'critical' || e.type === 'diagnosis' || e.type === 'procedure'
    );

    return { patientId: patient.id, events, keyMilestones, generatedAt: new Date() };
  }

  private assessLabSeverity(lab: LabResult): 'info' | 'warning' | 'critical' {
    const abnormalCount = lab.results.filter((r) => r.isAbnormal).length;
    if (abnormalCount >= 3) return 'critical';
    if (abnormalCount >= 1) return 'warning';
    return 'info';
  }
}

// ─── Change Detector ───────────────────────────────────────────────────
class ChangeDetector {
  detectChanges(patient: Patient, timeWindow = 30): RecentChanges {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - timeWindow);

    return {
      newDiagnoses: [],
      medicationChanges: [],
      vitalChanges: this.detectVitalChanges(patient, cutoffDate),
      labChanges: this.detectLabChanges(patient, cutoffDate),
      summary: '',
      generatedAt: new Date(),
    };
  }

  private detectVitalChanges(patient: Patient, since: Date): VitalChange[] {
    const recentVitals = patient.clinicalData.vitals
      .filter((v) => new Date(v.timestamp) >= since)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (recentVitals.length < 2) return [];

    const changes: VitalChange[] = [];
    const latest = recentVitals[0];
    const previous = recentVitals[1];

    // Blood pressure
    if (Math.abs(latest.bloodPressure.systolic - previous.bloodPressure.systolic) > 20) {
      const change = latest.bloodPressure.systolic - previous.bloodPressure.systolic;
      changes.push({
        type: 'blood_pressure',
        parameter: 'Systolic BP',
        previousValue: previous.bloodPressure.systolic,
        currentValue: latest.bloodPressure.systolic,
        change,
        percentChange: (change / previous.bloodPressure.systolic) * 100,
        severity: latest.bloodPressure.systolic > 140 ? 'warning' : 'info',
        date: new Date(latest.timestamp),
      });
    }

    // Weight (>5 lbs change)
    if (Math.abs(latest.weight - previous.weight) > 5) {
      const change = latest.weight - previous.weight;
      changes.push({
        type: 'weight',
        parameter: 'Weight',
        previousValue: previous.weight,
        currentValue: latest.weight,
        change,
        percentChange: (change / previous.weight) * 100,
        severity: Math.abs(change) > 10 ? 'warning' : 'info',
        date: new Date(latest.timestamp),
      });
    }

    return changes;
  }

  private detectLabChanges(patient: Patient, since: Date): LabChange[] {
    const recentLabs = patient.clinicalData.labResults.filter(
      (lab) => new Date(lab.date) >= since
    );

    if (recentLabs.length < 2) {
      // Use all available labs to detect trends
      return this.detectLabTrends(patient.clinicalData.labResults);
    }

    return this.detectLabTrends(recentLabs);
  }

  private detectLabTrends(labs: LabResult[]): LabChange[] {
    const changes: LabChange[] = [];
    if (labs.length < 2) return changes;

    const sorted = [...labs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const parameters = new Set(sorted[0].results.map((r) => r.parameter));

    for (const param of parameters) {
      const values = sorted
        .map((lab) => lab.results.find((r) => r.parameter === param)?.value)
        .filter((v): v is number => v !== undefined);

      if (values.length < 2) continue;

      const trend = this.calculateTrend(values);
      const lastVal = values[values.length - 1];
      const firstVal = values[0];
      const percentChange = Math.abs(((lastVal - firstVal) / firstVal) * 100);

      if (percentChange > 15 || trend.slope !== 0) {
        const refRange = sorted[0].results.find((r) => r.parameter === param)?.referenceRange;
        const isOutOfRange = refRange
          ? lastVal < refRange.min || lastVal > refRange.max
          : false;

        changes.push({
          testType: 'CMP',
          parameter: param,
          values,
          trend: trend.direction,
          severity: isOutOfRange ? (percentChange > 30 ? 'critical' : 'warning') : 'info',
          description: `${param} has ${trend.direction === 'rising' ? 'increased' : trend.direction === 'falling' ? 'decreased' : 'remained stable'} ${percentChange.toFixed(1)}% over recent measurements`,
        });
      }
    }

    return changes;
  }

  private calculateTrend(values: number[]): {
    slope: number;
    direction: 'rising' | 'falling' | 'stable';
  } {
    if (values.length < 2) return { slope: 0, direction: 'stable' };
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((s, xi, i) => s + xi * values[i], 0);
    const sumX2 = x.reduce((s, xi) => s + xi * xi, 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const direction = slope > 0.02 ? 'rising' : slope < -0.02 ? 'falling' : 'stable';
    return { slope, direction };
  }
}

// ─── Risk Scorer ───────────────────────────────────────────────────────
class RiskScorer {
  calculate(patient: Patient, changes: RecentChanges): RiskScore {
    let totalScore = 0;
    const factors: RiskScore['factors'] = [];

    // Age factor
    const dob = new Date(patient.personalInfo.dateOfBirth);
    const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 3600 * 1000));
    if (age > 65) {
      const score = Math.min((age - 65) * 2, 20);
      totalScore += score;
      factors.push({ category: 'demographic', factor: 'Advanced age', score, weight: 0.15, description: `Age ${age}` });
    }

    // Chronic conditions
    const chronicScore = Math.min(patient.medicalInfo.chronicConditions.length * 10, 30);
    if (chronicScore > 0) {
      totalScore += chronicScore;
      factors.push({
        category: 'medical_history',
        factor: 'Chronic conditions',
        score: chronicScore,
        weight: 0.25,
        description: `${patient.medicalInfo.chronicConditions.length} chronic condition(s): ${patient.medicalInfo.chronicConditions.join(', ')}`,
      });
    }

    // Lab trend risks
    for (const labChange of changes.labChanges) {
      if (labChange.severity === 'critical') {
        totalScore += 20;
        factors.push({
          category: 'clinical_data',
          factor: 'Critical lab trend',
          score: 20,
          weight: 0.30,
          description: labChange.description,
        });
      } else if (labChange.severity === 'warning') {
        totalScore += 10;
        factors.push({
          category: 'clinical_data',
          factor: 'Abnormal lab trend',
          score: 10,
          weight: 0.30,
          description: labChange.description,
        });
      }
    }

    // Vital changes
    for (const vc of changes.vitalChanges) {
      if (vc.severity === 'warning') {
        totalScore += 8;
        factors.push({
          category: 'clinical_data',
          factor: 'Vital sign change',
          score: 8,
          weight: 0.15,
          description: `${vc.parameter}: ${vc.previousValue} → ${vc.currentValue}`,
        });
      }
    }

    // Many medications
    if (patient.medicalInfo.currentMedications.length >= 5) {
      totalScore += 10;
      factors.push({
        category: 'medical_history',
        factor: 'Polypharmacy',
        score: 10,
        weight: 0.10,
        description: `${patient.medicalInfo.currentMedications.length} concurrent medications`,
      });
    }

    const normalizedScore = Math.min(totalScore, 100);
    const level =
      normalizedScore >= 70
        ? 'critical'
        : normalizedScore >= 50
        ? 'high'
        : normalizedScore >= 30
        ? 'medium'
        : 'low';

    return { score: normalizedScore, level, factors, calculatedAt: new Date(), confidence: 0.85 };
  }
}

// ─── Risk Alert Detectors ─────────────────────────────────────────────
function detectKidneyFunctionDecline(patient: Patient): RiskAlert | null {
  const creatinineLabs = patient.clinicalData.labResults
    .filter((lab) => lab.results.some((r) => r.parameter === 'Creatinine'))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-6);

  if (creatinineLabs.length < 3) return null;

  const values = creatinineLabs.map(
    (lab) => lab.results.find((r) => r.parameter === 'Creatinine')?.value ?? 0
  );
  const first = values[0];
  const last = values[values.length - 1];
  const percentIncrease = ((last - first) / first) * 100;

  if (percentIncrease > 20 && last > 1.2) {
    return {
      id: crypto.randomUUID(),
      type: 'kidney_function_decline',
      severity: percentIncrease > 40 ? 'critical' : 'warning',
      title: 'Possible CKD Progression',
      description: `Creatinine rising over recent months (${percentIncrease.toFixed(1)}% increase, now ${last.toFixed(2)} mg/dL)`,
      recommendation: 'Consider nephrology referral and medication review',
      data: { values },
      detectedAt: new Date(),
    };
  }
  return null;
}

function detectUncontrolledDiabetes(patient: Patient): RiskAlert | null {
  const glucoseValues = patient.clinicalData.labResults
    .flatMap((lab) => lab.results.filter((r) => r.parameter === 'Glucose').map((r) => r.value))
    .slice(-5);

  if (glucoseValues.length < 3) return null;
  const avgGlucose = glucoseValues.reduce((a, b) => a + b, 0) / glucoseValues.length;

  if (avgGlucose > 130) {
    return {
      id: crypto.randomUUID(),
      type: 'uncontrolled_glucose',
      severity: avgGlucose > 180 ? 'critical' : 'warning',
      title: 'Elevated Blood Glucose Pattern',
      description: `Average glucose ${avgGlucose.toFixed(0)} mg/dL over recent labs (target <100 mg/dL)`,
      recommendation: 'Review glycemic control — consider HbA1c, medication adjustment',
      data: { values: glucoseValues },
      detectedAt: new Date(),
    };
  }
  return null;
}

function detectMetabolicSyndrome(patient: Patient): RiskAlert | null {
  const conditions = new Set(patient.medicalInfo.chronicConditions);
  if (
    conditions.has('Hypertension') &&
    conditions.has('Diabetes Type 2') &&
    patient.clinicalData.vitals.some((v) => v.weight > 90)
  ) {
    return {
      id: crypto.randomUUID(),
      type: 'metabolic_syndrome',
      severity: 'warning',
      title: 'Metabolic Syndrome Indicators',
      description: 'Patient has Hypertension + Diabetes + Obesity — metabolic syndrome risk',
      recommendation: 'Consider comprehensive metabolic management program and lifestyle intervention',
      detectedAt: new Date(),
    };
  }
  return null;
}

// ─── Pattern Detector ─────────────────────────────────────────────────
class PatternDetector {
  detect(patient: Patient): DetectedPattern[] {
    const patterns: DetectedPattern[] = [];

    // Polypharmacy
    if (patient.medicalInfo.currentMedications.length >= 5) {
      patterns.push({
        type: 'polypharmacy',
        name: 'Polypharmacy',
        description: `Patient is on ${patient.medicalInfo.currentMedications.length} concurrent medications`,
        confidence: 0.95,
        relevance: 'high',
        actionable: true,
        recommendation: 'Review medication list for potential interactions and deprescribing opportunities',
      });
    }

    // Comorbidity cluster
    const conditions = new Set(patient.medicalInfo.chronicConditions);
    if (conditions.has('Hypertension') && conditions.has('Diabetes Type 2')) {
      patterns.push({
        type: 'comorbidity_cluster',
        name: 'Cardiometabolic Risk Cluster',
        description: 'Hypertension and Diabetes co-occurrence elevates cardiovascular risk',
        confidence: 0.92,
        relevance: 'high',
        actionable: true,
        recommendation: 'Ensure ACE inhibitor/ARB therapy; target BP <130/80; annual kidney function tests',
      });
    }

    // High medications + kidney disease
    if (conditions.has('CKD') && patient.medicalInfo.currentMedications.length > 3) {
      patterns.push({
        type: 'ckd_dosing',
        name: 'CKD Medication Dosing Review',
        description: 'Patient with CKD is on multiple medications requiring dose adjustment',
        confidence: 0.88,
        relevance: 'high',
        actionable: true,
        recommendation: 'Review all medications for renal dose adjustment; avoid nephrotoxic drugs',
      });
    }

    return patterns;
  }
}

// ─── Main Second Brain Service ────────────────────────────────────────
class SecondBrainService {
  private timelineGenerator = new TimelineGenerator();
  private changeDetector = new ChangeDetector();
  private riskScorer = new RiskScorer();
  private patternDetector = new PatternDetector();

  async analyze(patient: Patient): Promise<PatientInsights> {
    // Simulate async processing
    await new Promise((resolve) => setTimeout(resolve, 300));

    const timeline = this.timelineGenerator.generate(patient);
    const recentChanges = this.changeDetector.detectChanges(patient);

    // Generate changes summary
    recentChanges.summary = this.summarizeChanges(recentChanges);

    // Detect risk alerts
    const riskAlerts: RiskAlert[] = [];
    const kidneyAlert = detectKidneyFunctionDecline(patient);
    if (kidneyAlert) riskAlerts.push(kidneyAlert);

    const diabetesAlert = detectUncontrolledDiabetes(patient);
    if (diabetesAlert) riskAlerts.push(diabetesAlert);

    const metabolicAlert = detectMetabolicSyndrome(patient);
    if (metabolicAlert) riskAlerts.push(metabolicAlert);

    const riskScore = this.riskScorer.calculate(patient, recentChanges);
    const patterns = this.patternDetector.detect(patient);

    const insights: PatientInsights = {
      patientId: patient.id,
      timeline,
      recentChanges,
      riskAlerts,
      riskScore,
      patterns,
      summary: '',
      generatedAt: new Date(),
      patient,
    };

    insights.summary = this.summarizeInsights(insights);
    return insights;
  }

  private summarizeChanges(changes: RecentChanges): string {
    const parts: string[] = [];
    const criticalLabs = changes.labChanges.filter((c) => c.severity === 'critical').length;
    if (criticalLabs > 0) parts.push(`${criticalLabs} critical lab trend(s)`);
    else if (changes.labChanges.length > 0) parts.push(`${changes.labChanges.length} lab value change(s)`);
    if (changes.vitalChanges.length > 0) parts.push(`${changes.vitalChanges.length} vital sign change(s)`);
    if (changes.medicationChanges.length > 0) parts.push(`${changes.medicationChanges.length} medication change(s)`);
    return parts.length ? parts.join('; ') + ' in the last 30 days' : 'No significant changes in the last 30 days';
  }

  private summarizeInsights(insights: PatientInsights): string {
    const level = insights.riskScore.level;
    const criticalAlerts = insights.riskAlerts.filter((a) => a.severity === 'critical').length;

    if (criticalAlerts > 0 || level === 'critical') {
      return `⚠️ Critical: ${criticalAlerts} urgent alert(s) requiring immediate attention. Overall risk: ${level}.`;
    }
    if (level === 'high') {
      return `⚡ High risk patient. Close monitoring recommended. ${insights.recentChanges.summary}`;
    }
    if (insights.riskAlerts.length > 0) {
      return `🔶 ${insights.riskAlerts.length} risk alert(s) detected. ${insights.recentChanges.summary}`;
    }
    if (insights.recentChanges.labChanges.length > 0 || insights.recentChanges.vitalChanges.length > 0) {
      return `📊 Some changes detected. ${insights.recentChanges.summary}`;
    }
    return '✅ Patient status stable. No critical concerns identified.';
  }
}

export const secondBrainService = new SecondBrainService();
