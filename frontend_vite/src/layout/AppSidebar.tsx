import { useState } from "react";
import { Link } from "react-router-dom";
import { LayoutDashboard, Settings, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from 'react-router-dom';

export function AppSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handlelogout = async () => {
    await logout();
    navigate("/login");
  }

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden"
          />
        )}

      <aside
        onMouseEnter={()=> setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className={`
         fixed inset-y-0 left-0 z-40 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300
          bg-white shadow-lg flex flex-col dark:bg-zinc-800
          transition-all duration-400 ease-in-out
          ${isOpen ? 'w-64' : 'w-16 lg:w-19'}
          lg:translate-x-0
        `}
        style={{ top: '64px' }}
      >
        {/* Header */}
        <div className="h-16 flex items-center px-4">
          <a href="#" className="">
              <span className="sr-only">Your Company</span>
              <img src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=500" alt="" className="h-8 w-auto" />
          </a>

        </div>
        <hr className="mx-4 my-0 border-gray-300" />

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-1.5">
          <NavItem 
            href={`/`}
            icon={<LayoutDashboard size={22} />} 
            label="Dashboard" 
            isOpen={isOpen} 
          />
          <NavItem 
            href={`/produk`}
            icon={<LayoutDashboard size={22} />} 
            label="Produk" 
            isOpen={isOpen} 
          />
          <NavItem 
            href={`/mesin`}
            icon={<LayoutDashboard size={22} />} 
            label="Mesin" 
            isOpen={isOpen} 
          />
          <NavItem 
            href={`/user`}
            icon={<LayoutDashboard size={22} />} 
            label="User" 
            isOpen={isOpen} 
          />
          <NavItem 
            href={`/transaksi`}
            icon={<LayoutDashboard size={22} />} 
            label="Transaksi" 
            isOpen={isOpen} 
          />
          <NavItem 
            href={`/pergerakan-stock`}
            icon={<LayoutDashboard size={22} />} 
            label="Pergerakan Stock" 
            isOpen={isOpen} 
          />
         
        </nav>
           <hr className="mx-4 my-0 border-gray-300" />
        {/* Bottom actions */}
        <div className="p-3 space-y-1.5">
          <NavItem 
            href="#" 
            icon={<Settings size={22} />} 
            label="Pengaturan" 
            isOpen={isOpen} 
          />
          <button  
          onClick={handlelogout}
          className={`w-full
            group flex items-center rounded-lg px-3 py-3 transition-all duration-300 text-red-600 hover:bg-red-50/80
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
  color = " hover:bg-gray-100/80 dark:hover:bg-zinc-700",

}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  isOpen: boolean;
  color?: string;
}) {
  return (
    <Link
      to={href}
      className={`
        group flex items-center rounded-lg px-3 py-3 transition-all duration-300 
        ${color}
        ${isOpen ? 'justify-start gap-3' : ''}
      `}
      title={!isOpen ? label : undefined}   // tooltip saat collapsed
    >
      {/* Icon - selalu ada, sedikit membesar saat collapsed */}
      <span 
        className={`
          flex-shrink-0 transition-all duration-100
          ${isOpen ? 'text-90' : 'text-sm scale-110'}
        `}
      >
        {icon}
      </span>

      {/* Teks dengan animasi menyusut: Dashboard → Dash → hilang */}
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
        {isOpen ? label : ""}
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