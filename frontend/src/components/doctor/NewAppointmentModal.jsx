import { useState, useEffect } from 'react';
import { Activity, Stethoscope, UserPlus, X } from 'lucide-react';
import { apiRequest } from '../../utils/api';

export default function NewAppointmentModal({ isOpen, onClose, patient, lastAppointment }) {
    const [activeTab, setActiveTab] = useState('continue'); // 'continue' or 'new'
    const [formData, setFormData] = useState({
        doctorId: '',
        date: new Date().toISOString().split('T')[0],
        time: '09:00',
        chiefComplaint: '',
        notes: ''
    });

    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                const response = await apiRequest('/doctors/');
                if (response.success) {
                    setDoctors(response.data.map(d => ({
                        id: d._id,
                        name: d.full_name,
                        specialization: d.specialization || 'General' // Fallback
                    })));
                }
            } catch (error) {
                console.error("Failed to fetch doctors:", error);
            }
        };

        if (isOpen) {
            fetchDoctors();
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && !lastAppointment) {
            setActiveTab('new');
        } else if (isOpen) {
            setActiveTab('continue');
        }
    }, [isOpen, lastAppointment]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const type = activeTab === 'continue' ? 'old' : 'new';
        
        // Calculate end time (default 30 mins duration)
        const startTime = new Date(`${formData.date}T${formData.time}`);

        const payload = {
            patient_id: patient.id,
            doctor_id: formData.doctorId,
            appointment_date: new Date(formData.date).toISOString(),
            status: "scheduled",
            chief_complaint: formData.chiefComplaint || (lastAppointment ? "Follow up" : "New Visit"),
            start_time: startTime.toISOString(),
            // Required empty fields for validation
            discussion: "",
            discussion_summary: "",
            reports: [],
            tests: [],
            diagnosis: {}
        };

        let endpoint = `/appointments/?type=${type}`;
        if (type === 'old' && lastAppointment) {
            endpoint += `&prev_appointment_id=${lastAppointment.id}`;
        }

        try {
            const response = await apiRequest(endpoint, {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            if (response.success) {
                console.log("Appointment created:", response.data);
                // Optionally refresh parent or show success
                onClose();
            } else {
                console.error("Failed to create appointment:", response.error);
                // Show error to user (could add state for error message)
            }
        } catch (error) {
            console.error("Error submitting appointment:", error);
        } finally {
            setLoading(false);
        }
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
                                        {doctors.map(doc => (
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
                                disabled={loading}
                                className={`px-6 py-2.5 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 shadow-lg shadow-primary-500/30 transition-all transform hover:-translate-y-0.5 ${loading ? 'opacity-50 cursor-wait' : ''}`}
                            >
                                {loading ? 'Scheduling...' : 'Schedule Appointment'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};