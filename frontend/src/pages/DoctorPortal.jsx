import React, { useState } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { Stethoscope, Home, Users, LogOut } from 'lucide-react';
import DoctorDashboard from '../components/doctor/DoctorDashboard';
import PatientsPage from '../components/doctor/PatientsPage';
import ActiveSession from '../components/doctor/ActiveSession';
import ChatWithAI from '../components/doctor/ChatWithAI';

const DoctorPortal = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/doctor', icon: Home, label: 'Dashboard', exact: true },
    { path: '/doctor/patients', icon: Users, label: 'Patients', exact: false },
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
              <div className="bg-primary-600 p-2 rounded-lg">
                <Stethoscope className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Doctor Portal</h1>
                <p className="text-sm text-gray-600">Dr. Priya Mehta, MD</p>
              </div>
            </div>
            <button 
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">Exit Portal</span>
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
                    ? 'bg-primary-100 text-primary-700 font-semibold'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-sm">{item.label}</span>
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <Routes>
            <Route index element={<DoctorDashboard />} />
            <Route path="patients" element={<PatientsPage />} />
            <Route path="session/:appointmentId" element={<ActiveSession />} />
            <Route path="chat/:appointmentId" element={<ChatWithAI />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default DoctorPortal;

