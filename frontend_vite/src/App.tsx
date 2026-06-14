import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Home from "./pages/Dashboard/Home";
import { AppSidebar } from "./layout/AppSidebar"; 
import { Header } from "./layout/AppHeader"; 
import SignInForm from "./components/auth/SignInForm";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute, ProtectedRouteAdmin, ProtectedRouteTeknisi } from "./components/auth/ProtectedRoute";
import ProductPage from "./pages/Dashboard/Produk/Produk";
import MesinPage from "./pages/Dashboard/Mesin/MesinPage";
import LandingPage from "./pages/LandingPage";
import NotFound from "./NotFound";
import UserPage from "./pages/Dashboard/User/UserPage";
import TransaksiPage from "./pages/Dashboard/Transaksi/Page";
import PergerakanStockPage from "./pages/Dashboard/PergerakanStock/Page";
import PageDashboardTeknisi from "./pages/Teknisi/Dashboard/Page";
import TaskManagementPage from "./pages/Dashboard/Task/Page";
import TaskPage from "./pages/Teknisi/Task/Page";
import ProfilePage from "./pages/ProfilePage";

function AppContent() {
  const location = useLocation();
  const validPaths = ['/', '/login', '/dashboard', '/produk', '/mesin', '/user', '/transaksi', '/pergerakan-stock', '/task','/teknisi/dashboard', '/teknisi/task', '/profile'];
  const isLoginPage = location.pathname === '/login';
  const isLandingPage = location.pathname === '/';
  const isNotFound = !validPaths.includes(location.pathname);

  if (isLoginPage) {
    return (
      <div className="flex items-center h-screen bg-blue-50 dark:bg-slate-900">
       
        <Routes>
          <Route path="/login" element={<SignInForm />} />
        </Routes>
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
    <div className="min-h-screen bg-blue-50 dark:bg-slate-900">
      <Header />
      <div className="flex">
        <AppSidebar />
        <main className="flex-1 lg:ml-[72px] transition-all duration-300 pt-[64px]">
          <div className="p-6">
            <Routes>
            
              <Route element={<ProtectedRoute/>}>
                  <Route path="/profile" element={<ProfilePage />} />
                <Route element={<ProtectedRouteAdmin/>}>
                  <Route path="/dashboard" element={<Home />} />
                  <Route path="/produk" element={<ProductPage />} />
                  <Route path="/mesin" element={<MesinPage />} />
                  <Route path="/user" element={<UserPage />} />
                  <Route path="/task" element={<TaskManagementPage />} />
                  <Route path="/transaksi" element={<TransaksiPage />} />
                  <Route path="/pergerakan-stock" element={<PergerakanStockPage />} />
                </Route>
                <Route element={<ProtectedRouteTeknisi />}>
                  <Route path="/teknisi/dashboard" element={<PageDashboardTeknisi />} />
                  <Route path="/teknisi/task" element={<TaskPage />} />
                </Route>
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