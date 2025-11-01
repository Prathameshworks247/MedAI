import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Square, Clock, CheckCircle, Upload, FileText, Brain, Download, Eye, Plus, Mic, FileCheck, TestTube2, Sparkles, MessageSquare } from 'lucide-react';
import { appointments, ACTIVITY_TYPES, isRequiredActivitiesComplete, getActivityIcon } from '../../data/appointmentData';

const ActiveSession = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const appointment = appointments.find(a => a.id === appointmentId);
  const [expandedActivity, setExpandedActivity] = useState(null);
  
  if (!appointment) {
    return <div className="p-6">Appointment not found</div>;
  }

  const session = appointment.session;
  const activities = session?.activities || [];
  const requiredComplete = isRequiredActivitiesComplete(session);

  const getActivityColor = (type) => {
    const colors = {
      [ACTIVITY_TYPES.RECORDING]: 'bg-blue-50 border-blue-200',
      [ACTIVITY_TYPES.DOCUMENTS]: 'bg-purple-50 border-purple-200',
      [ACTIVITY_TYPES.REPORT]: 'bg-green-50 border-green-200',
      [ACTIVITY_TYPES.TESTS]: 'bg-orange-50 border-orange-200',
      [ACTIVITY_TYPES.DIAGNOSIS]: 'bg-red-50 border-red-200',
      [ACTIVITY_TYPES.ADDITIONAL_DOCS]: 'bg-gray-50 border-gray-200'
    };
    return colors[type] || 'bg-gray-50 border-gray-200';
  };

  const getActivityTitle = (type) => {
    const titles = {
      [ACTIVITY_TYPES.RECORDING]: 'Consultation Recording',
      [ACTIVITY_TYPES.DOCUMENTS]: 'Handwritten Documents',
      [ACTIVITY_TYPES.REPORT]: 'Clinical Report',
      [ACTIVITY_TYPES.TESTS]: 'Test Results',
      [ACTIVITY_TYPES.DIAGNOSIS]: 'Diagnosis & Insights',
      [ACTIVITY_TYPES.ADDITIONAL_DOCS]: 'Additional Documents'
    };
    return titles[type] || 'Activity';
  };

  const ActivityTimeline = ({ activity }) => {
    const isExpanded = expandedActivity === activity.id;
    
    return (
      <div className={`card border-2 ${getActivityColor(activity.type)}`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start space-x-3 flex-1">
            <div className="text-3xl">{getActivityIcon(activity.type)}</div>
            <div className="flex-1">
              <h4 className="text-lg font-bold text-gray-900">{activity.title}</h4>
              <p className="text-sm text-gray-600 flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {activity.timestamp}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">
              COMPLETED
            </span>
          </div>
        </div>

        {/* Activity Content Preview */}
        <div className="bg-white rounded-lg p-3 mb-3">
          {activity.type === ACTIVITY_TYPES.RECORDING && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">Duration: {activity.data.duration}</span>
                <button className="text-primary-600 hover:text-primary-700 text-sm font-semibold">
                  <Play className="w-4 h-4 inline mr-1" />
                  Play Audio
                </button>
              </div>
              {activity.data.transcription && (
                <p className="text-xs text-gray-600">Transcription available ({activity.data.transcription.length} characters)</p>
              )}
            </div>
          )}

          {activity.type === ACTIVITY_TYPES.DOCUMENTS && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-700">{activity.data.files?.length || 0} file(s) uploaded</p>
              <div className="flex flex-wrap gap-2">
                {activity.data.files?.map((file, idx) => (
                  <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                    {file.name}
                  </span>
                ))}
              </div>
              {activity.data.ocrExtracted && (
                <p className="text-xs text-gray-600">OCR text extracted</p>
              )}
            </div>
          )}

          {activity.type === ACTIVITY_TYPES.REPORT && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-700">Clinical report generated</p>
              <p className="text-xs text-gray-600">{activity.data.content?.length || 0} characters</p>
            </div>
          )}

          {activity.type === ACTIVITY_TYPES.TESTS && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-700">{activity.data.files?.length || 0} test file(s) uploaded</p>
              {activity.data.extractedValues && (
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(activity.data.extractedValues).slice(0, 4).map(([key, value]) => (
                    <div key={key} className="bg-white border border-gray-200 rounded p-2">
                      <p className="text-xs text-gray-600">{key}</p>
                      <p className="text-sm font-bold text-gray-900">{value}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activity.type === ACTIVITY_TYPES.DIAGNOSIS && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-900">{activity.data.diagnosis}</p>
              <div className="flex items-center space-x-2">
                <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                  activity.data.riskLevel === 'HIGH' ? 'bg-red-100 text-red-700' :
                  activity.data.riskLevel === 'MODERATE' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  Risk: {activity.data.riskLevel}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* View Details Button */}
        <button
          onClick={() => setExpandedActivity(isExpanded ? null : activity.id)}
          className="btn-secondary w-full flex items-center justify-center"
        >
          <Eye className="w-4 h-4 mr-2" />
          {isExpanded ? 'Hide Details' : 'View Full Details'}
        </button>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            {activity.type === ACTIVITY_TYPES.RECORDING && activity.data.transcription && (
              <div className="bg-white border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-semibold text-gray-900">Full Transcription</h5>
                  <button className="text-primary-600 hover:text-primary-700 text-sm flex items-center">
                    <Download className="w-4 h-4 mr-1" />
                    Export
                  </button>
                </div>
                <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">
                  {activity.data.transcription}
                </pre>
              </div>
            )}

            {activity.type === ACTIVITY_TYPES.REPORT && activity.data.content && (
              <div className="bg-white border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-semibold text-gray-900">Clinical Report</h5>
                  <button className="text-primary-600 hover:text-primary-700 text-sm flex items-center">
                    <Download className="w-4 h-4 mr-1" />
                    Download PDF
                  </button>
                </div>
                <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">
                  {activity.data.content}
                </pre>
              </div>
            )}

            {activity.type === ACTIVITY_TYPES.DIAGNOSIS && (
              <div className="space-y-4">
                {activity.data.findings && activity.data.findings.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h5 className="font-semibold text-gray-900 mb-2">Key Findings</h5>
                    <ul className="space-y-1">
                      {activity.data.findings.map((finding, idx) => (
                        <li key={idx} className="text-sm text-gray-700">• {finding}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {activity.data.recommendations && activity.data.recommendations.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h5 className="font-semibold text-gray-900 mb-2">Recommendations</h5>
                    <ul className="space-y-1">
                      {activity.data.recommendations.map((rec, idx) => (
                        <li key={idx} className="text-sm text-gray-700">{idx + 1}. {rec}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {activity.data.comparisonData && (
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h5 className="font-semibold text-gray-900 mb-2">Comparison with Previous Visit</h5>
                    <p className="text-sm text-gray-600 mb-2">Previous visit: {activity.data.comparisonData.prevVisit}</p>
                    <div className="space-y-1">
                      {Object.entries(activity.data.comparisonData.changes).map(([key, value]) => (
                        <p key={key} className="text-sm text-gray-700">
                          <span className="font-semibold">{key}:</span> {value}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button 
          onClick={() => navigate('/doctor')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </button>
        
        <div className="card bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-300">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <h2 className="text-2xl font-bold text-gray-900">ACTIVE SESSION</h2>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-1">{appointment.patientName}</h3>
              <p className="text-sm text-gray-600">{appointment.patientAge} years • {appointment.patientGender} • {appointment.scheduledTime}</p>
              
              {appointment.type === 'CONTINUATION' && (
                <div className="mt-3 p-3 bg-purple-100 border border-purple-200 rounded-lg">
                  <p className="text-sm font-semibold text-purple-900">
                    🔄 Appointment #{appointment.appointmentNumber} for this patient
                  </p>
                  <p className="text-xs text-purple-700 mt-1">
                    Previous visits: {appointment.previousAppointments.length}
                  </p>
                </div>
              )}
              
              {appointment.type === 'NEW_PATIENT' && (
                <div className="mt-3 p-3 bg-blue-100 border border-blue-200 rounded-lg">
                  <p className="text-sm font-semibold text-blue-900">
                    🆕 NEW PATIENT - First consultation
                  </p>
                </div>
              )}
            </div>
            
            <div className="text-right">
              <div className="flex items-center space-x-2 text-gray-700 mb-2">
                <Clock className="w-4 h-4" />
                <span className="text-sm">Started: {session?.startedAt}</span>
              </div>
              <div className="text-2xl font-bold text-green-600">{session?.totalDuration}</div>
              <p className="text-xs text-gray-600">Session Duration</p>
            </div>
          </div>
        </div>
      </div>

      {/* Required Activities Status */}
      <div className="card mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Required Activities</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className={`p-4 rounded-lg border-2 ${session?.requiredCompleted?.recording ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex items-center space-x-2 mb-2">
              {session?.requiredCompleted?.recording ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <Mic className="w-5 h-5 text-gray-400" />
              )}
              <span className="font-semibold text-gray-900">Recording</span>
            </div>
            <p className="text-xs text-gray-600">Consultation audio & transcription</p>
          </div>

          <div className={`p-4 rounded-lg border-2 ${session?.requiredCompleted?.documents ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex items-center space-x-2 mb-2">
              {session?.requiredCompleted?.documents ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <FileCheck className="w-5 h-5 text-gray-400" />
              )}
              <span className="font-semibold text-gray-900">Documents</span>
            </div>
            <p className="text-xs text-gray-600">Handwritten clinical notes</p>
          </div>

          <div className={`p-4 rounded-lg border-2 ${session?.requiredCompleted?.report ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex items-center space-x-2 mb-2">
              {session?.requiredCompleted?.report ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <FileText className="w-5 h-5 text-gray-400" />
              )}
              <span className="font-semibold text-gray-900">Clinical Report</span>
            </div>
            <p className="text-xs text-gray-600">AI-generated SOAP report</p>
          </div>
        </div>

        {!requiredComplete && (
          <div className="mt-4 flex space-x-3">
            {!session?.requiredCompleted?.recording && (
              <button className="btn-primary flex-1 flex items-center justify-center">
                <Mic className="w-4 h-4 mr-2" />
                Start Recording
              </button>
            )}
            {session?.requiredCompleted?.recording && !session?.requiredCompleted?.documents && (
              <button className="btn-primary flex-1 flex items-center justify-center">
                <Upload className="w-4 h-4 mr-2" />
                Upload Documents
              </button>
            )}
            {session?.requiredCompleted?.recording && session?.requiredCompleted?.documents && !session?.requiredCompleted?.report && (
              <button className="btn-primary flex-1 flex items-center justify-center">
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Report with AI
              </button>
            )}
          </div>
        )}
      </div>

      {/* Activity Timeline */}
      {activities.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">Session Timeline</h3>
            <span className="text-sm text-gray-600">{activities.length} activities completed</span>
          </div>
          
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <div key={activity.id} className="relative">
                {index < activities.length - 1 && (
                  <div className="absolute left-6 top-16 bottom-0 w-0.5 bg-gray-200 z-0"></div>
                )}
                <ActivityTimeline activity={activity} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Additional Actions - Only show after required activities */}
      {requiredComplete && (
        <div className="card bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Additional Actions</h3>
          <p className="text-sm text-gray-600 mb-4">
            All required activities completed. You can now upload additional documents or generate diagnosis at any time.
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            <button className="card hover:shadow-lg transition-all border-2 border-orange-200 bg-orange-50 text-left p-4">
              <div className="flex items-start space-x-3">
                <TestTube2 className="w-6 h-6 text-orange-600 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Upload Test Results</h4>
                  <p className="text-xs text-gray-600">Blood work, ECG, X-rays, etc.</p>
                </div>
              </div>
            </button>

            <button className="card hover:shadow-lg transition-all border-2 border-red-200 bg-red-50 text-left p-4">
              <div className="flex items-start space-x-3">
                <Brain className="w-6 h-6 text-red-600 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Generate Diagnosis</h4>
                  <p className="text-xs text-gray-600">AI-powered insights & recommendations</p>
                </div>
              </div>
            </button>

            <button 
              onClick={() => navigate(`/doctor/chat/${appointmentId}`)}
              className="card hover:shadow-lg transition-all border-2 border-blue-200 bg-blue-50 text-left p-4"
            >
              <div className="flex items-start space-x-3">
                <MessageSquare className="w-6 h-6 text-blue-600 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Chat with AI</h4>
                  <p className="text-xs text-gray-600">Ask questions about this case</p>
                </div>
              </div>
            </button>

            <button className="card hover:shadow-lg transition-all border-2 border-gray-200 bg-gray-50 text-left p-4">
              <div className="flex items-start space-x-3">
                <Plus className="w-6 h-6 text-gray-600 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Add Documents</h4>
                  <p className="text-xs text-gray-600">Any additional files or notes</p>
                </div>
              </div>
            </button>

            <button className="card hover:shadow-lg transition-all border-2 border-green-200 bg-green-50 text-left p-4">
              <div className="flex items-start space-x-3">
                <Download className="w-6 h-6 text-green-600 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Export All</h4>
                  <p className="text-xs text-gray-600">Download complete session record</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Session Controls */}
      <div className="card mt-6 bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Session Status</p>
            <p className="text-lg font-semibold text-gray-900">{appointment.status}</p>
          </div>
          <div className="flex space-x-3">
            <button className="btn-secondary flex items-center">
              Pause Session
            </button>
            <button className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors flex items-center">
              <Square className="w-4 h-4 mr-2" />
              End Session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActiveSession;
