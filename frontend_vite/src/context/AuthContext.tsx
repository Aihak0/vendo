import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import axios from 'axios';
import { useAlert } from '../pages/UiElements/Alert';

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  profile: any | null;
  isLoggingOut: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = 'http://localhost:3000';
// const API_URL = '/api';
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  const [loading, setLoading] = useState(true);

  const [profile, setProfile] = useState<any>(() => {
    const saved = localStorage.getItem('user_profile');
    return saved ? JSON.parse(saved) : null;
  });

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const alert = useAlert();

  const fetchProfile = async () => {
  try {
    const token = localStorage.getItem('access_token');
    // Jika token tidak ada atau isinya aneh, stop.
    if (!token || token === 'undefined' || token === 'null') return;

    const response = await axios.get(`${API_URL}/user/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    setProfile(response.data);
    localStorage.setItem('user_profile', JSON.stringify(response.data));
  } catch (error) {
    console.error("Gagal memuat profil:", error);
    // Lempar error ke atas agar fungsi yang memanggil tahu kalau ini gagal
    throw error; 
  }
};

  const refreshProfile = async () => {
    await fetchProfile();
  };

  const getCurrentUser = async () => {
    try {
      const token = localStorage.getItem('access_token');

      // Pengaman ekstra: cek jika token kosong, string "null", atau "undefined"
      if (!token || token === 'undefined' || token === 'null') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_profile');
        setUser(null);
        setProfile(null);
        setLoading(false); // Paksa matikan loading
        return;
      }

      const response = await axios.get(`${API_URL}/user/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUser(response.data);
      await fetchProfile();
    } catch (error) {
      console.error("Error saat dapatkan user:", error);
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_profile');
      setUser(null);
      setProfile(null);
    } finally {
      // Apapun yang terjadi, sukses atau gagal, LOADING HARUS FALSE!
      setLoading(false); 
    }
  };
  useEffect(() => {
    getCurrentUser();
  }, []);

  const login = async (
    email: string,
    password: string
  ) => {
    try {
      const response = await axios.post(
        `${API_URL}/auth/login`,
        {
          email,
          password,
        }
      );

      console.log("yang mana itu ",response.data)
      const { session, user } = response.data;

      localStorage.setItem(
        'access_token',
        session.access_token
      );

      setUser(user);

      await fetchProfile();
    } catch (error: any) {
      console.log("eror mana? ", error.response.data)
      throw new Error(
        error.response?.data?.message || 'Login gagal'
      );
    }
  };

  const logout = async () => {
    setIsLoggingOut(true);

    try {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_profile');

      setUser(null);
      setProfile(null);

      alert.success('Anda telah berhasil keluar');
      console.log("iki user ta => ", user);
    } catch (error: any) {
      
      alert.error(error.message);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        loading,
        profile,
        isLoggingOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error(
      'useAuth must be used within an AuthProvider'
    );
  }

  return context;
};
