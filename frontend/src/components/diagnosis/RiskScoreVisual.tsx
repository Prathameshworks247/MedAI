import { motion } from "framer-motion";
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
  const getColor = (percentage: number) => {
    if (percentage < 33) return { bg: "bg-success", text: "text-success" };
    if (percentage < 66) return { bg: "bg-warning", text: "text-warning" };
    return { bg: "bg-danger", text: "text-danger" };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl shadow-lg p-6"
    >
      <h3 className="text-xl font-bold text-card-foreground mb-6 flex items-center gap-2">
        <span className="text-2xl">⚠️</span>
        Risk Assessment
      </h3>

      <div className="space-y-6">
        {scores.map((risk, idx) => {
          const percentage = (risk.value / risk.max) * 100;
          const color = getColor(percentage);

          return (
            <motion.div
              key={risk.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-card-foreground">
                  {risk.name}
                </span>
                <span className={`text-sm font-medium ${color.text}`}>
                  {risk.interpretation}
                </span>
              </div>

              {/* Progress bar */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1, ease: "easeOut", delay: idx * 0.1 }}
                    className={`h-full ${color.bg} rounded-full`}
                  />
                </div>
                <div className="text-lg font-bold text-card-foreground w-14 text-right font-mono">
                  {risk.value}/{risk.max}
                </div>
              </div>

              {/* Dots visualization */}
              <div className="flex gap-1.5 mt-3">
                {Array.from({ length: risk.max }).map((_, dotIdx) => (
                  <motion.div
                    key={dotIdx}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      delay: idx * 0.1 + dotIdx * 0.05,
                      type: "spring",
                      stiffness: 500,
                    }}
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      dotIdx < risk.value
                        ? `${color.bg} text-card`
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {dotIdx + 1}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
