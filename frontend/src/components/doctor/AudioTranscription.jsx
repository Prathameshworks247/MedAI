import React, { useState } from 'react';
import { Mic, Square, Play, Download, Clock, FileText } from 'lucide-react';
import { transcriptionData, doctorNotes } from '../../data/dummyData';

const AudioTranscription = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecording, setHasRecording] = useState(true); // Set to true to show dummy data
  const [notes, setNotes] = useState(doctorNotes);

  const handleRecord = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      // Simulate starting recording
      setTimeout(() => {
        setHasRecording(true);
      }, 2000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Audio Recording & Transcription</h2>
        <p className="text-gray-600">Record patient consultations and view AI-generated transcriptions</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Audio Recorder Section */}
        <div className="card">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Mic className="w-5 h-5 mr-2 text-primary-600" />
            Audio Recorder
          </h3>

          <div className="bg-gray-50 rounded-lg p-8 mb-4">
            <div className="text-center">
              <div className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center mb-4 ${
                isRecording ? 'bg-red-100 animate-pulse' : 'bg-primary-100'
              }`}>
                {isRecording ? (
                  <Square className="w-16 h-16 text-red-600" />
                ) : (
                  <Mic className="w-16 h-16 text-primary-600" />
                )}
              </div>
              <p className="text-lg font-semibold text-gray-900 mb-2">
                {isRecording ? 'Recording in progress...' : 'Ready to record'}
              </p>
              {isRecording && (
                <p className="text-sm text-gray-600 mb-4">Duration: 00:45</p>
              )}
            </div>
          </div>

          <button
            onClick={handleRecord}
            className={`w-full py-3 rounded-lg font-semibold transition-colors ${
              isRecording
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'btn-primary'
            }`}
          >
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </button>

          {hasRecording && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-3">Recorded Audio</h4>
              <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-primary-100 p-2 rounded">
                    <Play className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{transcriptionData.audio}</p>
                    <p className="text-xs text-gray-600 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {transcriptionData.duration} • {transcriptionData.timestamp}
                    </p>
                  </div>
                </div>
                <button className="text-primary-600 hover:text-primary-700">
                  <Download className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Doctor's Notes Section */}
        <div className="card">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-primary-600" />
            Doctor's Notes
          </h3>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="input-field h-80 resize-none font-mono text-sm"
            placeholder="Add your observations, physical examination notes, and clinical impressions here..."
          />
          <div className="mt-4 flex space-x-3">
            <button className="btn-primary flex-1">Save Notes</button>
            <button className="btn-secondary">Clear</button>
          </div>
        </div>
      </div>

      {/* Transcription Section */}
      {hasRecording && (
        <div className="card mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-primary-600" />
              AI-Generated Transcription
            </h3>
            <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold">
              Completed
            </span>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Transcribed on {transcriptionData.timestamp}
              </p>
              <button className="text-primary-600 hover:text-primary-700 text-sm font-semibold flex items-center">
                <Download className="w-4 h-4 mr-1" />
                Export
              </button>
            </div>
            <div className="bg-white rounded-lg p-4 max-h-96 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans leading-relaxed">
                {transcriptionData.transcription}
              </pre>
            </div>
          </div>

          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>💡 Tip:</strong> This transcription was automatically generated using AI speech-to-text technology. 
              Review for accuracy before including in the clinical report.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioTranscription;

