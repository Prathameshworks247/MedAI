import React, { useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Upload, TrendingUp, TrendingDown, Minus, FileText, Image } from 'lucide-react';
import { testResults } from '../../data/dummyData';

const TestResults = () => {
  const [selectedTest, setSelectedTest] = useState('WBC');

  const testCategories = [
    { key: 'WBC', label: 'White Blood Cells', unit: '10³/µL', normal: '4.5-11.0', color: '#0ea5e9' },
    { key: 'RBC', label: 'Red Blood Cells', unit: '10⁶/µL', normal: '4.5-5.9', color: '#8b5cf6' },
    { key: 'HB', label: 'Hemoglobin', unit: 'g/dL', normal: '13.5-17.5', color: '#ef4444' },
    { key: 'Platelets', label: 'Platelets', unit: '10³/µL', normal: '150-400', color: '#f59e0b' },
    { key: 'Glucose', label: 'Blood Glucose', unit: 'mg/dL', normal: '70-100', color: '#10b981' },
    { key: 'Cholesterol', label: 'Total Cholesterol', unit: 'mg/dL', normal: '<200', color: '#ec4899' },
    { key: 'Triglycerides', label: 'Triglycerides', unit: 'mg/dL', normal: '<150', color: '#6366f1' },
  ];

  const getTrend = (data, key) => {
    if (data.length < 2) return 'stable';
    const latest = data[0][key];
    const previous = data[1][key];
    const change = ((latest - previous) / previous) * 100;
    
    if (Math.abs(change) < 2) return 'stable';
    return change > 0 ? 'up' : 'down';
  };

  const getTrendIcon = (trend) => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-red-600" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-green-600" />;
    return <Minus className="w-4 h-4 text-gray-600" />;
  };

  const currentTest = testCategories.find(t => t.key === selectedTest);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Test Results & Trends</h2>
        <p className="text-gray-600">Upload test results and visualize patient health trends over time</p>
      </div>

      {/* Upload Section */}
      <div className="card mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <Upload className="w-5 h-5 mr-2 text-primary-600" />
          Upload New Test Results
        </h3>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-400 transition-colors cursor-pointer">
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-700 font-semibold mb-1">Click to upload or drag and drop</p>
          <p className="text-sm text-gray-600">PDF, PNG, JPG up to 10MB</p>
          <div className="flex justify-center space-x-2 mt-4">
            <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full">Blood Reports</span>
            <span className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full">X-Rays</span>
            <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full">ECG</span>
          </div>
        </div>
      </div>

      {/* Test Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        {testCategories.map((test) => {
          const trend = getTrend(testResults, test.key);
          const latestValue = testResults[0][test.key];
          
          return (
            <div
              key={test.key}
              onClick={() => setSelectedTest(test.key)}
              className={`card cursor-pointer transition-all ${
                selectedTest === test.key
                  ? 'ring-2 ring-primary-500 bg-primary-50'
                  : 'hover:shadow-lg'
              }`}
            >
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  {getTrendIcon(trend)}
                </div>
                <p className="text-xs text-gray-600 mb-1">{test.key}</p>
                <p className="text-lg font-bold text-gray-900">{latestValue}</p>
                <p className="text-xs text-gray-500">{test.unit}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Chart */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">{currentTest.label} Trend</h3>
            <p className="text-sm text-gray-600">
              Normal range: {currentTest.normal} {currentTest.unit}
            </p>
          </div>
          <div className="flex space-x-2">
            <button className="btn-secondary text-sm">6 Months</button>
            <button className="btn-primary text-sm">1 Year</button>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={[...testResults].reverse()}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              labelFormatter={(date) => new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey={selectedTest} 
              stroke={currentTest.color} 
              strokeWidth={3}
              dot={{ r: 5 }}
              activeDot={{ r: 7 }}
              name={`${currentTest.label} (${currentTest.unit})`}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* All Tests Comparison */}
      <div className="card">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Latest Test Results Comparison</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={testResults.slice(0, 1)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
            />
            <Legend />
            <Bar dataKey="WBC" fill="#0ea5e9" name="WBC" />
            <Bar dataKey="RBC" fill="#8b5cf6" name="RBC" />
            <Bar dataKey="HB" fill="#ef4444" name="HB" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Uploads */}
      <div className="card mt-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Uploads</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex items-center space-x-3">
              <div className="bg-red-100 p-2 rounded">
                <FileText className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Complete Blood Count Report</p>
                <p className="text-xs text-gray-600">Uploaded on Oct 15, 2025</p>
              </div>
            </div>
            <button className="text-primary-600 hover:text-primary-700 text-sm font-semibold">View</button>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded">
                <Image className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">ECG Results</p>
                <p className="text-xs text-gray-600">Uploaded on Oct 14, 2025</p>
              </div>
            </div>
            <button className="text-primary-600 hover:text-primary-700 text-sm font-semibold">View</button>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 p-2 rounded">
                <FileText className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Lipid Profile</p>
                <p className="text-xs text-gray-600">Uploaded on Aug 20, 2025</p>
              </div>
            </div>
            <button className="text-primary-600 hover:text-primary-700 text-sm font-semibold">View</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestResults;

