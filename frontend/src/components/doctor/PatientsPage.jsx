import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Search, User, Calendar, Download, Eye, Play, Upload, Clock, Stethoscope, Activity, FileText } from 'lucide-react';
import { getPatientById } from '../../data/appointmentData';
import { apiRequest } from '../../utils/api';
import NewAppointmentModal from './NewAppointmentModal';

const PatientsPage = () => {
const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [patientsList, setPatientsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientAppointments, setPatientAppointments] = useState([]);
  const [expandedAppointment, setExpandedAppointment] = useState(null);
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
            session: {
                discussion: apt.discussion,
                reports: apt.reports,
                tests: apt.tests,
                generated_diagnosis: apt.generated_diagnosis,
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
      'scheduled': 'bg-blue-100 text-blue-700',
      'in_progress': 'bg-green-100 text-green-700',
      'paused': 'bg-yellow-100 text-yellow-700',
      'completed': 'bg-gray-100 text-gray-700',
      'cancelled': 'bg-red-100 text-red-700'
    };
    return badges[status] || 'bg-gray-100 text-gray-700';
  };

//   const getContentIcon = (status) => {
//     if (status === 'completed') return <CheckCircle className="w-4 h-4 text-green-600" />;
//     if (status === 'in_progress') return <Clock className="w-4 h-4 text-orange-600 animate-pulse" />;
//     return <span className="w-4 h-4 rounded-full bg-gray-300"></span>;
//   };

  const AppointmentTimeline = ({ appointments }) => {
    return (
      <div className="space-y-4">
        {appointments.map((appointment, index) => {
          const isExpanded = expandedAppointment === appointment.id;
          const session = appointment.session;
          const appointmentNo = appointment.id.split('-')[1];

          return (
            <div key={appointment.id} className={`card ${isExpanded ? 'ring-2 ring-primary-500' : ''}`}>
              {/* Appointment Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <Calendar className="w-5 h-5 text-gray-600" />
                    <h4 className="text-lg font-bold text-gray-900">
                      {appointmentNo == 0 ? "Baseline Visit" : `Follow Up Visit #${appointmentNo}`}
                    </h4>                    
                  </div>
                  <p className="text-base font-semibold mb-1">Doctor: {appointment.doctor.name}</p>
                  <p className="text-sm text-gray-700 mb-1">Chief Complaint: {appointment.chiefComplaint}</p>
                  <p className="text-sm text-gray-600 mb-1 italic">
                    "{appointment.scheduledDate} at {appointment.scheduledTime}" 
                  </p>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-semibold ${getStatusBadge(appointment.status)}`}>
                  {appointment.status.replace('_', ' ')}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                {appointment.status === 'in_progress' && appointment.doctor.id === user._id && (
                  <button 
                    onClick={() => handleStartSession(appointment.id)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    RESUME SESSION
                  </button>
                )}
                
                {appointment.status === 'completed' && (
                  <>
                    <button 
                      onClick={() => setExpandedAppointment(isExpanded ? null : appointment.id)}
                      className="flex-1 btn-primary flex items-center justify-center"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      {isExpanded ? 'Hide Details' : 'View Details'}
                    </button>
                    <button className="btn-secondary flex items-center">
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </button>
                  </>
                )}

                {appointment.status === 'scheduled' && appointment.doctor.id === user._id && (
                  <button 
                    onClick={() => handleStartSession(appointment.id)}
                    className="flex-1 btn-primary flex items-center justify-center"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    START SESSION
                  </button>
                )}
              </div>

              {/* Expanded Details */}
              {isExpanded && appointment.status === 'completed' && session && (
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

                  {/* Fallback if no details */}
                  {!session.discussion && (!session.reports || session.reports.length === 0) && (!session.tests || session.tests.length === 0) && (
                      <p className="text-sm text-gray-500 italic text-center py-4">No detailed session records available.</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Patient Records</h2>
        <p className="text-gray-600">Search and view patient appointment history</p>
      </div>

      {/* Search Section */}
      <div className="card mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
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
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-lg"
          />
        </div>

        {/* Search Results Dropdown */}
        {searchQuery && !selectedPatient && filteredPatients.length > 0 && (
          <div className="mt-2 border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
            {filteredPatients.map(patient => (
              <div
                key={patient.id}
                onClick={() => handlePatientSelect(patient)}
                className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{patient.name}</p>
                    <p className="text-sm text-gray-600">Age: {patient.age} years • <span className="capitalize">Gender: {patient.gender}</span> • ID: {patient.id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-700">{patient.totalAppointments} appointments</p>
                    {patient.lastVisit && (
                      <p className="text-xs text-gray-500">Last: {patient.lastVisit}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {searchQuery && !selectedPatient && filteredPatients.length === 0 && (
          <div className="mt-4 text-center text-gray-600 py-8">
            <User className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p>No patients found matching "{searchQuery}"</p>
          </div>
        )}
      </div>

      {/* Patient Details */}
      {selectedPatient && (
        <>
          {/* Patient Profile Card */}
          <div className="card mb-6 bg-gradient-to-r from-primary-50 to-blue-50 border-2 border-primary-200">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className="bg-primary-600 p-4 rounded-full">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">{selectedPatient.name}</h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-gray-700">
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
                <div className="text-3xl font-bold text-primary-600">{selectedPatient.totalAppointments}</div>
                <p className="text-sm text-gray-700">Total Appointments</p>
                {selectedPatient.lastVisit && (
                  <p className="text-xs text-gray-600 mt-1">Last visit: {selectedPatient.lastVisit}</p>
                )}
              </div>
            </div>
          </div>

          {/* Active Appointments Section */}
          {patientAppointments.filter(a => ['in_progress', 'paused'].includes(a.status)).length > 0 && (
            <div className="mb-8">
                <h3 className="text-2xl font-bold text-gray-900 flex items-center mb-4">
                    <Activity className="w-6 h-6 mr-2 text-green-600 animate-pulse" />
                    Active Sessions
                </h3>
                <div className="grid gap-4">
                    {patientAppointments.filter(a => ['in_progress', 'paused'].includes(a.status)).map(apt => {
                        const appointmentNo = apt.id.split('-')[1];
                        return (
                            <div key={apt.id} className={`bg-white border-l-4 ${apt.status === 'in_progress' ? 'border-green-500 bg-green-50' : 'border-yellow-500 bg-yellow-50'} rounded-lg shadow-sm p-4 hover:shadow-md transition-all`}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center space-x-2 mb-3">
                                            <span className={`text-xs px-2 py-1 rounded-full font-semibold uppercase ${apt.status === 'in_progress' ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'}`}>
                                                {apt.status.replace('_', ' ')}
                                            </span>                                        
                                        </div>
                                        <div className="flex items-center space-x-2 mb-2">
                                            <Calendar className="w-5 h-5 text-gray-600" />
                                            <h4 className="text-lg font-bold text-gray-900">
                                                {appointmentNo == 0 ? "Baseline Visit" : `Follow Up Visit #${appointmentNo}`}
                                            </h4>                    
                                        </div>
                                        <p className="text-gray-700 mb-1.5"><span className="font-semibold">Complaint:</span> {apt.chiefComplaint}</p>
                                        <div className="flex items-center space-x-4">
                                            <p className="text-sm text-gray-700 bg-white bg-opacity-50 px-2 py-1 rounded flex items-center">
                                                <Stethoscope className="w-3 h-3 mr-1" />
                                                {apt.doctor?.name}
                                            </p>
                                            <p className="text-sm text-gray-600 italic flex items-center">
                                                <Clock className="w-3 h-3 mr-1" />
                                                Started: {apt.scheduledDate} at {apt.scheduledTime}
                                            </p>
                                        </div>
                                    </div>
                                    {apt.doctor?.id === user._id && <button 
                                        onClick={() => handleStartSession(apt.id)}
                                        className={`px-4 py-2 ${apt.status === 'in_progress' ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-600 hover:bg-yellow-700'} text-white rounded-lg transition-colors flex items-center font-medium shadow-sm`}
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
                <h3 className="text-2xl font-bold text-gray-900 flex items-center mb-4">
                    <Clock className="w-6 h-6 mr-2 text-primary-600" />
                    Scheduled Appointments
                </h3>
                <div className="grid gap-4">
                    {patientAppointments.filter(a => a.status === 'scheduled').map(apt => (
                        <div key={apt.id} className="bg-white border-l-4 border-blue-500 rounded-lg shadow-sm p-4 hover:shadow-md transition-all">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-gray-700 mb-4">Chief Complaint: {apt.chiefComplaint}</p>
                                    <div className="flex items-center space-x-4">
                                        {apt.doctor && (
                                            <p className="text-sm text-gray-700 bg-gray-100 px-2 py-1 rounded flex items-center">
                                                <Stethoscope className="w-3 h-3 mr-1" />
                                                {apt.doctor.name}
                                            </p>
                                        )}
                                        <p className="text-sm text-gray-500 italic">"{apt.scheduledDate} at {apt.scheduledTime}"</p>
                                    </div>
                                </div>
                                {apt.doctor?.id === user._id && <button 
                                    onClick={() => handleStartSession(apt.id)}
                                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center font-medium"
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
              <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                <Calendar className="w-6 h-6 mr-2 text-primary-600" />
                Appointment History ({patientAppointments.filter(a => !['scheduled', 'in_progress', 'paused'].includes(a.status)).length})
              </h3>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="btn-secondary flex items-center"
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
        <div className="card text-center py-20">
          <Search className="w-20 h-20 text-gray-300 mx-auto mb-4" />
          <h3 className="text-2xl font-semibold text-gray-900 mb-2">Search for a Patient</h3>
          <p className="text-gray-600">Enter a patient name or ID to view their medical records and appointment history</p>
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
