import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Users, CheckCircle, Play, XCircle, RotateCcw, Eye } from 'lucide-react';
import { todaysSchedule, getCurrentAppointment } from '../../data/appointmentData';

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const currentAppointment = getCurrentAppointment();
  
  const stats = {
    total: todaysSchedule.appointments.length,
    completed: todaysSchedule.appointments.filter(a => a.status === 'COMPLETED').length,
    inProgress: todaysSchedule.appointments.filter(a => a.status === 'IN_PROGRESS').length,
    upcoming: todaysSchedule.appointments.filter(a => a.status === 'SCHEDULED').length,
    cancelled: todaysSchedule.appointments.filter(a => a.status === 'CANCELLED').length
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

  const getStatusIcon = (status) => {
    if (status === 'COMPLETED') return <CheckCircle className="w-4 h-4" />;
    if (status === 'IN_PROGRESS') return <Play className="w-4 h-4" />;
    if (status === 'CANCELLED') return <XCircle className="w-4 h-4" />;
    return <Clock className="w-4 h-4" />;
  };

  const getTypeBadge = (type, appointmentNumber) => {
    if (type === 'NEW_PATIENT') {
      return <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-semibold">🆕 NEW PATIENT</span>;
    }
    return <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-semibold">🔄 CONTINUATION (Visit #{appointmentNumber})</span>;
  };

  const handleStartSession = (appointmentId) => {
    navigate(`/doctor/session/${appointmentId}`);
  };

  const handleViewPatient = (patientId) => {
    navigate(`/doctor/patients?patientId=${patientId}`);
  };

  const AppointmentCard = ({ appointment, isCurrent = false }) => {
    const isCompleted = appointment.status === 'COMPLETED';
    const isInProgress = appointment.status === 'IN_PROGRESS';
    const isScheduled = appointment.status === 'SCHEDULED';

    return (
      <div className={`card transition-all ${isCurrent ? 'border-2 border-green-400 bg-green-50' : ''} ${isCompleted ? 'opacity-75' : ''}`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-gray-600" />
            <span className="font-semibold text-gray-900">{appointment.scheduledTime} - {appointment.endTime}</span>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusIcon(appointment.status)}
            <span className={`text-xs px-3 py-1 rounded-full font-semibold ${getStatusBadge(appointment.status)}`}>
              {appointment.status.replace('_', ' ')}
            </span>
          </div>
        </div>

        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-gray-900">{appointment.patientName}</h3>
            {getTypeBadge(appointment.type, appointment.appointmentNumber)}
          </div>
          <p className="text-sm text-gray-600">{appointment.patientAge} years • {appointment.patientGender}</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-3 mb-3">
          <p className="text-xs text-gray-600 mb-1">Chief Complaint:</p>
          <p className="text-sm text-gray-900">{appointment.chiefComplaint}</p>
        </div>

        {appointment.previousAppointments && appointment.previousAppointments.length > 0 && (
          <div className="mb-3 text-xs text-gray-600">
            📋 Previous visits: {appointment.previousAppointments.length}
          </div>
        )}

        <div className="flex space-x-2">
          {isScheduled && (
            <>
              <button 
                onClick={() => handleStartSession(appointment.id)}
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
                onClick={() => handleStartSession(appointment.id)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <span>RESUME SESSION</span>
              </button>
            </>
          )}
          
          {isCompleted && (
            <button 
              onClick={() => handleViewPatient(appointment.patientId)}
              className="flex-1 btn-secondary flex items-center justify-center space-x-2"
            >
              <Eye className="w-4 h-4" />
              <span>VIEW DETAILS</span>
            </button>
          )}
          
          {(isScheduled || isInProgress) && (
            <button 
              onClick={() => handleViewPatient(appointment.patientId)}
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

  const upcomingAppointments = todaysSchedule.appointments.filter(a => 
    a.status === 'SCHEDULED' && a.id !== currentAppointment?.id
  );
  
  const completedAppointments = todaysSchedule.appointments.filter(a => 
    a.status === 'COMPLETED'
  );

  return (
    <div className="max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome, Dr. Priya Mehta</h2>
        <p className="text-gray-600">Today's Schedule - {todaysSchedule.dayOfWeek}, {todaysSchedule.date}</p>
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
              <AppointmentCard key={appointment.id} appointment={appointment} />
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
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))}
          </div>
        </div>
      )}

      {/* No Appointments Message */}
      {stats.total === 0 && (
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
