import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const sessionStr = localStorage.getItem('admin-session');
  
  if (!sessionStr) {
    return <Navigate to="/login" replace />;
  }

  try {
    const session = JSON.parse(sessionStr);
    if (!session || !session.token) {
      return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(session.systemRole)) {
      return <Navigate to="/dashboard" replace />;
    }
  } catch (err) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
