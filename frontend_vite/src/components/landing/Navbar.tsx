import { useState, useEffect } from "react";
import Logo from '../../assets/LogoLight.png';

const links = [
  { label: "Produk", href: "#products" },
  { label: "Mesin", href: "#machines" },
  { label: "About", href: "#about" },
  { label: "Kontak", href: "#contact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/90 backdrop-blur-xl shadow-sm border-b border-blue-100"
          : "bg-white/70 backdrop-blur-md"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex items-center ">
          <img src={Logo} alt="Logo" className="h-10 w-aoto" />
        
          <span className="font-extrabold text-2xl text-blue-600 tracking-tight">
            vendo
          </span>
        </a>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors"
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* CTA */}
        <a
          href="#contact"
          className="hidden md:inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-5 py-2.5 rounded-full shadow-md shadow-blue-200 transition-all hover:-translate-y-0.5"
        >
          Hubungi Kami
        </a>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-xl hover:bg-blue-50 transition"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <div className="w-5 flex flex-col gap-1">
            <span className={`h-0.5 bg-slate-700 rounded transition-all ${menuOpen ? "rotate-45 translate-y-1.5" : ""}`} />
            <span className={`h-0.5 bg-slate-700 rounded transition-all ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`h-0.5 bg-slate-700 rounded transition-all ${menuOpen ? "-rotate-45 -translate-y-1.5" : ""}`} />
          </div>
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-blue-100 px-6 py-4 flex flex-col gap-3">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className="text-sm font-semibold text-slate-600 hover:text-blue-600 py-1"
            >
              {l.label}
            </a>
          ))}
          <a
            href="#contact"
            className="mt-2 text-center bg-blue-600 text-white text-sm font-bold px-5 py-2.5 rounded-full"
            onClick={() => setMenuOpen(false)}
          >
            Hubungi Kami
          </a>
        </div>
      )}
    </nav>
  );
}
