import {  useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight, ArrowLeftFromLine, SunMedium, Eclipse, SunMoon } from "lucide-react";

import LogoDark from "../assets/LogoDark.png";
import LogoLight from "../assets/LogoLight.png";
import { useAuth } from "../context/AuthContext";
import { useTheme } from '../context/ThemeContext';

export function Header() {
  const { theme, setThemeMode } = useTheme();
  const {profile, loading: loadingAuth} = useAuth(); 
  const location = useLocation();
  const [openDropdown, setOpenDropdown] = useState(false);

  // const [theme, setTheme] = useState(localStorage.getItem("theme") || "system");

  // useEffect(() => {
  //   const root = window.document.documentElement;

  //   const applyTheme = () => {
  //     if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
  //       root.classList.add('dark');
  //     } else {
  //       root.classList.remove('dark');
  //     }
  //   };

  //   applyTheme();
  //   console.log("theme berubah =>", theme);
  //   // Jika pilihannya 'system', kita harus dengerin perubahan sistem secara real-time
  //   if (theme === 'system') {
  //     const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  //     const handleChange = () => applyTheme();
      
  //     mediaQuery.addEventListener('change', handleChange);
  //     return () => mediaQuery.removeEventListener('change', handleChange);
  //   }

  //   localStorage.setItem('theme', theme);
  // }, [theme]);


  const pathnames = location.pathname.split("/").filter(Boolean);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-slate-950 border-b dark:border-slate-800 shadow-sm">
      <div className="mx-auto px-4 sm:px-6 lg:pr-8 max-w-full">
        <nav className="flex items-center justify-between h-16">
          {/* Kiri: Logo + Breadcrumb */}
          <div className="flex items-center gap-6">
            <Link to="/" className="-m-1.5">
              <img
                src={theme === "dark" ? LogoDark : theme === 'system' ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? LogoDark : LogoLight) : LogoLight}
                alt="Logo"
                className="h-9 w-auto"
              />
            </Link>

            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="hidden md:flex items-center space-x-2">
              <ol className="flex items-center space-x-2 text-sm font-normal">
                <li>
                  <Link
                    to="/dashboard"
                    className="text-gray-600 hover:text-indigo-600 dark:text-gray-200 dark:hover:text-indigo-400"
                  >
                    Dashboard
                  </Link>
                </li>

                {pathnames.map((value, index) => {
                  const isLast = index === pathnames.length - 1;
                  const to = "/" + pathnames.slice(0, index + 1).join("/");
                  const name = value.charAt(0).toUpperCase() + value.slice(1);

                  return (
                    <li key={to} className="flex items-center">
                      <ChevronRight className="w-4 h-4 mx-1 text-gray-400" />
                      {isLast ? (
                        <span className="text-gray-900 dark:text-gray-100 font-medium">{name}</span>
                      ) : (
                        <Link
                          to={ to }
                          className="text-gray-600 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400">
                            { name }
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ol>
            </nav>
          </div>

          {loadingAuth ? <div className="py-4 px-15 bg-blue-50 dark:bg-slate-800 rounded-xl animate-pulse"/> : (

            <div className="relative">
              <button
                type="button"
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                onClick={() => setOpenDropdown(!openDropdown)}
                onBlur={() => setTimeout(() => setOpenDropdown(false), 200)}
              >
                <span>Hai {profile?.nama || profile?.email || "anda belum login"}
                  👋
                </span>
                <svg
                  className={`h-4 w-4 transition-transform ${openDropdown ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {openDropdown && (
                <div className="absolute right-0 z-50 mt-2 w-48 rounded-md bg-white dark:bg-slate-950 border-2 border-blue-100 dark:border-blue-950">
                  <div className="py-1">
                    <div className="flex items-center gap-2 px-3">
                      <div className="h-[2px] flex-grow bg-blue-200 dark:bg-gray-600"></div>
                      <label className="text-xs font-medium text-blue-200 dark:text-gray-600">Theme</label>
                      {/* Ini garisnya */}
                      <div className="h-[2px] flex-grow w-20 bg-blue-200 dark:bg-gray-600"></div>
                    </div>

                    <button onMouseDown={() => setThemeMode("light")} className={`flex w-full items-center px-4 py-2 text-sm text-gray-700 ${ theme === "light" ? "bg-blue-50/50 dark:bg-slate-900" : "hover:bg-blue-50/50 dark:hover:bg-slate-900" } dark:text-gray-300`}>
                      <SunMedium size={16} className="mr-2" />
                      Terang
                    </button>
                    <button onMouseDown={() => setThemeMode("dark")} className={`flex w-full items-center px-4 py-2 text-sm text-gray-700 ${ theme === "dark" ? "bg-blue-50/50 dark:bg-slate-900" : "hover:bg-blue-50/50 dark:hover:bg-slate-900" } dark:text-gray-300`}>
                      <Eclipse size={16} className="mr-2" />
                      Gelap
                    </button>
                    <button onMouseDown={() => setThemeMode("system")} className={`flex w-full items-center px-4 py-2 text-sm text-gray-700 ${ theme === "system" ? "bg-blue-50/50 dark:bg-slate-900" : "hover:bg-blue-50/50 dark:hover:bg-slate-900" } dark:text-gray-300`}>
                      <SunMoon size={16} className="mr-2" />
                      Sistem
                    </button>
                    
                    <hr className="my-1 border-1 border-blue-100 dark:border-blue-950" />
                    <button className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30">
                      <ArrowLeftFromLine size={16} className="mr-2" />
                      Keluar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          {/* Kanan: User menu */}
        </nav>
      </div>
    </header>
  );
}