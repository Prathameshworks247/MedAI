import React, { useState } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Activity, Brain, LayoutDashboard, TrendingUp, AlertTriangle, Network } from "lucide-react";
import { DashboardHeader } from "./DashboardHeader";
import { DiagnosisCard } from "./DiagnosisCard";
import { TestTrendChart } from "./TestTrendChart";
import { ProgressComparison } from "./ProgressComparison";
import { RiskScoreVisual } from "./RiskScoreVisual";
import { ClinicalReasoningModal } from "./ClinicalReasoningModal";

const DiagnosisDashboard = ({ data, text }: { data: any, text: string }) => {
    const [isReasoningModalOpen, setIsReasoningModalOpen] = useState(false);

    if (!data) return null;

    const match = text.match(/^(.*?)ALTERNATIVE DIAGNOSES/s);
    const primary_diagnosis_text = match ? match[1] : text;

    const {
        primary_diagnosis,
        test_trends,
        clinical_reasoning,
        risk_scores,
        progress_metrics,
        patient
    } = data;
    console.log(clinical_reasoning);

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

                {/* Primary Diagnosis & AI Analysis */}
                <motion.section variants={sectionVariants}>
                    <div className="flex items-center justify-between mb-4">
                        <SectionHeader icon={LayoutDashboard} title="Primary Diagnosis" />

                        {clinical_reasoning && (
                            <button
                                onClick={() => setIsReasoningModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-sm font-semibold transition-colors border border-indigo-200"
                            >
                                <Network className="w-4 h-4" />
                                View Clinical Reasoning Graph
                            </button>
                        )}
                    </div>

                    {text && text.length > 0 && (
                        <div className="mb-6 p-4 bg-indigo-50 border border-indigo-100 rounded-lg text-gray-800 font-normal shadow-sm">
                            <div className="prose prose-indigo max-w-none prose-headings:font-bold prose-headings:text-indigo-900 prose-p:leading-relaxed prose-strong:text-indigo-800 prose-ul:list-disc prose-ul:pl-4">
                                <ReactMarkdown>
                                    {primary_diagnosis_text}
                                </ReactMarkdown>
                            </div>
                        </div>
                    )}

                    {diagnosisData && <DiagnosisCard diagnosis={diagnosisData} />}
                </motion.section>

                {/* Charts & Test Trends - Full Width */}
                <motion.section variants={sectionVariants} className="space-y-6">
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
                            <div className="col-span-full">
                                <EmptyState message="No test trends available." />
                            </div>
                        )}
                    </div>
                </motion.section>

                {/* Risk & Progress Row */}
                <section className="space-y-8">
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

            {/* Clinical Reasoning Modal */}
            <ClinicalReasoningModal
                isOpen={isReasoningModalOpen}
                onClose={() => setIsReasoningModalOpen(false)}
                nodes={clinical_reasoning?.nodes || []}
                connections={clinical_reasoning?.connections || []}
            />
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
