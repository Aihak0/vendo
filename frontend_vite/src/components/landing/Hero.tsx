import VendingMachineIllustration from "./VendingMachineIllustration";
import { Star, BanknoteXIcon, Clock } from "lucide-react";

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center overflow-hidden pt-20"
    >
      {/* Blobs */}
      <div className="absolute top-[-80px] right-0 w-[500px] h-[500px] rounded-full bg-blue-200/40 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-0 left-[-60px] w-[350px] h-[350px] rounded-full bg-blue-100/50 blur-[70px] pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-12 items-center w-full">
        {/* Left */}
        <div className="space-y-6 animate-[fadeUp_0.7s_ease_forwards]">
          <style>{`
            @keyframes fadeUp {
              from { opacity: 0; transform: translateY(28px); }
              to   { opacity: 1; transform: translateY(0); }
            }
          `}</style>

          {/* Chip */}
          <span className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-xs font-bold px-4 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            Vending Machine Modern
          </span>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.1] tracking-tight text-slate-900">
            Snack &amp; Minuman{" "}
            <span className="bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent">
              Kapan Saja,
            </span>{" "}
            Di Mana Saja
          </h1>

          {/* Desc */}
          <p className="text-slate-500 text-lg leading-relaxed max-w-md">
            Vendo hadir di lokasi strategis dengan pilihan produk fresh dan
            lezat. Pilih, bayar cashless, dan nikmati seketika — 24 jam nonstop
            tanpa antre.
          </p>

          {/* Buttons */}
          <div className="flex gap-3 flex-wrap">
            <a
              href="#products"
              className="bg-gradient-to-r from-blue-500 to-blue-700 text-white font-bold text-sm px-7 py-3.5 rounded-full shadow-lg shadow-blue-300/40 hover:-translate-y-1 hover:shadow-blue-300/60 transition-all"
            >
              Lihat Produk →
            </a>
            <a
              href="#how"
              className="bg-white text-blue-600 font-bold text-sm px-7 py-3.5 rounded-full border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-all"
            >
              Cara Menggunakan
            </a>
          </div>

          {/* Trust badges */}
          <div className="flex items-center gap-4 pt-2">
            {[
              { icon: <Star size={16} className="text-amber-400" />, text: "4.9 Rating" },
              { icon: <BanknoteXIcon size={16} className="text-green-400" />, text: "100% Cashless" },
              { icon: <Clock size={16} />, text: "24/7 Aktif" }].map((b, index) => (
              <span key={index} className="text-xs text-slate-400 font-semibold flex gap-2">
                {b.icon}
                <span>{b.text}</span>
              </span>
            ))}
          </div>
          
        </div>

        {/* Right: VM Illustration */}
        <div className="hidden md:flex justify-center items-center">
          <VendingMachineIllustration />
        </div>
      </div>
    </section>
  );
}
