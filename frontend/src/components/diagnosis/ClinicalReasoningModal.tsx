import React, { Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Brain } from 'lucide-react';
import { ClinicalReasoningFlow } from './ClinicalReasoningFlow';

interface ClinicalReasoningModalProps {
    isOpen: boolean;
    onClose: () => void;
    nodes: any[];
    connections: any[];
}

export const ClinicalReasoningModal: React.FC<ClinicalReasoningModalProps> = ({
    isOpen,
    onClose,
    nodes,
    connections
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none"
                    >
                        <div
                            className="bg-white dark:bg-slate-900 w-full max-w-6xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col pointer-events-auto border dark:border-slate-800"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b dark:border-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                                        <Brain className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                            Clinical Reasoning Chain
                                        </h2>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            Visualizing the AI's diagnostic thought process
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                                >
                                    <X className="w-6 h-6 text-slate-500" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-auto p-6 bg-slate-50/50 dark:bg-slate-900/50">
                                <div className="min-h-[500px] h-full">
                                    <ClinicalReasoningFlow
                                        nodes={nodes}
                                        connections={connections}
                                    />
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-4 border-t dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 rounded-b-2xl flex justify-end">
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 bg-white border border-slate-300 dark:bg-slate-800 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
