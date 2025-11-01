import React, { useState } from 'react';
import { FileText, Download, Printer, Send, Sparkles, Eye } from 'lucide-react';
import { clinicalReport } from '../../data/dummyData';

const ClinicalReport = () => {
  const [report, setReport] = useState(clinicalReport);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  const handleGenerate = () => {
    setIsGenerating(true);
    // Simulate AI generation
    setTimeout(() => {
      setIsGenerating(false);
    }, 2000);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Clinical Report</h2>
        <p className="text-gray-600">AI-generated structured clinical documentation</p>
      </div>

      {/* Action Buttons */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="btn-primary flex items-center"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {isGenerating ? 'Generating...' : 'Regenerate with AI'}
          </button>
          <button className="btn-secondary flex items-center">
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </button>
          <button className="btn-secondary flex items-center">
            <Printer className="w-4 h-4 mr-2" />
            Print
          </button>
          <button className="btn-secondary flex items-center">
            <Send className="w-4 h-4 mr-2" />
            Send to Patient
          </button>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="btn-secondary flex items-center ml-auto"
          >
            <Eye className="w-4 h-4 mr-2" />
            {showPreview ? 'Edit Mode' : 'Preview Mode'}
          </button>
        </div>
      </div>

      {/* Report Editor/Preview */}
      <div className="card">
        {showPreview ? (
          /* Preview Mode */
          <div className="bg-white">
            <div className="border-b border-gray-200 pb-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Clinical Report</h3>
                  <p className="text-sm text-gray-600 mt-1">Generated using AI from consultation data</p>
                </div>
                <div className="text-right">
                  <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                    Finalized
                  </span>
                </div>
              </div>
            </div>

            <div className="prose max-w-none">
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans leading-relaxed">
                  {report}
                </pre>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ Note:</strong> This report was generated using AI based on transcribed consultation, 
                doctor's notes, and patient history. Please review all information for accuracy before finalizing.
              </p>
            </div>
          </div>
        ) : (
          /* Edit Mode */
          <div>
            <div className="mb-4">
              <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-primary-600" />
                Edit Clinical Report
              </h3>
              <p className="text-sm text-gray-600">Make any necessary adjustments to the AI-generated report</p>
            </div>
            <textarea
              value={report}
              onChange={(e) => setReport(e.target.value)}
              className="input-field h-[600px] resize-none font-mono text-sm"
              placeholder="Clinical report will appear here..."
            />
            <div className="mt-4 flex space-x-3">
              <button className="btn-primary flex-1">Save Changes</button>
              <button className="btn-secondary">Reset to Original</button>
            </div>
          </div>
        )}
      </div>

      {/* Report Sections Info */}
      <div className="grid md:grid-cols-3 gap-4 mt-6">
        <div className="card bg-blue-50 border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-2">Data Sources</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✓ Audio transcription</li>
            <li>✓ Doctor's notes</li>
            <li>✓ Patient history</li>
            <li>✓ Vital signs</li>
          </ul>
        </div>
        <div className="card bg-green-50 border-green-200">
          <h4 className="font-semibold text-green-900 mb-2">AI Features</h4>
          <ul className="text-sm text-green-800 space-y-1">
            <li>✓ Structured formatting</li>
            <li>✓ Medical terminology</li>
            <li>✓ ICD-10 coding</li>
            <li>✓ Treatment suggestions</li>
          </ul>
        </div>
        <div className="card bg-purple-50 border-purple-200">
          <h4 className="font-semibold text-purple-900 mb-2">Export Options</h4>
          <ul className="text-sm text-purple-800 space-y-1">
            <li>✓ PDF format</li>
            <li>✓ Direct printing</li>
            <li>✓ Email to patient</li>
            <li>✓ EHR integration</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ClinicalReport;

