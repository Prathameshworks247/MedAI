import React, { useState } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { Stethoscope, Home, Users, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import DarkModeToggle from '../components/DarkModeToggle';
import DoctorDashboard from '../components/doctor/DoctorDashboard';
import PatientsPage from '../components/doctor/PatientsPage';
import ActiveSession from '../components/doctor/ActiveSession';

const DoctorPortal = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();

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
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
            {/* Top Navigation */}
            <header className="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20 backdrop-blur-sm bg-opacity-95 dark:bg-opacity-95">
                <div className="px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="bg-gradient-to-br from-primary-600 to-primary-700 p-2.5 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-200">
                                <Stethoscope className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 dark:from-primary-400 dark:to-primary-600 bg-clip-text text-transparent">Doctor Portal</h1>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{user?.full_name || 'Doctor'}</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <DarkModeToggle />
                            <button
                                onClick={() => {
                                    logout();
                                    navigate('/');
                                }}
                                className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 hover:shadow-md"
                            >
                                <LogOut className="w-5 h-5" />
                                <span className="hidden sm:inline font-medium">Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex">
                {/* Sidebar Navigation */}
                <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 min-h-[calc(100vh-73px)] sticky top-[73px] shadow-lg transition-colors duration-200">
                    <nav className="p-4 space-y-2">
                        {navItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive(item.path, item.exact)
                                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:shadow-sm'
                                    }`}
                            >
                                <item.icon className={`w-5 h-5 transition-transform duration-200 ${isActive(item.path, item.exact) ? 'scale-110' : 'group-hover:scale-110'}`} />
                                <span className="text-sm font-medium">{item.label}</span>
                            </Link>
                        ))}
                    </nav>

                    {/* Sidebar Footer */}
                    <div className="absolute bottom-4 left-4 right-4 p-4 bg-gradient-to-br from-primary-50 to-blue-50 dark:from-gray-700 dark:to-gray-600 rounded-xl border border-primary-100 dark:border-gray-600">
                        <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">MediPortal v1.0</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Healthcare Management</p>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-6 bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
                    <Routes>
                        <Route index element={<DoctorDashboard />} />
                        <Route path="patients" element={<PatientsPage />} />
                        <Route path="session/:appointmentId" element={<ActiveSession />} />
                    </Routes>
                </main>
            </div>
        </div>
    );
};

export default DoctorPortal;

