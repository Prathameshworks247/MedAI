import { motion } from "framer-motion";

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
  const circumference = 2 * Math.PI * 36;
  const strokeDashoffset = circumference - (diagnosis.confidence * circumference);

  const statusConfig = {
    improving: { icon: "📈", label: "Improving", bgClass: "bg-success-muted", textClass: "text-success" },
    stable: { icon: "⚖️", label: "Stable", bgClass: "bg-info-muted", textClass: "text-info" },
    worsening: { icon: "📉", label: "Worsening", bgClass: "bg-danger-muted", textClass: "text-danger" },
  };

  const status = statusConfig[diagnosis.status];

  const getConfidenceColor = () => {
    if (diagnosis.confidence >= 0.9) return "stroke-success";
    if (diagnosis.confidence >= 0.7) return "stroke-warning";
    return "stroke-danger";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl shadow-lg p-6 border-l-4 border-primary"
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-card-foreground">
            {diagnosis.condition}
          </h2>
          <p className="text-sm text-muted-foreground font-mono">
            ICD-10: {diagnosis.icd_code}
          </p>
        </div>

        {/* Confidence Ring */}
        <div className="relative flex items-center justify-center">
          <svg className="w-20 h-20 -rotate-90">
            <circle
              cx="40"
              cy="40"
              r="36"
              fill="none"
              strokeWidth="6"
              className="stroke-muted"
            />
            <motion.circle
              cx="40"
              cy="40"
              r="36"
              fill="none"
              strokeWidth="6"
              strokeLinecap="round"
              className={getConfidenceColor()}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              style={{ strokeDasharray: circumference }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold text-card-foreground">
              {confidencePercent}%
            </span>
          </div>
        </div>
      </div>

      {/* Status Badge */}
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${status.bgClass} ${status.textClass} mb-6`}>
        <span>{status.icon}</span>
        <span>{status.label}</span>
      </div>

      {/* Evidence Timeline */}
      <div className="mt-4">
        <h4 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wide">
          Evidence Timeline
        </h4>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute top-4 left-0 right-0 h-0.5 bg-border" />

          {/* Timeline points */}
          <div className="flex justify-between relative">
            {diagnosis.evidenceChain.map((point, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.15 }}
                className="flex flex-col items-center"
              >
                {/* Point */}
                <div
                  className={`w-8 h-8 rounded-full border-4 border-card z-10 flex items-center justify-center text-xs font-bold shadow-md ${
                    point.change === "better"
                      ? "bg-success text-success-foreground"
                      : point.change === "same"
                      ? "bg-muted-foreground text-card"
                      : "bg-danger text-danger-foreground"
                  }`}
                >
                  {point.change === "better" ? "↑" : point.change === "same" ? "=" : "↓"}
                </div>

                {/* Label */}
                <div className="mt-3 text-center">
                  <div className="text-xs font-medium text-card-foreground">
                    {point.appointment}
                  </div>
                  <div className="text-xs text-muted-foreground">{point.date}</div>
                  <div className="text-sm font-bold text-card-foreground mt-1">
                    {point.value}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="mt-6 w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium transition-colors hover:bg-primary/90"
      >
        View Full Evidence Graph →
      </motion.button>
    </motion.div>
  );
}
