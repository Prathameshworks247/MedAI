import React, { useState } from 'react';
import {
    Calendar,
    Clock,
    Eye,
    Download,
    Play,
    MessageCircle,
    FileText,
    Sparkles,
    CheckCircle
} from 'lucide-react';
import ChatModal from './ChatModal';
import DiagnosisDashboard from '../diagnosis/Main';

const AppointmentHistoryCard = ({
    appointment,
    patientId,
    patientName,
    onStartSession,
    currentUser
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);

    const session = appointment.session;
    const appointmentNo = appointment.id.split('-')[1];

    const getStatusBadge = (status) => {
        const badges = {
            'scheduled': 'bg-blue-100 text-blue-700',
            'in_progress': 'bg-green-100 text-green-700',
            'paused': 'bg-yellow-100 text-yellow-700',
            'completed': 'bg-gray-100 text-gray-700',
            'cancelled': 'bg-red-100 text-red-700'
        };
        return badges[status] || 'bg-gray-100 text-gray-700';
    };

    return (
        <>
            <div className={`card ${isExpanded ? 'ring-2 ring-primary-500' : ''}`}>
                {/* Appointment Header */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                            <Calendar className="w-5 h-5 text-gray-600" />
                            <h4 className="text-lg font-bold text-gray-900">
                                {appointmentNo == 0 ? "Baseline Visit" : `Follow Up Visit #${appointmentNo}`}
                            </h4>
                        </div>
                        <p className="text-base font-semibold mb-1">Doctor: {appointment.doctor?.name || 'Unknown'}</p>
                        <p className="text-sm text-gray-700 mb-1">Chief Complaint: {appointment.chiefComplaint}</p>
                        <p className="text-sm text-gray-600 mb-1 italic">
                            "{appointment.scheduledDate} at {appointment.scheduledTime}"
                        </p>
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full font-semibold ${getStatusBadge(appointment.status || 'completed')}`}>
                        {(appointment.status || 'completed').replace('_', ' ')}
                    </span>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                    {/* Start/Resume Session Buttons for PatientsPage */}
                    {onStartSession && appointment.status === 'in_progress' && (currentUser?._id === appointment.doctor?.id || currentUser?.id === appointment.doctor?.id) && (
                        <button
                            onClick={() => onStartSession(appointment.id)}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                        >
                            <Play className="w-4 h-4 mr-2" />
                            RESUME SESSION
                        </button>
                    )}

                    {onStartSession && appointment.status === 'scheduled' && (currentUser?._id === appointment.doctor?.id || currentUser?.id === appointment.doctor?.id) && (
                        <button
                            onClick={() => onStartSession(appointment.id)}
                            className="flex-1 btn-primary flex items-center justify-center"
                        >
                            <Play className="w-4 h-4 mr-2" />
                            START SESSION
                        </button>
                    )}

                    {/* Completed / History View Actions */}
                    {(!appointment.status || appointment.status === 'completed') && (
                        <>
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="flex-1 btn-primary flex items-center justify-center"
                            >
                                <Eye className="w-4 h-4 mr-2" />
                                {isExpanded ? 'Hide Details' : 'View Details'}
                            </button>

                            <button
                                onClick={() => setIsChatOpen(true)}
                                className="flex-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center border border-indigo-200"
                            >
                                <MessageCircle className="w-4 h-4 mr-2" />
                                View Chats
                            </button>

                            <button className="btn-secondary flex items-center">
                                <Download className="w-4 h-4 mr-2" />
                                Export
                            </button>
                        </>
                    )}
                </div>

                {/* Expanded Details */}
                {isExpanded && session && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <h5 className="text-lg font-bold text-gray-900 mb-4">Session Details</h5>

                        {/* Discussion */}
                        {session.discussion && (
                            <div className="mb-6">
                                <h6 className="flex items-center text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                                    <span className="w-5 h-5 mr-2 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full">🎤</span>
                                    Discussion
                                </h6>
                                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 max-h-60 overflow-y-auto">
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{session.discussion}</p>
                                </div>
                            </div>
                        )}

                        {/* Reports */}
                        {session.reports && session.reports.length > 0 && (
                            <div className="mb-6">
                                <h6 className="flex items-center text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                                    <span className="w-5 h-5 mr-2 flex items-center justify-center bg-green-100 text-green-600 rounded-full">📋</span>
                                    Reports
                                </h6>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {session.reports.map((report, idx) => (
                                        <div key={idx} className="flex items-center justify-between bg-white border border-gray-200 hover:border-green-300 rounded-lg p-3 shadow-sm transition-all group">
                                            <div className="flex items-center space-x-3 overflow-hidden">
                                                <FileText className="w-5 h-5 text-gray-400 group-hover:text-green-500" />
                                                <span className="text-sm font-medium text-gray-700 truncate" title={report.file_name}>{report.file_name}</span>
                                            </div>
                                            <a
                                                href={report.uri}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="ml-2 p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                                                title="Open Report"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Tests */}
                        {session.tests && session.tests.length > 0 && (
                            <div className="mb-6">
                                <h6 className="flex items-center text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                                    <span className="w-5 h-5 mr-2 flex items-center justify-center bg-purple-100 text-purple-600 rounded-full">🧪</span>
                                    Tests
                                </h6>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {session.tests.map((test, idx) => (
                                        <div key={idx} className="flex items-center justify-between bg-white border border-gray-200 hover:border-purple-300 rounded-lg p-3 shadow-sm transition-all group">
                                            <div className="flex items-center space-x-3 overflow-hidden">
                                                <FileText className="w-5 h-5 text-gray-400 group-hover:text-purple-500" />
                                                <span className="text-sm font-medium text-gray-700 truncate" title={test.doc_name}>{test.doc_name}</span>
                                            </div>
                                            <a
                                                href={test.uri}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="ml-2 p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                                                title="Open Test Document"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Generated Diagnosis */}
                        {(appointment.diagnosis_generated_at || session.generated_diagnosis) && (
                            <div className="mb-6 mt-8 border-2 border-indigo-100 bg-white rounded-lg p-4">
                                <div className="mb-4 border-b border-gray-100 pb-4">
                                    <h6 className="text-lg font-bold text-gray-900 flex items-center">
                                        <Sparkles className="w-5 h-5 mr-2 text-indigo-600" />
                                        AI Diagnostic Analysis
                                    </h6>
                                    {appointment.diagnosis_generated_at && (
                                        <p className="text-sm text-gray-500 mt-1">
                                            Generated on {new Date(appointment.diagnosis_generated_at).toLocaleString()}
                                        </p>
                                    )}
                                </div>
                                {session.generated_diagnosis && (
                                    <DiagnosisDashboard
                                        data={session.generated_diagnosis}
                                    />
                                )}
                            </div>
                        )}

                        {/* Fallback if no details */}
                        {!session.discussion && (!session.reports || session.reports.length === 0) && (!session.tests || session.tests.length === 0) && !appointment.diagnosis_generated_at && (
                            <p className="text-sm text-gray-500 italic text-center py-4">No detailed session records available.</p>
                        )}
                    </div>
                )}
            </div>

            {/* Chat History Modal */}
            <ChatModal
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                appointmentId={appointment.id}
                patientId={patientId}
                patientName={patientName}
                readOnly={true}
            />
        </>
    );
};

export default AppointmentHistoryCard;
