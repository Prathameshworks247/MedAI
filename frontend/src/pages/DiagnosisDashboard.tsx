import { DashboardHeader } from "../components/diagnosis/DashboardHeader";
import { DiagnosisCard } from "../components/diagnosis/DiagnosisCard";
import { TestTrendChart } from "../components/diagnosis/TestTrendChart";
import { ProgressComparison } from "../components/diagnosis/ProgressComparison";
import { RiskScoreVisual } from "../components/diagnosis/RiskScoreVisual";
import { ClinicalReasoningFlow } from "../components/diagnosis/ClinicalReasoningFlow";
import React from "react";

// Mock data for demonstration
const diagnosisData = {
  condition: "Stable Angina",
  icd_code: "I20.8",
  confidence: 0.95,
  status: "improving" as const,
  evidenceChain: [
    { appointment: "Baseline", date: "Oct 01", value: "8/10", change: "worse" as const },
    { appointment: "Apt #1", date: "Oct 15", value: "4/10", change: "better" as const },
    { appointment: "Apt #2", date: "Oct 28", value: "2/10", change: "better" as const },
    { appointment: "Apt #3", date: "Nov 01", value: "0/10", change: "better" as const },
  ],
};

const wbcData = [
  { date: "2024-10-01", value: 11.5, appointmentNumber: 0 },
  { date: "2024-10-15", value: 11.2, appointmentNumber: 1 },
  { date: "2024-10-28", value: 10.1, appointmentNumber: 2 },
  { date: "2024-11-01", value: 9.2, appointmentNumber: 3 },
];

const bpData = [
  { date: "2024-10-01", value: 140, appointmentNumber: 0 },
  { date: "2024-10-15", value: 135, appointmentNumber: 1 },
  { date: "2024-10-28", value: 128, appointmentNumber: 2 },
  { date: "2024-11-01", value: 125, appointmentNumber: 3 },
];

const progressMetrics = [
  {
    name: "Chest Pain",
    baseline: 8,
    current: 0,
    unit: "/10",
    target: 0,
    better: "lower" as const,
    icon: "💔",
  },
  {
    name: "Blood Pressure",
    baseline: 140,
    current: 125,
    unit: " mmHg",
    target: 130,
    better: "lower" as const,
    icon: "🩺",
  },
  {
    name: "WBC Count",
    baseline: 11.5,
    current: 9.2,
    unit: " 10⁹/L",
    target: 9,
    better: "lower" as const,
    icon: "🧬",
  },
  {
    name: "Medication Adherence",
    baseline: 60,
    current: 95,
    unit: "%",
    target: 90,
    better: "higher" as const,
    icon: "💊",
  },
];

const riskScores = [
  { name: "TIMI Score", value: 3, max: 7, interpretation: "Moderate Risk" },
  { name: "CHADS₂-VASc", value: 2, max: 9, interpretation: "Low-Moderate Risk" },
  { name: "Framingham", value: 4, max: 10, interpretation: "15% 10-year CVD risk" },
];

const DiagnosisDashboard = () => {
  return (
    <div className="min-h-screen bg-background p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <DashboardHeader
          patientName="John Smith"
          lastUpdated="Nov 01, 2024 at 10:30 AM"
        />

        {/* Primary Diagnosis */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold text-muted-foreground mb-4 flex items-center gap-2">
            <span>📊</span> PRIMARY DIAGNOSIS
          </h2>
          <DiagnosisCard diagnosis={diagnosisData} />
        </section>

        {/* Charts Row */}
        <section className="grid lg:grid-cols-2 gap-6 mb-6">
          <div>
            <h2 className="text-lg font-semibold text-muted-foreground mb-4 flex items-center gap-2">
              <span>📈</span> TEST TRENDS
            </h2>
            <div className="space-y-6">
              <TestTrendChart
                testName="WBC Count"
                unit="10⁹/L"
                normalRange={[4, 11]}
                data={wbcData}
              />
              <TestTrendChart
                testName="Blood Pressure (Systolic)"
                unit="mmHg"
                normalRange={[90, 130]}
                data={bpData}
              />
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-muted-foreground mb-4 flex items-center gap-2">
              <span>🧠</span> CLINICAL REASONING
            </h2>
            <ClinicalReasoningFlow nodes={[]} connections={[]} />
          </div>
        </section>

        {/* Risk & Progress Row */}
        <section className="grid lg:grid-cols-2 gap-6">
          <RiskScoreVisual scores={riskScores} />
          <ProgressComparison metrics={progressMetrics} />
        </section>
      </div>
    </div>
  );
};

export default DiagnosisDashboard;
