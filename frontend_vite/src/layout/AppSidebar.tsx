import { useState } from "react";
import { Link } from "react-router-dom";
import { LayoutDashboard, ListCheck, LogOut, Apple, Calculator, UserRound, ArrowUp01, Receipt, List, Menu, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from 'react-router-dom';


export function AppSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { profile, loading: loadingUser, user,  logout } = useAuth();
  const navigate = useNavigate();


  const handlelogout = async () => {
    await logout();
    navigate("/login");
  }

  const pathnames = location.pathname;
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden"
          />
        )}

      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsMobileOpen(false)} // ← tambah onClick
        />
      )}

      <button
        onClick={() => setIsMobileOpen(true)}
        className="fixed bottom-5 right-5 z-50 lg:hidden flex items-center justify-center w-12 h-12 bg-indigo-600 text-white rounded-full shadow-lg"
        aria-label="Buka menu"
      >
        <Menu size={22} /> 
      </button>

      <aside
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className={`
          fixed inset-y-0 left-0 z-40
          bg-white dark:bg-slate-950
          border-r border-gray-200 dark:border-gray-700
          shadow-lg flex flex-col
          transition-all duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64'}
          lg:translate-x-0
          ${isOpen ? 'lg:w-64' : 'lg:w-18'}
        `}
        style={{ top: '64px' }}
      >

      <button
        onClick={() => setIsMobileOpen(false)}
        className={`bg-slate-200 dark:bg-slate-700 p-1.5 lg:hidden absolute top-3 -right-9 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200
          transition-opacity duration-300
          ${isMobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
        aria-label="Tutup menu"
      >
        <X size={20} />
</button>
        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-1.5">
          { loadingUser || !user ? (
          <div className="animate-pulse space-y-1.5">
            <div className="p-6 rounded-lg bg-slate-800"></div>
            <div className="p-6 rounded-lg bg-slate-800"></div>
            <div className="p-6 rounded-lg bg-slate-800"></div>
          </div>
          ):(
            profile.role === 'admin' ? (
              <>
                <NavItem 
                  href={`/dashboard`}
                  icon={<LayoutDashboard size={22} />} 
                  isActive={pathnames === "/dashboard"}
                  label="Dashboard" 
                  isOpen={isOpen} 
                  isMobileOpen={isMobileOpen}
                />
                <NavItem 
                  href={`/produk`}
                  icon={<Apple size={22} />} 
                  isActive={pathnames === "/produk"}
                  label="Produk" 
                  isOpen={isOpen} 
                  isMobileOpen={isMobileOpen}
                />
                <NavItem 
                  href={`/mesin`}
                  icon={<Calculator size={22} />} 
                  isActive={pathnames === "/mesin"}
                  label="Mesin" 
                  isOpen={isOpen}
                  isMobileOpen={isMobileOpen} 
                />
                <NavItem 
                  href={`/user`}
                  icon={<UserRound size={22} />} 
                  isActive={pathnames === "/user"}
                  label="User" 
                  isOpen={isOpen} 
                  isMobileOpen={isMobileOpen}
                />
                <NavItem 
                  href={`/task`}
                  icon={<List size={22} />} 
                  isActive={pathnames === "/task"}
                  label="Task" 
                  isOpen={isOpen} 
                  isMobileOpen={isMobileOpen}
                />
                <hr className=" my-0 border-gray-300 dark:border-gray-700 my-3" />
                <NavItem 
                  href={`/transaksi`}
                  icon={<Receipt size={22} />} 
                  isActive={pathnames === "/transaksi"}
                  label="Transaksi" 
                  isOpen={isOpen} 
                  isMobileOpen={isMobileOpen}
                />
                <NavItem 
                  href={`/pergerakan-stock`}
                  icon={<ArrowUp01 size={22} />} 
                  isActive={pathnames === "/pergerakan-stock"}
                  label="Pergerakan Stock" 
                  isOpen={isOpen} 
                  isMobileOpen={isMobileOpen}
                />
              </>
            ) : (
              <>
                <NavItem 
                  href={`/teknisi/dashboard`}
                  icon={<LayoutDashboard size={22} />} 
                  isActive={pathnames === "/teknisi/dashboard"}
                  label="Dashboard" 
                  isOpen={isOpen}
                  isMobileOpen={isMobileOpen} 
                />
                <NavItem 
                  href={`/teknisi/task`}
                  icon={<ListCheck size={22} />} 
                  isActive={pathnames === "/teknisi/task"}
                  label="Task" 
                  isOpen={isOpen} 
                  isMobileOpen={isMobileOpen}
                />
              </>
            )
          )}
         
        </nav>
        
        {/* Bottom actions */}
        <div className="p-3 space-y-1.5">
         <hr className=" my-0 border-gray-300 dark:border-gray-700 my-3" />
          {/* <NavItem 
            href="#" 
            icon={<Settings size={22} />} 
            label="Pengaturan" 
            isOpen={isOpen} 
          /> */}
          <button  
          onClick={handlelogout}
          className={`w-full
            group flex items-center rounded-lg px-3 py-3 transition-all duration-300 text-red-600 hover:bg-red-50/80 dark:hover:bg-red-950/50
            ${isOpen ? 'justify-start gap-3' : ''}
          `}>
             <span 
            className={`
              flex-shrink-0 transition-all duration-100
              ${isOpen ? 'text-90' : 'text-sm scale-110'}
            `}
          >
            <LogOut size={22}/>
          </span>
           <span 
              className={`
                font-medium whitespace-nowrap overflow-hidden transition-all duration-400 ease-in-out
                ${isOpen 
                  ? 'opacity-100 max-w-[140px] translate-x-0' 
                  : 'opacity-0 max-w-0 -translate-x-2'
                }
              `}
            >
              {/* Versi panjang → pendek (opsional) */}
              {isOpen ? "Keluar" : ""}
            </span>
          </button>
        
        </div>
      </aside>
    </>
  );
}

function NavItem({
  href,
  icon,
  label,
  isOpen,
  isMobileOpen,
  isActive = false,
  color = " hover:bg-gray-100/80 dark:hover:bg-slate-800",

}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  isOpen: boolean;
  isMobileOpen: boolean;
  isActive?: boolean;
  color?: string;
}) {
  return (
    <Link
      to={href}
      className={`
        group flex items-center rounded-lg px-3 py-3 transition-all duration-300 text-gray-700 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-300
        ${isActive ? 'bg-gray-100/80 text-indigo-600 dark:bg-slate-800 dark:text-indigo-300' : ''}
        ${ !isActive && color}
        ${isOpen || isMobileOpen ? 'justify-start gap-3' : ''}
      `}
      title={!isOpen ? label : undefined}   // tooltip saat collapsed
    >
      {/* Icon - selalu ada, sedikit membesar saat collapsed */}
      <span 
        className={`
          flex-shrink-0 transition-all duration-100
          ${isOpen || isMobileOpen ? 'text-90' : 'text-sm scale-110'}
        `}
      >
        {icon}
      </span>

      {/* Teks dengan animasi menyusut: Dashboard → Dash → hilang */}
      <span 
        className={`
          font-medium whitespace-nowrap overflow-hidden transition-all duration-400 ease-in-out
          ${isOpen || isMobileOpen
            ? 'opacity-100 max-w-[140px] translate-x-0' 
            : 'opacity-0 max-w-0 -translate-x-2'
          }
        `}
      >
        {/* Versi panjang → pendek (opsional) */}
        {isOpen || isMobileOpen ? label : ""}
      </span>
    </Link>
  );
}

export function SidebarSkeleton(){
  return (
    <aside className="hidden md:flex md:flex-col w-18 bg-zinc-900 border-r border-zinc-800 flex-shrink-0">
        <div className="p-5 border-b border-zinc-800">
          <div className="h-8 28 bg-zinc-700 rounded animate-pulse" />
        </div>
        <nav className="flex-1 px-3 py-6 space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-9 bg-zinc-800 rounded-lg animate-pulse"
            />
          ))}
        </nav>
        <div className="p-4 border-t border-zinc-800">
          <div className="h-10 bg-zinc-700 rounded-full animate-pulse" />
        </div>
      </aside>
  );
}