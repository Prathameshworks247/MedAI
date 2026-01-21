import React from "react";
import { motion } from "framer-motion";
import {
    ArrowDown,
    Brain,
    Activity,
    FileSearch,
    AlertCircle,
    Stethoscope,
    Pill,
    CheckCircle2,
    User,
    Microscope,
    Thermometer,
    HeartPulse,
    Syringe,
    ClipboardList,
} from "lucide-react";

interface ReasoningNode {
    id: string;
    label: string;
    type: "input" | "process" | "output" | "evidence";
    description?: string; // Added description to interface if available
    icon: string;
    data?: any; // For extra flexibility
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

const IconMap: Record<string, any> = {
    "activity": Activity,
    "file-search": FileSearch,
    "filesearch": FileSearch,
    "alert-circle": AlertCircle,
    "alertcircle": AlertCircle,
    "stethoscope": Stethoscope,
    "pill": Pill,
    "check-circle-2": CheckCircle2,
    "checkcircle2": CheckCircle2,
    "brain": Brain,
    "user": User,
    "microscope": Microscope,
    "thermometer": Thermometer,
    "heart-pulse": HeartPulse,
    "heartpulse": HeartPulse,
    "syringe": Syringe,
    "clipboard-list": ClipboardList,
    "clipboardlist": ClipboardList,
    "default": Activity
};

export function ClinicalReasoningFlow({ nodes, connections }: ClinicalReasoningFlowProps) {
    // Categorize nodes
    const inputs = nodes.filter(n => n.type === 'input');
    const evidence = nodes.filter(n => n.type === 'evidence');
    const processes = nodes.filter(n => n.type === 'process');
    const outputs = nodes.filter(n => n.type === 'output');

    // Combine evidence and processes for the middle layer if desired, or keep separate
    // Visually, evidence usually feeds into reasoning (process) which feeds into diagnosis (output)
    // For this design, let's treat 'process' and 'evidence' as the middle layer
    const middleLayer = [...evidence, ...processes];

    const getIcon = (iconName: string) => {
        const normalized = iconName.toLowerCase().replace(/_/g, '-');
        return IconMap[normalized] || IconMap['default'];
    };

    const renderNodeIcon = (node: ReasoningNode, className = "w-5 h-5") => {
        const IconComponent = getIcon(node.icon);
        return <IconComponent className={className} />;
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
                <div className="flex flex-col items-center gap-6">
                    {/* INPUT LAYER */}
                    {inputs.length > 0 && (
                        <div className="w-full flex flex-col gap-4 items-center">
                            {inputs.map((node, idx) => (
                                <motion.div
                                    key={node.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="w-full max-w-sm"
                                >
                                    <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex items-start gap-4">
                                        <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                                            {renderNodeIcon(node, "w-5 h-5 text-blue-600 dark:text-blue-400")}
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-foreground">{node.label}</h4>
                                            {node.description && (
                                                <p className="text-sm text-muted-foreground mt-1">{node.description}</p>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {/* ARROW */}
                    {(inputs.length > 0 && middleLayer.length > 0) && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            transition={{ delay: 0.2 }}
                            className="text-muted-foreground/40"
                        >
                            <ArrowDown className="w-6 h-6 animate-bounce" />
                        </motion.div>
                    )}

                    {/* MIDDLE LAYER (Evidence & Process) */}
                    {middleLayer.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                            {middleLayer.map((node, idx) => {
                                const isProcess = node.type === 'process';
                                const bgClass = isProcess ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'bg-amber-50 dark:bg-amber-900/20';
                                const textClass = isProcess ? 'text-indigo-600 dark:text-indigo-400' : 'text-amber-600 dark:text-amber-400';

                                return (
                                    <motion.div
                                        key={node.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 + idx * 0.1 }}
                                        className={`p-4 rounded-xl border border-border bg-card/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow`}
                                    >
                                        <div className="flex flex-col items-center text-center gap-2">
                                            <div className={`p-2 rounded-full ${bgClass} mb-2`}>
                                                {renderNodeIcon(node, `w-5 h-5 ${textClass}`)}
                                            </div>
                                            <h5 className="font-semibold text-sm text-foreground">{node.label}</h5>
                                            {node.description && (
                                                <p className="text-xs text-muted-foreground leading-relaxed">{node.description}</p>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}

                    {/* ARROW */}
                    {(middleLayer.length > 0 && outputs.length > 0) && (
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
                    )}

                    {/* OUTPUT LAYER */}
                    {outputs.length > 0 && (
                        <div className="w-full flex flex-col items-center gap-4">
                            {outputs.map((node, idx) => (
                                <motion.div
                                    key={node.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.7 + idx * 0.1 }}
                                    className="w-full max-w-lg bg-gradient-to-br from-indigo-500/5 via-primary/5 to-purple-500/5 border border-primary/20 rounded-xl p-6 relative overflow-hidden text-center backdrop-blur-sm"
                                >
                                    <div className="absolute top-0 right-0 p-4 opacity-10">
                                        {renderNodeIcon(node, "w-24 h-24 text-primary")}
                                    </div>

                                    <div className="relative z-10 flex flex-col items-center">
                                        <span className="text-xs font-bold tracking-widest text-primary uppercase mb-2">Diagnosis / Outcome</span>
                                        <h3 className="text-2xl font-bold text-foreground mb-1">{node.label}</h3>
                                        {node.description && (
                                            <p className="text-muted-foreground mt-2 text-sm">{node.description}</p>
                                        )}
                                        {/* If we have confidence data, we could show it here if passed in node.data */}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {nodes.length === 0 && (
                        <div className="text-center p-8 text-muted-foreground">
                            No reasoning nodes available to display.
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

