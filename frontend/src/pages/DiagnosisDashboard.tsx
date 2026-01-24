import { DashboardHeader } from "../components/diagnosis/DashboardHeader";
import { DiagnosisCard } from "../components/diagnosis/DiagnosisCard";
import { TestTrendChart } from "../components/diagnosis/TestTrendChart";
import { ProgressComparison } from "../components/diagnosis/ProgressComparison";
import { RiskScoreVisual } from "../components/diagnosis/RiskScoreVisual";
import { ClinicalReasoningFlow } from "../components/diagnosis/ClinicalReasoningFlow";
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { apiRequest } from "../utils/api";

// Type definitions matching backend JSON schema
interface DiagnosisData {
  patient: {
    name: string;
    last_updated: string;
  };
  primary_diagnosis: {
    condition: string;
    icd_code: string;
    confidence: number;
    status: "improving" | "worsening" | "stable";
    evidence_chain: Array<{
      appointment: string;
      date: string;
      value: string;
      change: "better" | "worse" | "same";
    }>;
  };
  test_trends: {
    [key: string]: {
      test_name: string;
      unit: string;
      normal_range: [number, number];
      data: Array<{
        date: string;
        value: number;
        appointment_number: number;
      }>;
    };
  };
  clinical_reasoning: {
    nodes: Array<{
      id: string;
      label: string;
      type: "input" | "process" | "output" | "evidence";
      icon: string;
    }>;
    connections: Array<{
      from: string;
      to: string;
      label?: string;
    }>;
  };
  risk_scores: Array<{
    name: string;
    value: number;
    max: number;
    interpretation: string;
  }>;
  progress_metrics: Array<{
    name: string;
    baseline: number;
    current: number;
    unit: string;
    target: number;
    better: "lower" | "higher";
    icon: string;
  }>;
  alternative_diagnoses?: Array<{
    icd_10_code: string;
    diagnosis_name: string;
    confidence_score: number;
    rationale: string;
  }>;
}

const DiagnosisDashboard = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const [diagnosisData, setDiagnosisData] = useState<DiagnosisData | null>(null);
  const [med42Text, setMed42Text] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDiagnosis = async () => {
      if (!appointmentId) {
        setError("No appointment ID provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const result = await apiRequest(`/appointments/${appointmentId}`, {
          method: 'GET',
        });
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch appointment');
        }
        
        const appointment = result.data;
        
        if (appointment.generated_diagnosis) {
          setDiagnosisData(appointment.generated_diagnosis);
        } else {
          setError("No diagnosis data available. Please generate diagnosis first.");
        }
        
        // Also fetch the Med42 text
        if (appointment.generated_diagnosis_text) {
          setMed42Text(appointment.generated_diagnosis_text);
        }
      } catch (err: any) {
        console.error("Error fetching diagnosis:", err);
        setError(err.response?.data?.detail || "Failed to load diagnosis data");
      } finally {
        setLoading(false);
      }
    };

    fetchDiagnosis();
  }, [appointmentId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 lg:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading diagnosis data...</p>
        </div>
      </div>
    );
  }

  if (error || !diagnosisData) {
    return (
      <div className="min-h-screen bg-background p-4 lg:p-8 flex items-center justify-center">
        <div className="text-center">
          <p className="text-danger mb-4">{error || "No diagnosis data available"}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Convert evidence_chain to evidenceChain format for DiagnosisCard
  const diagnosisCardData = {
    condition: diagnosisData.primary_diagnosis.condition,
    icd_code: diagnosisData.primary_diagnosis.icd_code,
    confidence: diagnosisData.primary_diagnosis.confidence,
    status: diagnosisData.primary_diagnosis.status,
    evidenceChain: diagnosisData.primary_diagnosis.evidence_chain.map(ev => ({
      appointment: ev.appointment,
      date: ev.date,
      value: ev.value,
      change: ev.change,
    })),
  };

  // Convert test_trends to array format for TestTrendChart
  const testTrends = Object.entries(diagnosisData.test_trends || {}).map(([key, test]) => ({
    key,
    ...test,
  }));

  // Format last_updated for display
  const formatLastUpdated = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <DashboardHeader
          patientName={diagnosisData.patient.name}
          lastUpdated={formatLastUpdated(diagnosisData.patient.last_updated)}
        />

        {/* Primary Diagnosis */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold text-muted-foreground mb-4 flex items-center gap-2">
            <span>📊</span> PRIMARY DIAGNOSIS
          </h2>
          <DiagnosisCard diagnosis={diagnosisCardData} />
        </section>

        {/* Charts Row */}
        <section className="grid lg:grid-cols-2 gap-6 mb-6">
          <div>
            <h2 className="text-lg font-semibold text-muted-foreground mb-4 flex items-center gap-2">
              <span>📈</span> TEST TRENDS
            </h2>
            <div className="space-y-6">
              {testTrends.map((test) => (
                <TestTrendChart
                  key={test.key}
                  testName={test.test_name}
                  unit={test.unit}
                  normalRange={test.normal_range}
                  data={test.data.map(d => ({
                    date: d.date,
                    value: d.value,
                    appointmentNumber: d.appointment_number,
                  }))}
                />
              ))}
              {testTrends.length === 0 && (
                <p className="text-muted-foreground text-center py-8">No test trend data available</p>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-muted-foreground mb-4 flex items-center gap-2">
              <span>🧠</span> CLINICAL REASONING
            </h2>
            <ClinicalReasoningFlow
              nodes={diagnosisData.clinical_reasoning.nodes}
              connections={diagnosisData.clinical_reasoning.connections}
            />
          </div>
        </section>

        {/* Risk & Progress Row */}
        <section className="grid lg:grid-cols-2 gap-6 mb-6">
          <RiskScoreVisual scores={diagnosisData.risk_scores || []} />
          <ProgressComparison metrics={diagnosisData.progress_metrics || []} />
        </section>

        {/* Med42 Full Text */}
        {med42Text && (
          <section className="mb-6">
            <h2 className="text-lg font-semibold text-muted-foreground mb-4 flex items-center gap-2">
              <span>📝</span> MED42 DIAGNOSIS ANALYSIS
            </h2>
            <div className="bg-card rounded-xl shadow-lg p-6 border-l-4 border-primary">
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm text-card-foreground bg-muted/50 p-4 rounded-lg overflow-x-auto">
                  {med42Text}
                </pre>
              </div>
            </div>
          </section>
        )}

        {/* Alternative Diagnoses */}
        {diagnosisData.alternative_diagnoses && diagnosisData.alternative_diagnoses.length > 0 && (
          <section className="mb-6">
            <h2 className="text-lg font-semibold text-muted-foreground mb-4 flex items-center gap-2">
              <span>🔍</span> ALTERNATIVE DIAGNOSES
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {diagnosisData.alternative_diagnoses.map((alt, index) => (
                <div
                  key={index}
                  className="bg-card rounded-xl shadow-lg p-6 border-l-4 border-warning"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-card-foreground">
                        {alt.diagnosis_name}
                      </h3>
                      <p className="text-sm text-muted-foreground font-mono mt-1">
                        ICD-10: {alt.icd_10_code}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-warning">
                        {Math.round(alt.confidence_score * 100)}%
                      </div>
                      <div className="text-xs text-muted-foreground">Confidence</div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                      Rationale
                    </h4>
                    <p className="text-sm text-card-foreground leading-relaxed">
                      {alt.rationale}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default DiagnosisDashboard;