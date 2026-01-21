import React from "react";
import { motion } from "framer-motion";
import { Activity, Brain, LayoutDashboard, TrendingUp, AlertTriangle } from "lucide-react";
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

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const sectionVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="min-h-screen bg-background/50 p-6 md:p-8"
        >
            <div className="max-w-7xl mx-auto space-y-8">
                <DashboardHeader
                    patientName={patient?.name || "Patient"}
                    lastUpdated={patient?.last_updated ? new Date(patient.last_updated).toLocaleString() : new Date().toLocaleString()}
                />

                {/* Primary Diagnosis */}
                {diagnosisData && (
                    <motion.section variants={sectionVariants}>
                        <SectionHeader icon={LayoutDashboard} title="Primary Diagnosis" />
                        <DiagnosisCard diagnosis={diagnosisData} />
                    </motion.section>
                )}

                {/* Charts Row */}
                <section className="grid xl:grid-cols-2 gap-8">
                    <motion.div variants={sectionVariants} className="space-y-6">
                        <SectionHeader icon={TrendingUp} title="Test Trends Analysis" />
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
                                <EmptyState message="No test trends available." />
                            )}
                        </div>
                    </motion.div>

                    <motion.div variants={sectionVariants} className="h-full flex flex-col">
                        <SectionHeader icon={Brain} title="Clinical Reasoning" />
                        <div className="flex-1">
                            {clinical_reasoning ? (
                                <ClinicalReasoningFlow
                                    nodes={clinical_reasoning.nodes || []}
                                    connections={clinical_reasoning.connections || []}
                                />
                            ) : (
                                <EmptyState message="No clinical reasoning graph available." />
                            )}
                        </div>
                    </motion.div>
                </section>

                {/* Risk & Progress Row */}
                <section className="grid xl:grid-cols-2 gap-8">
                    {risk_scores && risk_scores.length > 0 && (
                        <motion.div variants={sectionVariants}>
                            <SectionHeader icon={AlertTriangle} title="Risk Assessment" />
                            <RiskScoreVisual scores={risk_scores} />
                        </motion.div>
                    )}
                    {progress_metrics && progress_metrics.length > 0 && (
                        <motion.div variants={sectionVariants}>
                            <SectionHeader icon={Activity} title="Progress Monitoring" />
                            <ProgressComparison metrics={progress_metrics} />
                        </motion.div>
                    )}
                </section>
            </div>
        </motion.div>
    );
};

function SectionHeader({ icon: Icon, title }: { icon: any, title: string }) {
    return (
        <h2 className="text-sm font-bold text-muted-foreground mb-4 flex items-center gap-2 uppercase tracking-wider pl-1">
            <Icon className="w-4 h-4" /> {title}
        </h2>
    );
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="bg-muted/30 border border-dashed border-border rounded-xl p-8 text-center text-muted-foreground">
            {message}
        </div>
    );
}

export default DiagnosisDashboard;
