import { motion } from "framer-motion";
import { ArrowRight, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, RefreshCcw } from "lucide-react";
import React from "react";

interface Metric {
    name: string;
    baseline: number;
    current: number;
    unit: string;
    target: number;
    better: "lower" | "higher";
    icon: string;
    is_prediction?: boolean;
}

interface ProgressComparisonProps {
    metrics: Metric[];
}

export function ProgressComparison({ metrics }: ProgressComparisonProps) {
    const calculateImprovement = (metric: Metric) => {
        const change = metric.current - metric.baseline;
        const percentChange = Math.abs((change / metric.baseline) * 100);
        const isImproving =
            metric.better === "lower" ? change < 0 : change > 0;
        return { change, percentChange, isImproving };
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {metrics.map((metric, idx) => {
                const { change, percentChange, isImproving } = calculateImprovement(metric);
                const isStable = Math.abs(change) < 0.1;

                return (
                    <motion.div
                        key={metric.name}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className={`bg-card rounded-2xl shadow-sm border p-6 transition-colors ${
                            metric.is_prediction
                            ? "border-primary/30 bg-primary/5 border-dashed"
                            : "border-border/50 hover:bg-muted/30"
                        }`}
                    >
                            {/* Metric header */}
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="text-2xl">{metric.icon}</div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-semibold text-foreground">{metric.name}</h4>
                                            {metric.is_prediction && (
                                                <span className="text-[9px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full font-bold uppercase tracking-tighter">
                                                    Projected
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground">Target: {metric.target} {metric.unit}</p>
                                    </div>
                                </div>

                                <div className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-xs font-bold border ${isImproving
                                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-200"
                                        : isStable
                                            ? "bg-blue-500/10 text-blue-600 border-blue-200"
                                            : "bg-rose-500/10 text-rose-600 border-rose-200"
                                    }`}>
                                    {isImproving ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                                    {percentChange.toFixed(0)}%
                                </div>
                            </div>

                            {/* Visual comparison */}
                            <div className="flex items-center gap-3 relative">
                                {/* Baseline */}
                                <div className="flex-1 flex flex-col gap-1">
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Baseline</span>
                                    <div className="h-10 rounded-lg bg-muted flex items-center px-3 text-muted-foreground font-mono font-medium relative overflow-hidden">
                                        {metric.baseline} {metric.unit}
                                    </div>
                                </div>

                                {/* Arrow */}
                                <div className="text-muted-foreground">
                                    <ArrowRight className="w-4 h-4" />
                                </div>

                                {/* Current */}
                                <div className="flex-1 flex flex-col gap-1">
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                                        {metric.is_prediction ? "Predicted" : "Current"}
                                    </span>
                                    <div className={`h-10 rounded-lg flex items-center px-3 font-mono font-bold relative overflow-hidden transition-all group-hover:shadow-md ${
                                        metric.is_prediction 
                                        ? "bg-primary text-primary-foreground"
                                        : isImproving ? "bg-emerald-500 text-emerald-950" : "bg-rose-500 text-rose-950"
                                        }`}>
                                        <div className="relative z-10 flex items-center gap-2">
                                            {metric.current} {metric.unit}
                                            {metric.is_prediction ? (
                                                <RefreshCcw className="w-3 h-3 animate-spin-slow" />
                                            ) : (
                                                isImproving ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />
                                            )}
                                        </div>
                                        {/* Shimmer effect */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] animate-[shimmer_2s_infinite]" />
                                    </div>
                                </div>
                            </div>
                    </motion.div>
                );
            })}
        </div>
    );
}
