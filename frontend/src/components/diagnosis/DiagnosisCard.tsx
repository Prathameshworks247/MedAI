import { motion } from "framer-motion";
import { ArrowRight, TrendingUp, TrendingDown, Minus } from "lucide-react";
import React from "react";

interface EvidencePoint {
    appointment: string;
    date: string;
    value: string;
    change: "better" | "same" | "worse";
}

interface DiagnosisCardProps {
    diagnosis: {
        condition: string;
        icd_code: string;
        confidence: number;
        status: "improving" | "stable" | "worsening";
        evidenceChain: EvidencePoint[];
    };
}

export function DiagnosisCard({ diagnosis }: DiagnosisCardProps) {
    const confidencePercent = Math.round(diagnosis.confidence * 100);
    const circumference = 2 * Math.PI * 48;
    const strokeDashoffset = circumference - (diagnosis.confidence * circumference);

    const statusConfig = {
        improving: {
            icon: TrendingUp,
            label: "Improving",
            class: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
        },
        stable: {
            icon: Minus,
            label: "Stable",
            class: "bg-blue-500/10 text-blue-600 border-blue-500/20"
        },
        worsening: {
            icon: TrendingDown,
            label: "Worsening",
            class: "bg-rose-500/10 text-rose-600 border-rose-500/20"
        },
    };

    const status = statusConfig[diagnosis.status];
    const StatusIcon = status.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl shadow-sm border border-border/50 px-10 py-6 overflow-hidden relative"
        >
            <div className="absolute top-0 left-0 w-1 h-full bg-primary" />

            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="space-y-3">
                    <div className="space-y-1">
                        <h2 className="text-3xl font-bold text-foreground">
                            {diagnosis.condition}
                        </h2>
                        <div className="flex items-center gap-3">
                            <span className="px-2.5 py-0.5 rounded-md bg-muted text-muted-foreground text-xs font-mono font-medium border border-border">
                                ICD-10: {diagnosis.icd_code}
                            </span>
                            <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-semibold ${status.class}`}>
                                <StatusIcon className="w-3.5 h-3.5" />
                                {status.label}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Confidence Ring with Gradients */}
                <div className="relative flex items-center justify-center">
                    <svg className="w-32 h-32 -rotate-90">
                        <defs>
                            <linearGradient id="confidenceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="hsl(var(--primary))" />
                                <stop offset="100%" stopColor="hsl(var(--primary) / 0.5)" />
                            </linearGradient>
                        </defs>
                        <circle
                            cx="60"
                            cy="64"
                            r="48"
                            fill="none"
                            strokeWidth="8"
                            className="stroke-muted/20"
                        />
                        <motion.circle
                            cx="60"
                            cy="64"
                            r="48"
                            fill="none"
                            strokeWidth="8"
                            strokeLinecap="round"
                            stroke="url(#confidenceGradient)"
                            initial={{ strokeDashoffset: circumference }}
                            animate={{ strokeDashoffset }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            style={{ strokeDasharray: circumference }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold text-foreground">
                            {confidencePercent}%
                        </span>
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                            Confidence
                        </span>
                    </div>
                </div>
            </div>

            {/* Evidence Timeline */}
            {/* <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
                <h4 className="text-sm font-semibold text-muted-foreground mb-6 uppercase tracking-wider flex items-center gap-2">
                    Documentation Trail
                </h4>
                <div className="relative">
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-border/60 -translate-y-1/2" />

                    <div className="flex justify-between items-center relative z-10 px-20">
                        {diagnosis.evidenceChain.map((point, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.15 }}
                                className="group relative"
                            >
                                <div className="flex flex-col items-center">
                                    <motion.div
                                        whileHover={{ scale: 1.15 }}
                                        className={`w-4 h-4 rounded-full border-2 border-card shadow-sm z-10 transition-colors duration-300 ${point.change === "better"
                                            ? "bg-emerald-500"
                                            : point.change === "same"
                                                ? "bg-blue-500"
                                                : "bg-rose-500"
                                            }`}
                                    />

                                    <div className="absolute top-8 left-1/2 -translate-x-1/2 w-max max-w-[140px] text-center pt-2 opacity-100 transition-all">
                                        <div className="text-xs font-semibold text-foreground mb-0.5">
                                            {point.value}
                                        </div>
                                        <div className="text-[10px] text-muted-foreground bg-card/80 px-1.5 py-0.5 rounded border border-border/50 backdrop-blur-sm">
                                            {point.date}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                <div className="mt-24 text-center">
                    <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className="text-primary text-sm font-medium hover:text-primary/80 inline-flex items-center gap-1 transition-colors"
                    >
                        View Full Evidence Graph <ArrowRight className="w-3.5 h-3.5" />
                    </motion.button>
                </div>
            </div> */}
        </motion.div>
    );
}
