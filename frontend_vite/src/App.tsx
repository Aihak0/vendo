import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Home from "./pages/Dashboard/Home";
import { AppSidebar } from "./layout/AppSidebar"; 
import { Header } from "./layout/AppHeader"; 
import SignInForm from "./components/auth/SignInForm";
import { DiscAlbum } from "lucide-react";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import ProductPage from "./pages/Dashboard/Produk/Produk";
import MesinPage from "./pages/Dashboard/Mesin/MesinPage";
import LandingPage from "./pages/LandingPage";
import NotFound from "./NotFound";

function AppContent() {
  const location = useLocation();
  const validPaths = ['/', '/login', '/dashboard', '/produk', '/mesin'];
  const isLoginPage = location.pathname === '/login';
  const isLandingPage = location.pathname === '/';
  const isNotFound = !validPaths.includes(location.pathname);

  if (isLoginPage) {
    return (
      <div className="flex items-center h-screen">
        <div className="bg-zinc-100 mx-auto p-10 rounded-lg">
        <Routes>
          <Route path="/login" element={<SignInForm />} />
        </Routes>
        </div>
      </div>
    );
  }

  if (isLandingPage){
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
      </Routes>
    );
  }

  if (isNotFound) {
    return (
      <Routes>
        <Route path="*" element={<NotFound/>}/>
      </Routes>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header />
      <div className="flex">
        <AppSidebar />
        <main className="flex-1 lg:ml-[90px] transition-all duration-300 pt-[64px]">
          <div className="p-6">
            <Routes>
            
              <Route element={<ProtectedRoute/>}>
                <Route path="/dashboard" element={<Home />} />
                <Route path="/produk" element={<ProductPage />} />
                <Route path="/mesin" element={<MesinPage />} />
              </Route>
              
             
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}

// 2. Export App yang membungkus AppContent dengan BrowserRouter
export default function App() {
  return (
    <AuthProvider>
      <div className="bg-gray-200">
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
      </div>
    </AuthProvider>
  );
}