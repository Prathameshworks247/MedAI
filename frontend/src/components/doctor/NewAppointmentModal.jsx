import { useState, useEffect } from 'react';
import { Activity, Stethoscope, UserPlus } from 'lucide-react';
import { X } from 'lucide-react';

const DUMMY_DOCTORS = [
    { id: 'doc_1', name: 'Dr. Sarah Wilson', specialization: 'Cardiology' },
    { id: 'doc_2', name: 'Dr. Michael Chen', specialization: 'Neurology' },
    { id: 'doc_3', name: 'Dr. Emily Brooks', specialization: 'General Practice' },
    { id: 'doc_4', name: 'Dr. James Robinson', specialization: 'Orthopedics' }
];

export default function NewAppointmentModal({ isOpen, onClose, patient, lastAppointment }) {
    const [activeTab, setActiveTab] = useState('continue'); // 'continue' or 'new'
    const [formData, setFormData] = useState({
        doctorId: '',
        date: new Date().toISOString().split('T')[0],
        time: '09:00',
        chiefComplaint: '',
        notes: ''
    });

    useEffect(() => {
        if (isOpen && !lastAppointment) {
            setActiveTab('new');
        } else if (isOpen) {
            setActiveTab('continue');
        }
    }, [isOpen, lastAppointment]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Creating appointment:", {
            type: activeTab === 'continue' ? 'FOLLOW_UP' : 'NEW_ASSESSMENT',
            patientId: patient.id,
            previousAppointmentId: activeTab === 'continue' ? lastAppointment?.id : null,
            ...formData
        });
        // TODO: Call API endpoint
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Schedule Appointment</h2>
                        <p className="text-gray-500 text-sm">For {patient.name} ({patient.id})</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                <div className="p-6">
                    {/* Tab Selection */}
                    <div className="flex space-x-4 mb-8">
                        <button
                            disabled={!lastAppointment}
                            onClick={() => lastAppointment && setActiveTab('continue')}
                            className={`flex-1 p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center space-y-2 ${!lastAppointment
                                    ? 'opacity-50 cursor-not-allowed border-gray-100 bg-gray-50'
                                    : activeTab === 'continue'
                                        ? 'border-primary-600 bg-primary-50 text-primary-900'
                                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50 text-gray-600'
                                }`}
                        >
                            <div className={`p-3 rounded-full ${activeTab === 'continue' ? 'bg-primary-100' : 'bg-gray-100'}`}>
                                <Activity className={`w-6 h-6 ${activeTab === 'continue' ? 'text-primary-600' : 'text-gray-500'}`} />
                            </div>
                            <span className="font-semibold">Continue Care</span>
                            <span className="text-xs text-center opacity-75">
                                {lastAppointment ? 'Follow up on previous visit' : 'No previous visit found'}
                            </span>
                        </button>

                        <button
                            onClick={() => setActiveTab('new')}
                            className={`flex-1 p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center space-y-2 ${activeTab === 'new'
                                    ? 'border-primary-600 bg-primary-50 text-primary-900'
                                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50 text-gray-600'
                                }`}
                        >
                            <div className={`p-3 rounded-full ${activeTab === 'new' ? 'bg-primary-100' : 'bg-gray-100'}`}>
                                <UserPlus className={`w-6 h-6 ${activeTab === 'new' ? 'text-primary-600' : 'text-gray-500'}`} />
                            </div>
                            <span className="font-semibold">New Assessment</span>
                            <span className="text-xs text-center opacity-75">Start a new case</span>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {activeTab === 'continue' && (
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
                                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                                    <Stethoscope className="w-4 h-4 mr-2" />
                                    Previous Appointment Context
                                </h4>
                                {lastAppointment ? (
                                    <div className="space-y-2 text-sm text-gray-600">
                                        <p><span className="font-medium">Date:</span> {lastAppointment.scheduledDate}</p>
                                        <p><span className="font-medium">Type:</span> {lastAppointment.type === 'NEW_PATIENT' ? 'Initial Consultation' : 'Follow-up'}</p>
                                        <p><span className="font-medium">Chief Complaint:</span> {lastAppointment.chiefComplaint}</p>
                                        {lastAppointment.session?.diagnosis?.diagnosis && (
                                            <p><span className="font-medium">Diagnosis:</span> {lastAppointment.session.diagnosis.diagnosis}</p>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded border border-yellow-100">
                                        No previous appointment found. This will create a new follow-up chain.
                                    </p>
                                )}
                            </div>
                        )}

                        {activeTab === 'new' && (
                            <>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Select Specialist</label>
                                    <select
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                        value={formData.doctorId}
                                        onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                                        required
                                    >
                                        <option value="">Choose a doctor...</option>
                                        {DUMMY_DOCTORS.map(doc => (
                                            <option key={doc.id} value={doc.id}>{doc.name} - {doc.specialization}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Chief Complaint</label>
                                    <textarea
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                        rows="3"
                                        placeholder="Describe the main reason for this visit..."
                                        value={formData.chiefComplaint}
                                        onChange={(e) => setFormData({ ...formData, chiefComplaint: e.target.value })}
                                        required
                                    />
                                </div>
                            </>
                        )}

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                                <input
                                    type="date"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Start Time</label>
                                <input
                                    type="time"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    value={formData.time}
                                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 space-x-3 border-t border-gray-100 mt-8">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-2.5 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-2.5 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 shadow-lg shadow-primary-500/30 transition-all transform hover:-translate-y-0.5"
                            >
                                Schedule Appointment
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};