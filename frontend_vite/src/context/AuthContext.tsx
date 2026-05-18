import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { createClient, type User } from '@supabase/supabase-js';
import { useAlert } from '../pages/UiElements/Alert';

// Ganti dengan URL dan Key milikmu
const supabase = createClient('https://gqqghwfjsokyqjxztxwk.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxcWdod2Zqc29reXFqeHp0eHdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzMzEzNzgsImV4cCI6MjA4NzkwNzM3OH0.tCPMutwRd3vRDxE5q6pSj38MEXbQnkLYO0QiHzGk9J4');

// 1. Definisikan tipe untuk isi Context
interface AuthContextType {
  user: User | null;
  loading: boolean;
  profile: any | null;
  isLoggingOut: boolean;
  login: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 2. Berikan tipe ReactNode untuk 'children'
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // 3. Berikan tipe eksplisit <User | null> pada useState
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      const savedProfile = localStorage.getItem('user_profile');
      return savedProfile ? JSON.parse(savedProfile) : null;
    }
    return null;
  });
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const alert = useAlert();
  const fetchProfile = async (userId: string) => {
    
    const { data, error } = await supabase
      .from('user_profiles') // Pastikan nama tabel sesuai
      .select('*') // Kolom yang ingin diambil
      .eq('user_id', userId) // Pastikan kolom Foreign Key di tabel profile benar
      .single();

    if (!error) {
      setProfile(data);
      localStorage.setItem('user_profile', JSON.stringify(data));
    }

  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };


  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      // 1. Ambil sesi dari storage (sangat cepat karena biasanya sinkron di SDK)
      const { data: { session } } = await supabase.auth.getSession();

      if (mounted) {
        if (session?.user) {
          setUser(session.user);
          if (!profile) {
            await fetchProfile(session.user.id);
          }
        }
        setLoading(false); // Selesaikan loading hanya setelah pengecekan awal
      }

      // 2. Pasang listener untuk perubahan status (login/logout/token refresh)
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          setUser(session.user);
          if (!profile) {
              await fetchProfile(session.user.id);
            }
        } else {
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      });

      return subscription;
    };

    const authSubscription = initializeAuth();

    return () => {
      mounted = false;
      authSubscription.then(sub => sub?.unsubscribe());
    };
  }, []);

  // 4. Berikan tipe string pada parameter login
  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) throw error;

    // Langsung ambil profile tepat setelah login berhasil
    if (data?.user) {
      setUser(data.user);
      // Kita panggil fetchProfile secara manual di sini agar 
      // halaman login bisa menunggu (await) sampai profile benar-benar ada
      await fetchProfile(data.user.id);
    }
    
    return data;
  };
  const logout = async () => {
    setIsLoggingOut(true); // Mulai loading
    
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      localStorage.removeItem('user_profile');
      alert.success('Anda telah berhasil keluar'); 
    } catch (error: any) {
      alert.error('Gagal logout: ' + error.message);
    } finally {
      setIsLoggingOut(false);
    }
  };

  
// if (loading) return <div>Memuat Sesi...</div>;
return (
  <AuthContext.Provider value={{ user, login, logout, loading, profile, isLoggingOut, refreshProfile }}>
    {children}
  </AuthContext.Provider>
);
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};