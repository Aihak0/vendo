// components/CustomDropdown.tsx
import { Menu, MenuButton, MenuItem, MenuItems, Transition } from '@headlessui/react';
import React, { Fragment, useRef, type ReactNode } from 'react';
import { ChevronDown, ChevronDownIcon } from 'lucide-react'; // optional, install @heroicons/react

import { useState, useEffect } from 'react';

// Definisi tipe item (biar TypeScript senang & autocomplete bagus)
export type DropdownItem = {
  label: string;
  icon?: ReactNode;           // bisa HeroIcon atau SVG custom
  onClick?: () => void;       // fungsi custom per item
  href?: string;              // kalau mau jadi link (opsional)
  disabled?: boolean;
  danger?: boolean;           // misal buat Sign out → warna merah
};

interface CustomDropdownProps {
  label?: string;             // teks tombol (default: "Options")
  icon?: ReactNode;
  items: DropdownItem[];
  buttonClassName?: string;   // kustom style tombol
}


interface FilterDropdownStyle<T extends string> {
  activeFilter: T;                   
  onChange: (filter: T) => void;    
  buttonStyle?: string; 
  style: {
    [key in T]: {                    
      dot?: string;
      label: string; // Tadi kamu tulis number, biasanya label itu string
      icon?: any;     // Sesuaikan dengan tipe icon kamu
    };
  };
  filter: T[];                       // Daftar semua filter yang tersedia
}

export function FilterDropdown<T extends string>({ activeFilter, onChange, style, filter, buttonStyle }: FilterDropdownStyle<T>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
 
  useEffect(() => {
    const handler = (e :any) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
 
  const activeStyle = style[activeFilter];
 
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex h-full items-center gap-2 px-3 py-1.5 text-xs font-medium ${buttonStyle ? buttonStyle : `border border-gray-200 dark:border-gray-700 rounded-lg bg-blue-50/50 dark:bg-slate-900 hover:bg-blue-50 text-gray-700 dark:text-gray-400 dark:hover:bg-slate-800`}  transition min-w-[130px] justify-between`}>
        <span className="flex items-center gap-1.5">
          {activeStyle?.dot ? <span className={`w-1.5 h-1.5 rounded-full ${activeStyle.dot}`} /> : activeStyle?.icon ? <span>{activeStyle.icon}</span> : null}
          {activeStyle?.label}
        </span>
        < ChevronDown size={16}/>
      </button>
 
      {open && (
        <div className="absolute left-0 top-full mt-1 w-40 bg-white dark:bg-slate-950 border border-blue-200 dark:border-gray-700 rounded-lg shadow-md z-10 py-1 overflow-hidden">
          {filter.map((f) => {
            const current_style = style[f as keyof typeof style];
            const isActive = activeFilter === f;
            return (
              <button
                key={f}
                onClick={() => { onChange(f); setOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition ${
                  isActive ? "bg-gray-100 text-gray-900 font-medium dark:bg-slate-900 dark:text-gray-300" : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-slate-900"
                }`}
              >
                {current_style?.dot ? (
                  <span className={`w-1.5 h-1.5 rounded-full ${current_style.dot}`} />
                ) : current_style?.icon ? (
                  <span className=''>
                    {current_style.icon}
                  </span>
                ): null}
                { current_style?.label }
                {isActive && (
                  <svg className="w-3 h-3 ml-auto text-gray-500" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8l4 4 6-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}


export default function CustomDropdown({
  label,
  items,
  icon,
  buttonClassName = "",
}: CustomDropdownProps) {
  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <MenuButton
          className={`
           
            outline-none
            ${buttonClassName}
          `}
        >
          {label}

          {React.isValidElement(icon) ? icon : (<ChevronDownIcon className="-mr-1 h-5 w-5 text-gray-400" aria-hidden="true" />)}
          
        </MenuButton>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <MenuItems className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-gray-800 shadow-lg ring-1 ring-white/10 focus:outline-none">
          <div className="py-1">
            {items.map((item, index) => (
              <MenuItem key={index} disabled={item.disabled}>
                {({ active, disabled }) => {
                  const baseClass = `
                    block w-full px-4 py-2 text-left text-sm
                    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                    ${active ? 'bg-white/10 text-white' : 'text-gray-300'}
                    ${item.danger ? 'text-red-400 hover:text-red-300' : ''}
                  `;

                  if (item.href) {
                    return (
                      <a
                        href={item.href}
                        className={baseClass}
                        onClick={item.onClick} // tetap bisa jalankan fungsi
                      >
                        {item.icon && <span className="mr-2 inline-block w-5">{item.icon}</span>}
                        {item.label}
                      </a>
                    );
                  }

                  return (
                    <button
                      type="button"
                      className={baseClass}
                      onClick={item.onClick}
                      disabled={disabled}
                    >
                      {item.icon && <span className="mr-2 inline-block w-5">{item.icon}</span>}
                      {item.label}
                    </button>
                  );
                }}
              </MenuItem>
            ))}
          </div>
        </MenuItems>
      </Transition>
    </Menu>
  );
}