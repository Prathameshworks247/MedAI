import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, User, Calendar, FileText, TrendingUp, Brain, Download, Eye, Play, Upload, CheckCircle, Clock } from 'lucide-react';
import { getAppointmentsByPatient, getPatientById } from '../../data/appointmentData';
import { apiRequest } from '../../utils/api';

const PatientsPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [patientsList, setPatientsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [expandedAppointment, setExpandedAppointment] = useState(null);

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
            gender: 'Unknown', // Not in DB
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
        // Try to find in fetched list first
        const patientFromList = patientsList.find(p => p.id === patientId);
        if (patientFromList) {
            setSelectedPatient(patientFromList);
            setSearchQuery(patientFromList.name);
        } else {
            // Fallback to dummy data if not found (e.g. initial load or dummy ID)
            const patient = getPatientById(patientId);
            if (patient) {
                setSelectedPatient(patient);
                setSearchQuery(patient.name);
            }
        }
    }
  }, [searchParams, patientsList]);

  // Use patientsList as the source
  const filteredPatients = patientsList;

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setSearchQuery(patient.name);
    setExpandedAppointment(null);
  };

  const getStatusBadge = (status) => {
    const badges = {
      'SCHEDULED': 'bg-blue-100 text-blue-700',
      'IN_PROGRESS': 'bg-green-100 text-green-700',
      'PAUSED': 'bg-yellow-100 text-yellow-700',
      'COMPLETED': 'bg-gray-100 text-gray-700',
      'CANCELLED': 'bg-red-100 text-red-700'
    };
    return badges[status] || 'bg-gray-100 text-gray-700';
  };

  const getTypeBadge = (type, appointmentNumber) => {
    if (type === 'NEW_PATIENT') {
      return <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-semibold">🆕 NEW PATIENT</span>;
    }
    return <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-semibold">🔄 Visit #{appointmentNumber}</span>;
  };

  const getContentIcon = (status) => {
    if (status === 'COMPLETED') return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (status === 'IN_PROGRESS') return <Clock className="w-4 h-4 text-orange-600 animate-pulse" />;
    return <span className="w-4 h-4 rounded-full bg-gray-300"></span>;
  };

  const AppointmentTimeline = ({ appointments }) => {
    return (
      <div className="space-y-4">
        {appointments.map((appointment, index) => {
          const isExpanded = expandedAppointment === appointment.id;
          const session = appointment.session;

          return (
            <div key={appointment.id} className={`card ${isExpanded ? 'ring-2 ring-primary-500' : ''}`}>
              {/* Appointment Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <Calendar className="w-5 h-5 text-gray-600" />
                    <h4 className="text-lg font-bold text-gray-900">
                      Appointment #{appointment.appointmentNumber}
                    </h4>
                    {getTypeBadge(appointment.type, appointment.appointmentNumber)}
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    📅 {appointment.scheduledDate} at {appointment.scheduledTime}
                  </p>
                  <p className="text-sm text-gray-700 font-semibold">{appointment.chiefComplaint}</p>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-semibold ${getStatusBadge(appointment.status)}`}>
                  {appointment.status.replace('_', ' ')}
                </span>
              </div>

              {/* Session Activities Summary */}
              {session && session.activities && session.activities.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4 mb-3">
                  <h5 className="text-sm font-semibold text-gray-900 mb-3">Session Activities ({session.activities.length}):</h5>
                  <div className="space-y-2">
                    {session.activities.map((activity, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{activity.type === 'recording' ? '🎤' : activity.type === 'documents' ? '📄' : activity.type === 'report' ? '📋' : activity.type === 'tests' ? '🧪' : activity.type === 'diagnosis' ? '🩺' : '📎'}</span>
                          <div>
                            <p className="text-xs font-semibold text-gray-900">{activity.title}</p>
                            <p className="text-xs text-gray-600">{activity.timestamp}</p>
                          </div>
                        </div>
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-2">
                {appointment.status === 'IN_PROGRESS' && (
                  <button 
                    onClick={() => navigate(`/doctor/session/${appointment.id}`)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    RESUME SESSION
                  </button>
                )}
                
                {appointment.status === 'COMPLETED' && (
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

                {appointment.status === 'SCHEDULED' && (
                  <button 
                    onClick={() => navigate(`/doctor/session/${appointment.id}`)}
                    className="flex-1 btn-primary flex items-center justify-center"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    START SESSION
                  </button>
                )}
              </div>

              {/* Expanded Details - Activity Timeline */}
              {isExpanded && appointment.status === 'COMPLETED' && session && session.activities && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h6 className="font-semibold text-gray-900 mb-3">Complete Activity Timeline:</h6>
                  <div className="space-y-3">
                    {session.activities.map((activity, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-start space-x-3 mb-2">
                          <span className="text-2xl">{activity.type === 'recording' ? '🎤' : activity.type === 'documents' ? '📄' : activity.type === 'report' ? '📋' : activity.type === 'tests' ? '🧪' : activity.type === 'diagnosis' ? '🩺' : '📎'}</span>
                          <div className="flex-1">
                            <h6 className="font-semibold text-gray-900">{activity.title}</h6>
                            <p className="text-xs text-gray-600">{activity.timestamp}</p>
                          </div>
                        </div>

                        {/* Activity Content */}
                        {activity.type === 'recording' && activity.data.transcription && (
                          <details className="text-sm mt-2">
                            <summary className="cursor-pointer text-blue-700 font-semibold">View Transcription</summary>
                            <div className="mt-2 p-3 bg-white rounded border border-gray-200">
                              <pre className="whitespace-pre-wrap text-xs text-gray-700 max-h-48 overflow-y-auto">
                                {activity.data.transcription}
                              </pre>
                            </div>
                          </details>
                        )}

                        {activity.type === 'report' && activity.data.content && (
                          <details className="text-sm mt-2">
                            <summary className="cursor-pointer text-green-700 font-semibold">View Report</summary>
                            <div className="mt-2 p-3 bg-white rounded border border-gray-200">
                              <pre className="whitespace-pre-wrap text-xs text-gray-700 max-h-48 overflow-y-auto">
                                {activity.data.content}
                              </pre>
                            </div>
                          </details>
                        )}

                        {activity.type === 'tests' && activity.data.extractedValues && (
                          <div className="mt-2 grid grid-cols-4 gap-2">
                            {Object.entries(activity.data.extractedValues).map(([key, value]) => (
                              <div key={key} className="bg-white rounded p-2 border border-gray-200">
                                <p className="text-xs text-gray-600">{key}</p>
                                <p className="text-sm font-bold text-gray-900">{value}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {activity.type === 'diagnosis' && activity.data.diagnosis && (
                          <div className="mt-2 space-y-2">
                            <div className="bg-white rounded p-3 border border-gray-200">
                              <p className="text-sm font-semibold text-gray-900">{activity.data.diagnosis}</p>
                              <p className="text-xs text-gray-600 mt-1">Risk Level: {activity.data.riskLevel}</p>
                            </div>
                            {activity.data.findings && activity.data.findings.length > 0 && (
                              <div className="bg-white rounded p-3 border border-gray-200">
                                <p className="text-xs font-semibold text-gray-900 mb-1">Key Findings:</p>
                                <ul className="text-xs text-gray-700 space-y-1">
                                  {activity.data.findings.map((finding, i) => (
                                    <li key={i}>• {finding}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
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
              if (!e.target.value) setSelectedPatient(null);
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
                    <p className="text-sm text-gray-600">{patient.age} years • {patient.gender} • {patient.id}</p>
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
                    <p><span className="font-semibold">Gender:</span> {selectedPatient.gender}</p>
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

          {/* Appointment History */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                <Calendar className="w-6 h-6 mr-2 text-primary-600" />
                Appointment History ({selectedPatient.totalAppointments})
              </h3>
              <button className="btn-secondary flex items-center">
                <Upload className="w-4 h-4 mr-2" />
                Schedule New Appointment
              </button>
            </div>
            <AppointmentTimeline appointments={getAppointmentsByPatient(selectedPatient.id)} />
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
    </div>
  );
};

export default PatientsPage;

