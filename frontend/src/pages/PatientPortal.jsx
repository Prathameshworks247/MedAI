import React from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { Heart, Pill, MessageCircle, Apple, Bell, Home, LogOut, User, Calendar } from 'lucide-react';
import PatientDashboard from '../components/patient/PatientDashboard';
import MyAppointments from '../components/patient/MyAppointments';
import Medications from '../components/patient/Medications';
import Chatbot from '../components/patient/Chatbot';
import DietPlan from '../components/patient/DietPlan';
import Notifications from '../components/patient/Notifications';

const PatientPortal = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/patient', icon: Home, label: 'Dashboard', exact: true },
    { path: '/patient/appointments', icon: Calendar, label: 'My Appointments' },
    { path: '/patient/medications', icon: Pill, label: 'Medications' },
    { path: '/patient/chatbot', icon: MessageCircle, label: 'Health Assistant' },
    { path: '/patient/notifications', icon: Bell, label: 'Notifications' },
  ];

  const isActive = (path, exact) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-green-600 p-2 rounded-lg">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Patient Portal</h1>
                <p className="text-sm text-gray-600">Rajesh Sharma</p>
              </div>
            </div>
            <button 
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-73px)] sticky top-[73px]">
          <nav className="p-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive(item.path, item.exact)
                    ? 'bg-green-100 text-green-700 font-semibold'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-sm">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Quick Info */}
          <div className="p-4 mt-6">
            <div className="card bg-green-50 border-green-200">
              <div className="flex items-center space-x-2 mb-2">
                <User className="w-4 h-4 text-green-600" />
                <p className="text-xs font-semibold text-green-900">Your Doctor</p>
              </div>
              <p className="text-sm font-bold text-green-900">Dr. Priya Mehta</p>
              <p className="text-xs text-green-700">Cardiology</p>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <Routes>
            <Route index element={<PatientDashboard />} />
            <Route path="appointments" element={<MyAppointments />} />
            <Route path="medications" element={<Medications />} />
            <Route path="chatbot" element={<Chatbot />} />
            <Route path="diet" element={<DietPlan />} />
            <Route path="notifications" element={<Notifications />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default PatientPortal;

