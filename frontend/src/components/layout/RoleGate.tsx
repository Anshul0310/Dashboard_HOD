import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../lib/store';
import type { UserRole } from '../../lib/types';

interface RoleGateProps {
  /** Which roles can see this content */
  allowedRoles: UserRole[];
  /** Content to render if role is allowed */
  children: ReactNode;
  /** Where to redirect if role is not allowed (default: /overview) */
  redirectTo?: string;
}

/**
 * Conditionally renders children based on the current user role.
 * Redirects to another route if the current role is not in the allowedRoles list.
 */
export function RoleGate({ allowedRoles, children, redirectTo = '/overview' }: RoleGateProps) {
  const role = useAuthStore((s) => s.role);

  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
