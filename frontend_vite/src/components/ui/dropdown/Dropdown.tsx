// components/CustomDropdown.tsx
import { Menu, MenuButton, MenuItem, MenuItems, Transition } from '@headlessui/react';
import React, { Fragment, type ReactNode } from 'react';
import { ChevronDownIcon } from 'lucide-react'; // optional, install @heroicons/react

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
            inline-flex w-full justify-center items-center gap-x-1.5 
            rounded-md bg-white/10 px-1 py-2 text-sm font-semibold 
             ring-1 ring-inset ring-white/5 
            hover:bg-white/20 focus:outline-none focus:ring-2
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