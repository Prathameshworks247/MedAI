import { motion } from "framer-motion";
import React from "react";
interface Metric {
  name: string;
  baseline: number;
  current: number;
  unit: string;
  target: number;
  better: "lower" | "higher";
  icon: string;
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl shadow-lg p-6"
    >
      <h3 className="text-xl font-bold text-card-foreground mb-6 flex items-center gap-2">
        <span className="text-2xl">🔄</span>
        Progress vs Baseline
      </h3>

      <div className="space-y-5">
        {metrics.map((metric, idx) => {
          const { change, percentChange, isImproving } =
            calculateImprovement(metric);

          return (
            <motion.div
              key={metric.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="border-b border-border pb-5 last:border-0 last:pb-0"
            >
              {/* Metric header */}
              <div className="flex justify-between items-center mb-3">
                <span className="font-medium text-card-foreground flex items-center gap-2">
                  <span className="text-lg">{metric.icon}</span>
                  {metric.name}
                </span>
                <span
                  className={`text-sm font-bold flex items-center gap-1 ${
                    isImproving ? "text-success" : "text-danger"
                  }`}
                >
                  {isImproving ? "✓" : "✗"} {percentChange.toFixed(0)}%
                  {isImproving ? " improvement" : " worsening"}
                </span>
              </div>

              {/* Visual comparison bars */}
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <div className="text-xs text-muted-foreground mb-1.5 uppercase tracking-wide">
                    Baseline
                  </div>
                  <div className="h-10 bg-muted rounded-lg flex items-center px-4">
                    <span className="text-sm font-bold text-muted-foreground">
                      {metric.baseline}
                      {metric.unit}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1.5 uppercase tracking-wide">
                    Current
                  </div>
                  <div
                    className={`h-10 rounded-lg flex items-center px-4 ${
                      isImproving ? "bg-success-muted" : "bg-danger-muted"
                    }`}
                  >
                    <span
                      className={`text-sm font-bold ${
                        isImproving ? "text-success" : "text-danger"
                      }`}
                    >
                      {metric.current}
                      {metric.unit}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress indicator */}
              <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
                <span className="font-mono">
                  {metric.baseline}
                  {metric.unit}
                </span>
                <motion.span
                  animate={{ x: [0, 5, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className={`text-xl ${
                    isImproving ? "text-success" : "text-danger"
                  }`}
                >
                  {metric.better === "lower"
                    ? change < 0
                      ? "→"
                      : "→"
                    : change > 0
                    ? "→"
                    : "→"}
                </motion.span>
                <span
                  className={`font-mono font-bold ${
                    isImproving ? "text-success" : "text-danger"
                  }`}
                >
                  {metric.current}
                  {metric.unit}
                </span>
                <span className="text-xs text-muted-foreground ml-2">
                  (Target: {metric.target}
                  {metric.unit})
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
