import React from "react";
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

  // Group nodes by type for better visualization
  const inputNodes = nodes.filter(n => n.type === "input");
  const evidenceNodes = nodes.filter(n => n.type === "evidence");
  const processNodes = nodes.filter(n => n.type === "process");
  const outputNodes = nodes.filter(n => n.type === "output");

  // If no nodes provided, show empty state
  if (nodes.length === 0) {
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
        <div className="text-center py-8 text-muted-foreground">
          <p>No clinical reasoning data available</p>
          <p className="text-sm mt-2">Reasoning flow will be generated from diagnosis analysis</p>
        </div>
      </motion.div>
    );
  }

  // Build a simple flow visualization
  // For a more complex graph, consider using a graph library like react-flow
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
          {/* Input Nodes */}
          {inputNodes.length > 0 && (
            <>
              {inputNodes.map((node, idx) => (
                <motion.div
                  key={node.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`px-6 py-4 rounded-xl border-2 ${getNodeStyle("input")} text-center max-w-xs`}
                >
                  <span className="text-2xl block mb-2">{node.icon || "👤"}</span>
                  <span className="font-semibold text-card-foreground block">{node.label}</span>
                </motion.div>
              ))}
              {evidenceNodes.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: inputNodes.length * 0.1 }}
                  className="text-2xl text-muted-foreground"
                >
                  ↓
                </motion.div>
              )}
            </>
          )}

          {/* Evidence Nodes */}
          {evidenceNodes.length > 0 && (
            <>
              <div className="flex flex-wrap justify-center gap-4">
                {evidenceNodes.map((node, idx) => (
                  <motion.div
                    key={node.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (inputNodes.length * 0.1) + 0.2 + (idx * 0.1) }}
                    className={`px-5 py-4 rounded-xl border-2 ${getNodeStyle("evidence")} text-center flex-1 min-w-[160px] max-w-[200px]`}
                  >
                    <span className="text-2xl block mb-2">{node.icon || "📊"}</span>
                    <span className="font-semibold text-card-foreground block text-sm">{node.label}</span>
                  </motion.div>
                ))}
              </div>
              {(processNodes.length > 0 || outputNodes.length > 0) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: (inputNodes.length * 0.1) + 0.2 + (evidenceNodes.length * 0.1) }}
                  className="flex items-center gap-2 text-muted-foreground"
                >
                  <span className="text-xs">suggests</span>
                  <span className="text-lg">↘</span>
                  <span className="text-2xl">↓</span>
                  <span className="text-lg">↙</span>
                  <span className="text-xs">confirms</span>
                </motion.div>
              )}
            </>
          )}

          {/* Process Nodes */}
          {processNodes.length > 0 && (
            <>
              <div className="flex flex-wrap justify-center gap-4">
                {processNodes.map((node, idx) => (
                  <motion.div
                    key={node.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (inputNodes.length * 0.1) + 0.4 + (evidenceNodes.length * 0.1) + (idx * 0.1) }}
                    className={`px-5 py-4 rounded-xl border-2 ${getNodeStyle("process")} text-center flex-1 min-w-[160px] max-w-[200px]`}
                  >
                    <span className="text-2xl block mb-2">{node.icon || "🔍"}</span>
                    <span className="font-semibold text-card-foreground block text-sm">{node.label}</span>
                  </motion.div>
                ))}
              </div>
              {outputNodes.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: (inputNodes.length * 0.1) + 0.6 + (evidenceNodes.length * 0.1) + (processNodes.length * 0.1) }}
                  className="text-2xl text-muted-foreground"
                >
                  ↓
                </motion.div>
              )}
            </>
          )}

          {/* Output Nodes */}
          {outputNodes.length > 0 && (
            <div className="flex flex-wrap justify-center gap-4">
              {outputNodes.map((node, idx) => (
                <motion.div
                  key={node.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: (inputNodes.length * 0.1) + 0.7 + (evidenceNodes.length * 0.1) + (processNodes.length * 0.1) + (idx * 0.1) }}
                  className={`px-8 py-5 rounded-xl border-2 ${getNodeStyle("output")} text-center shadow-lg ${outputNodes.length === 1 ? 'max-w-md' : 'flex-1 min-w-[200px]'}`}
                >
                  <span className="text-3xl block mb-2">{node.icon || "🎯"}</span>
                  <span className="font-bold text-lg text-card-foreground block">{node.label}</span>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
