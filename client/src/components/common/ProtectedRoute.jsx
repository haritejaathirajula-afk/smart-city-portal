import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert } from 'lucide-react';
import Button from '../ui/Button';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-civic-600 mb-4" />
        <p className="text-sm text-slate-500">Verifying municipal authorization...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0) {
    const userRole = (user?.role || '').toLowerCase();
    const isAllowed = allowedRoles.some((r) => r.toLowerCase() === userRole);

    if (!isAllowed) {
      return (
        <div className="max-w-md mx-auto px-4 py-16 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Access Restricted</h2>
          <p className="text-sm text-slate-600 mb-6">
            Your current role (<strong className="capitalize">{user?.role}</strong>) does not have clearance to access this administrative portal.
          </p>
          <Button onClick={() => window.history.back()} variant="outline">
            Go Back
          </Button>
        </div>
      );
    }
  }

  return children;
}
