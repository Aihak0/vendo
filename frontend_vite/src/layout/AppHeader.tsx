import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight, ArrowLeftFromLine } from "lucide-react";

export function Header() {
  const location = useLocation();
  const [openDropdown, setOpenDropdown] = useState(false);

  const pathnames = location.pathname.split("/").filter(Boolean);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-zinc-900 border-b shadow-sm">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-full">
        <nav className="flex items-center justify-between h-16">
          {/* Kiri: Logo + Breadcrumb */}
          <div className="flex items-center gap-6">
            <Link to="/" className="-m-1.5 p-1.5">
              <img
                src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=500"
                alt="Logo"
                className="h-8 w-auto"
              />
            </Link>

            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="hidden md:flex items-center space-x-2">
              <ol className="flex items-center space-x-2 text-sm font-medium">
                <li>
                  <Link
                    to="/"
                    className="text-gray-600 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400"
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
                        <span className="text-gray-900 dark:text-white">{name}</span>
                      ) : (
                        <Link
                          to={to}
                          className="text-gray-600 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400"
                        >
                          {name}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ol>
            </nav>
          </div>

          {/* Kanan: User menu */}
          <div className="relative">
            <button
              type="button"
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              onClick={() => setOpenDropdown(!openDropdown)}
              onBlur={() => setTimeout(() => setOpenDropdown(false), 200)}
            >
              <span>Hai Joko</span>
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
              <div className="absolute right-0 z-50 mt-2 w-48 rounded-md bg-white dark:bg-zinc-800 shadow-lg ring-1 ring-black/5 dark:ring-white/10">
                <div className="py-1">
                  <button className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-zinc-700 dark:text-gray-300">
                    <ArrowLeftFromLine size={16} className="mr-2" />
                    Terang
                  </button>
                  <button className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-zinc-700 dark:text-gray-300">
                    <ArrowLeftFromLine size={16} className="mr-2" />
                    Gelap
                  </button>
                  <button className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-zinc-700 dark:text-gray-300">
                    <ArrowLeftFromLine size={16} className="mr-2" />
                    Sistem
                  </button>
                  <hr className="my-1 dark:border-zinc-700" />
                  <button className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30">
                    <ArrowLeftFromLine size={16} className="mr-2" />
                    Keluar
                  </button>
                </div>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}