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
      'SCHEDULED': { color: 'bg-blue-100 text-blue-700', label: 'Scheduled' },
      'IN_PROGRESS': { color: 'bg-green-100 text-green-700', label: 'In Progress' },
      'COMPLETED': { color: 'bg-gray-100 text-gray-700', label: 'Completed' },
      'CANCELLED': { color: 'bg-red-100 text-red-700', label: 'Cancelled' }
    };
    return badges[status] || badges['SCHEDULED'];
  };

  const getStatusIcon = (status) => {
    if (status === 'COMPLETED') return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (status === 'IN_PROGRESS') return <Clock className="w-5 h-5 text-green-600 animate-pulse" />;
    if (status === 'CANCELLED') return <XCircle className="w-5 h-5 text-red-600" />;
    return <Calendar className="w-5 h-5 text-blue-600" />;
  };

  const AppointmentCard = ({ appointment, isUpcoming = false }) => {
    const badge = getStatusBadge(appointment.status);
    const isCompleted = appointment.status === 'COMPLETED';
    const session = appointment.session;

    return (
      <div className="card hover:shadow-lg transition-all">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-3">
            {getStatusIcon(appointment.status)}
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Appointment with Dr. Priya Mehta
              </h3>
              <p className="text-sm text-gray-600">Cardiology Department</p>
            </div>
          </div>
          <span className={`text-xs px-3 py-1 rounded-full font-semibold ${badge.color}`}>
            {badge.label}
          </span>
        </div>

        {/* Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-gray-700">
            <Calendar className="w-4 h-4 mr-2 text-gray-500" />
            <span className="text-sm">{appointment.scheduledDate} ({appointment.scheduledTime})</span>
          </div>
          <div className="flex items-center text-gray-700">
            <MapPin className="w-4 h-4 mr-2 text-gray-500" />
            <span className="text-sm">City Heart Hospital, Room 302</span>
          </div>
        </div>

        {/* Chief Complaint */}
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <p className="text-xs text-gray-600 mb-1">Reason for Visit:</p>
          <p className="text-sm text-gray-900 font-semibold">{appointment.chiefComplaint}</p>
        </div>

        {/* Actions */}
        {isUpcoming && (
          <div className="flex space-x-2">
            <button className="btn-secondary flex-1 text-sm flex items-center justify-center">
              <RotateCcw className="w-4 h-4 mr-1" />
              Reschedule
            </button>
            <button className="bg-red-100 hover:bg-red-200 text-red-700 font-semibold py-2 px-4 rounded-lg transition-colors text-sm">
              Cancel
            </button>
          </div>
        )}

        {isCompleted && (
          <>
            {/* Available Content */}
            <div className="border-t border-gray-200 pt-4 mb-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Available Documents:</h4>
              <div className="space-y-2">
                {session?.soapReport?.status === 'COMPLETED' && (
                  <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-900 font-semibold">Clinical Report</span>
                    </div>
                    <button 
                      onClick={() => setSelectedAppointment(selectedAppointment === appointment.id ? null : appointment.id)}
                      className="text-xs text-green-700 hover:text-green-900 font-semibold"
                    >
                      {selectedAppointment === appointment.id ? 'Hide' : 'View'}
                    </button>
                  </div>
                )}
                
                {session?.testResults?.status === 'COMPLETED' && (
                  <div className="flex items-center justify-between p-2 bg-purple-50 rounded">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-purple-600" />
                      <span className="text-sm text-purple-900 font-semibold">Test Results</span>
                    </div>
                    <span className="text-xs text-purple-700 font-semibold">
                      {session.testResults.files?.length || 0} file(s)
                    </span>
                  </div>
                )}

                {appointment.type === 'CONTINUATION' && (
                  <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-blue-900">Prescribed Medications</span>
                    </div>
                    <span className="text-xs text-blue-700 font-semibold">4 items</span>
                  </div>
                )}
              </div>
            </div>

            {/* Expanded Report View */}
            {selectedAppointment === appointment.id && session?.soapReport?.content && (
              <div className="border-t border-gray-200 pt-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-gray-900">Clinical Report</h4>
                    <button className="text-primary-600 hover:text-primary-700 flex items-center text-sm">
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </button>
                  </div>
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">
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
        <h2 className="text-3xl font-bold text-gray-900 mb-2">My Appointments</h2>
        <p className="text-gray-600">View and manage your doctor appointments</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-900">{patientAppointments.length}</div>
            <p className="text-sm text-blue-700">Total Appointments</p>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-900">{upcomingAppointments.length}</div>
            <p className="text-sm text-green-700">Upcoming</p>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">{pastAppointments.length}</div>
            <p className="text-sm text-gray-700">Completed</p>
          </div>
        </div>
      </div>

      {/* Upcoming Appointments */}
      {upcomingAppointments.length > 0 && (
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <Calendar className="w-6 h-6 mr-2 text-green-600" />
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
        <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
          <CheckCircle className="w-6 h-6 mr-2 text-gray-600" />
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
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No past appointments</p>
          </div>
        )}
      </div>

      {/* Important Information */}
      <div className="card mt-8 bg-blue-50 border-2 border-blue-200">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">Important Information</h4>
            <ul className="text-sm text-blue-800 space-y-1">
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

