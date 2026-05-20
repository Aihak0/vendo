
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAlert } from '../../pages/UiElements/Alert';
import { useEffect } from 'react';
import Spinner from '../ui/spinner/spinner';
export const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  
  if (!user && !loading) return <Navigate to="/login" replace />;
  return <Outlet />;
};

export const ProtectedRouteAdmin = () => {
  const { user, profile, loading, isLoggingOut } = useAuth();
  const alert = useAlert();

  useEffect(() => {
    if (!loading && profile && profile.role !== 'admin') {
      alert.error('Anda tidak diperbolehkan mengakses halaman ini', { title: "Denied" });
    }
  }, [loading, profile]);

  if(loading) return <Spinner/>;
  if(isLoggingOut) return <Spinner/>;
  if (!user) return <Navigate to="/login" replace />;

  if(profile?.role !== 'admin') return <Navigate to="/teknisi/dashboard" replace />
  return <Outlet />;
}

export const ProtectedRouteTeknisi = () => {
  const { user, profile, loading, isLoggingOut } = useAuth();
  const alert = useAlert();
   useEffect(() => {
    if (!loading && profile && profile.role !== 'teknisi') {
      alert.error('Anda tidak diperbolehkan mengakses halaman ini', { title: "Denied" });
    }
  }, [loading, profile]);
  if(loading) return <Spinner/>;
  if(isLoggingOut) return <Spinner/>;
  if (!user) return <Navigate to="/login" replace />;
  if( profile.role !== 'teknisi') return <Navigate to="/dashboard" replace />
  return <Outlet />;
}
