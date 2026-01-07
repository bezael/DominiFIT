import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useMembership } from "@/hooks/use-membership";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /**
   * Si es true, requiere membresía activa además de autenticación
   * @default false
   */
  requireMembership?: boolean;
  /**
   * Ruta a la que redirigir si no tiene membresía
   * @default "/paywall"
   */
  membershipRedirectTo?: string;
}

export const ProtectedRoute = ({ 
  children, 
  requireMembership = false,
  membershipRedirectTo = "/paywall"
}: ProtectedRouteProps) => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { hasActiveMembership, loading: membershipLoading } = useMembership();

  const loading = authLoading || (requireMembership && membershipLoading);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // Si requiere membresía y no la tiene, redirigir al paywall
  if (requireMembership && !hasActiveMembership) {
    return <Navigate to={membershipRedirectTo} replace />;
  }

  return <>{children}</>;
};
