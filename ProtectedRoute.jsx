import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProtectedRoute({ children, allowRoles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (allowRoles && !allowRoles.includes(user.role)) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-800">
        You do not have permission to view this page.
      </div>
    );
  }
  return children;
}
