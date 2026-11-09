import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import ProtectedRoute from './components/common/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import CitizenDashboard from './pages/citizen/CitizenDashboard';
import ReportComplaintPage from './pages/citizen/ReportComplaintPage';
import MyComplaintsPage from './pages/citizen/MyComplaintsPage';
import ComplaintDetailsPage from './pages/citizen/ComplaintDetailsPage';
import OfficerDashboard from './pages/officer/OfficerDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import ServicesPage from './pages/services/ServicesPage';
import AlertsPage from './pages/alerts/AlertsPage';
import FeedbackPage from './pages/feedback/FeedbackPage';
import AnalyticsPage from './pages/analytics/AnalyticsPage';
import CityMapPage from './pages/map/CityMapPage';
import ModulePlaceholder from './pages/ModulePlaceholder';
import NotFound from './pages/NotFound';

function DashboardRedirect() {
  const { user, isOfficer, isAdmin } = useAuth();
  if (isAdmin) return <Navigate to="/admin" replace />;
  if (isOfficer) return <Navigate to="/officer" replace />;
  return <Navigate to="/citizen/dashboard" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 selection:bg-civic-500 selection:text-white">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              
              {/* Grievance Tracking & Details (Public/Protected) */}
              <Route path="/complaints" element={<MyComplaintsPage />} />
              <Route path="/complaints/:idOrCode" element={<ComplaintDetailsPage />} />
              
              {/* Smart Dashboard Redirect */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <DashboardRedirect />
                  </ProtectedRoute>
                } 
              />

              {/* Citizen Dashboard (Phase 4) */}
              <Route 
                path="/citizen/dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['citizen', 'admin']}>
                    <CitizenDashboard />
                  </ProtectedRoute>
                } 
              />

              {/* Complaint Reporting (Phase 5) */}
              <Route 
                path="/report" 
                element={
                  <ProtectedRoute allowedRoles={['citizen', 'admin']}>
                    <ReportComplaintPage />
                  </ProtectedRoute>
                } 
              />
              
              {/* Officer Dashboard (Phase 7) */}
              <Route 
                path="/officer" 
                element={
                  <ProtectedRoute allowedRoles={['officer', 'admin']}>
                    <OfficerDashboard />
                  </ProtectedRoute>
                } 
              />

              {/* Municipal Service Requests (Phase 9) */}
              <Route path="/services" element={<ServicesPage />} />
              {/* Emergency Alerts & Announcements (Phase 10) */}
              <Route path="/alerts" element={<AlertsPage />} />
              {/* Citizen Feedback & Department Ratings (Phase 11) */}
              <Route path="/feedback" element={<FeedbackPage />} />
              {/* City Analytics & SLA Performance (Phase 12) */}
              <Route path="/analytics" element={<AnalyticsPage />} />
              {/* Interactive City Map & Heatmap (Phase 13) */}
              <Route path="/map" element={<CityMapPage />} />
              {/* Admin Dashboard (Phase 8) */}
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />

              {/* Protected User Profile */}
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                } 
              />
              
              {/* 404 Catch-All */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}
