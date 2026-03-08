import React from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[]; // roles permitidos, opcional
}

export default function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const authState = useSelector((state: any) => state.auth);
  const { isAuthenticated, loading, currentUser } = authState;

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si se especifican roles, verifica que el usuario tenga uno permitido
  if (roles && (!currentUser || !roles.includes(currentUser.rol.toString()))) {
    return <Navigate to="/caja" replace />;
  }

  return <>{children}</>;
}
