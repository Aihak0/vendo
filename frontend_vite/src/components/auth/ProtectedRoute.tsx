
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAlert } from '../../pages/UiElements/Alert';
import { useEffect, useState } from 'react';
import Spinner from '../ui/spinner/spinner';
import ChangePassword from '../../pages/Teknisi/ChangePassowrd';
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
  const [showForceChangePassword, setShowForceChangePassword] = useState(false);
  const alert = useAlert();
  useEffect(() => {
    // 1. Pengecekan Hak Akses/Role
    if (!loading && profile && profile.role !== 'teknisi') {
      alert.error('Anda tidak diperbolehkan mengakses halaman ini', { title: "Denied" });
    }
    
    // 2. Sinkronisasi Modal Ganti Password (DIPERBAIKI)
    if (!loading && profile) {
      // Ini akan otomatis menjadi true jika password default, 
      // dan otomatis menjadi false jika password sudah diubah (setelah refreshProfile)
      setShowForceChangePassword(!!profile.is_default_password);
      
      console.log("Status is_default_password terbaru:", profile.is_default_password);
    }
  }, [loading, profile]);
  if(loading) return <Spinner/>;
  if(isLoggingOut) return <Spinner/>;
  if (!user) return <Navigate to="/login" replace />;
  if( profile.role !== 'teknisi') return <Navigate to="/dashboard" replace />
  return (
    <>
      <Outlet />
      
      {/* Modal ini akan mengambang di atas halaman teknisi manapun */}
      <ChangePassword 
        isOpen={showForceChangePassword} 
      
      />
    </>
  );
}
