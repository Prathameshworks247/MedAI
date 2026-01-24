import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Square, Clock, CheckCircle, Upload, FileText, Brain, Download, Eye, Plus, Mic, FileCheck, TestTube2, Sparkles, MessageSquare, Loader, Calendar, Stethoscope, Activity } from 'lucide-react';
import { ACTIVITY_TYPES } from '../../data/appointmentData';
import { apiRequest } from '../../utils/api';
import DiagnosisDashboard from '../diagnosis/Main';
import PDFViewer from './PDFViewer';
import ChatButton from './ChatButton';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const RequiredActivities = ({ session }) => (
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
    </div>
);

const RecordingSection = ({
    isRecording,
    isReviewing,
    transcription,
    discussion_summary,
    partialTranscript,
    isConnected,
    recordingDuration,
    onStart,
    onStop,
    onRedo,
    onFinalize,
    formatDuration,
    appointmentId,
    isFinalizing
}) => {
    const isFinalized = discussion_summary && discussion_summary.length > 0
    return (
        <div className="mb-6">
            {/* Live Transcription Display */}
            <div className="card mb-4 bg-blue-50 border-2 border-blue-300">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center">
                        <Mic className={`w-5 h-5 mr-2 text-blue-600 ${isRecording ? 'animate-pulse' : ''}`} />
                        {isRecording ? 'Discussion Details' : 'Discussion Details'}
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
                        {!transcription && !partialTranscript && !isRecording && (
                            <p className="text-sm text-gray-400 italic text-center py-4">No transcription available. Start recording to generate one.</p>
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

            {/* Recording Controls */}
            {!isFinalized && (
                <div className="mt-4">
                    {!isRecording && transcription.length === 0 ? (
                        <button
                            onClick={onStart}
                            className="btn-primary flex items-center justify-center w-full"
                        >
                            <Mic className="w-4 h-4 mr-2" />
                            Start Recording
                        </button>
                    ) : isRecording ? (
                        <button
                            onClick={onStop}
                            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center w-full"
                        >
                            <Square className="w-4 h-4 mr-2" />
                            Stop Recording ({formatDuration(recordingDuration)})
                        </button>
                    ) : (
                        <div className="flex space-x-2">
                            <button
                                onClick={onRedo}
                                className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center flex-1"
                            >
                                <span className="mr-2">↺</span>
                                Redo Recording
                            </button>
                            <button
                                onClick={onFinalize}
                                disabled={isFinalizing}
                                className={`bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center flex-1 ${isFinalizing ? 'opacity-75 cursor-not-allowed' : ''}`}
                            >
                                {isFinalizing ? (
                                    <>
                                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                                        Finalizing...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Finalize Recording
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const UploadSection = ({ title, icon: Icon, colorClass, borderClass, accept, onUpload, uploading, uploadedFiles }) => {
    const id = `upload-${title.toLowerCase().replace(/\s+/g, '-')}`;
    return (
        <div className={`card ${colorClass} border-2 ${borderClass}`}>
            <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center">
                <Icon className={`w-5 h-5 mr-2 ${borderClass.replace('border-', 'text-').replace('300', '600')}`} />
                {title}
            </h3>
            <p className="text-xs text-gray-600 mb-3">
                Upload {title.toLowerCase()} files.
            </p>
            <input
                type="file"
                id={id}
                multiple
                accept={accept}
                onChange={onUpload}
                className="hidden"
                disabled={uploading}
            />
            <label
                htmlFor={id}
                className={`btn-secondary w-full flex items-center justify-center cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                {uploading ? <Loader className="w-4 h-4 mr-3 animate-spin" /> : <Upload className="w-4 h-4 mr-3" />}
                Upload {title}
            </label>
            {uploadedFiles && uploadedFiles.length > 0 && (
                <div className="mt-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Uploaded Files:</h4>
                    <div className="space-y-2">
                        {uploadedFiles.map((file, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-2">
                                <div className="flex items-center space-x-2 overflow-hidden">
                                    <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    <span className="text-sm text-gray-700 truncate" title={file.file_name || file.name || file.doc_name}>
                                        {file.file_name || file.name || file.doc_name}
                                    </span>
                                </div>
                                {file.uri ? (
                                    <a
                                        href={file.uri}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-50 rounded"
                                        title="View Document"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </a>
                                ) : (
                                    <CheckCircle className="w-4 h-4 text-green-600 mr-1" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const ActiveSession = () => {
    const { appointmentId } = useParams();
    const navigate = useNavigate();

    const [appointment, setAppointment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFinalizing, setIsFinalizing] = useState(false);

    const [expandedActivity, setExpandedActivity] = useState(null);
    const [expandedHistoryId, setExpandedHistoryId] = useState(null);

    // Audio recording state
    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const [transcription, setTranscription] = useState('');
    const [partialTranscript, setPartialTranscript] = useState('');
    const [isConnected, setIsConnected] = useState(false);

    // Workflow state: transcript -> documents -> chat
    const [transcriptRecorded, setTranscriptRecorded] = useState(false);
    const [isReviewing, setIsReviewing] = useState(false);
    const [documentsUploaded, setDocumentsUploaded] = useState(false);
    const [uploadedReports, setUploadedReports] = useState([]);
    const [uploadedTests, setUploadedTests] = useState([]);
    const [uploadedFiles, setUploadedFiles] = useState([]); // Keep for backward compatibility or general files
    const [uploading, setUploading] = useState(false);

    const [pdfDocumentId, setPdfDocumentId] = useState(null);
    const [uploadedPdf, setUploadedPdf] = useState(null);
    const [uploadedPdfFile, setUploadedPdfFile] = useState(null); // Store the actual file object
    const [uploadingPdf, setUploadingPdf] = useState(false);

    // PDF Viewer state
    const [showPdfViewer, setShowPdfViewer] = useState(false);
    const [viewerPage, setViewerPage] = useState(1);
    const [viewerCoordinates, setViewerCoordinates] = useState(null);

    // Doctor's diagnosis state
    const [doctorDiagnosisText, setDoctorDiagnosisText] = useState('');
    const [doctorDiagnosisFiles, setDoctorDiagnosisFiles] = useState([]);
    const [uploadingDoctorDiagnosis, setUploadingDoctorDiagnosis] = useState(false);
    const [generatingDiagnosis, setGeneratingDiagnosis] = useState(false);

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
                        // Mark transcript as recorded when final transcript is received
                        setTranscriptRecorded(true);

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
                                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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

            setIsRecording(false);
            isRecordingRef.current = false; // Clear ref to stop segment restarts

            // Do NOT close WebSocket here. Enter review mode.
            setIsReviewing(true);

            console.log('✓ Recording stopped, entering review mode');
            // Mark transcript as recorded when recording stops (transcript will be saved to DB)
            // setTranscriptRecorded(true); // Moved to finalize

        } catch (error) {
            console.error('Error stopping recording:', error);
        }
    };

    const handleFinalizeRecording = async () => {
        // Close WebSocket
        if (websocketRef.current) {
            console.log('Closing WebSocket connection');
            websocketRef.current.close();
            websocketRef.current = null;
        }
        setIsConnected(false);
        setIsReviewing(false);
        setTranscriptRecorded(true);
        setIsFinalizing(true);

        try {
            // Call the finalize recording endpoint
            const response = await apiRequest(`/appointments/${appointmentId}/finalize-recording`, {
                method: 'POST'
            });

            if (response) {
                console.log("Recording finalized successfully:", response);
            }

            // Update appointment locally to reflect completion and new summary
            setAppointment(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    discussion_summary: response.data.discussion_summary,
                    session: {
                        ...prev.session,
                        requiredCompleted: {
                            ...prev.session.requiredCompleted,
                            recording: true
                        }
                    }
                };
            });
        } catch (error) {
            console.error("Error finalizing recording:", error);
            alert("Failed to finalize recording. Please try again.");
            // Optionally revert state if needed, but for now we keep it simple
        } finally {
            setIsFinalizing(false);
        }
    };

    const handleRedoRecording = async () => {
        // 1. Close current WebSocket
        if (websocketRef.current) {
            websocketRef.current.close();
            websocketRef.current = null;
        }
        setIsConnected(false);

        // 2. Clear local transcription state
        setTranscription('');
        setPartialTranscript('');

        // 3. Clear transcription in DB
        try {
            // We assume passing empty discussion clears it. 
            // Note: The backend update_appointment uses exclude_unset=True for Pydantic models.
            // We need to ensure sending an empty string works. 
            // If the backend model is Optional[str], passing "" should update it to "".
            await apiRequest(`/appointments/${appointmentId}`, {
                method: 'PATCH',
                body: JSON.stringify({ discussion: "" })
            });
        } catch (err) {
            console.error("Failed to clear discussion in DB", err);
        }

        // 4. Reset states and start recording
        setIsReviewing(false);
        setTranscriptRecorded(false);

        // 5. Start recording again
        handleStartRecording();
    };

    // Handle document upload
    const handleFileUpload = async (e, type) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setUploading(true);
        const patientId = appointment?.patientId || appointment?.patient?.id || appointment?.patient_id;

        if (!patientId) {
            alert('Patient ID not found');
            setUploading(false);
            return;
        }

        try {
            const uploadPromises = files.map(async (file) => {
                const formData = new FormData();
                formData.append('file', file);

                // For file uploads, we need to manually construct the request
                const token = localStorage.getItem('access_token');
                const url = `${API_BASE_URL}/ingest/document/${appointmentId}?patient_id=${patientId}`;

                const headers = {};
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }

                const response = await fetch(url, {
                    method: 'POST',
                    body: formData,
                    headers: headers
                });

                const contentType = response.headers.get('content-type');
                let data;
                if (contentType && contentType.includes('application/json')) {
                    data = await response.json();
                } else {
                    const text = await response.text();
                    data = { detail: text || `HTTP error! status: ${response.status}` };
                }

                if (!response.ok) {
                    throw new Error(data.detail || `HTTP error! status: ${response.status}`);
                }

                const apiResponse = { success: true, data };

                if (apiResponse.success) {
                    return { name: file.name, success: true };
                } else {
                    throw new Error(apiResponse.error || 'Upload failed');
                }
            });

            const results = await Promise.all(uploadPromises);

            if (type === 'report') {
                setUploadedReports(prev => [...prev, ...results]);
            } else if (type === 'test') {
                setUploadedTests(prev => [...prev, ...results]);
            } else {
                setUploadedFiles(prev => [...prev, ...results]);
            }

            setDocumentsUploaded(true);

            // Refresh appointment data
            const refreshResponse = await apiRequest(`/appointments/${appointmentId}`);
            if (refreshResponse.success) {
                setAppointment(prev => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        session: {
                            ...prev.session,
                            reports: refreshResponse.data.reports || [],
                            tests: refreshResponse.data.tests || []
                        }
                    };
                });

                // Clear local uploaded states so UI uses the reliable DB data (with URIs) from session.reports/tests
                if (type === 'report') setUploadedReports([]);
                if (type === 'test') setUploadedTests([]);
            }

            alert(`Successfully uploaded ${results.length} ${type}(s)`);
        } catch (error) {
            console.error('Error uploading documents:', error);
            alert(`Error uploading documents: ${error.message}`);
        } finally {
            setUploading(false);
            // Reset file input
            e.target.value = '';
        }
    };

    // Handle PDF upload for chatbot
    const handlePdfUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.name.endsWith('.pdf')) {
            alert('Please upload a PDF file');
            e.target.value = '';
            return;
        }

        setUploadingPdf(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const token = localStorage.getItem('access_token');
            const headers = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${API_BASE_URL}/doctors/upload-pdf`, {
                method: 'POST',
                body: formData,
                headers: headers
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Failed to upload PDF');
            }

            setPdfDocumentId(data.document_id);
            setUploadedPdf({
                document_id: data.document_id,
                file_name: data.file_name,
                total_chunks: data.total_chunks,
                total_pages: data.total_pages
            });
            setUploadedPdfFile(file); // Store the file object for viewing

            alert(`PDF uploaded successfully! ${data.total_chunks} chunks from ${data.total_pages} pages. You can now ask questions about this document.`);
        } catch (error) {
            console.error('Error uploading PDF:', error);
            alert(`Error uploading PDF: ${error.message}`);
        } finally {
            setUploadingPdf(false);
            e.target.value = '';
        }
    };


    const handlePauseSession = async () => {
        if (isRecording) {
            await handleStopRecording();
        }

        try {
            const response = await apiRequest(`/appointments/${appointmentId}`, {
                method: 'PATCH',
                body: JSON.stringify({ status: 'paused' })
            });

            if (response.success) {
                navigate('/doctor');
            } else {
                console.error('Failed to pause session:', response.error);
                alert('Failed to pause session. Please try again.');
            }
        } catch (error) {
            console.error('Error pausing session:', error);
            alert('An error occurred while pausing the session.');
        }
    };

    const handleEndSession = async () => {
        if (confirm('Are you sure you want to end this session? This will mark the appointment as completed.')) {
            if (isRecording) {
                await handleStopRecording();
            }

            try {
                const response = await apiRequest(`/appointments/${appointmentId}`, {
                    method: 'PATCH',
                    body: JSON.stringify({ status: 'completed' })
                });

                if (response.success) {
                    navigate('/doctor');
                } else {
                    console.error('Failed to end session:', response.error);
                    alert('Failed to end session. Please try again.');
                }
            } catch (error) {
                console.error('Error ending session:', error);
                alert('An error occurred while ending the session.');
            }
        }
    };

    // Handle Generate Diagnosis button click
    const handleGenerateDiagnosis = async () => {
        if (!transcriptRecorded && !documentsUploaded) {
            alert('Please complete recording or upload documents before generating diagnosis.');
            return;
        }

        setGeneratingDiagnosis(true);
        try {
            const response = await apiRequest(`/appointments/${appointmentId}/diagnosis`, {
                method: 'POST'
            });

            if (!response.success) {
                throw new Error(response.error || 'Failed to generate diagnosis');
            }

            const generatedAt = response?.data?.generated_at || new Date().toISOString();

            // Update local appointment state so the diagnosis renders immediately without a full refetch
            setAppointment(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    generated_diagnosis: response?.data?.diagnosis ?? prev.generated_diagnosis,
                    generated_diagnosis_text: response?.data?.diagnosis_text ?? prev.generated_diagnosis_text,
                    diagnosis_generated_at: generatedAt
                };
            });

            alert('Diagnosis generated successfully.');
        } catch (error) {
            console.error('Error generating diagnosis:', error);
            alert(`An error occurred while generating diagnosis: ${error.message || 'Unknown error'}`);
        } finally {
            setGeneratingDiagnosis(false);
        }
    };

    const [savingDoctorDiagnosis, setSavingDoctorDiagnosis] = useState(false);

    // Handle doctor's diagnosis file upload
    const handleDoctorDiagnosisFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        const newFiles = files.map(file => ({
            name: file.name,
            file: file,
            uploaded: false,
            id: 'doc-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
        }));
        
        setDoctorDiagnosisFiles(prev => [...prev, ...newFiles]);
        e.target.value = '';
    };

    const handleRemoveDoctorDiagnosisFile = (fileId) => {
        setDoctorDiagnosisFiles(prev => prev.filter(f => f.id !== fileId));
    };

    // Handle saving doctor's diagnosis
    const handleSaveDoctorDiagnosis = async () => {
        if (!doctorDiagnosisText.trim() && doctorDiagnosisFiles.length === 0) {
            alert('Please provide diagnosis text or upload files.');
            return;
        }

        setSavingDoctorDiagnosis(true);
        try {
            let newlyUploadedFiles = [];

            // Step 1: Upload new files if any
            const filesToUpload = doctorDiagnosisFiles.filter(f => !f.uploaded).map(f => f.file);
            
            if (filesToUpload.length > 0) {
                const formData = new FormData();
                filesToUpload.forEach(file => {
                    formData.append('files', file);
                });

                // Use fetch directly for multipart/form-data
                const token = localStorage.getItem('access_token');
                const uploadResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/appointments/${appointmentId}/upload-diagnosis-files`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });

                const uploadData = await uploadResponse.json();
                
                if (uploadData.success) {
                    newlyUploadedFiles = [...uploadData.files];
                } else {
                    throw new Error(uploadData.detail || 'Failed to upload files');
                }
            }

            // Step 2: Combine with existing files if it's an update
            const existingFiles = appointment.doctor_diagnosis?.files || [];
            const finalFiles = [...existingFiles, ...newlyUploadedFiles];

            // Step 3: Save diagnosis data
            const response = await apiRequest(`/appointments/${appointmentId}/doctor-diagnosis`, {
                method: 'POST',
                body: JSON.stringify({
                    diagnosis_text: doctorDiagnosisText,
                    files: finalFiles
                })
            });

            if (response.success) {
                alert('Diagnosis saved successfully!');
                // Update local state to reflect the saved data
                setAppointment(prev => ({
                    ...prev,
                    doctor_diagnosis: {
                        text: doctorDiagnosisText,
                        files: finalFiles,
                        submitted_at: new Date().toISOString()
                    }
                }));
                // Clear the input states
                setDoctorDiagnosisText('');
                setDoctorDiagnosisFiles([]);
            } else {
                throw new Error(response.error || 'Failed to save diagnosis');
            }
        } catch (error) {
            console.error('Error saving doctor diagnosis:', error);
            alert(`An error occurred while saving diagnosis: ${error.message}`);
        } finally {
            setSavingDoctorDiagnosis(false);
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
                            timestamp: new Date(apiData.updated_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                            data: {
                                duration: 'N/A',
                                transcription: apiData.discussion
                            }
                        });
                        // Update local transcription state if loaded
                        setTranscription(apiData.discussion);
                        // Mark transcript as recorded if it exists
                        setTranscriptRecorded(true);
                    }

                    // Check if documents are uploaded (reports or tests exist)
                    if ((apiData.reports && apiData.reports.length > 0) || (apiData.tests && apiData.tests.length > 0)) {
                        setDocumentsUploaded(true);
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
                                        diagnosis_generated_at: apt.diagnosis_generated_at,
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
                        appointmentNumber: visitNum,
                        type: type,
                        previousAppointments: previousAppointments,
                        scheduledTime: apiData.start_time ? new Date(apiData.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A',
                        session: {
                            startedAt: apiData.start_time ? new Date(apiData.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A',
                            totalDuration: '00:00', // Placeholder
                            activities: activities,
                            requiredCompleted: {
                                recording: !!(apiData.discussion && apiData.discussion.trim().length > 0),
                                documents: !!(apiData.reports && apiData.reports.length > 0),
                                report: !!apiData.diagnosis_generated_at
                            }
                        }
                    };

                    setAppointment(transformedAppointment);
                    setUploadedReports(apiData.reports);
                    setUploadedTests(apiData.tests);
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

    const session = appointment?.session;
    // Use local Logic or Helper.
    const requiredComplete = session?.requiredCompleted?.recording && session?.requiredCompleted?.documents && session?.requiredCompleted?.report;


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

                                                {/* Generated Diagnosis */}
                                                {prevApt.diagnosis_generated_at && session.generated_diagnosis && (
                                                    <div className="mb-6 mt-8 border-2 border-indigo-100 bg-white rounded-lg p-4">
                                                        <div className="mb-4 border-b border-gray-100 pb-4">
                                                            <h6 className="text-lg font-bold text-gray-900 flex items-center">
                                                                <Sparkles className="w-5 h-5 mr-2 text-indigo-600" />
                                                                AI Diagnostic Analysis
                                                            </h6>
                                                            <p className="text-sm text-gray-500 mt-1">
                                                                Comprehensive analysis generated on {new Date(prevApt.diagnosis_generated_at).toLocaleString()}
                                                            </p>
                                                        </div>
                                                        <DiagnosisDashboard
                                                            data={session.generated_diagnosis}
                                                        />
                                                    </div>
                                                )}

                                                {/* Fallback if no details */}
                                                {!session.discussion && (!session.reports || session.reports.length === 0) && (!session.tests || session.tests.length === 0) && !prevApt.diagnosis_generated_at && (
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
                            <h3 className="text-xl font-semibold text-gray-800 mb-1">{appointment.patient.name}</h3>
                            <p className="text-sm text-gray-600 font-semibold mb-1 capitalize">Chief Complaint: {appointment.chief_complaint}</p>
                            <p className="text-sm text-gray-600">{appointment.patient.age} years • {appointment.patient.gender} • {appointment.scheduledTime}</p>

                            {appointment.type === 'followup' && (
                                <div className="mt-3 p-3 bg-purple-100 border border-purple-200 rounded-lg">
                                    <p className="text-sm font-semibold text-purple-900">
                                        🔄 Follow Up Visit #{appointment.appointmentNumber}
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

            <RequiredActivities session={session} />

            <RecordingSection
                isRecording={isRecording}
                isReviewing={isReviewing}
                transcription={transcription}
                discussion_summary={appointment?.discussion_summary}
                partialTranscript={partialTranscript}
                isConnected={isConnected}
                recordingDuration={recordingDuration}
                onStart={handleStartRecording}
                onStop={handleStopRecording}
                onRedo={handleRedoRecording}
                onFinalize={handleFinalizeRecording}
                formatDuration={formatDuration}
                appointmentId={appointmentId}
                isFinalizing={isFinalizing}
            />

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <UploadSection
                    title="Reports"
                    icon={FileText}
                    colorClass="bg-purple-50"
                    borderClass="border-purple-300"
                    accept=".pdf,.doc,.docx,.txt"
                    onUpload={(e) => handleFileUpload(e, 'report')}
                    uploading={uploading}
                    uploadedFiles={uploadedReports.length > 0 ? uploadedReports : session.reports}
                />

                <UploadSection
                    title="Tests & Labs"
                    icon={TestTube2}
                    colorClass="bg-orange-50"
                    borderClass="border-orange-300"
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                    onUpload={(e) => handleFileUpload(e, 'test')}
                    uploading={uploading}
                    uploadedFiles={uploadedTests.length > 0 ? uploadedTests : session.tests}
                />
            </div>

            {/* Generate Diagnosis Button - Show before diagnosis is generated */}
            {!appointment.diagnosis_generated_at && (
                <div className="mt-6 card bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-300">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center">
                                <Brain className="w-5 h-5 mr-2 text-indigo-600" />
                                AI Diagnostic Analysis
                            </h3>
                            <p className="text-sm text-gray-600">
                                Generate comprehensive AI-powered diagnostic insights based on the consultation recording and uploaded documents.
                            </p>
                            {!transcriptRecorded && !documentsUploaded && (
                                <p className="text-sm text-orange-600 mt-2 font-semibold">
                                    ⚠ Complete recording or upload documents to enable diagnosis generation
                                </p>
                            )}
                        </div>
                        <button
                            onClick={handleGenerateDiagnosis}
                            disabled={!transcriptRecorded && !documentsUploaded || generatingDiagnosis}
                            className={`ml-4 px-6 py-3 rounded-lg font-semibold transition-all flex items-center ${(transcriptRecorded || documentsUploaded) && !generatingDiagnosis
                                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-xl'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                        >
                            {generatingDiagnosis ? (
                                <>
                                    <Loader className="w-5 h-5 mr-2 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5 mr-2" />
                                    Generate Diagnosis
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}


            {/* Diagnostic Insights - Show if generated */}

            {/* Diagnostic Insights - Show if generated */}
            {appointment.diagnosis_generated_at && (
                <div className="card mt-8 border-2 border-indigo-100 bg-white">
                    <div className="mb-4 border-b border-gray-100 pb-4">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center">
                            <Sparkles className="w-5 h-5 mr-2 text-indigo-600" />
                            AI Diagnostic Analysis
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                            Comprehensive analysis generated on {new Date(appointment.diagnosis_generated_at).toLocaleString()}
                        </p>
                    </div>
                    <DiagnosisDashboard
                        data={appointment.generated_diagnosis}
                    />
                </div>
            )}

            {/* Doctor's Diagnosis Section - Show after AI diagnosis is generated */}
            {appointment.diagnosis_generated_at && (
                <div className="card mt-6 border-2 border-green-200 bg-green-50">
                    <div className="mb-6 border-b border-green-200 pb-5 flex items-center justify-between">
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900 flex items-center mb-2">
                                <Stethoscope className="w-6 h-6 mr-3 text-green-600" />
                                Doctor's Diagnosis
                            </h3>
                            <p className="text-base text-gray-700 mt-2">
                                Provide your clinical diagnosis, notes, and supporting documents
                            </p>
                        </div>
                        {appointment.doctor_diagnosis?.submitted_at && (
                            <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-bold flex items-center border border-green-200">
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Saved on {new Date(appointment.doctor_diagnosis.submitted_at).toLocaleString()}
                            </div>
                        )}
                    </div>

                    {/* Display Saved Diagnosis if it exists */}
                    {appointment.doctor_diagnosis && (
                        <div className="mb-8 bg-white p-6 rounded-lg border border-green-200 shadow-sm">
                            <h4 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Saved Clinical Notes:</h4>
                            <div className="text-gray-800 whitespace-pre-wrap leading-relaxed mb-6" style={{ fontSize: '16px' }}>
                                {appointment.doctor_diagnosis.text || "No clinical notes provided."}
                            </div>
                            
                                    {appointment.doctor_diagnosis.files && appointment.doctor_diagnosis.files.length > 0 && (
                                        <div>
                                            <h4 className="text-base font-bold text-gray-800 mb-3">Saved Supporting Documents:</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {appointment.doctor_diagnosis.files.map((file, idx) => (
                                                    <div key={idx} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                                                        <div className="flex items-center space-x-3 overflow-hidden">
                                                            <FileText className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                                                            <span className="text-sm text-gray-800 truncate font-medium" title={file.name}>
                                                                {file.name}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <a
                                                                href={file.uri}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-indigo-600 hover:text-indigo-800 p-2 hover:bg-indigo-50 rounded transition-colors"
                                                                title="View Document"
                                                            >
                                                                <Eye className="w-5 h-5" />
                                                            </a>
                                                            <button
                                                                onClick={async () => {
                                                                    if (confirm(`Are you sure you want to remove ${file.name}?`)) {
                                                                        const updatedFiles = appointment.doctor_diagnosis.files.filter((_, i) => i !== idx);
                                                                        try {
                                                                            const response = await apiRequest(`/appointments/${appointmentId}/doctor-diagnosis`, {
                                                                                method: 'POST',
                                                                                body: JSON.stringify({
                                                                                    diagnosis_text: appointment.doctor_diagnosis.text,
                                                                                    files: updatedFiles
                                                                                })
                                                                            });
                                                                            if (response.success) {
                                                                                setAppointment(prev => ({
                                                                                    ...prev,
                                                                                    doctor_diagnosis: {
                                                                                        ...prev.doctor_diagnosis,
                                                                                        files: updatedFiles
                                                                                    }
                                                                                }));
                                                                            }
                                                                        } catch (err) {
                                                                            alert("Failed to remove file.");
                                                                        }
                                                                    }
                                                                }}
                                                                className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded transition-colors font-bold"
                                                                title="Remove File"
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                            <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
                                <button 
                                    onClick={() => {
                                        setDoctorDiagnosisText(appointment.doctor_diagnosis.text);
                                        alert("You can now update your clinical notes below. Re-upload files if you wish to add more.");
                                    }}
                                    className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center"
                                >
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    Update Diagnosis
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Diagnosis Form */}
                    <div className="space-y-8">
                        {/* Diagnosis Text Input */}
                        <div>
                            <label htmlFor="doctor-diagnosis-text" className="block text-lg font-bold text-gray-800 mb-3">
                                {appointment.doctor_diagnosis ? "Update Clinical Notes" : "Clinical Notes"}
                            </label>
                            <textarea
                                id="doctor-diagnosis-text"
                                value={doctorDiagnosisText}
                                onChange={(e) => setDoctorDiagnosisText(e.target.value)}
                                placeholder="Enter your clinical diagnosis, observations, treatment plan, and any additional notes..."
                                className="w-full px-5 py-4 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-y min-h-[200px] leading-relaxed"
                                rows={8}
                                style={{ fontSize: '16px', lineHeight: '1.6' }}
                            />
                            <p className="text-sm text-gray-600 mt-2">
                                Include your clinical assessment, differential diagnosis, treatment recommendations, and follow-up plans.
                            </p>
                        </div>

                        {/* Diagnosis File Upload */}
                        <div>
                            <label className="block text-lg font-bold text-gray-800 mb-3">
                                {appointment.doctor_diagnosis ? "Add More Supporting Documents" : "Supporting Documents"}
                            </label>
                            <p className="text-base text-gray-700 mb-4">
                                Upload clinical notes, images, or other supporting documents for your diagnosis
                            </p>
                            <input
                                type="file"
                                id="doctor-diagnosis-files"
                                multiple
                                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.dicom"
                                onChange={handleDoctorDiagnosisFileUpload}
                                className="hidden"
                                disabled={uploadingDoctorDiagnosis || savingDoctorDiagnosis}
                            />
                            <label
                                htmlFor="doctor-diagnosis-files"
                                className={`btn-secondary w-full flex items-center justify-center cursor-pointer py-3 text-base font-semibold ${uploadingDoctorDiagnosis || savingDoctorDiagnosis ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {uploadingDoctorDiagnosis ? (
                                    <>
                                        <Loader className="w-5 h-5 mr-3 animate-spin" />
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-5 h-5 mr-3" />
                                        {appointment.doctor_diagnosis ? "Upload Additional Documents" : "Upload Supporting Documents"}
                                    </>
                                )}
                            </label>

                            {/* Display selected files */}
                            {doctorDiagnosisFiles.length > 0 && (
                                <div className="mt-5">
                                    <h4 className="text-base font-bold text-gray-800 mb-3">Selected for Upload:</h4>
                                    <div className="space-y-3">
                                        {doctorDiagnosisFiles.map((file, idx) => (
                                            <div key={file.id || idx} className="flex items-center justify-between bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-green-300 transition-colors">
                                                <div className="flex items-center space-x-3 overflow-hidden flex-1">
                                                    <FileText className="w-5 h-5 text-gray-500 flex-shrink-0" />
                                                    <span className="text-base text-gray-800 truncate font-medium" title={file.name}>
                                                        {file.name}
                                                    </span>
                                                </div>
                                                <div className="flex items-center space-x-3 ml-4">
                                                    <button
                                                        onClick={() => handleRemoveDoctorDiagnosisFile(file.id)}
                                                        className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded transition-colors text-xl font-bold"
                                                        title="Remove File"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Save Button */}
                        <div className="flex justify-center space-x-4 pt-6 border-t-2 border-green-200">
                            <button
                                onClick={() => {
                                    setDoctorDiagnosisText('');
                                    setDoctorDiagnosisFiles([]);
                                }}
                                className="btn-secondary px-8 py-4 text-base font-semibold rounded-xl"
                                disabled={savingDoctorDiagnosis}
                            >
                                Clear Form
                            </button>
                            <button
                                onClick={handleSaveDoctorDiagnosis}
                                disabled={savingDoctorDiagnosis || (!doctorDiagnosisText.trim() && doctorDiagnosisFiles.length === 0)}
                                className={`px-12 py-4 rounded-xl font-bold transition-all flex items-center text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 ${savingDoctorDiagnosis || (!doctorDiagnosisText.trim() && doctorDiagnosisFiles.length === 0)
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-green-600 hover:bg-green-700 text-white active:scale-95'
                                    }`}
                            >
                                {savingDoctorDiagnosis ? (
                                    <>
                                        <Loader className="w-6 h-6 mr-3 animate-spin" />
                                        Saving Diagnosis...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-6 h-6 mr-3" />
                                        {appointment.doctor_diagnosis ? "Update Saved Diagnosis" : "Submit Final Diagnosis"}
                                    </>
                                )}
                            </button>
                        </div>
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
                        <p className="text-lg font-semibold text-gray-900 capitalize">{appointment.status.split('_').join(' ')}</p>
                    </div>
                    <div className="flex space-x-3">
                        <button
                            onClick={handlePauseSession}
                            className="btn-secondary flex items-center"
                        >
                            Pause Session
                        </button>
                        <button
                            onClick={handleEndSession}
                            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors flex items-center"
                        >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            End Session
                        </button>
                    </div>
                </div>
            </div>

            {/* PDF Viewer Modal */}
            {showPdfViewer && uploadedPdfFile && (
                <PDFViewer
                    pdfFile={uploadedPdfFile}
                    pageNumber={viewerPage}
                    coordinates={viewerCoordinates}
                    onClose={() => {
                        setShowPdfViewer(false);
                        setViewerCoordinates(null);
                    }}
                />
            )}

            {/* Chat Button - Floating */}
            {appointment && (
                <ChatButton
                    appointmentId={appointmentId}
                    patientId={appointment.patientId || appointment.patient?.id || appointment.patient_id}
                    patientName={appointment.patient?.name || appointment.patientName}
                />
            )}
        </div>
    );
};

export default ActiveSession;
