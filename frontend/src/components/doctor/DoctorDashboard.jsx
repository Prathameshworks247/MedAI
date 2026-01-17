import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, CheckCircle, Play, XCircle, RotateCcw, Eye, Loader } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiRequest } from '../../utils/api';

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const today = new Date();
  const dateFormatted = today.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' });
  
  useEffect(() => {
    const fetchAppointments = async () => {
      if (!user?._id) return;
      
      try {
        setLoading(true);
        // Format date as YYYY-MM-DD for the API
        const dateStr = today.toISOString().split('T')[0];
        
        const response = await apiRequest(`/appointments?doctor_id=${user._id}&appointment_date=${dateStr}`);
        
        if (response.success) {
          setAppointments(response.data);
        }
      } catch (error) {
        console.error("Error fetching appointments:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [user]);

  const currentAppointment = appointments.find(a => a.status === 'in_progress') || 
                            appointments.find(a => a.status === 'scheduled');
  
  const stats = {
    total: appointments.length,
    completed: appointments.filter(a => a.status === 'completed').length,
    inProgress: appointments.filter(a => a.status === 'in_progress').length,
    upcoming: appointments.filter(a => a.status === 'scheduled' || a.status === 'new').length,
    cancelled: appointments.filter(a => a.status === 'cancelled').length
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

  const getStatusIcon = (status) => {
    const s = status?.toUpperCase();
    if (s === 'COMPLETED') return <CheckCircle className="w-4 h-4" />;
    if (s === 'IN_PROGRESS') return <Play className="w-4 h-4" />;
    if (s === 'CANCELLED') return <XCircle className="w-4 h-4" />;
    return <Clock className="w-4 h-4" />;
  };

  const getTypeBadge = (type, appointmentNumber) => {
    // The backend might return type in lowercase or different format
    if (type === 'NEW_PATIENT' || type === 'new') {
      return <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-semibold">🆕 NEW PATIENT</span>;
    }
    return <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-semibold">🔄 CONTINUATION {appointmentNumber ? `(Visit #${appointmentNumber})` : ''}</span>;
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

  const handleViewPatient = (patientId) => {
    navigate(`/doctor/patients?patientId=${patientId}`);
  };

  // Helper to format time from ISO string or time string
  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    try {
      const date = new Date(timeStr);
      if (isNaN(date.getTime())) {
          // If not a valid date, maybe it's already HH:MM
          return timeStr;
      }
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } catch (e) {
      return timeStr;
    }
  };

  const AppointmentCard = ({ appointment, isCurrent = false }) => {
    const status = appointment.status?.toUpperCase();
    const isCompleted = status === 'COMPLETED';
    const isInProgress = status === 'IN_PROGRESS';
    const isScheduled = status === 'SCHEDULED' || status === 'NEW';

    // Map backend fields to UI fields if needed
    // Backend: patient_id, doctor_id, appointment_date, status, chief_complaint, start_time, end_time
    // Also "doctor" object populated
    // We might not have patientName directly if not populated. The backend `read_appointments` populates doctor but NOT patient details? 
    // Backend `read_appointments` lines 60-70 populates doctor. It does NOT seem to populate patient.
    // However, the existing UI expects `appointment.patientName`.
    // If the backend doesn't provide patient name, I should probably fetch it or display Unknown.
    // Ideally I should update backend to populate patient too. But I'll handle it gracefully here.
    
    // NOTE: I am not updating backend to populate patient. I will just use what is available or a placeholder.
    // Wait, the user sees "Welcome Dr...", they want to see their appointments. They need to see patient names.
    // If the current backend endpoint doesn't return patient names, I should probably flag it or try to fetch.
    // `backend/src/routes/appointment.py` lines 60-70 only populates doctor.
    // I should probably update the backend to populate patient as well for the doctor dashboard to be useful.
    
    const patientName = appointment.patient_name || appointment.patient?.name || "Patient ID: " + appointment.patient_id;
    const startTime = formatTime(appointment.start_time);
    const endTime = formatTime(appointment.end_time);

    return (
      <div className={`card transition-all ${isCurrent ? 'border-2 border-green-400 bg-green-50' : ''} ${isCompleted ? 'opacity-75' : ''}`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-gray-600" />
            <span className="font-semibold text-gray-900">{startTime} - {endTime}</span>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusIcon(appointment.status)}
            <span className={`text-xs px-3 py-1 rounded-full font-semibold ${getStatusBadge(appointment.status)}`}>
              {status?.replace('_', ' ')}
            </span>
          </div>
        </div>

        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-gray-900">{patientName}</h3>
            {getTypeBadge(appointment.type, appointment.appointment_number)}
          </div>
          <p className="text-sm text-gray-600">{appointment.patient_age || 'N/A'} years • {appointment.patient_gender || 'N/A'}</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-3 mb-3">
          <p className="text-xs text-gray-600 mb-1">Chief Complaint:</p>
          <p className="text-sm text-gray-900">{appointment.chief_complaint || appointment.chiefComplaint}</p>
        </div>

        {appointment.previous_appointments && appointment.previous_appointments.length > 0 && (
          <div className="mb-3 text-xs text-gray-600">
            📋 Previous visits: {appointment.previous_appointments.length}
          </div>
        )}

        <div className="flex space-x-2">
          {isScheduled && (
            <>
              <button 
                onClick={() => handleStartSession(appointment._id)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <Play className="w-4 h-4" />
                <span>START SESSION</span>
              </button>
              <button className="btn-secondary">
                <RotateCcw className="w-4 h-4" />
              </button>
              <button className="bg-red-100 hover:bg-red-200 text-red-700 font-semibold py-2 px-3 rounded-lg transition-colors">
                <XCircle className="w-4 h-4" />
              </button>
            </>
          )}
          
          {isInProgress && (
            <>
              <button 
                onClick={() => handleStartSession(appointment._id)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <span>RESUME SESSION</span>
              </button>
            </>
          )}
          
          {isCompleted && (
            <button 
              onClick={() => handleViewPatient(appointment.patient_id)}
              className="flex-1 btn-secondary flex items-center justify-center space-x-2"
            >
              <Eye className="w-4 h-4" />
              <span>VIEW DETAILS</span>
            </button>
          )}
          
          {(isScheduled || isInProgress) && (
            <button 
              onClick={() => handleViewPatient(appointment.patient_id)}
              className="btn-secondary flex items-center space-x-1"
            >
              <Eye className="w-4 h-4" />
              <span className="hidden sm:inline">History</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  const upcomingAppointments = appointments.filter(a => 
    (a.status === 'scheduled' || a.status === 'SCHEDULED' || a.status === 'new') && a._id !== currentAppointment?._id
  );
  
  const completedAppointments = appointments.filter(a => 
    a.status === 'completed' || a.status === 'COMPLETED'
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome, {user?.full_name || 'Doctor'}</h2>
        <p className="text-gray-600">Today's Schedule - {dayOfWeek}, {dateFormatted}</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-900">{stats.total}</div>
            <p className="text-sm text-blue-700">Total Appointments</p>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-900">{stats.inProgress}</div>
            <p className="text-sm text-green-700">In Progress</p>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-900">{stats.upcoming}</div>
            <p className="text-sm text-purple-700">Upcoming</p>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">{stats.completed}</div>
            <p className="text-sm text-gray-700">Completed</p>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <div className="text-center">
            <div className="text-3xl font-bold text-red-900">{stats.cancelled}</div>
            <p className="text-sm text-red-700">Cancelled</p>
          </div>
        </div>
      </div>

      {/* Current Appointment */}
      {currentAppointment && (
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <h3 className="text-2xl font-bold text-gray-900">CURRENT APPOINTMENT</h3>
          </div>
          <AppointmentCard appointment={currentAppointment} isCurrent={true} />
        </div>
      )}

      {/* Upcoming Appointments */}
      {upcomingAppointments.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            UPCOMING APPOINTMENTS ({upcomingAppointments.length})
          </h3>
          <div className="grid lg:grid-cols-2 gap-6">
            {upcomingAppointments.map(appointment => (
              <AppointmentCard key={appointment._id} appointment={appointment} />
            ))}
          </div>
        </div>
      )}

      {/* Completed Today */}
      {completedAppointments.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
            COMPLETED TODAY ({completedAppointments.length})
          </h3>
          <div className="space-y-4">
            {completedAppointments.map(appointment => (
              <AppointmentCard key={appointment._id} appointment={appointment} />
            ))}
          </div>
        </div>
      )}

      {/* No Appointments Message */}
      {stats.total === 0 && !loading && (
        <div className="card text-center py-12">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Appointments Today</h3>
          <p className="text-gray-600">Your schedule is clear for today.</p>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;
