import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Square, Clock, CheckCircle, Upload, FileText, Brain, Download, Eye, Plus, Mic, FileCheck, TestTube2, Sparkles, MessageSquare, Loader, Calendar, Stethoscope, Activity } from 'lucide-react';
import { ACTIVITY_TYPES, isRequiredActivitiesComplete, getActivityIcon } from '../../data/appointmentData';
import { apiRequest } from '../../utils/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const ActiveSession = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [expandedActivity, setExpandedActivity] = useState(null);
  const [expandedHistoryId, setExpandedHistoryId] = useState(null);
  
  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [transcription, setTranscription] = useState('');
  const [partialTranscript, setPartialTranscript] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  
  // Refs for audio recording
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const websocketRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const durationIntervalRef = useRef(null);
  const segmentChunksRef = useRef([]); // Persist chunks across MediaRecorder restarts
  const isRecordingRef = useRef(false); // Track recording state to avoid closure issues
  
  // Format duration as MM:SS
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Connect to WebSocket
  const connectWebSocket = () => {
    try {
      // Extract host from API_BASE_URL
      const url = new URL(API_BASE_URL);
      const wsProtocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
      // Include appointment_id as query parameter so backend can save transcript
      const wsUrl = `${wsProtocol}//${url.host}/appointments/ws/dictation?appointment_id=${appointmentId}`;
      
      console.log('Connecting to WebSocket:', wsUrl);
      const ws = new WebSocket(wsUrl);
      websocketRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'partial_transcript') {
            // Append partial transcript to existing transcription
            setTranscription(prev => {
              // Only add space if previous ends with word char (simplistic)
              const newText = prev + (prev && !prev.endsWith(' ') ? ' ' : '') + data.text;
              return newText;
            });
            setPartialTranscript(data.text);
          } else if (data.type === 'final_transcript') {
            // Append final transcript to existing transcription
            setTranscription(prev => prev + (prev && !prev.endsWith(' ') ? ' ' : '') + data.text);
            setPartialTranscript('');
            console.log('✓ Final transcript received and appended');
            
            // Also update the appointment state to reflect the new transcription in activities
             setAppointment(prev => {
                if (!prev) return prev;
                // Add or update recording activity
                 const updatedActivities = [...(prev.session.activities || [])];
                 const recIndex = updatedActivities.findIndex(a => a.type === ACTIVITY_TYPES.RECORDING);
                 // We need to use functional update properly, access current value within scope or use a ref for latest transcription if needed
                 // But here we rely on the data.text which is the incremental final transcript.
                 // Actually, setTranscription updates state, but here we might be out of sync if we just append data.text to `transcription` (state).
                 // However, for UI update, it's "good enough" to just force a re-render or update locally.
                 // Better approach: Use the backend data on next fetch, but for instant feedback:
                 
                 // If we had the full text in data.text it would be easier.
                 // Let's assume user expects to see it in the timeline immediately.
                 // We will skip updating the complex appointment object for now to avoid state bugs, 
                 // as the live transcription view shows the text anyway. 
                 // But wait, the timeline view reads from `appointment.session.activities`.
                 // So we SHOULD update it.
                 
                 // Let's iterate:
                 const currentTrans = prev.session.activities?.[recIndex]?.data?.transcription || "";
                 const newTrans = currentTrans + (currentTrans ? ' ' : '') + data.text;
                 
                 const newActivity = {
                    id: 'rec-' + prev.id,
                    type: ACTIVITY_TYPES.RECORDING,
                    title: 'Consultation Recording',
                    timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                    data: {
                        duration: 'Recording...',
                        transcription: newTrans 
                    }
                 };

                 if (recIndex >= 0) {
                     updatedActivities[recIndex] = newActivity;
                 } else {
                     updatedActivities.push(newActivity);
                 }
                 
                 return {
                     ...prev,
                     session: {
                         ...prev.session,
                         activities: updatedActivities,
                         requiredCompleted: {
                             ...prev.session.requiredCompleted,
                             recording: true
                         }
                     }
                 };
             });
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
      };
    } catch (error) {
      console.error('Error connecting WebSocket:', error);
      setIsConnected(false);
    }
  };

  const handleStartRecording = async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });
      
      streamRef.current = stream;
  
      // Connect to WebSocket
      connectWebSocket();
  
      // Wait for WebSocket to connect
      await new Promise(resolve => setTimeout(resolve, 500));
  
      // Check MIME type support
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
  
      console.log('Using MIME type:', mimeType);
  
      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType,
        audioBitsPerSecond: 128000
      });
      
      mediaRecorderRef.current = mediaRecorder;
  
      // Reset chunks array for new recording session
      segmentChunksRef.current = [];
      
      // Collect chunks as they arrive (fires every 1 second due to timeslice)
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          segmentChunksRef.current.push(event.data);
          const totalSize = segmentChunksRef.current.reduce((sum, chunk) => sum + chunk.size, 0);
          console.log(`📦 Chunk ${segmentChunksRef.current.length}: ${event.data.size} bytes (segment total: ${(totalSize / 1024).toFixed(1)} KB)`);
        }
      };
  
      // When recording stops, send the complete segment
      mediaRecorder.onstop = () => {
        const recorder = mediaRecorderRef.current;
        
        // Request any remaining data before processing
        if (recorder && recorder.state === 'inactive' && segmentChunksRef.current.length > 0) {
          const completeSegment = new Blob(segmentChunksRef.current, { type: mimeType });
          const segmentSizeKB = completeSegment.size / 1024;
          
          console.log(`📦 Segment complete: ${completeSegment.size} bytes (${segmentSizeKB.toFixed(1)} KB) from ${segmentChunksRef.current.length} chunks`);
          
          if (websocketRef.current?.readyState === WebSocket.OPEN && completeSegment.size > 1000) {
            // Only send if segment is meaningful (at least 1KB)
            completeSegment.arrayBuffer().then(buffer => {
              console.log(`📤 Sending WebM segment: ${buffer.byteLength} bytes (${(buffer.byteLength / 1024).toFixed(1)} KB)`);
              websocketRef.current.send(buffer);
            }).catch(error => {
              console.error('Error sending segment:', error);
            });
          } else if (completeSegment.size <= 1000) {
            console.warn(`⚠ Segment too small (${segmentSizeKB.toFixed(1)} KB), skipping`);
          }
          
          // Clear for next segment
          segmentChunksRef.current = [];
        }
        
        // Automatically start next segment if still recording (use ref to avoid closure issues)
        if (isRecordingRef.current) {
          setTimeout(() => {
            const currentRecorder = mediaRecorderRef.current;
            if (isRecordingRef.current && currentRecorder && currentRecorder.state === 'inactive') {
              console.log('🔄 Starting next 15-second segment...');
              // Reset chunks array for new segment
              segmentChunksRef.current = [];
              // Restart with timeslice
              try {
                currentRecorder.start(1000);
                console.log('✓ Next segment started successfully');
              } catch (error) {
                console.error('Error restarting MediaRecorder:', error);
              }
            } else {
              console.log(`⚠ Cannot restart: isRecording=${isRecordingRef.current}, recorder=${!!currentRecorder}, state=${currentRecorder?.state}`);
            }
          }, 300); // Slightly longer delay to ensure state is ready
        } else {
          console.log('⏹ Recording stopped, not restarting segment');
        }
      };
  
      // Start recording with timeslice to ensure chunks are collected regularly
      // Timeslice of 1 second ensures we get chunks every second
      mediaRecorder.start(1000); // Request data every 1 second
      
      // Set up interval to stop/restart every 15 seconds for complete segments
      intervalRef.current = setInterval(() => {
        const recorder = mediaRecorderRef.current;
        if (recorder && recorder.state === 'recording') {
          // Request final data before stopping
          recorder.requestData();
          // Small delay to ensure final data is collected, then stop
          setTimeout(() => {
            if (recorder && recorder.state === 'recording') {
              console.log(`⏹ Stopping segment after 15 seconds (collected ${segmentChunksRef.current.length} chunks)`);
              recorder.stop(); // This triggers onstop, which sends the segment
            }
          }, 200);
        }
      }, 15000); // Create a new segment every 15 seconds
  
      setIsRecording(true);
      isRecordingRef.current = true; // Set ref to track recording state
      setRecordingDuration(0);
      // Do NOT clear transcription if it already exists from DB, but maybe clear partial
      setPartialTranscript('');
  
      // Start duration timer
      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
  
      console.log('✓ Recording started with 15-second segments');
  
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Failed to start recording. Please check microphone permissions.');
    }
  };

  // Stop recording
  const handleStopRecording = async () => {
    try {
      console.log('Stopping recording...');
      
      // Clear interval first
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
  
      // Stop MediaRecorder (this will trigger onstop one last time)
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
  
      // Stop all tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
  
      // Clear duration timer
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
  
      setIsRecording(false);
      isRecordingRef.current = false; // Clear ref to stop segment restarts
  
      // Wait for final segment to be sent, then close WebSocket
      setTimeout(() => {
        if (websocketRef.current) {
          console.log('Closing WebSocket connection');
          websocketRef.current.close();
          websocketRef.current = null;
        }
        setIsConnected(false);
      }, 1000);
  
      console.log('✓ Recording stopped');
  
    } catch (error) {
      console.error('Error stopping recording:', error);
    }
  };

  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        setLoading(true);
        const response = await apiRequest(`/appointments/${appointmentId}`);
        if (response.success) {
          const apiData = response.data;
          
          // Transform API data to expected frontend format
          const [idPrefix, visitNumStr] = (apiData._id || '').split('-');
          const visitNum = parseInt(visitNumStr || '0', 10);
          const type = visitNum === 0 ? 'baseline' : 'followup';
          
          const activities = [];
          
          if (apiData.discussion && apiData.discussion.trim().length > 0) {
            activities.push({
              id: 'rec-' + apiData._id,
              type: ACTIVITY_TYPES.RECORDING,
              title: 'Consultation Recording',
              timestamp: new Date(apiData.updated_at || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
              data: {
                duration: 'N/A', 
                transcription: apiData.discussion
              }
            });
            // Update local transcription state if loaded
            setTranscription(apiData.discussion);
          }

          // Fetch previous appointments
          let previousAppointments = [];
          if (visitNum > 0) {
            try {
              const prevIds = Array.from({ length: visitNum }, (_, i) => `${idPrefix}-${i}`);
              // Fetch all in parallel
              const prevResponses = await Promise.all(prevIds.map(id => apiRequest(`/appointments/${id}`)));
              
              previousAppointments = prevResponses
                .filter(res => res.success && res.data)
                .map(res => {
                    const apt = res.data;
                    const dateObj = new Date(apt.start_time || Date.now());
                    return {
                        id: apt._id,
                        scheduledDate: apt.appointment_date ? apt.appointment_date.split('T')[0] : '',
                        scheduledTime: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        chiefComplaint: apt.chief_complaint,
                        status: apt.status || 'completed',
                        doctor: apt.doctor || {},
                        patient: apt.patient || {},
                        session: {
                            discussion: apt.discussion,
                            reports: apt.reports,
                            tests: apt.tests,
                            generated_diagnosis: apt.generated_diagnosis,
                            doctor_diagnosis: apt.doctor_diagnosis
                        },            
                    };
                })
                .sort((a, b) => {
                     const numA = parseInt(a.id.split('-')[1]);
                     const numB = parseInt(b.id.split('-')[1]);
                     return numB - numA; // Descending order
                });
            } catch (err) {
              console.error("Error fetching previous appointments:", err);
              // Do not fail the main load if history fails
            }
          }
          
          const transformedAppointment = {
            ...apiData,
            id: apiData._id,
            patientName: apiData.patient?.name || 'Unknown Patient',
            patientAge: apiData.patient?.age || 'N/A',
            patientGender: apiData.patient?.gender || 'N/A',
            scheduledTime: apiData.start_time ? new Date(apiData.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A',
            type: type,
            appointmentNumber: visitNum,
            appointmentNumber: visitNum,
            previousAppointments: previousAppointments,
            session: {
              startedAt: apiData.start_time ? new Date(apiData.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A',
              totalDuration: '00:00', // Placeholder
              activities: activities,
              requiredCompleted: {
                recording: !!(apiData.discussion && apiData.discussion.trim().length > 0),
                documents: false,
                report: false
              }
            }
          };
          
          setAppointment(transformedAppointment);
        } else {
          setError('Failed to fetch appointment details');
        }
      } catch (err) {
        console.error("Error fetching appointment:", err);
        setError('An error occurred while fetching appointment details');
      } finally {
        setLoading(false);
      }
    };

    if (appointmentId) {
      fetchAppointment();
    }
  }, [appointmentId]);


  // Cleanup on unmount
  useEffect(() => {
    return () => {
      handleStopRecording();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-500 mb-4">{error || 'Appointment not found'}</div>
        <button onClick={() => navigate('/doctor')} className="btn-secondary">Back to Dashboard</button>
      </div>
    );
  }

  const session = appointment.session;
  const activities = session?.activities || [];
  
  // Use local Logic or Helper.
  const requiredComplete = session?.requiredCompleted?.recording && session?.requiredCompleted?.documents && session?.requiredCompleted?.report;

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

  const getActivityIcon = (type) => {
     // I will use explicit icons here as I don't want to import from data file if not needed or I can import it
     // But previous code imported it. Let's keep it imported.
     // Wait, the imported getActivityIcon function might return JSX.
     // Let's assume it works as before.
     // If not, I'll use a switch case.
     // The error log didn't complain about getActivityIcon.
     return type === ACTIVITY_TYPES.RECORDING ? <Mic /> : 
            type === ACTIVITY_TYPES.DOCUMENTS ? <FileCheck /> :
            type === ACTIVITY_TYPES.REPORT ? <FileText /> :
            type === ACTIVITY_TYPES.TESTS ? <TestTube2 /> :
            type === ACTIVITY_TYPES.DIAGNOSIS ? <Brain /> : <Plus />;
  };

  const ActivityTimeline = ({ activity }) => {
    const isExpanded = expandedActivity === activity.id;
    
    // Use imported function or fallback
    const icon = activity.type === ACTIVITY_TYPES.RECORDING ? <Mic /> : 
                 activity.type === ACTIVITY_TYPES.DOCUMENTS ? <FileCheck /> :
                 activity.type === ACTIVITY_TYPES.REPORT ? <FileText /> :
                 activity.type === ACTIVITY_TYPES.TESTS ? <TestTube2 /> :
                 activity.type === ACTIVITY_TYPES.DIAGNOSIS ? <Brain /> : <Plus />;

    return (
      <div className={`card border-2 ${getActivityColor(activity.type)}`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start space-x-3 flex-1">
            <div className="text-3xl">{icon}</div> 
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

  const appointmentNo = appointment.id.split("-")[1];

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

        {/* Previous Visits */}
      {appointment.previousAppointments && appointment.previousAppointments.length > 0 && (
        <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-gray-600" />
                Previous Visits
            </h3>
            <div className="space-y-4">
                {appointment.previousAppointments.map((prevApt) => {
                     const isExpanded = expandedHistoryId === prevApt.id;
                     const session = prevApt.session;
                     const aptNo = prevApt.id.split('-')[1];

                     return (
                        <div key={prevApt.id} className={`card ${isExpanded ? 'ring-2 ring-primary-500' : ''}`}>
                             <div className="flex items-start justify-between mb-3">
                                 <div className="flex-1">
                                      <div className="flex items-center space-x-2 mb-1">
                                         <Calendar className="w-5 h-5 text-gray-600" />
                                          <h4 className="text-lg font-bold text-gray-900">
                                            {aptNo == 0 ? "Baseline Visit" : `Follow Up Visit #${aptNo}`}
                                          </h4>   
                                      </div>
                                      <p className="text-base font-semibold mb-1">Doctor: {prevApt.doctor?.name || 'Unknown'}</p>
                                      <p className="text-sm text-gray-700 mb-1">Chief Complaint: {prevApt.chiefComplaint}</p>
                                      <p className="text-sm text-gray-600 mb-1 italic">
                                        "{prevApt.scheduledDate} at {prevApt.scheduledTime}" 
                                      </p>
                                 </div>
                                 <span className={`text-xs px-3 py-1 rounded-full font-semibold ${getStatusBadge(prevApt.status)}`}>
                                   {(prevApt.status || 'completed').replace('_', ' ')}
                                 </span>
                             </div>
                             
                              <div className="flex space-x-2">
                                <button 
                                  onClick={() => setExpandedHistoryId(isExpanded ? null : prevApt.id)}
                                  className="flex-1 btn-primary flex items-center justify-center"
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  {isExpanded ? 'Hide Details' : 'View Details'}
                                </button>
                                <button className="btn-secondary flex items-center">
                                  <Download className="w-4 h-4 mr-2" />
                                  Export
                                </button>
                              </div>
                              
                              {/* Details */}
                              {isExpanded && session && (
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
        </div>
      )}
        
        <div className="card bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-300">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <h2 className="text-2xl font-bold text-gray-900">ACTIVE SESSION</h2>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-1">{appointment.patientName}</h3>
              <p className="text-sm text-gray-600">{appointment.patientAge} years • {appointment.patientGender} • {appointment.scheduledTime}</p>
              
              {appointment.type === 'followup' && (
                <div className="mt-3 p-3 bg-purple-100 border border-purple-200 rounded-lg">
                  <p className="text-sm font-semibold text-purple-900">
                    🔄 Followup Visit #{appointment.appointmentNumber}
                  </p>
                </div>
              )}
              
              {appointment.type === 'baseline' && (
                <div className="mt-3 p-3 bg-blue-100 border border-blue-200 rounded-lg">
                  <p className="text-sm font-semibold text-blue-900">
                    🆕 Baseline Visit
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

        {/* Recording Controls - Always visible */}
        <div className="mt-4">
          {!isRecording ? (
            <button 
              onClick={handleStartRecording}
              className="btn-primary flex items-center justify-center w-full"
            >
              <Mic className="w-4 h-4 mr-2" />
              {session?.requiredCompleted?.recording ? 'Start New Recording' : 'Start Recording'}
            </button>
          ) : (
            <button 
              onClick={handleStopRecording}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center w-full"
            >
              <Square className="w-4 h-4 mr-2" />
              Stop Recording ({formatDuration(recordingDuration)})
            </button>
          )}
        </div>

        {!requiredComplete && (
          <div className="mt-4 flex space-x-3">
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

      {/* Live Transcription Display - Show when recording or has transcription */}
      {(isRecording || transcription || partialTranscript) && (
        <div className="card mb-6 bg-blue-50 border-2 border-blue-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center">
              <Mic className={`w-5 h-5 mr-2 text-blue-600 ${isRecording ? 'animate-pulse' : ''}`} />
              {isRecording ? 'Live Transcription' : 'Transcription'}
            </h3>
            <div className="flex items-center space-x-2">
              {isRecording && (
                <>
                  <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-sm text-gray-600">
                    {isConnected ? 'Connected' : 'Connecting...'}
                  </span>
                </>
              )}
              {transcription && !isRecording && (
                <button 
                  onClick={() => {
                    const blob = new Blob([transcription], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `transcription-${appointmentId}-${Date.now()}.txt`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="text-primary-600 hover:text-primary-700 text-sm flex items-center"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Export
                </button>
              )}
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
            <div className="space-y-2">
              {transcription && (
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {transcription}
                </p>
              )}
              {partialTranscript && (
                <p className="text-sm text-gray-500 italic whitespace-pre-wrap leading-relaxed">
                  {partialTranscript}
                  {isRecording && (
                    <span className="inline-block w-2 h-4 bg-blue-500 ml-1 animate-pulse"></span>
                  )}
                </p>
              )}
              {!transcription && !partialTranscript && isRecording && (
                <p className="text-sm text-gray-400 italic">Waiting for audio transcription...</p>
              )}
            </div>
          </div>
          
          {isRecording && (
            <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
              <span>Duration: {formatDuration(recordingDuration)}</span>
              <span>Status: Recording</span>
            </div>
          )}
        </div>
      )}

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
            <button 
              onClick={handleStopRecording}
              disabled={!isRecording}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Square className="w-4 h-4 mr-2" />
              {isRecording ? 'Stop Recording' : 'End Session'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActiveSession;
