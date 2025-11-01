import React from 'react';
import { Link } from 'react-router-dom';
import { Pill, MessageCircle, Apple, Bell, Calendar, Activity, AlertCircle } from 'lucide-react';
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
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {patientInfo.name.split(' ')[0]}!</h2>
        <p className="text-gray-600">Here's your health overview for today</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 mb-1">Today's Medications</p>
              <p className="text-3xl font-bold text-blue-900">{medications.length}</p>
            </div>
            <div className="bg-blue-600 p-3 rounded-lg">
              <Pill className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 mb-1">Next Appointment</p>
              <p className="text-lg font-bold text-green-900">Nov 8</p>
            </div>
            <div className="bg-green-600 p-3 rounded-lg">
              <Calendar className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-700 mb-1">Health Score</p>
              <p className="text-3xl font-bold text-purple-900">85%</p>
            </div>
            <div className="bg-purple-600 p-3 rounded-lg">
              <Activity className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-700 mb-1">Notifications</p>
              <p className="text-3xl font-bold text-orange-900">{unreadNotifications}</p>
            </div>
            <div className="bg-orange-600 p-3 rounded-lg">
              <Bell className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Important Alert */}
      <div className="card mb-8 bg-red-50 border-2 border-red-300">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-bold text-red-900 mb-1">Important Reminder</h3>
            <p className="text-red-800 mb-3">
              Don't forget to take your evening medications at 6:00 PM today. 
              Your next appointment with Dr. Priya Mehta is on November 8, 2025 at 10:00 AM.
            </p>
            <Link to="/patient/medications" className="text-red-700 font-semibold hover:text-red-900 text-sm">
              View Medication Schedule →
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Link to="/patient/medications" className="card hover:shadow-xl transition-all group">
          <div className="flex items-start space-x-4">
            <div className="bg-blue-600 p-3 rounded-lg">
              <Pill className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                View My Medications
              </h3>
              <p className="text-sm text-gray-600">Check your medication schedule and instructions</p>
            </div>
          </div>
        </Link>

        <Link to="/patient/chatbot" className="card hover:shadow-xl transition-all group">
          <div className="flex items-start space-x-4">
            <div className="bg-green-600 p-3 rounded-lg">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-green-600 transition-colors">
                Ask Health Questions
              </h3>
              <p className="text-sm text-gray-600">Chat with our AI assistant for quick answers</p>
            </div>
          </div>
        </Link>

        <Link to="/patient/diet" className="card hover:shadow-xl transition-all group">
          <div className="flex items-start space-x-4">
            <div className="bg-purple-600 p-3 rounded-lg">
              <Apple className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-purple-600 transition-colors">
                My Diet Plan
              </h3>
              <p className="text-sm text-gray-600">View your personalized nutrition recommendations</p>
            </div>
          </div>
        </Link>

        <Link to="/patient/notifications" className="card hover:shadow-xl transition-all group">
          <div className="flex items-start space-x-4">
            <div className="bg-orange-600 p-3 rounded-lg relative">
              <Bell className="w-6 h-6 text-white" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadNotifications}
                </span>
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-orange-600 transition-colors">
                Notifications
              </h3>
              <p className="text-sm text-gray-600">Stay updated with your health reminders</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Today's Medications */}
      <div className="card mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">Today's Medications</h3>
          <Link to="/patient/medications" className="text-blue-600 hover:text-blue-700 text-sm font-semibold">
            View All →
          </Link>
        </div>
        <div className="space-y-3">
          {upcomingMedications.map((med) => (
            <div key={med.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded">
                  <Pill className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{med.name} {med.dosage}</p>
                  <p className="text-sm text-gray-600">{med.timing}</p>
                </div>
              </div>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-semibold">
                Mark Taken
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Health Tips */}
      <div className="card bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200">
        <div className="flex items-start space-x-3">
          <div className="bg-green-600 p-2 rounded-lg">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Today's Health Tip</h3>
            <p className="text-gray-700 leading-relaxed">
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

