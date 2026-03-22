import Logo from '../../assets/LogoLight.png';

const links = [
  { label: "Produk", href: "#products" },
  { label: "Mesin", href: "#machines" },
  { label: "About", href: "#about" },
  { label: "Kontak", href: "#contact" },
];

export default function Footer() {
  return (
    <footer className="bg-white border-t border-blue-100 px-6 py-7">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center">
          <img src={Logo} alt="Logo" className="h-8 w-aoto" />
          <div className="font-black text-xl text-blue-600">
            vendo
          </div>

        </div>

        <div className="flex gap-6 flex-wrap">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-semibold text-slate-400 hover:text-blue-600 transition-colors"
            >
              {l.label}
            </a>
          ))}
        </div>

        <p className="text-xs text-slate-400 font-medium">
          © 2026 Aihako Technology. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
