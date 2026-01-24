import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, Users, Heart, Activity, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import DarkModeToggle from '../components/DarkModeToggle';

const HomePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-200">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-md border-b border-gray-100 dark:border-gray-700 sticky top-0 z-40 backdrop-blur-sm bg-white/95 dark:bg-gray-800/95 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-primary-600 to-primary-700 p-2 rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-200">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-blue-600 bg-clip-text text-transparent">MediPortal</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Healthcare Management System</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {isAuthenticated() ? (
                <>
                  <div className="text-right mr-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.full_name}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">{user?.role}</p>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      navigate('/');
                    }}
                    className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium py-2 px-5 rounded-lg transition-all duration-200 text-sm border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-md"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => navigate('/login')}
                    className="flex items-center space-x-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-medium py-2 px-5 rounded-lg transition-all duration-200 text-sm shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Login</span>
                  </button>
                </>
              )}
              <DarkModeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome to MediPortal
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            An AI-powered healthcare platform connecting doctors and patients for better diagnosis,
            treatment, and care management.
          </p>
        </div>

        {/* Auth Section - Show if not authenticated */}
        {!isAuthenticated() && (
          <div className="text-center mb-12">
            <div className="inline-flex flex-wrap justify-center gap-4">
              <button
                onClick={() => navigate('/login')}
                className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <LogIn className="w-5 h-5" />
                <span>Login</span>
              </button>
              <button
                onClick={() => navigate('/signup/doctor')}
                className="bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-700 hover:to-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1 border-2 border-primary-400"
              >
                <UserPlus className="w-5 h-5" />
                <span>Doctor Signup</span>
              </button>
              <button
                onClick={() => navigate('/signup/patient')}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1 border-2 border-green-400"
              >
                <UserPlus className="w-5 h-5" />
                <span>Patient Signup</span>
              </button>
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
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-2 border-gray-100 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-500 hover:shadow-2xl transition-all duration-300 cursor-pointer group transform hover:-translate-y-2"
          >
            <div className="text-center">
              <div className="bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:from-primary-200 group-hover:to-primary-300 dark:group-hover:from-primary-800 dark:group-hover:to-primary-700 transition-all duration-300 shadow-md group-hover:shadow-lg">
                <Stethoscope className="w-10 h-10 text-primary-600 dark:text-primary-300 group-hover:scale-110 transition-transform duration-300" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">Doctor Portal</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Record consultations, generate reports, analyze test results, and get AI-powered diagnostic insights.
              </p>
              <div className="space-y-2 text-left bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-700 dark:to-blue-900/20 p-4 rounded-lg border border-gray-100 dark:border-gray-600 group-hover:border-primary-200 dark:group-hover:border-primary-700 transition-all">
                <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                  <Activity className="w-4 h-4 mr-2 text-primary-600 dark:text-primary-400" />
                  <span>Audio transcription & clinical reports</span>
                </div>
                <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                  <Activity className="w-4 h-4 mr-2 text-primary-600 dark:text-primary-400" />
                  <span>Test result trends & visualization</span>
                </div>
                <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                  <Activity className="w-4 h-4 mr-2 text-primary-600 dark:text-primary-400" />
                  <span>AI diagnostic insights</span>
                </div>
              </div>
              <button className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 w-full mt-6 shadow-md group-hover:shadow-lg">
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
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-2 border-gray-100 dark:border-gray-700 hover:border-green-400 dark:hover:border-green-500 hover:shadow-2xl transition-all duration-300 cursor-pointer group transform hover:-translate-y-2"
          >
            <div className="text-center">
              <div className="bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:from-green-200 group-hover:to-green-300 dark:group-hover:from-green-800 dark:group-hover:to-green-700 transition-all duration-300 shadow-md group-hover:shadow-lg">
                <Users className="w-10 h-10 text-green-600 dark:text-green-300 group-hover:scale-110 transition-transform duration-300" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">Patient Portal</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                View medications, get diet recommendations, chat with AI assistant, and manage appointments.
              </p>
              <div className="space-y-2 text-left bg-gradient-to-br from-gray-50 to-green-50 dark:from-gray-700 dark:to-green-900/20 p-4 rounded-lg border border-gray-100 dark:border-gray-600 group-hover:border-green-200 dark:group-hover:border-green-700 transition-all">
                <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                  <Activity className="w-4 h-4 mr-2 text-green-600 dark:text-green-400" />
                  <span>Medication schedules & reminders</span>
                </div>
                <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                  <Activity className="w-4 h-4 mr-2 text-green-600 dark:text-green-400" />
                  <span>AI chatbot for quick queries</span>
                </div>
                <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                  <Activity className="w-4 h-4 mr-2 text-green-600 dark:text-green-400" />
                  <span>Diet plans & health notifications</span>
                </div>
              </div>
              <button className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 w-full mt-6 shadow-md group-hover:shadow-lg">
                {isAuthenticated() && user?.role === 'patient' ? 'Enter Patient Portal' : 'Login as Patient'}
              </button>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-20 text-center">
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-12">Key Features</h3>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 transition-colors duration-200">
              <div className="bg-blue-100 dark:bg-blue-900 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Activity className="w-6 h-6 text-blue-600 dark:text-blue-300" />
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Audio Transcription</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">Convert doctor-patient conversations to text automatically</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 transition-colors duration-200">
              <div className="bg-purple-100 dark:bg-purple-900 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Activity className="w-6 h-6 text-purple-600 dark:text-purple-300" />
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">AI Insights</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">Get diagnostic recommendations based on patient data</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 transition-colors duration-200">
              <div className="bg-green-100 dark:bg-green-900 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Activity className="w-6 h-6 text-green-600 dark:text-green-300" />
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Test Trends</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">Visualize patient test results over time with charts</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 transition-colors duration-200">
              <div className="bg-orange-100 dark:bg-orange-900 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Activity className="w-6 h-6 text-orange-600 dark:text-orange-300" />
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Smart Chatbot</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">Answer patient questions about medications and care</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-20 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-600 dark:text-gray-400">
            © 2025 MediPortal. A prototype for healthcare innovation.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;

