import { motion } from "framer-motion";

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
        return "bg-info-muted border-info text-info";
      case "output":
        return "bg-success-muted border-success text-success";
      case "evidence":
        return "bg-warning-muted border-warning text-warning";
      default:
        return "bg-secondary border-border text-secondary-foreground";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl shadow-lg p-6"
    >
      <h3 className="text-xl font-bold text-card-foreground mb-6 flex items-center gap-2">
        <span className="text-2xl">🧠</span>
        Clinical Reasoning Chain
      </h3>

      <div className="relative">
        {/* Flow visualization */}
        <div className="flex flex-col items-center gap-4">
          {/* Input Node */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0 }}
            className={`px-6 py-4 rounded-xl border-2 ${getNodeStyle("input")} text-center max-w-xs`}
          >
            <span className="text-2xl block mb-2">👤</span>
            <span className="font-semibold text-card-foreground block">Patient Baseline</span>
            <span className="text-sm text-muted-foreground">Chest Pain (8/10), HTN, DM2</span>
          </motion.div>

          {/* Arrow */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-2xl text-muted-foreground"
          >
            ↓
          </motion.div>

          {/* Evidence row */}
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { icon: "💊", title: "Symptoms", desc: "Crushing chest pain, radiates to arm" },
              { icon: "🧪", title: "Tests", desc: "ECG: ST elevation, Troponin: 2.4" },
              { icon: "⚠️", title: "Risk Factors", desc: "HTN, DM2, Family Hx of CAD" },
            ].map((item, idx) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + idx * 0.1 }}
                className={`px-5 py-4 rounded-xl border-2 ${getNodeStyle("evidence")} text-center flex-1 min-w-[160px] max-w-[200px]`}
              >
                <span className="text-2xl block mb-2">{item.icon}</span>
                <span className="font-semibold text-card-foreground block text-sm">{item.title}</span>
                <span className="text-xs text-muted-foreground">{item.desc}</span>
              </motion.div>
            ))}
          </div>

          {/* Converging arrows */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex items-center gap-2 text-muted-foreground"
          >
            <span className="text-xs">suggests</span>
            <span className="text-lg">↘</span>
            <span className="text-2xl">↓</span>
            <span className="text-lg">↙</span>
            <span className="text-xs">confirms</span>
          </motion.div>

          {/* Diagnosis Node */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 }}
            className={`px-8 py-5 rounded-xl border-2 ${getNodeStyle("output")} text-center shadow-lg`}
          >
            <span className="text-3xl block mb-2">🎯</span>
            <span className="font-bold text-lg text-card-foreground block">DIAGNOSIS</span>
            <span className="text-sm text-muted-foreground block">Stable Angina</span>
            <span className="text-xs font-mono text-success">(95% confidence)</span>
          </motion.div>

          {/* Arrow */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-2xl text-muted-foreground"
          >
            ↓
          </motion.div>

          {/* Treatment & Follow-up */}
          <div className="flex flex-wrap justify-center gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="px-5 py-4 rounded-xl border-2 bg-primary/10 border-primary text-center"
            >
              <span className="text-2xl block mb-2">💊</span>
              <span className="font-semibold text-card-foreground block text-sm">Treatment</span>
              <span className="text-xs text-muted-foreground">Lisinopril 20mg + Aspirin 81mg</span>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className={`px-5 py-4 rounded-xl border-2 ${getNodeStyle("output")} text-center`}
            >
              <span className="text-2xl block mb-2">📊</span>
              <span className="font-semibold text-card-foreground block text-sm">Follow-up</span>
              <span className="text-xs text-muted-foreground">Pain resolved, BP controlled</span>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
