import React, { useState } from 'react';
import { Calendar, Clock, MapPin, FileText, Download, CheckCircle, AlertCircle, RotateCcw, XCircle } from 'lucide-react';
import { appointments } from '../../data/appointmentData';

const MyAppointments = () => {
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  
  // Filter appointments for the current patient (Rajesh Sharma)
  const patientId = "PAT-2025-001234";
  const patientAppointments = appointments.filter(apt => apt.patientId === patientId);
  
  const upcomingAppointments = patientAppointments.filter(apt => 
    apt.status === 'SCHEDULED' || apt.status === 'IN_PROGRESS'
  );
  
  const pastAppointments = patientAppointments.filter(apt => 
    apt.status === 'COMPLETED'
  );

  const getStatusBadge = (status) => {
    const badges = {
      'SCHEDULED': { color: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300', label: 'Scheduled' },
      'IN_PROGRESS': { color: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300', label: 'In Progress' },
      'COMPLETED': { color: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300', label: 'Completed' },
      'CANCELLED': { color: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300', label: 'Cancelled' }
    };
    return badges[status] || badges['SCHEDULED'];
  };

  const getStatusIcon = (status) => {
    if (status === 'COMPLETED') return <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />;
    if (status === 'IN_PROGRESS') return <Clock className="w-5 h-5 text-green-600 dark:text-green-400 animate-pulse" />;
    if (status === 'CANCELLED') return <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />;
    return <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
  };

  const AppointmentCard = ({ appointment, isUpcoming = false }) => {
    const badge = getStatusBadge(appointment.status);
    const isCompleted = appointment.status === 'COMPLETED';
    const session = appointment.session;

    return (
      <div className="card hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-3">
            {getStatusIcon(appointment.status)}
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Appointment with Dr. Priya Mehta
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Cardiology Department</p>
            </div>
          </div>
          <span className={`text-xs px-3 py-1 rounded-full font-semibold ${badge.color}`}>
            {badge.label}
          </span>
        </div>

        {/* Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-gray-700 dark:text-gray-300">
            <Calendar className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
            <span className="text-sm">{appointment.scheduledDate} ({appointment.scheduledTime})</span>
          </div>
          <div className="flex items-center text-gray-700 dark:text-gray-300">
            <MapPin className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
            <span className="text-sm">City Heart Hospital, Room 302</span>
          </div>
        </div>

        {/* Chief Complaint */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Reason for Visit:</p>
          <p className="text-sm text-gray-900 dark:text-white font-semibold">{appointment.chiefComplaint}</p>
        </div>

        {/* Actions */}
        {isUpcoming && (
          <div className="flex space-x-2">
            <button className="btn-secondary flex-1 text-sm flex items-center justify-center">
              <RotateCcw className="w-4 h-4 mr-1" />
              Reschedule
            </button>
            <button className="bg-red-100 dark:bg-red-900/40 hover:bg-red-200 dark:hover:bg-red-800/40 text-red-700 dark:text-red-300 font-semibold py-2 px-4 rounded-lg transition-all text-sm">
              Cancel
            </button>
          </div>
        )}

        {isCompleted && (
          <>
            {/* Available Content */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-4">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Available Documents:</h4>
              <div className="space-y-2">
                {session?.soapReport?.status === 'COMPLETED' && (
                  <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/30 rounded">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <span className="text-sm text-green-900 dark:text-green-200 font-semibold">Clinical Report</span>
                    </div>
                    <button
                      onClick={() => setSelectedAppointment(selectedAppointment === appointment.id ? null : appointment.id)}
                      className="text-xs text-green-700 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 font-semibold transition-colors"
                    >
                      {selectedAppointment === appointment.id ? 'Hide' : 'View'}
                    </button>
                  </div>
                )}

                {session?.testResults?.status === 'COMPLETED' && (
                  <div className="flex items-center justify-between p-2 bg-purple-50 dark:bg-purple-900/30 rounded">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span className="text-sm text-purple-900 dark:text-purple-200 font-semibold">Test Results</span>
                    </div>
                    <span className="text-xs text-purple-700 dark:text-purple-300 font-semibold">
                      {session.testResults.files?.length || 0} file(s)
                    </span>
                  </div>
                )}

                {appointment.type === 'CONTINUATION' && (
                  <div className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/30 rounded">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm text-blue-900 dark:text-blue-200">Prescribed Medications</span>
                    </div>
                    <span className="text-xs text-blue-700 dark:text-blue-300 font-semibold">4 items</span>
                  </div>
                )}
              </div>
            </div>

            {/* Expanded Report View */}
            {selectedAppointment === appointment.id && session?.soapReport?.content && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-gray-900 dark:text-white">Clinical Report</h4>
                    <button className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center text-sm transition-colors">
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </button>
                  </div>
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 font-sans leading-relaxed">
                    {session.soapReport.content}
                  </pre>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-2 mt-4">
              <button className="btn-secondary flex-1 text-sm flex items-center justify-center">
                <Download className="w-4 h-4 mr-1" />
                Download All
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Appointments</h2>
        <p className="text-gray-600 dark:text-gray-400">View and manage your doctor appointments</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-blue-200 dark:border-blue-700 hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">{patientAppointments.length}</div>
            <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">Total Appointments</p>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border-green-200 dark:border-green-700 hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-900 dark:text-green-100">{upcomingAppointments.length}</div>
            <p className="text-sm text-green-700 dark:text-green-300 font-medium">Upcoming</p>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 border-gray-200 dark:border-gray-600 hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{pastAppointments.length}</div>
            <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">Completed</p>
          </div>
        </div>
      </div>

      {/* Upcoming Appointments */}
      {upcomingAppointments.length > 0 && (
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <Calendar className="w-6 h-6 mr-2 text-green-600 dark:text-green-400" />
            Upcoming Appointments
          </h3>
          <div className="space-y-4">
            {upcomingAppointments.map(appointment => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                isUpcoming={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Past Appointments */}
      <div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
          <CheckCircle className="w-6 h-6 mr-2 text-gray-600 dark:text-gray-400" />
          Past Appointments ({pastAppointments.length})
        </h3>
        {pastAppointments.length > 0 ? (
          <div className="space-y-4">
            {pastAppointments.map(appointment => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                isUpcoming={false}
              />
            ))}
          </div>
        ) : (
          <div className="card text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No past appointments</p>
          </div>
        )}
      </div>

      {/* Important Information */}
      <div className="card mt-8 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 hover:shadow-xl transition-all duration-200">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-1">Important Information</h4>
            <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
              <li>• Please arrive 10 minutes before your scheduled time</li>
              <li>• Bring your previous test reports and prescription</li>
              <li>• Cancel at least 24 hours in advance to avoid charges</li>
              <li>• Contact reception at +91 12345 67890 for queries</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyAppointments;

