import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import HomePage from './pages/HomePage';
import Login from './pages/Login';
import DoctorSignup from './pages/DoctorSignup';
import PatientSignup from './pages/PatientSignup';
import DoctorPortal from './pages/DoctorPortal';
import PatientPortal from './pages/PatientPortal';
import DiagnosisDashboard from './pages/DiagnosisDashboard';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup/doctor" element={<DoctorSignup />} />
            <Route path="/signup/patient" element={<PatientSignup />} />
            <Route
              path="/doctor/*"
              element={
                <ProtectedRoute requiredRole="doctor">
                  <DoctorPortal />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/*"
              element={
                <ProtectedRoute requiredRole="patient">
                  <PatientPortal />
                </ProtectedRoute>
              }
            />
            <Route path="/diagnosis" element={<DiagnosisDashboard />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

