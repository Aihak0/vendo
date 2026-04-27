import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { createClient, type User } from '@supabase/supabase-js';

// Ganti dengan URL dan Key milikmu
const supabase = createClient('https://gqqghwfjsokyqjxztxwk.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxcWdod2Zqc29reXFqeHp0eHdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzMzEzNzgsImV4cCI6MjA4NzkwNzM3OH0.tCPMutwRd3vRDxE5q6pSj38MEXbQnkLYO0QiHzGk9J4');

// 1. Definisikan tipe untuk isi Context
interface AuthContextType {
  user: User | null;
  loading: boolean;
  profile: any | null;
  login: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 2. Berikan tipe ReactNode untuk 'children'
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // 3. Berikan tipe eksplisit <User | null> pada useState
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any | null>(null);

  const fetchProfile = async (userId: string) => {
    
    const { data, error } = await supabase
      .from('user_profiles') // Pastikan nama tabel sesuai
      .select('*') // Kolom yang ingin diambil
      .eq('user_id', userId) // Pastikan kolom Foreign Key di tabel profile benar
      .single();

    if (!error) {
      setProfile(data);
    }
  };


  useEffect(() => {
    // Ambil sesi awal
    supabase.auth.getSession().then(async({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id);
        setLoading(false);
      }
      
     

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
          if (session?.user) {
            setUser(session.user);
            await fetchProfile(session.user.id);
          } else {
            setUser(null);
            setProfile(null); // Reset profile saat logout
          }
        setLoading(false);
      });

      return () => subscription.unsubscribe();
    });
  }, []);

  // 4. Berikan tipe string pada parameter login
  const login = (email: string, password: string) => 
    supabase.auth.signInWithPassword({ email, password });

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      // State 'user' akan otomatis jadi null karena onAuthStateChange
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

// if (loading) return <div>Memuat Sesi...</div>;
return (
  <AuthContext.Provider value={{ user, login, logout, loading, profile }}>
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