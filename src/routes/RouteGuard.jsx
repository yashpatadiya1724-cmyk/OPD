import React from 'react';
import { canAccessRoute } from './routeConfig.js';
import AccessDeniedView from './AccessDeniedView.jsx';
import LoginPage from '../components/LoginPage.jsx';

/**
 * RouteGuard Component
 * Enforces Role-Based Access Control (RBAC) and authentication checks before
 * granting access to privileged clinical or administrative views.
 */
export default function RouteGuard({ 
  route, 
  currentUser, 
  onLoginSuccess,
  onNavigateHome,
  children 
}) {
  if (!route) {
    return <>{children}</>;
  }

  // 1. Check if public route (e.g. TV display, Project overview, Hospital directory)
  if (!route.authRequired) {
    return <>{children}</>;
  }

  // 2. Check if user is authenticated
  if (!currentUser) {
    return <LoginPage onLoginSuccess={onLoginSuccess} />;
  }

  // 3. Check role permission
  const userRole = (currentUser.role || 'patient').toLowerCase();
  const hasPermission = canAccessRoute(route.id, userRole);

  if (!hasPermission) {
    return (
      <AccessDeniedView 
        attemptedRoute={route}
        userRole={userRole}
        onNavigateHome={onNavigateHome}
      />
    );
  }

  return <>{children}</>;
}
