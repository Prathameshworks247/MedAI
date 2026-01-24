import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Search, User, Calendar, Download, Eye, Play, Upload, Clock, Stethoscope, Activity, FileText, Sparkles } from 'lucide-react';
import { getPatientById } from '../../data/appointmentData';
import { apiRequest } from '../../utils/api';
import NewAppointmentModal from './NewAppointmentModal';
import AppointmentHistoryCard from './AppointmentHistoryCard';
import DiagnosisDashboard from '../diagnosis/Main';

const PatientsPage = () => {
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [patientsList, setPatientsList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [patientAppointments, setPatientAppointments] = useState([]);
    const [expandedAppointment, setExpandedAppointment] = useState(null); // Kept for potential future use or backward compatibility
    const [isModalOpen, setIsModalOpen] = useState(false);

    const calculateAge = (dob) => {
        if (!dob) return 'N/A';
        const birthDate = new Date(dob);
        const ageDifMs = Date.now() - birthDate.getTime();
        const ageDate = new Date(ageDifMs);
        return Math.abs(ageDate.getUTCFullYear() - 1970);
    };

    const getRegistrationDateFromId = (id) => {
        try {
            const timestamp = parseInt(id.substring(0, 8), 16) * 1000;
            return new Date(timestamp).toLocaleDateString();
        } catch (e) {
            return 'N/A';
        }
    };

    const fetchAppointments = async (patientId) => {
        try {
            const [scheduledRes, completedRes, totalRes, inProgressRes, pausedRes] = await Promise.all([
                apiRequest(`/appointments/?patient_id=${patientId}&appointment_status=scheduled`),
                apiRequest(`/appointments/?patient_id=${patientId}&appointment_status=completed&limit=10`),
                apiRequest(`/appointments/total?patient_id=${patientId}`),
                apiRequest(`/appointments/?patient_id=${patientId}&appointment_status=in_progress`),
                apiRequest(`/appointments/?patient_id=${patientId}&appointment_status=paused`)
            ]);

            let allAppointments = [];

            const mapAppointment = (apt, index, totalCount) => {
                const dateObj = new Date(apt.start_time);
                return {
                    id: apt._id,
                    scheduledDate: apt.appointment_date ? apt.appointment_date.split('T')[0] : '',
                    scheduledTime: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    chiefComplaint: apt.chief_complaint,
                    status: apt.status || 'scheduled',
                    doctor: apt.doctor,
                    patient: apt.patient,
                    diagnosis_generated_at: apt.diagnosis_generated_at,
                    session: {
                        discussion: apt.discussion,
                        reports: apt.reports,
                        tests: apt.tests,
                        generated_diagnosis: apt.generated_diagnosis,
                        generated_diagnosis_text: apt.generated_diagnosis_text,
                        doctor_diagnosis: apt.doctor_diagnosis
                    },
                };
            };

            // Process In Progress
            if (inProgressRes.success) {
                const inProgressMapped = inProgressRes.data.map(apt => mapAppointment(apt));
                allAppointments = [...allAppointments, ...inProgressMapped];
            }

            // Process Paused
            if (pausedRes.success) {
                const pausedMapped = pausedRes.data.map(apt => mapAppointment(apt));
                allAppointments = [...allAppointments, ...pausedMapped];
            }

            // Process Scheduled
            if (scheduledRes.success) {
                const scheduledMapped = scheduledRes.data.map(apt => mapAppointment(apt));
                allAppointments = [...allAppointments, ...scheduledMapped];
            }

            // Process Completed
            if (completedRes.success) {
                const completedMapped = completedRes.data.map(apt => mapAppointment(apt));
                allAppointments = [...allAppointments, ...completedMapped];
            }

            // Sort by date desc
            allAppointments.sort((a, b) => new Date(b.scheduledDate + 'T' + b.scheduledTime) - new Date(a.scheduledDate + 'T' + a.scheduledTime));

            setPatientAppointments(allAppointments);

            // Update total appointments count if available
            if (totalRes.success) {
                setSelectedPatient(prev => ({
                    ...prev,
                    totalAppointments: totalRes.data.total
                }));
            }

        } catch (e) {
            console.error("Failed to fetch appointments", e);
        }
    };

    const fetchPatients = async (query = '') => {
        setLoading(true);
        try {
            let endpoint = '/patients/';
            if (query) {
                endpoint += `?filter=${encodeURIComponent(query)}`;
            }

            const response = await apiRequest(endpoint);
            if (response.success) {
                const mapped = response.data.map(p => ({
                    id: p._id,
                    name: p.full_name,
                    age: calculateAge(p.date_of_birth),
                    gender: p.gender || 'Unknown',
                    bloodGroup: p.blood_group,
                    phone: p.phone,
                    registeredDate: getRegistrationDateFromId(p._id),
                    totalAppointments: 0,
                    lastVisit: null
                }));
                setPatientsList(mapped);
            }
        } catch (e) {
            console.error("Failed to fetch patients", e);
        } finally {
            setLoading(false);
        }
    }

    // Effect to fetch patients on search or init
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchPatients(searchQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);


    // Check if patient ID is in URL params
    useEffect(() => {
        const patientId = searchParams.get('patientId');
        if (patientId) {
            const loadPatient = async () => {
                // Avoid re-fetching if already selected
                if (selectedPatient?.id === patientId && patientAppointments.length > 0) return;

                // 1. Try to find in fetched list first
                const patientFromList = patientsList.find(p => p.id === patientId);
                if (patientFromList) {
                    setSelectedPatient(patientFromList);
                    setSearchQuery(patientFromList.name);
                    fetchAppointments(patientId);
                    return;
                }

                // 2. If not in list, fetch from API
                try {
                    const response = await apiRequest(`/patients/${patientId}`);
                    if (response.success && response.data) {
                        const p = response.data;
                        const mappedPatient = {
                            id: p._id,
                            name: p.full_name,
                            age: calculateAge(p.date_of_birth),
                            gender: p.gender || 'Unknown',
                            bloodGroup: p.blood_group,
                            phone: p.phone,
                            registeredDate: getRegistrationDateFromId(p._id),
                            totalAppointments: 0,
                            lastVisit: null
                        };
                        setSelectedPatient(mappedPatient);
                        setSearchQuery(mappedPatient.name);
                        fetchAppointments(patientId);
                    } else {
                        // 3. Fallback to dummy data
                        const patient = getPatientById(patientId);
                        if (patient) {
                            setSelectedPatient(patient);
                            setSearchQuery(patient.name);
                            // Also try to fetch appointments for dummy patient if needed, though likely wont work with real backend
                            fetchAppointments(patientId);
                        }
                    }
                } catch (e) {
                    console.error("Error loading patient from URL", e);
                }
            };
            loadPatient();
        }
    }, [searchParams, patientsList]);

    // Use patientsList as the source
    const filteredPatients = patientsList;

    const handlePatientSelect = (patient) => {
        setSelectedPatient(patient);
        setSearchQuery(patient.name);
        setExpandedAppointment(null);
        fetchAppointments(patient.id);
    };

    const handleStartSession = async (appointmentId) => {
        try {
            await apiRequest(`/appointments/${appointmentId}`, {
                method: 'PATCH',
                body: JSON.stringify({ status: 'in_progress' })
            });
            navigate(`/doctor/session/${appointmentId}`);
        } catch (e) {
            console.error("Failed to start session", e);
            // Navigate anyway to not block the user
            navigate(`/doctor/session/${appointmentId}`);
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            'scheduled': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
            'in_progress': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
            'paused': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
            'completed': 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
            'cancelled': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
        };
        return badges[status] || 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    };

    //   const getContentIcon = (status) => {
    //     if (status === 'completed') return <CheckCircle className="w-4 h-4 text-green-600" />;
    //     if (status === 'in_progress') return <Clock className="w-4 h-4 text-orange-600 animate-pulse" />;
    //     return <span className="w-4 h-4 rounded-full bg-gray-300"></span>;
    //   };

    const AppointmentTimeline = ({ appointments }) => {
        return (
            <div className="space-y-4">
                {appointments.map((appointment) => (
                    <AppointmentHistoryCard
                        key={appointment.id}
                        appointment={appointment}
                        patientId={selectedPatient?.id || appointment.patient?.id}
                        patientName={selectedPatient?.name || appointment.patient?.name}
                        onStartSession={handleStartSession}
                        currentUser={user}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Patient Records</h2>
                <p className="text-gray-600 dark:text-gray-400">Search and view patient appointment history</p>
            </div>

            {/* Search Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700 mb-6 transition-colors duration-200">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            if (!e.target.value) {
                                setSelectedPatient(null);
                                setSearchParams({});
                            }
                        }}
                        placeholder="Search patient by name or ID..."
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors duration-200"
                    />
                </div>

                {/* Search Results Dropdown */}
                {searchQuery && !selectedPatient && filteredPatients.length > 0 && (
                    <div className="mt-2 border border-gray-200 dark:border-gray-600 rounded-lg max-h-60 overflow-y-auto bg-white dark:bg-gray-700 shadow-lg">
                        {filteredPatients.map(patient => (
                            <div
                                key={patient.id}
                                onClick={() => handlePatientSelect(patient)}
                                className="p-3 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer border-b border-gray-100 dark:border-gray-600 last:border-b-0 transition-colors duration-150"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold text-gray-900 dark:text-white">{patient.name}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Age: {patient.age} years • <span className="capitalize">Gender: {patient.gender}</span> • ID: {patient.id}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-700 dark:text-gray-300">{patient.totalAppointments} appointments</p>
                                        {patient.lastVisit && (
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Last: {patient.lastVisit}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {searchQuery && !selectedPatient && filteredPatients.length === 0 && (
                    <div className="mt-4 text-center text-gray-600 dark:text-gray-400 py-8">
                        <User className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                        <p>No patients found matching "{searchQuery}"</p>
                    </div>
                )}
            </div>

            {/* Patient Details */}
            {selectedPatient && (
                <>
                    {/* Patient Profile Card */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-2 border-primary-200 dark:border-primary-700 mb-6 bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 transition-colors duration-200">
                        <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-4">
                                <div className="bg-gradient-to-br from-primary-600 to-primary-700 p-4 rounded-full shadow-lg">
                                    <User className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{selectedPatient.name}</h3>
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-gray-700 dark:text-gray-300">
                                        <p><span className="font-semibold">Patient ID:</span> {selectedPatient.id}</p>
                                        <p><span className="font-semibold">Age:</span> {selectedPatient.age} years</p>
                                        <p className='capitalize'><span className="font-semibold">Gender:</span> {selectedPatient.gender}</p>
                                        <p><span className="font-semibold">Blood Group:</span> {selectedPatient.bloodGroup}</p>
                                        <p><span className="font-semibold">Phone:</span> {selectedPatient.phone}</p>
                                        <p><span className="font-semibold">Registered:</span> {selectedPatient.registeredDate}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">{selectedPatient.totalAppointments}</div>
                                <p className="text-sm text-gray-700 dark:text-gray-300">Total Appointments</p>
                                {selectedPatient.lastVisit && (
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Last visit: {selectedPatient.lastVisit}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Active Appointments Section */}
                    {patientAppointments.filter(a => ['in_progress', 'paused'].includes(a.status)).length > 0 && (
                        <div className="mb-8">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center mb-4">
                                <Activity className="w-6 h-6 mr-2 text-green-600 dark:text-green-400 animate-pulse" />
                                Active Sessions
                            </h3>
                            <div className="grid gap-4">
                                {patientAppointments.filter(a => ['in_progress', 'paused'].includes(a.status)).map(apt => {
                                    const appointmentNo = apt.id.split('-')[1];
                                    return (
                                        <div key={apt.id} className={`bg-white dark:bg-gray-800 border-l-4 ${apt.status === 'in_progress' ? 'border-green-500 dark:border-green-400 bg-green-50 dark:bg-green-900/20' : 'border-yellow-500 dark:border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'} rounded-lg shadow-md p-4 hover:shadow-lg transition-all duration-200`}>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="flex items-center space-x-2 mb-3">
                                                        <span className={`text-xs px-2 py-1 rounded-full font-semibold uppercase ${apt.status === 'in_progress' ? 'bg-green-200 dark:bg-green-900/40 text-green-800 dark:text-green-300' : 'bg-yellow-200 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300'}`}>
                                                            {apt.status.replace('_', ' ')}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center space-x-2 mb-2">
                                                        <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                                        <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                                                            {appointmentNo == 0 ? "Baseline Visit" : `Follow Up Visit #${appointmentNo}`}
                                                        </h4>
                                                    </div>
                                                    <p className="text-gray-700 dark:text-gray-300 mb-1.5"><span className="font-semibold">Complaint:</span> {apt.chiefComplaint}</p>
                                                    <div className="flex items-center space-x-4">
                                                        <p className="text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 bg-opacity-50 px-2 py-1 rounded flex items-center border border-gray-200 dark:border-gray-600">
                                                            <Stethoscope className="w-3 h-3 mr-1" />
                                                            {apt.doctor?.name}
                                                        </p>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400 italic flex items-center">
                                                            <Clock className="w-3 h-3 mr-1" />
                                                            Started: {apt.scheduledDate} at {apt.scheduledTime}
                                                        </p>
                                                    </div>
                                                </div>
                                                {apt.doctor?.id === user._id && <button
                                                    onClick={() => handleStartSession(apt.id)}
                                                    className={`px-4 py-2 ${apt.status === 'in_progress' ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800' : 'bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800'} text-white rounded-lg transition-all duration-200 flex items-center font-medium shadow-md hover:shadow-lg`}
                                                >
                                                    <Play className="w-4 h-4 mr-2" />
                                                    {apt.status === 'in_progress' ? 'Resume Session' : 'Continue Session'}
                                                </button>}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Scheduled Appointments Section */}
                    {patientAppointments.filter(a => a.status === 'scheduled').length > 0 && (
                        <div className="mb-8">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center mb-4">
                                <Clock className="w-6 h-6 mr-2 text-primary-600 dark:text-primary-400" />
                                Scheduled Appointments
                            </h3>
                            <div className="grid gap-4">
                                {patientAppointments.filter(a => a.status === 'scheduled').map(apt => (
                                    <div key={apt.id} className="bg-white dark:bg-gray-800 border-l-4 border-blue-500 dark:border-blue-400 rounded-lg shadow-md p-4 hover:shadow-lg transition-all duration-200">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-gray-700 dark:text-gray-300 mb-4"><span className="font-semibold">Chief Complaint:</span> {apt.chiefComplaint}</p>
                                                <div className="flex items-center space-x-4">
                                                    {apt.doctor && (
                                                        <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded flex items-center border border-gray-200 dark:border-gray-600">
                                                            <Stethoscope className="w-3 h-3 mr-1" />
                                                            {apt.doctor.name}
                                                        </p>
                                                    )}
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 italic">"{apt.scheduledDate} at {apt.scheduledTime}"</p>
                                                </div>
                                            </div>
                                            {apt.doctor?.id === user._id && <button
                                                onClick={() => handleStartSession(apt.id)}
                                                className="px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-lg transition-all duration-200 flex items-center font-medium shadow-md hover:shadow-lg"
                                            >
                                                <Play className="w-4 h-4 mr-2" />
                                                Start Session
                                            </button>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Appointment History */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                                <Calendar className="w-6 h-6 mr-2 text-primary-600 dark:text-primary-400" />
                                Appointment History ({patientAppointments.filter(a => !['scheduled', 'in_progress', 'paused'].includes(a.status)).length})
                            </h3>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold py-2 px-4 rounded-lg transition-all duration-200 flex items-center shadow-md hover:shadow-lg"
                            >
                                <Upload className="w-4 h-4 mr-2" />
                                Schedule New Appointment
                            </button>
                        </div>
                        <AppointmentTimeline appointments={patientAppointments.filter(a => !['scheduled', 'in_progress', 'paused'].includes(a.status))} />
                    </div>
                </>
            )}

            {/* Empty State */}
            {!searchQuery && !selectedPatient && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700 text-center py-20 transition-colors duration-200">
                    <Search className="w-20 h-20 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Search for a Patient</h3>
                    <p className="text-gray-600 dark:text-gray-400">Enter a patient name or ID to view their medical records and appointment history</p>
                </div>
            )}
            <NewAppointmentModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    if (selectedPatient) fetchAppointments(selectedPatient.id); // Refresh after close
                }}
                patient={selectedPatient}
                lastAppointment={patientAppointments.length && patientAppointments[0].status === 'completed' ? patientAppointments[0] : null}
            />
        </div>
    );
};

export default PatientsPage;
