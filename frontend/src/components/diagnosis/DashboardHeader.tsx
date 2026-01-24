import { motion } from "framer-motion";
import { Activity, FileText, Share2, Calendar, User, Clock } from "lucide-react";
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
            className="relative bg-card rounded-2xl shadow-sm border border-border/40 p-5 mb-8 overflow-hidden group"
        >
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none transition-opacity duration-500 group-hover:opacity-75" />
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="flex items-center gap-5">
                    <motion.div
                        whileHover={{ scale: 1.05, rotate: 5 }}
                        className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10 flex items-center justify-center shadow-inner"
                    >
                        <Activity className="w-8 h-8 text-primary" />
                    </motion.div>

                    <div className="space-y-1.5">
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">
                            Diagnosis Dashboard
                        </h1>
                    </div>
                </div>
                <div className="flex flex-wrap gap-3">
                    <ActionButton icon={FileText} label="Export PDF" variant="primary" />
                    <ActionButton icon={Share2} label="Share" variant="secondary" />
                    <ActionButton icon={Calendar} label="Follow-up" variant="secondary" />
                </div>
            </div>
        </motion.div>
    );
}

function ActionButton({ icon: Icon, label, variant }: { icon: any, label: string, variant: 'primary' | 'secondary' }) {
    return (
        <motion.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            className={`
        inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all shadow-sm
        ${variant === 'primary'
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/20'
                    : 'bg-card border border-border hover:bg-muted/50 text-foreground'}
      `}
        >
            <Icon className="w-4 h-4" />
            {label}
        </motion.button>
    );
}
