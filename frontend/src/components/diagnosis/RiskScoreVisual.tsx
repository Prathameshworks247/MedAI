import { motion } from "framer-motion";
import { AlertTriangle, ShieldCheck, AlertOctagon } from "lucide-react";
import React from "react";

interface RiskScore {
    name: string;
    value: number;
    max: number;
    interpretation: string;
}

interface RiskScoreVisualProps {
    scores: RiskScore[];
}

export function RiskScoreVisual({ scores }: RiskScoreVisualProps) {
    const getRiskLevel = (percentage: number) => {
        if (percentage < 33) return { color: "text-emerald-500", bg: "bg-emerald-500", label: "Low Risk", icon: ShieldCheck };
        if (percentage < 66) return { color: "text-amber-500", bg: "bg-amber-500", label: "Moderate Risk", icon: AlertTriangle };
        return { color: "text-rose-500", bg: "bg-rose-500", label: "High Risk", icon: AlertOctagon };
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl shadow-sm border border-border/50 p-6 h-full"
        >
            <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-3">
                <div className="p-2 bg-rose-500/10 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-rose-500" />
                </div>
                Risk Assessment
            </h3>

            <div className="space-y-8">
                {scores.map((risk, idx) => {
                    const percentage = (risk.value / risk.max) * 100;
                    const level = getRiskLevel(percentage);
                    const Icon = level.icon;

                    return (
                        <motion.div
                            key={risk.name}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="relative"
                        >
                            <div className="flex justify-between items-end mb-3">
                                <div className="flex flex-col gap-1">
                                    <span className="font-semibold text-foreground text-lg">
                                        {risk.name}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <Icon className={`w-4 h-4 ${level.color}`} />
                                        <span className={`text-sm font-medium ${level.color}`}>
                                            {risk.interpretation}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-2xl font-bold text-foreground font-mono">
                                        {risk.value}
                                    </span>
                                    <span className="text-muted-foreground text-sm font-medium ml-1">
                                        / {risk.max}
                                    </span>
                                </div>
                            </div>

                            {/* Progress Bar Container */}
                            <div className="h-4 bg-secondary/50 rounded-full overflow-hidden relative">
                                {/* Background segments for texture */}
                                <div className="absolute inset-0 flex gap-1">
                                    {Array.from({ length: 20 }).map((_, i) => (
                                        <div key={i} className="flex-1 border-r border-card/30 last:border-0" />
                                    ))}
                                </div>

                                {/* Active Progress */}
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percentage}%` }}
                                    transition={{ duration: 1.2, ease: "easeOut", delay: idx * 0.2 }}
                                    className={`h-full ${level.bg} relative`}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                                </motion.div>
                            </div>

                            {/* Scale Labels */}
                            <div className="flex justify-between mt-2 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                                <span>Low</span>
                                <span>Moderate</span>
                                <span>High</span>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </motion.div>
    );
}
