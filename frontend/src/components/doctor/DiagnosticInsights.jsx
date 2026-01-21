import React, { useState } from 'react';
import { Brain, AlertTriangle, CheckCircle, Info, Lightbulb, Download, RefreshCw } from 'lucide-react';
import { diagnosticInsights } from '../../data/dummyData.js';

const DiagnosticInsights = ({ data, summaryText }) => {
    //   const insightsData = data;
    const summary = summaryText;

    const [isGenerating, setIsGenerating] = useState(false);

    const handleRegenerate = () => {
        setIsGenerating(true);
        setTimeout(() => {
            setIsGenerating(false);
        }, 2000);
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'high':
                return 'bg-red-50 border-red-200 text-red-900';
            case 'moderate':
                return 'bg-yellow-50 border-yellow-200 text-yellow-900';
            case 'low':
                return 'bg-green-50 border-green-200 text-green-900';
            default:
                return 'bg-gray-50 border-gray-200 text-gray-900';
        }
    };

    const getSeverityIcon = (severity) => {
        switch (severity) {
            case 'high':
                return <AlertTriangle className="w-5 h-5 text-red-600" />;
            case 'moderate':
                return <Info className="w-5 h-5 text-yellow-600" />;
            case 'low':
                return <CheckCircle className="w-5 h-5 text-green-600" />;
            default:
                return <Info className="w-5 h-5 text-gray-600" />;
        }
    };

    const getSeverityBadge = (severity) => {
        const colors = {
            high: 'bg-red-100 text-red-700',
            moderate: 'bg-yellow-100 text-yellow-700',
            low: 'bg-green-100 text-green-700'
        };
        return (
            <span className={`text-xs px-2 py-1 rounded-full font-semibold ${colors[severity]}`}>
                {severity.toUpperCase()}
            </span>
        );
    };

    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">AI Diagnostic Insights</h2>
                <p className="text-gray-600">Comprehensive analysis based on patient data, test results, and medical history</p>
            </div>

            {/* Action Bar */}
            <div className="card mb-6 bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="bg-purple-600 p-3 rounded-lg">
                            <Brain className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">AI-Powered Analysis</h3>
                            <p className="text-sm text-gray-600">Generated from multiple data sources using GPT-4</p>
                        </div>
                    </div>
                    <div className="flex space-x-3">
                        <button
                            onClick={handleRegenerate}
                            disabled={isGenerating}
                            className="btn-secondary flex items-center"
                        >
                            <RefreshCw className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                            {isGenerating ? 'Generating...' : 'Regenerate'}
                        </button>
                        <button className="btn-primary flex items-center">
                            <Download className="w-4 h-4 mr-2" />
                            Export Report
                        </button>
                    </div>
                </div>
            </div>

            {/* Summary Section */}
            <div className="card mb-6">
                <div className="flex items-start space-x-3 mb-4">
                    <div className="bg-blue-100 p-2 rounded-lg">
                        <Lightbulb className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Executive Summary</h3>
                        <p className="text-gray-700 leading-relaxed whitespace-pre-line">{summary}</p>
                    </div>
                </div>
            </div>

            {/* Key Findings */}
            <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Key Clinical Findings</h3>
                <div className="space-y-4">
                    {diagnosticInsights.keyFindings.map((finding, index) => (
                        <div
                            key={index}
                            className={`card border-2 ${getSeverityColor(finding.severity)}`}
                        >
                            <div className="flex items-start space-x-4">
                                <div className="mt-1">
                                    {getSeverityIcon(finding.severity)}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-lg font-semibold">{finding.category}</h4>
                                        {getSeverityBadge(finding.severity)}
                                    </div>
                                    <p className="text-sm leading-relaxed">{finding.finding}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recommendations */}
            <div className="card mb-6 bg-blue-50 border-2 border-blue-200">
                <div className="flex items-start space-x-3 mb-4">
                    <div className="bg-blue-600 p-2 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Clinical Recommendations</h3>
                        <div className="space-y-3">
                            {diagnosticInsights.recommendations.map((recommendation, index) => (
                                <div key={index} className="flex items-start space-x-3">
                                    <div className="bg-blue-600 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-white text-xs font-bold">{index + 1}</span>
                                    </div>
                                    <p className="text-gray-800 leading-relaxed flex-1">{recommendation}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Differential Diagnosis */}
            <div className="card">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Differential Diagnosis</h3>
                <p className="text-sm text-gray-600 mb-4">
                    Possible diagnoses ranked by likelihood based on clinical presentation and test results:
                </p>
                <div className="space-y-3">
                    {diagnosticInsights.differentialDiagnosis.map((diagnosis, index) => (
                        <div
                            key={index}
                            className={`p-4 rounded-lg border-2 ${index === 0
                                ? 'bg-purple-50 border-purple-300'
                                : 'bg-gray-50 border-gray-200'
                                }`}
                        >
                            <div className="flex items-center space-x-3">
                                <div className={`font-bold text-lg ${index === 0 ? 'text-purple-700' : 'text-gray-600'
                                    }`}>
                                    #{index + 1}
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-gray-900">{diagnosis}</p>
                                    {index === 0 && (
                                        <p className="text-xs text-purple-700 mt-1">Primary consideration</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Data Sources */}
            <div className="grid md:grid-cols-4 gap-4 mt-6">
                <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600 mb-1">100%</div>
                        <p className="text-sm text-blue-900">Transcription</p>
                    </div>
                </div>
                <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                    <div className="text-center">
                        <div className="text-3xl font-bold text-green-600 mb-1">100%</div>
                        <p className="text-sm text-green-900">Clinical Notes</p>
                    </div>
                </div>
                <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                    <div className="text-center">
                        <div className="text-3xl font-bold text-purple-600 mb-1">5</div>
                        <p className="text-sm text-purple-900">Test Results</p>
                    </div>
                </div>
                <div className="card bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                    <div className="text-center">
                        <div className="text-3xl font-bold text-orange-600 mb-1">GPT-4</div>
                        <p className="text-sm text-orange-900">AI Model</p>
                    </div>
                </div>
            </div>

            {/* Disclaimer */}
            <div className="card mt-6 bg-yellow-50 border-2 border-yellow-300">
                <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-semibold text-yellow-900 mb-1">Medical Disclaimer</h4>
                        <p className="text-sm text-yellow-800 leading-relaxed">
                            These AI-generated insights are designed to assist clinical decision-making and should not replace
                            professional medical judgment. All recommendations should be validated against current medical guidelines
                            and patient-specific factors. Final diagnostic and treatment decisions remain the responsibility of the
                            attending physician.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DiagnosticInsights;

