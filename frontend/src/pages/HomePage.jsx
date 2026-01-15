import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, Users, Heart, Activity, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const HomePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-primary-600 p-2 rounded-lg">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">MediPortal</h1>
                <p className="text-sm text-gray-600">Healthcare Management System</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {isAuthenticated() ? (
                <>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
                    <p className="text-xs text-gray-600 capitalize">{user?.role}</p>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      navigate('/');
                    }}
                    className="btn-secondary text-sm"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => navigate('/login')}
                    className="flex items-center space-x-2 btn-secondary text-sm"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Login</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-4">
            Welcome to MediPortal
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            An AI-powered healthcare platform connecting doctors and patients for better diagnosis,
            treatment, and care management.
          </p>
        </div>

        {/* Auth Section - Show if not authenticated */}
        {!isAuthenticated() && (
          <div className="text-center mb-12">
            <div className="inline-flex space-x-4">
              <button
                onClick={() => navigate('/login')}
                className="btn-primary flex items-center space-x-2 px-6 py-3"
              >
                <LogIn className="w-5 h-5" />
                <span>Login</span>
              </button>
              <div className="flex space-x-2">
                <button
                  onClick={() => navigate('/signup/doctor')}
                  className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center space-x-2"
                >
                  <UserPlus className="w-5 h-5" />
                  <span>Doctor Signup</span>
                </button>
                <button
                  onClick={() => navigate('/signup/patient')}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center space-x-2"
                >
                  <UserPlus className="w-5 h-5" />
                  <span>Patient Signup</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Portal Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Doctor Portal Card */}
          <div 
            onClick={() => {
              if (isAuthenticated() && user?.role === 'doctor') {
                navigate('/doctor');
              } else if (isAuthenticated() && user?.role !== 'doctor') {
                alert('You need to be logged in as a doctor to access this portal.');
              } else {
                navigate('/login');
              }
            }}
            className="card hover:shadow-xl transition-all duration-300 cursor-pointer group border-2 border-transparent hover:border-primary-400"
          >
            <div className="text-center">
              <div className="bg-primary-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary-200 transition-colors">
                <Stethoscope className="w-10 h-10 text-primary-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Doctor Portal</h3>
              <p className="text-gray-600 mb-6">
                Record consultations, generate reports, analyze test results, and get AI-powered diagnostic insights.
              </p>
              <div className="space-y-2 text-left bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center text-sm text-gray-700">
                  <Activity className="w-4 h-4 mr-2 text-primary-600" />
                  <span>Audio transcription & clinical reports</span>
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <Activity className="w-4 h-4 mr-2 text-primary-600" />
                  <span>Test result trends & visualization</span>
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <Activity className="w-4 h-4 mr-2 text-primary-600" />
                  <span>AI diagnostic insights</span>
                </div>
              </div>
              <button className="btn-primary w-full mt-6">
                {isAuthenticated() && user?.role === 'doctor' ? 'Enter Doctor Portal' : 'Login as Doctor'}
              </button>
            </div>
          </div>

          {/* Patient Portal Card */}
          <div 
            onClick={() => {
              if (isAuthenticated() && user?.role === 'patient') {
                navigate('/patient');
              } else if (isAuthenticated() && user?.role !== 'patient') {
                alert('You need to be logged in as a patient to access this portal.');
              } else {
                navigate('/login');
              }
            }}
            className="card hover:shadow-xl transition-all duration-300 cursor-pointer group border-2 border-transparent hover:border-green-400"
          >
            <div className="text-center">
              <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                <Users className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Patient Portal</h3>
              <p className="text-gray-600 mb-6">
                View medications, get diet recommendations, chat with AI assistant, and manage appointments.
              </p>
              <div className="space-y-2 text-left bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center text-sm text-gray-700">
                  <Activity className="w-4 h-4 mr-2 text-green-600" />
                  <span>Medication schedules & reminders</span>
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <Activity className="w-4 h-4 mr-2 text-green-600" />
                  <span>AI chatbot for quick queries</span>
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <Activity className="w-4 h-4 mr-2 text-green-600" />
                  <span>Diet plans & health notifications</span>
                </div>
              </div>
              <button className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 w-full mt-6">
                {isAuthenticated() && user?.role === 'patient' ? 'Enter Patient Portal' : 'Login as Patient'}
              </button>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-20 text-center">
          <h3 className="text-3xl font-bold text-gray-900 mb-12">Key Features</h3>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Audio Transcription</h4>
              <p className="text-sm text-gray-600">Convert doctor-patient conversations to text automatically</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Activity className="w-6 h-6 text-purple-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">AI Insights</h4>
              <p className="text-sm text-gray-600">Get diagnostic recommendations based on patient data</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Test Trends</h4>
              <p className="text-sm text-gray-600">Visualize patient test results over time with charts</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="bg-orange-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Activity className="w-6 h-6 text-orange-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Smart Chatbot</h4>
              <p className="text-sm text-gray-600">Answer patient questions about medications and care</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-600">
            © 2025 MediPortal. A prototype for healthcare innovation.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;

