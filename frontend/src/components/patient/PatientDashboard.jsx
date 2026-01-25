import React from 'react';
import { Link } from 'react-router-dom';
import { Pill, MessageCircle, Apple, Bell, Calendar, Activity, AlertCircle, CalendarPlus } from 'lucide-react';
import { patientInfo, medications, notifications } from '../../data/dummyData';

const PatientDashboard = () => {
  const upcomingMedications = medications.filter(med => 
    med.timing.includes('Morning') || med.timing.includes('Evening')
  ).slice(0, 3);

  const unreadNotifications = notifications.filter(n => !n.read).length;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Welcome back, {patientInfo.name.split(' ')[0]}!</h2>
        <p className="text-gray-600 dark:text-gray-400">Here's your health overview for today</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-blue-200 dark:border-blue-700 hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-1 font-medium">Today's Medications</p>
              <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{medications.length}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl shadow-lg">
              <Pill className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border-green-200 dark:border-green-700 hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 dark:text-green-300 mb-1 font-medium">Next Appointment</p>
              <p className="text-lg font-bold text-green-900 dark:text-green-100">Nov 8</p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-xl shadow-lg">
              <Calendar className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 border-purple-200 dark:border-purple-700 hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-700 dark:text-purple-300 mb-1 font-medium">Health Score</p>
              <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">85%</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-xl shadow-lg">
              <Activity className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 border-orange-200 dark:border-orange-700 hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-700 dark:text-orange-300 mb-1 font-medium">Notifications</p>
              <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">{unreadNotifications}</p>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-3 rounded-xl shadow-lg">
              <Bell className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Important Alert */}
      <div className="card mb-8 bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 hover:shadow-xl transition-all duration-200">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-bold text-red-900 dark:text-red-200 mb-1">Important Reminder</h3>
            <p className="text-red-800 dark:text-red-300 mb-3">
              Don't forget to take your evening medications at 6:00 PM today.
              Your next appointment with Dr. Priya Mehta is on November 8, 2025 at 10:00 AM.
            </p>
            <Link to="/patient/medications" className="text-red-700 dark:text-red-400 font-semibold hover:text-red-900 dark:hover:text-red-300 text-sm transition-colors">
              View Medication Schedule →
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Link to="/patient/book-appointment" className="card hover:shadow-xl transition-all duration-200 group transform hover:-translate-y-1">
          <div className="flex items-start space-x-4">
            <div className="bg-gradient-to-br from-teal-500 to-teal-600 p-3 rounded-xl shadow-md group-hover:shadow-lg transition-shadow">
              <CalendarPlus className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                Book New Appointment
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Find and book appointments with doctors near you</p>
            </div>
          </div>
        </Link>

        <Link to="/patient/medications" className="card hover:shadow-xl transition-all duration-200 group transform hover:-translate-y-1">
          <div className="flex items-start space-x-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl shadow-md group-hover:shadow-lg transition-shadow">
              <Pill className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                View My Medications
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Check your medication schedule and instructions</p>
            </div>
          </div>
        </Link>

        <Link to="/patient/chatbot" className="card hover:shadow-xl transition-all duration-200 group transform hover:-translate-y-1">
          <div className="flex items-start space-x-4">
            <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-xl shadow-md group-hover:shadow-lg transition-shadow">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                Ask Health Questions
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Chat with our AI assistant for quick answers</p>
            </div>
          </div>
        </Link>

        <Link to="/patient/diet" className="card hover:shadow-xl transition-all duration-200 group transform hover:-translate-y-1">
          <div className="flex items-start space-x-4">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-xl shadow-md group-hover:shadow-lg transition-shadow">
              <Apple className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                My Diet Plan
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">View your personalized nutrition recommendations</p>
            </div>
          </div>
        </Link>

        <Link to="/patient/notifications" className="card hover:shadow-xl transition-all duration-200 group transform hover:-translate-y-1">
          <div className="flex items-start space-x-4">
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-3 rounded-xl shadow-md group-hover:shadow-lg transition-shadow relative">
              <Bell className="w-6 h-6 text-white" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg">
                  {unreadNotifications}
                </span>
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                Notifications
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Stay updated with your health reminders</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Today's Medications */}
      <div className="card mb-8 hover:shadow-xl transition-all duration-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Today's Medications</h3>
          <Link to="/patient/medications" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-semibold transition-colors">
            View All →
          </Link>
        </div>
        <div className="space-y-3">
          {upcomingMedications.map((med) => (
            <div key={med.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 dark:bg-blue-900/40 p-2 rounded-lg">
                  <Pill className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{med.name} {med.dosage}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{med.timing}</p>
                </div>
              </div>
              <button className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all">
                Mark Taken
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Health Tips */}
      <div className="card bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-2 border-green-200 dark:border-green-700 hover:shadow-xl transition-all duration-200">
        <div className="flex items-start space-x-3">
          <div className="bg-gradient-to-br from-green-500 to-green-600 p-2 rounded-xl shadow-md">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Today's Health Tip</h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Remember to take a 30-minute walk after your evening meal. Regular physical activity helps
              manage blood pressure and improves heart health. Stay hydrated and avoid heavy meals before bedtime.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;

