import { motion } from "framer-motion";
import { ArrowDown, CornerDownRight, Brain, Activity, FileSearch, AlertCircle, Stethoscope, Pill, CheckCircle2 } from "lucide-react";
import React from "react";

interface ReasoningNode {
    id: string;
    label: string;
    type: "input" | "process" | "output" | "evidence";
    icon: string;
}

interface ReasoningConnection {
    from: string;
    to: string;
    label?: string;
}

interface ClinicalReasoningFlowProps {
    nodes: ReasoningNode[];
    connections: ReasoningConnection[];
}

export function ClinicalReasoningFlow({ nodes, connections }: ClinicalReasoningFlowProps) {
    const getNodeStyle = (type: ReasoningNode["type"]) => {
        switch (type) {
            case "input":
                return "bg-blue-500/10 border-blue-200 text-blue-700";
            case "output":
                return "bg-emerald-500/10 border-emerald-200 text-emerald-700";
            case "evidence":
                return "bg-amber-500/10 border-amber-200 text-amber-700";
            default:
                return "bg-slate-100 border-slate-200 text-slate-700";
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl shadow-sm border border-border/50 p-6 h-full"
        >
            <h3 className="text-xl font-bold text-foreground mb-8 flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                    <Brain className="w-6 h-6 text-primary" />
                </div>
                Clinical Reasoning Chain
            </h3>

            <div className="relative">
                {/* Flow visualization */}
                <div className="flex flex-col items-center gap-6">
                    {/* Input Node */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0 }}
                        className="w-full max-w-sm"
                    >
                        <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex items-start gap-4">
                            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                                <UserIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-foreground">Patient Baseline</h4>
                                <p className="text-sm text-muted-foreground mt-1">Chest Pain (8/10), HTN, DM2</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Arrow */}
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        transition={{ delay: 0.2 }}
                        className="text-muted-foreground/40"
                    >
                        <ArrowDown className="w-6 h-6 animate-bounce" />
                    </motion.div>

                    {/* Evidence row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                        {[
                            { icon: Activity, title: "Symptoms", desc: "Crushing chest pain, radiates to arm", color: "text-rose-500", bg: "bg-rose-50" },
                            { icon: FileSearch, title: "Tests", desc: "ECG: ST elevation, Troponin: 2.4", color: "text-indigo-500", bg: "bg-indigo-50" },
                            { icon: AlertCircle, title: "Risk Factors", desc: "HTN, DM2, Family Hx of CAD", color: "text-amber-500", bg: "bg-amber-50" },
                        ].map((item, idx) => (
                            <motion.div
                                key={item.title}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 + idx * 0.1 }}
                                className={`p-4 rounded-xl border border-border bg-card/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow`}
                            >
                                <div className="flex flex-col items-center text-center gap-2">
                                    <div className={`p-2 rounded-full ${item.bg} dark:bg-opacity-10 mb-2`}>
                                        <item.icon className={`w-5 h-5 ${item.color}`} />
                                    </div>
                                    <h5 className="font-semibold text-sm text-foreground">{item.title}</h5>
                                    <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Converging visuals */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="w-full flex justify-center py-2"
                    >
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            <ArrowDown className="w-4 h-4 text-muted-foreground" />
                        </div>
                    </motion.div>


                    {/* Diagnosis Node */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.7 }}
                        className="w-full max-w-lg bg-gradient-to-br from-indigo-500/5 via-primary/5 to-purple-500/5 border border-primary/20 rounded-xl p-6 relative overflow-hidden text-center backdrop-blur-sm"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Stethoscope className="w-24 h-24 text-primary" />
                        </div>

                        <div className="relative z-10 flex flex-col items-center">
                            <span className="text-xs font-bold tracking-widest text-primary uppercase mb-2">Primary Diagnosis</span>
                            <h3 className="text-2xl font-bold text-foreground mb-1">Stable Angina</h3>
                            <div className="px-3 py-1 rounded-full bg-success/10 text-success text-xs font-medium border border-success/20 mt-2">
                                95% Confidence
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="text-muted-foreground/40"
                    >
                        <ArrowDown className="w-6 h-6" />
                    </motion.div>

                    {/* Treatment & Follow-up */}
                    <div className="flex flex-wrap justify-center gap-4 w-full">
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.9 }}
                            className="flex-1 min-w-[200px] p-4 rounded-xl border border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900 flex items-start gap-3"
                        >
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                                <Pill className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <span className="font-semibold text-foreground block text-sm mb-1">Treatment Plan</span>
                                <span className="text-xs text-muted-foreground">Lisinopril 20mg + Aspirin 81mg</span>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 1 }}
                            className="flex-1 min-w-[200px] p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-900 flex items-start gap-3"
                        >
                            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg">
                                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <span className="font-semibold text-foreground block text-sm mb-1">Expected Outcome</span>
                                <span className="text-xs text-muted-foreground">Pain resolution, BP under control</span>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function UserIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    )
}
