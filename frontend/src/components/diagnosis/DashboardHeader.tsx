import { motion } from "framer-motion";
import { Activity, FileText, Share2, Calendar } from "lucide-react";
import React from "react";
interface DashboardHeaderProps {
  patientName: string;
  lastUpdated: string;
}

export function DashboardHeader({ patientName, lastUpdated }: DashboardHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl shadow-lg p-6 mb-6"
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <Activity className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-card-foreground">
              Diagnosis Dashboard
            </h1>
            <p className="text-muted-foreground">
              Patient: <span className="font-medium text-card-foreground">{patientName}</span>
              <span className="mx-2">•</span>
              Last updated: {lastUpdated}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm transition-colors hover:bg-primary/90"
          >
            <FileText className="w-4 h-4" />
            Export PDF
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-secondary text-secondary-foreground rounded-lg font-medium text-sm transition-colors hover:bg-secondary/80"
          >
            <Share2 className="w-4 h-4" />
            Share with Patient
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-secondary text-secondary-foreground rounded-lg font-medium text-sm transition-colors hover:bg-secondary/80"
          >
            <Calendar className="w-4 h-4" />
            Schedule Follow-up
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
