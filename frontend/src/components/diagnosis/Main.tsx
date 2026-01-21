import React from "react";
import { DashboardHeader } from "./DashboardHeader";
import { DiagnosisCard } from "./DiagnosisCard";
import { TestTrendChart } from "./TestTrendChart";
import { ProgressComparison } from "./ProgressComparison";
import { RiskScoreVisual } from "./RiskScoreVisual";
import { ClinicalReasoningFlow } from "./ClinicalReasoningFlow";

const DiagnosisDashboard = ({ data }: { data: any }) => {
    if (!data) return null;

    const {
        primary_diagnosis,
        test_trends,
        clinical_reasoning,
        risk_scores,
        progress_metrics,
        patient
    } = data;

    // Transform primary diagnosis to match component expectation
    const diagnosisData = primary_diagnosis ? {
        ...primary_diagnosis,
        evidenceChain: primary_diagnosis.evidence_chain
    } : null;

    return (
        <div className="">
            <div className="max-w-7xl mx-auto">
                <DashboardHeader
                    patientName={patient?.name || "Patient"}
                    lastUpdated={patient?.last_updated ? new Date(patient.last_updated).toLocaleString() : new Date().toLocaleString()}
                />

                {/* Primary Diagnosis */}
                {diagnosisData && (
                    <section className="mb-6">
                        <h2 className="text-lg font-semibold text-muted-foreground mb-4 flex items-center gap-2">
                            <span>📊</span> PRIMARY DIAGNOSIS
                        </h2>
                        <DiagnosisCard diagnosis={diagnosisData} />
                    </section>
                )}

                {/* Charts Row */}
                <section className="grid lg:grid-cols-2 gap-6 mb-6">
                    <div>
                        <h2 className="text-lg font-semibold text-muted-foreground mb-4 flex items-center gap-2">
                            <span>📈</span> TEST TRENDS
                        </h2>
                        <div className="space-y-6">
                            {test_trends && Object.keys(test_trends).length > 0 ? (
                                Object.entries(test_trends).map(([key, testData]: [string, any]) => (
                                    <TestTrendChart
                                        key={key}
                                        testName={testData.test_name || key}
                                        unit={testData.unit || ""}
                                        normalRange={testData.normal_range || []}
                                        data={testData.data || []}
                                    />
                                ))
                            ) : (
                                <p className="text-gray-500 italic">No test trends available.</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <h2 className="text-lg font-semibold text-muted-foreground mb-4 flex items-center gap-2">
                            <span>🧠</span> CLINICAL REASONING
                        </h2>
                        {clinical_reasoning ? (
                            <ClinicalReasoningFlow
                                nodes={clinical_reasoning.nodes || []}
                                connections={clinical_reasoning.connections || []}
                            />
                        ) : (
                            <p className="text-gray-500 italic">No clinical reasoning graph available.</p>
                        )}
                    </div>
                </section>

                {/* Risk & Progress Row */}
                <section className="grid lg:grid-cols-2 gap-6">
                    {risk_scores && risk_scores.length > 0 && (
                        <RiskScoreVisual scores={risk_scores} />
                    )}
                    {progress_metrics && progress_metrics.length > 0 && (
                        <ProgressComparison metrics={progress_metrics} />
                    )}
                </section>
            </div>
        </div>
    );
};

export default DiagnosisDashboard;
